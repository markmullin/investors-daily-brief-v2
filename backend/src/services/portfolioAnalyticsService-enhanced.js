/**
 * ENHANCED PORTFOLIO ANALYTICS SERVICE - FIXES CRITICAL 500 ERRORS
 * Addresses the portfolio analytics failures and Redis integration issues
 * Provides comprehensive error handling and fallback mechanisms
 */

import fmpService from './fmpService.js';
import redisService from './redisService.js';

class EnhancedPortfolioAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
    this.isRedisAvailable = false;
    this.fallbackMode = false;
    this.lastRedisCheck = null;
    this.redisCheckInterval = 60000; // Check Redis every 60 seconds
  }

  /**
   * ENHANCED: Check Redis availability with comprehensive error handling
   */
  async checkRedisAvailability() {
    const now = Date.now();
    
    // Only check Redis availability every minute to avoid overhead
    if (this.lastRedisCheck && (now - this.lastRedisCheck) < this.redisCheckInterval) {
      return this.isRedisAvailable;
    }
    
    try {
      console.log('🔍 [PORTFOLIO] Checking Redis availability...');
      
      // Test Redis with a simple operation
      const testKey = 'portfolio_redis_health_check';
      const testValue = { timestamp: now, test: 'redis_health' };
      
      await redisService.set(testKey, testValue, 10); // 10 second expiry
      const retrieved = await redisService.get(testKey);
      
      if (retrieved && retrieved.timestamp === now) {
        console.log('✅ [PORTFOLIO] Redis is available and working');
        this.isRedisAvailable = true;
        this.fallbackMode = false;
        
        // Clean up test key
        await redisService.del(testKey);
      } else {
        throw new Error('Redis test data mismatch');
      }
      
    } catch (error) {
      console.warn(`⚠️  [PORTFOLIO] Redis not available: ${error.message}`);
      console.log('🔄 [PORTFOLIO] Switching to in-memory fallback mode');
      this.isRedisAvailable = false;
      this.fallbackMode = true;
    }
    
    this.lastRedisCheck = now;
    return this.isRedisAvailable;
  }

  /**
   * ENHANCED: Get cached data with Redis and fallback support
   */
  async getCachedData(key, ttlSeconds = 3600) {
    try {
      // Check Redis availability first
      const redisAvailable = await this.checkRedisAvailability();
      
      if (redisAvailable) {
        const data = await redisService.get(key);
        if (data) {
          console.log(`📚 [PORTFOLIO] Redis cache hit for ${key}`);
          return data;
        }
      } else {
        // Fallback to in-memory cache
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < (ttlSeconds * 1000)) {
          console.log(`💾 [PORTFOLIO] In-memory cache hit for ${key}`);
          return cached.data;
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️  [PORTFOLIO] Cache retrieval failed for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * ENHANCED: Set cached data with Redis and fallback support
   */
  async setCachedData(key, data, ttlSeconds = 3600) {
    try {
      const redisAvailable = await this.checkRedisAvailability();
      
      if (redisAvailable) {
        await redisService.set(key, data, ttlSeconds);
        console.log(`💾 [PORTFOLIO] Data cached in Redis: ${key} (TTL: ${ttlSeconds}s)`);
      } else {
        // Fallback to in-memory cache
        this.cache.set(key, {
          data: data,
          timestamp: Date.now()
        });
        console.log(`🧠 [PORTFOLIO] Data cached in memory: ${key}`);
      }
    } catch (error) {
      console.warn(`⚠️  [PORTFOLIO] Cache storage failed for ${key}:`, error.message);
      // Continue without caching rather than failing
    }
  }

  /**
   * ENHANCED: Get portfolio fundamentals with comprehensive error handling
   */
  async getPortfolioFundamentals(holdings) {
    if (!holdings || typeof holdings !== 'object') {
      console.error('❌ [PORTFOLIO] Invalid holdings provided to getPortfolioFundamentals');
      return {};
    }

    const symbols = Object.keys(holdings);
    const fundamentalData = {};
    
    console.log(`🔍 [PORTFOLIO] Fetching fundamentals for ${symbols.length} holdings: ${symbols.join(', ')}`);
    
    if (symbols.length === 0) {
      console.log('ℹ️  [PORTFOLIO] No holdings provided, returning empty fundamentals');
      return fundamentalData;
    }

    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 3; // Reduced batch size for better reliability
    let processedCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        console.log(`📊 [PORTFOLIO] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)}: ${batch.join(', ')}`);
        
        const batchPromises = batch.map(async (symbol) => {
          try {
            const cacheKey = `portfolio_fundamentals_${symbol}`;
            
            // Check cache first
            const cached = await this.getCachedData(cacheKey, 3600);
            if (cached) {
              return [symbol, cached];
            }
            
            console.log(`📈 [PORTFOLIO] Fetching live FMP fundamentals for ${symbol}...`);
            
            // Get comprehensive fundamental data with timeout protection
            const fundamentalsPromise = this.fetchComprehensiveFundamentals(symbol);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Fundamentals fetch timeout')), 30000)
            );
            
            const fundamentals = await Promise.race([fundamentalsPromise, timeoutPromise]);
            
            if (!fundamentals || Object.keys(fundamentals).length === 0) {
              console.warn(`⚠️  [PORTFOLIO] No fundamental data available for ${symbol}`);
              return [symbol, null];
            }
            
            // Cache the result
            await this.setCachedData(cacheKey, fundamentals, 3600);
            
            const metricsInfo = fundamentals.pe ? `P/E=${fundamentals.pe.toFixed(2)}` : 'Limited data';
            console.log(`✅ [PORTFOLIO] ${symbol}: ${metricsInfo}, ROE=${fundamentals.roe?.toFixed(1) || 'N/A'}%`);
            
            return [symbol, fundamentals];
            
          } catch (error) {
            console.error(`❌ [PORTFOLIO] Error fetching fundamentals for ${symbol}:`, error.message);
            errorCount++;
            return [symbol, null];
          }
        });
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value[1]) {
              const [symbol, data] = result.value;
              fundamentalData[symbol] = data;
              processedCount++;
            } else {
              console.warn(`⚠️  [PORTFOLIO] Failed to get fundamentals for ${batch[index]}`);
            }
          });
          
        } catch (batchError) {
          console.error(`❌ [PORTFOLIO] Batch processing error:`, batchError.message);
        }
        
        // Small delay between batches to be respectful to FMP API
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successRate = symbols.length > 0 ? (processedCount / symbols.length) * 100 : 0;
      console.log(`📊 [PORTFOLIO] Fundamentals processing complete: ${processedCount}/${symbols.length} successful (${successRate.toFixed(1)}%)`);
      
      if (errorCount > 0) {
        console.warn(`⚠️  [PORTFOLIO] ${errorCount} symbols had errors during fundamental data fetching`);
      }
      
      return fundamentalData;
      
    } catch (error) {
      console.error(`❌ [PORTFOLIO] Critical error in getPortfolioFundamentals:`, error.message);
      console.error('Stack trace:', error.stack);
      
      // Return whatever data we managed to collect
      console.log(`🔄 [PORTFOLIO] Returning partial results: ${Object.keys(fundamentalData).length} symbols with data`);
      return fundamentalData;
    }
  }

  /**
   * ENHANCED: Fetch comprehensive fundamentals with error handling
   */
  async fetchComprehensiveFundamentals(symbol) {
    try {
      console.log(`🔍 [PORTFOLIO] Fetching comprehensive fundamentals for ${symbol}...`);
      
      // Fetch multiple data sources in parallel with individual error handling
      const [keyMetrics, ratios, growth, profile] = await Promise.allSettled([
        fmpService.getKeyMetrics(symbol).catch(err => {
          console.warn(`⚠️  Key metrics failed for ${symbol}: ${err.message}`);
          return null;
        }),
        fmpService.getFinancialRatios(symbol).catch(err => {
          console.warn(`⚠️  Financial ratios failed for ${symbol}: ${err.message}`);
          return null;
        }),
        fmpService.getFinancialGrowth(symbol).catch(err => {
          console.warn(`⚠️  Financial growth failed for ${symbol}: ${err.message}`);
          return null;
        }),
        fmpService.getCompanyProfile(symbol).catch(err => {
          console.warn(`⚠️  Company profile failed for ${symbol}: ${err.message}`);
          return null;
        })
      ]);
      
      // Extract data from settled promises
      const keyMetricsData = keyMetrics.status === 'fulfilled' ? keyMetrics.value : null;
      const ratiosData = ratios.status === 'fulfilled' ? ratios.value : null;
      const growthData = growth.status === 'fulfilled' ? growth.value : null;
      const profileData = profile.status === 'fulfilled' ? profile.value : null;
      
      // Check if we have at least some data
      if (!keyMetricsData && !ratiosData && !growthData && !profileData) {
        console.warn(`⚠️  [PORTFOLIO] No fundamental data sources available for ${symbol}`);
        return null;
      }
      
      // Extract latest metrics with safe property access
      const latestKeyMetrics = Array.isArray(keyMetricsData) && keyMetricsData.length > 0 ? keyMetricsData[0] : {};
      const latestRatios = Array.isArray(ratiosData) && ratiosData.length > 0 ? ratiosData[0] : {};
      const latestGrowth = Array.isArray(growthData) && growthData.length > 0 ? growthData[0] : {};
      const companyInfo = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : {};
      
      // Build comprehensive metrics object with safe property access
      const metrics = {
        // Valuation metrics
        pe: this.safeFloat(latestKeyMetrics.peRatio || latestRatios.priceEarningsRatio),
        pb: this.safeFloat(latestKeyMetrics.pbRatio || latestRatios.priceToBookRatio),
        peg: this.safeFloat(latestKeyMetrics.pegRatio),
        priceToSales: this.safeFloat(latestKeyMetrics.priceToSalesRatio),
        
        // Profitability metrics  
        roe: this.safeFloat(latestKeyMetrics.roe || latestRatios.returnOnEquity),
        roa: this.safeFloat(latestKeyMetrics.roa || latestRatios.returnOnAssets),
        profitMargin: this.safeFloat(latestKeyMetrics.netProfitMargin || latestRatios.netProfitMargin),
        operatingMargin: this.safeFloat(latestKeyMetrics.operatingMargin || latestRatios.operatingProfitMargin),
        grossMargin: this.safeFloat(latestRatios.grossProfitMargin),
        
        // Growth metrics
        revenueGrowth: this.safeFloat(latestGrowth.revenueGrowth),
        netIncomeGrowth: this.safeFloat(latestGrowth.netIncomeGrowth),
        epsGrowth: this.safeFloat(latestGrowth.epsgrowth),
        
        // Financial health metrics
        debtToEquity: this.safeFloat(latestKeyMetrics.debtToEquity || latestRatios.debtEquityRatio),
        currentRatio: this.safeFloat(latestRatios.currentRatio),
        quickRatio: this.safeFloat(latestRatios.quickRatio),
        interestCoverage: this.safeFloat(latestRatios.interestCoverage),
        
        // Dividend metrics
        dividendYield: this.safeFloat(latestKeyMetrics.dividendYield),
        payoutRatio: this.safeFloat(latestRatios.payoutRatio),
        
        // Book value and EPS
        bookValuePerShare: this.safeFloat(latestKeyMetrics.bookValuePerShare),
        eps: this.safeFloat(latestKeyMetrics.earningsPerShare),
        
        // Company info
        sector: companyInfo.sector || null,
        industry: companyInfo.industry || null,
        marketCap: this.safeFloat(latestKeyMetrics.marketCap || companyInfo.mktCap),
        
        // Metadata
        lastUpdated: new Date().toISOString(),
        source: 'FMP_API_ENHANCED',
        dataQuality: this.assessDataQuality(latestKeyMetrics, latestRatios, latestGrowth, companyInfo)
      };
      
      console.log(`📊 [PORTFOLIO] ${symbol} fundamentals processed: ${metrics.dataQuality} quality, ${Object.keys(metrics).filter(k => metrics[k] !== null).length} metrics`);
      
      return metrics;
      
    } catch (error) {
      console.error(`❌ [PORTFOLIO] Error in fetchComprehensiveFundamentals for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Helper function to safely convert values to float
   */
  safeFloat(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Assess data quality based on available metrics
   */
  assessDataQuality(keyMetrics, ratios, growth, profile) {
    let score = 0;
    if (keyMetrics && Object.keys(keyMetrics).length > 0) score += 25;
    if (ratios && Object.keys(ratios).length > 0) score += 25;
    if (growth && Object.keys(growth).length > 0) score += 25;
    if (profile && Object.keys(profile).length > 0) score += 25;
    
    if (score >= 75) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 25) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * ENHANCED: Calculate portfolio metrics with comprehensive error handling
   */
  calculatePortfolioMetrics(holdings, fundamentalData) {
    try {
      console.log(`🧮 [PORTFOLIO] Calculating portfolio metrics for ${Object.keys(holdings).length} holdings...`);
      
      if (!holdings || typeof holdings !== 'object' || Object.keys(holdings).length === 0) {
        console.warn('⚠️  [PORTFOLIO] No holdings provided for portfolio metrics calculation');
        return this.getEmptyPortfolioMetrics();
      }

      const portfolioMetrics = {
        weightedPE: 0,
        weightedPB: 0,
        weightedROE: 0,
        weightedROA: 0,
        weightedProfitMargin: 0,
        avgRevenueGrowth: 0,
        avgNetIncomeGrowth: 0,
        qualityScore: 0,
        valueScore: 0,
        growthScore: 0,
        financialHealthScore: 0,
        sectorAllocation: {},
        styleAllocation: {
          growth: 0,
          value: 0,
          blend: 0
        },
        summary: {
          totalHoldings: Object.keys(holdings).length,
          withFundamentals: Object.keys(fundamentalData || {}).length,
          avgMarketCap: 0,
          totalMarketCap: 0,
          dataQuality: 'UNKNOWN'
        }
      };

      let totalValue = 0;
      let validPECount = 0, validPBCount = 0, validROECount = 0;
      let validGrowthCount = 0, validIncomeGrowthCount = 0;
      let totalMarketCap = 0, marketCapCount = 0;
      let highQualityData = 0;
      
      // Calculate weighted averages using real data
      Object.entries(holdings).forEach(([symbol, holding]) => {
        try {
          const fundamentals = fundamentalData ? fundamentalData[symbol] : null;
          if (!fundamentals) {
            console.log(`📊 [PORTFOLIO] No fundamentals available for ${symbol}, skipping metrics calculation`);
            return;
          }
          
          const marketValue = holding.currentValue || (holding.quantity * (holding.currentPrice || holding.avgCost || 0));
          if (marketValue <= 0) {
            console.warn(`⚠️  [PORTFOLIO] Invalid market value for ${symbol}: ${marketValue}`);
            return;
          }
          
          totalValue += marketValue;
          const weight = marketValue;
          
          // Track data quality
          if (fundamentals.dataQuality === 'HIGH') highQualityData++;
          
          // Weighted P/E (exclude extreme outliers)
          if (fundamentals.pe && fundamentals.pe > 0 && fundamentals.pe < 150) {
            portfolioMetrics.weightedPE += fundamentals.pe * weight;
            validPECount += weight;
          }
          
          // Weighted P/B
          if (fundamentals.pb && fundamentals.pb > 0 && fundamentals.pb < 20) {
            portfolioMetrics.weightedPB += fundamentals.pb * weight;
            validPBCount += weight;
          }
          
          // Weighted ROE
          if (fundamentals.roe && fundamentals.roe > -100 && fundamentals.roe < 200) {
            portfolioMetrics.weightedROE += fundamentals.roe * weight;
            validROECount += weight;
          }
          
          // Revenue Growth
          if (fundamentals.revenueGrowth && fundamentals.revenueGrowth > -100 && fundamentals.revenueGrowth < 500) {
            portfolioMetrics.avgRevenueGrowth += fundamentals.revenueGrowth;
            validGrowthCount++;
          }
          
          // Net Income Growth
          if (fundamentals.netIncomeGrowth && fundamentals.netIncomeGrowth > -100 && fundamentals.netIncomeGrowth < 500) {
            portfolioMetrics.avgNetIncomeGrowth += fundamentals.netIncomeGrowth;
            validIncomeGrowthCount++;
          }
          
          // Market Cap aggregation
          if (fundamentals.marketCap && fundamentals.marketCap > 0) {
            totalMarketCap += fundamentals.marketCap;
            marketCapCount++;
          }
          
          // Sector allocation
          if (fundamentals.sector) {
            portfolioMetrics.sectorAllocation[fundamentals.sector] = 
              (portfolioMetrics.sectorAllocation[fundamentals.sector] || 0) + weight;
          }
          
          // Style Classification using real metrics
          const pe = fundamentals.pe || 0;
          const growth = fundamentals.revenueGrowth || 0;
          
          if (pe < 15 && growth < 10) {
            portfolioMetrics.styleAllocation.value += weight;
          } else if (pe > 25 || growth > 15) {
            portfolioMetrics.styleAllocation.growth += weight;
          } else {
            portfolioMetrics.styleAllocation.blend += weight;
          }
          
        } catch (holdingError) {
          console.error(`❌ [PORTFOLIO] Error processing holding ${symbol}:`, holdingError.message);
        }
      });
      
      // Finalize calculations with safety checks
      if (totalValue > 0) {
        if (validPECount > 0) {
          portfolioMetrics.weightedPE = portfolioMetrics.weightedPE / validPECount;
        }
        
        if (validPBCount > 0) {
          portfolioMetrics.weightedPB = portfolioMetrics.weightedPB / validPBCount;
        }
        
        if (validROECount > 0) {
          portfolioMetrics.weightedROE = portfolioMetrics.weightedROE / validROECount;
        }
        
        if (validGrowthCount > 0) {
          portfolioMetrics.avgRevenueGrowth = portfolioMetrics.avgRevenueGrowth / validGrowthCount;
        }
        
        if (validIncomeGrowthCount > 0) {
          portfolioMetrics.avgNetIncomeGrowth = portfolioMetrics.avgNetIncomeGrowth / validIncomeGrowthCount;
        }
        
        // Convert sector and style allocations to percentages
        Object.keys(portfolioMetrics.sectorAllocation).forEach(sector => {
          portfolioMetrics.sectorAllocation[sector] = (portfolioMetrics.sectorAllocation[sector] / totalValue) * 100;
        });
        
        Object.keys(portfolioMetrics.styleAllocation).forEach(style => {
          portfolioMetrics.styleAllocation[style] = (portfolioMetrics.styleAllocation[style] / totalValue) * 100;
        });
      }
      
      // Summary stats
      portfolioMetrics.summary.avgMarketCap = marketCapCount > 0 ? totalMarketCap / marketCapCount : 0;
      portfolioMetrics.summary.totalMarketCap = totalMarketCap;
      portfolioMetrics.summary.dataQuality = highQualityData > portfolioMetrics.summary.totalHoldings / 2 ? 'HIGH' : 'MEDIUM';
      
      // Calculate composite scores using enhanced methods
      portfolioMetrics.qualityScore = this.calculateQualityScore(fundamentalData, holdings);
      portfolioMetrics.valueScore = this.calculateValueScore(fundamentalData, holdings);
      portfolioMetrics.growthScore = this.calculateGrowthScore(fundamentalData, holdings);
      portfolioMetrics.financialHealthScore = this.calculateFinancialHealthScore(fundamentalData, holdings);
      
      const peDisplay = portfolioMetrics.weightedPE ? portfolioMetrics.weightedPE.toFixed(1) : 'N/A';
      const roeDisplay = portfolioMetrics.weightedROE ? portfolioMetrics.weightedROE.toFixed(1) + '%' : 'N/A';
      const qualityDisplay = portfolioMetrics.qualityScore ? portfolioMetrics.qualityScore.toFixed(0) : 'N/A';
      
      console.log(`📊 [PORTFOLIO] Portfolio metrics calculated: P/E=${peDisplay}, ROE=${roeDisplay}, Quality=${qualityDisplay}`);
      
      return portfolioMetrics;
      
    } catch (error) {
      console.error(`❌ [PORTFOLIO] Error in calculatePortfolioMetrics:`, error.message);
      console.error('Stack trace:', error.stack);
      
      // Return empty metrics rather than failing
      return this.getEmptyPortfolioMetrics();
    }
  }

  /**
   * Return empty portfolio metrics structure
   */
  getEmptyPortfolioMetrics() {
    return {
      weightedPE: null,
      weightedPB: null,
      weightedROE: null,
      weightedROA: null,
      weightedProfitMargin: null,
      avgRevenueGrowth: null,
      avgNetIncomeGrowth: null,
      qualityScore: 50,
      valueScore: 50,
      growthScore: 50,
      financialHealthScore: 50,
      sectorAllocation: {},
      styleAllocation: {
        growth: 0,
        value: 0,
        blend: 0
      },
      summary: {
        totalHoldings: 0,
        withFundamentals: 0,
        avgMarketCap: 0,
        totalMarketCap: 0,
        dataQuality: 'NONE'
      }
    };
  }

  // Keep existing calculation methods but add error handling
  calculateQualityScore(fundamentalData, holdings) {
    try {
      let totalScore = 0;
      let validCount = 0;
      
      Object.entries(holdings).forEach(([symbol, holding]) => {
        const fundamentals = fundamentalData[symbol];
        if (!fundamentals) return;
        
        let score = 50; // Start at neutral
        
        // ROE scoring
        if (fundamentals.roe > 20) score += 25;
        else if (fundamentals.roe > 15) score += 15;
        else if (fundamentals.roe > 10) score += 5;
        else if (fundamentals.roe < 5) score -= 15;
        
        // Profit margin scoring
        if (fundamentals.profitMargin > 25) score += 20;
        else if (fundamentals.profitMargin > 15) score += 12;
        else if (fundamentals.profitMargin > 8) score += 5;
        else if (fundamentals.profitMargin < 3) score -= 12;
        
        // Debt to equity scoring
        if (fundamentals.debtToEquity < 0.2) score += 15;
        else if (fundamentals.debtToEquity < 0.5) score += 8;
        else if (fundamentals.debtToEquity < 1.0) score += 2;
        else if (fundamentals.debtToEquity > 2.0) score -= 20;
        
        // Interest coverage
        if (fundamentals.interestCoverage > 10) score += 10;
        else if (fundamentals.interestCoverage > 5) score += 5;
        else if (fundamentals.interestCoverage < 2) score -= 15;
        
        totalScore += Math.max(0, Math.min(100, score));
        validCount++;
      });
      
      return validCount > 0 ? totalScore / validCount : 50;
    } catch (error) {
      console.error('❌ [PORTFOLIO] Error calculating quality score:', error.message);
      return 50;
    }
  }
  
  calculateValueScore(fundamentalData, holdings) {
    try {
      let totalScore = 0;
      let validCount = 0;
      
      Object.entries(holdings).forEach(([symbol, holding]) => {
        const fundamentals = fundamentalData[symbol];
        if (!fundamentals) return;
        
        let score = 50;
        
        // P/E scoring
        if (fundamentals.pe && fundamentals.pe > 0) {
          if (fundamentals.pe < 10) score += 30;
          else if (fundamentals.pe < 15) score += 20;
          else if (fundamentals.pe < 20) score += 10;
          else if (fundamentals.pe < 25) score += 2;
          else if (fundamentals.pe > 40) score -= 25;
        }
        
        // P/B scoring
        if (fundamentals.pb && fundamentals.pb > 0) {
          if (fundamentals.pb < 1.0) score += 25;
          else if (fundamentals.pb < 1.5) score += 15;
          else if (fundamentals.pb < 2.5) score += 5;
          else if (fundamentals.pb > 5.0) score -= 20;
        }
        
        // Price to Sales scoring
        if (fundamentals.priceToSales && fundamentals.priceToSales > 0) {
          if (fundamentals.priceToSales < 1.0) score += 15;
          else if (fundamentals.priceToSales < 2.0) score += 8;
          else if (fundamentals.priceToSales > 8.0) score -= 15;
        }
        
        totalScore += Math.max(0, Math.min(100, score));
        validCount++;
      });
      
      return validCount > 0 ? totalScore / validCount : 50;
    } catch (error) {
      console.error('❌ [PORTFOLIO] Error calculating value score:', error.message);
      return 50;
    }
  }
  
  calculateGrowthScore(fundamentalData, holdings) {
    try {
      let totalScore = 0;
      let validCount = 0;
      
      Object.entries(holdings).forEach(([symbol, holding]) => {
        const fundamentals = fundamentalData[symbol];
        if (!fundamentals) return;
        
        let score = 50;
        
        // Revenue growth scoring
        if (fundamentals.revenueGrowth !== null && fundamentals.revenueGrowth !== undefined) {
          if (fundamentals.revenueGrowth > 25) score += 30;
          else if (fundamentals.revenueGrowth > 15) score += 20;
          else if (fundamentals.revenueGrowth > 8) score += 12;
          else if (fundamentals.revenueGrowth > 3) score += 5;
          else if (fundamentals.revenueGrowth < -5) score -= 25;
        }
        
        // Net income growth scoring
        if (fundamentals.netIncomeGrowth !== null && fundamentals.netIncomeGrowth !== undefined) {
          if (fundamentals.netIncomeGrowth > 30) score += 25;
          else if (fundamentals.netIncomeGrowth > 15) score += 15;
          else if (fundamentals.netIncomeGrowth > 5) score += 8;
          else if (fundamentals.netIncomeGrowth < -10) score -= 20;
        }
        
        // EPS growth scoring
        if (fundamentals.epsGrowth !== null && fundamentals.epsGrowth !== undefined) {
          if (fundamentals.epsGrowth > 20) score += 20;
          else if (fundamentals.epsGrowth > 10) score += 10;
          else if (fundamentals.epsGrowth < -15) score -= 20;
        }
        
        totalScore += Math.max(0, Math.min(100, score));
        validCount++;
      });
      
      return validCount > 0 ? totalScore / validCount : 50;
    } catch (error) {
      console.error('❌ [PORTFOLIO] Error calculating growth score:', error.message);
      return 50;
    }
  }
  
  calculateFinancialHealthScore(fundamentalData, holdings) {
    try {
      let totalScore = 0;
      let validCount = 0;
      
      Object.entries(holdings).forEach(([symbol, holding]) => {
        const fundamentals = fundamentalData[symbol];
        if (!fundamentals) return;
        
        let score = 50;
        
        // Debt to equity
        if (fundamentals.debtToEquity !== null && fundamentals.debtToEquity !== undefined) {
          if (fundamentals.debtToEquity < 0.1) score += 25;
          else if (fundamentals.debtToEquity < 0.3) score += 18;
          else if (fundamentals.debtToEquity < 0.6) score += 10;
          else if (fundamentals.debtToEquity < 1.0) score += 2;
          else if (fundamentals.debtToEquity > 3.0) score -= 30;
        }
        
        // Current ratio
        if (fundamentals.currentRatio > 2.0) score += 15;
        else if (fundamentals.currentRatio > 1.5) score += 10;
        else if (fundamentals.currentRatio > 1.0) score += 5;
        else if (fundamentals.currentRatio < 0.8) score -= 20;
        
        // ROE
        if (fundamentals.roe > 25) score += 20;
        else if (fundamentals.roe > 15) score += 12;
        else if (fundamentals.roe > 8) score += 5;
        else if (fundamentals.roe < 3) score -= 15;
        
        // Interest coverage
        if (fundamentals.interestCoverage > 15) score += 15;
        else if (fundamentals.interestCoverage > 8) score += 10;
        else if (fundamentals.interestCoverage > 3) score += 5;
        else if (fundamentals.interestCoverage < 1.5) score -= 25;
        
        totalScore += Math.max(0, Math.min(100, score));
        validCount++;
      });
      
      return validCount > 0 ? totalScore / validCount : 50;
    } catch (error) {
      console.error('❌ [PORTFOLIO] Error calculating financial health score:', error.message);
      return 50;
    }
  }

  /**
   * ENHANCED: Get portfolio insights with comprehensive error handling
   */
  async getPortfolioInsights(holdings, fundamentalData, portfolioMetrics) {
    try {
      console.log(`💡 [PORTFOLIO] Generating portfolio insights...`);
      
      const insights = {
        alerts: [],
        recommendations: [],
        strengths: [],
        risks: [],
        summary: {
          overallHealth: 'Good',
          topConcerns: [],
          keyStrengths: []
        }
      };
      
      if (!holdings || !fundamentalData || !portfolioMetrics) {
        console.warn('⚠️  [PORTFOLIO] Insufficient data for portfolio insights');
        insights.summary.overallHealth = 'Unknown';
        return insights;
      }
      
      // Analyze individual holdings
      Object.entries(holdings).forEach(([symbol, holding]) => {
        try {
          const fundamentals = fundamentalData[symbol];
          if (!fundamentals) return;
          
          // High P/E alert
          if (fundamentals.pe && fundamentals.pe > 50) {
            insights.alerts.push({
              type: 'warning',
              symbol,
              message: `${symbol} has very high P/E ratio (${fundamentals.pe.toFixed(1)}) - potential overvaluation risk`,
              severity: 'high'
            });
          }
          
          // High debt alert
          if (fundamentals.debtToEquity && fundamentals.debtToEquity > 3.0) {
            insights.alerts.push({
              type: 'warning', 
              symbol,
              message: `${symbol} has very high debt-to-equity ratio (${fundamentals.debtToEquity.toFixed(1)}) - significant financial risk`,
              severity: 'high'
            });
          }
          
          // Poor profitability alert
          if (fundamentals.roe && fundamentals.roe < 0) {
            insights.alerts.push({
              type: 'warning',
              symbol, 
              message: `${symbol} has negative ROE (${fundamentals.roe.toFixed(1)}%) - poor profitability`,
              severity: 'medium'
            });
          }
          
          // Strong fundamentals
          if (fundamentals.roe > 20 && fundamentals.profitMargin > 15 && 
              fundamentals.debtToEquity && fundamentals.debtToEquity < 0.5) {
            insights.strengths.push({
              symbol,
              message: `${symbol} shows excellent fundamentals: ROE ${fundamentals.roe.toFixed(1)}%, Profit Margin ${fundamentals.profitMargin.toFixed(1)}%, Low Debt`,
              type: 'excellence'
            });
          }
          
          // Value opportunities
          if (fundamentals.pe && fundamentals.pe < 12 && fundamentals.revenueGrowth > 5) {
            insights.recommendations.push({
              type: 'opportunity',
              symbol,
              message: `${symbol} appears undervalued: P/E ${fundamentals.pe.toFixed(1)} with ${fundamentals.revenueGrowth.toFixed(1)}% revenue growth`,
              action: 'consider_increasing'
            });
          }
          
          // High growth with reasonable valuation
          if (fundamentals.revenueGrowth > 20 && fundamentals.pe && fundamentals.pe < 30) {
            insights.recommendations.push({
              type: 'growth',
              symbol,
              message: `${symbol} shows strong growth (${fundamentals.revenueGrowth.toFixed(1)}%) at reasonable valuation (P/E ${fundamentals.pe.toFixed(1)})`,
              action: 'quality_growth'
            });
          }
          
        } catch (holdingError) {
          console.error(`❌ [PORTFOLIO] Error analyzing holding ${symbol}:`, holdingError.message);
        }
      });
      
      // Portfolio-level insights
      if (portfolioMetrics.weightedPE > 35) {
        insights.risks.push({
          message: `Portfolio has high average P/E (${portfolioMetrics.weightedPE.toFixed(1)}) - consider rebalancing toward value`,
          type: 'valuation_risk'
        });
      }
      
      if (portfolioMetrics.styleAllocation.growth > 80) {
        insights.recommendations.push({
          type: 'rebalance',
          message: `Portfolio heavily tilted toward growth (${portfolioMetrics.styleAllocation.growth.toFixed(1)}%) - consider adding value positions for balance`,
          action: 'diversify_style'
        });
      }
      
      if (portfolioMetrics.qualityScore > 80) {
        insights.strengths.push({
          message: `Excellent portfolio quality score (${portfolioMetrics.qualityScore.toFixed(1)}/100) indicates high-quality holdings`,
          type: 'portfolio_strength'
        });
      }
      
      // Determine overall health
      const alertCount = insights.alerts.length;
      const strengthCount = insights.strengths.length;
      
      if (alertCount === 0 && strengthCount >= 2) {
        insights.summary.overallHealth = 'Excellent';
      } else if (alertCount <= 2 && strengthCount >= 1) {
        insights.summary.overallHealth = 'Good';
      } else if (alertCount <= 5) {
        insights.summary.overallHealth = 'Fair';
      } else {
        insights.summary.overallHealth = 'Needs Attention';
      }
      
      console.log(`🎯 [PORTFOLIO] Insights generated: ${insights.alerts.length} alerts, ${insights.recommendations.length} recommendations, ${insights.strengths.length} strengths`);
      
      return insights;
      
    } catch (error) {
      console.error(`❌ [PORTFOLIO] Error generating portfolio insights:`, error.message);
      return {
        alerts: [],
        recommendations: [],
        strengths: [],
        risks: [],
        summary: {
          overallHealth: 'Unknown',
          topConcerns: [],
          keyStrengths: []
        }
      };
    }
  }

  /**
   * Enhanced service status check
   */
  async getServiceStatus() {
    try {
      const redisStatus = await this.checkRedisAvailability();
      
      return {
        service: 'PortfolioAnalyticsService',
        status: 'operational',
        redis: {
          available: redisStatus,
          fallbackMode: this.fallbackMode,
          lastCheck: this.lastRedisCheck
        },
        cache: {
          inMemorySize: this.cache.size,
          cacheTimeout: this.cacheTimeout
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'PortfolioAnalyticsService',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new EnhancedPortfolioAnalyticsService();
