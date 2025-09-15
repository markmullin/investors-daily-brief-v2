/**
 * Market Environment Nightly Collector (Enhanced with Error Handling)
 * Runs Monday-Friday at 3am to analyze all S&P 500 companies
 * Generates dual scores: Short-term (technical/momentum) and Long-term (valuation/fundamental)
 */

import cron from 'node-cron';
import fmpService from '../fmpService.js';
import redisService from '../redisService.js';
import PythonBridge from '../PythonBridge.js';

class MarketEnvironmentNightlyCollector {
  constructor() {
    this.isRunning = false;
    this.lastCollection = null;
    this.cacheKeys = {
      shortTerm: 'market_environment:short_term_score',
      longTerm: 'market_environment:long_term_score',
      sp500Data: 'market_environment:sp500_analysis',
      collectionStatus: 'market_environment:collection_status'
    };
    this.cacheTTL = 24 * 60 * 60; // 24 hours cache
    
    // Enhanced configuration
    this.config = {
      maxCollectionTime: 45 * 60 * 1000, // 45 minutes max
      batchSize: 10, // Smaller batches for reliability
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      companyTimeout: 30000, // 30 seconds per company
      pythonTimeout: 15000, // 15 seconds for Python analysis
    };
  }

  /**
   * Initialize the nightly collection scheduler
   */
  initialize() {
    console.log('🌙 Initializing Market Environment Nightly Collector...');
    
    // Schedule for Monday-Friday at 3:00 AM
    this.scheduledJob = cron.schedule('0 3 * * 1-5', () => {
      this.runNightlyCollection();
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });

    console.log('✅ Market Environment Nightly Collector scheduled for 3:00 AM, Monday-Friday EST');
  }

  /**
   * Run the full nightly collection process with comprehensive error handling
   */
  async runNightlyCollection() {
    if (this.isRunning) {
      console.warn('⚠️ Nightly collection already in progress, skipping...');
      return { success: false, message: 'Collection already in progress' };
    }

    // Set up overall timeout protection
    const collectionTimeout = setTimeout(() => {
      console.error('❌ Collection timeout after 45 minutes - forcing reset');
      this.forceReset();
    }, this.config.maxCollectionTime);

    try {
      this.isRunning = true;
      const startTime = Date.now();
      
      console.log('🌙 Starting Market Environment Nightly Collection...');
      await this.updateCollectionStatus('running', 'Nightly collection started');

      // Step 1: Get S&P 500 constituent list with retry logic
      console.log('📊 Step 1: Fetching S&P 500 constituents...');
      const sp500List = await this.getSP500ConstituentsWithRetry();
      console.log(`✅ Retrieved ${sp500List.length} S&P 500 companies`);
      
      // Step 2: Collect data for companies with enhanced error handling
      console.log('📈 Step 2: Collecting company data...');
      const companyData = await this.collectCompanyDataEnhanced(sp500List);
      console.log(`✅ Collected data for ${companyData.length} companies`);
      
      // Step 3: Calculate dual scores with fallback
      console.log('🎯 Step 3: Calculating market scores...');
      const scores = await this.calculateDualScoresEnhanced(companyData);
      console.log(`✅ Calculated scores - Short: ${scores.shortTerm}, Long: ${scores.longTerm}`);
      
      // Step 4: Store results with verification
      console.log('💾 Step 4: Storing results...');
      await this.storeResultsEnhanced(scores, companyData);
      console.log('✅ Results stored successfully');
      
      const duration = (Date.now() - startTime) / 1000;
      this.lastCollection = new Date();
      
      console.log(`🎉 Collection completed successfully in ${duration}s`);
      await this.updateCollectionStatus('completed', `Collection completed in ${duration}s, ${companyData.length} companies analyzed`);
      
      clearTimeout(collectionTimeout);
      return { 
        success: true, 
        duration, 
        companies: companyData.length,
        scores: { shortTerm: scores.shortTerm, longTerm: scores.longTerm }
      };
      
    } catch (error) {
      console.error('❌ Nightly collection failed:', error);
      await this.updateCollectionStatus('failed', `Collection failed: ${error.message}`);
      clearTimeout(collectionTimeout);
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
      clearTimeout(collectionTimeout);
    }
  }

  /**
   * Force reset the collection state
   */
  async forceReset() {
    console.log('🔄 Force resetting collection state...');
    this.isRunning = false;
    await this.updateCollectionStatus('reset', 'Collection forcibly reset due to timeout');
  }

  /**
   * Get S&P 500 constituents with retry logic
   */
  async getSP500ConstituentsWithRetry() {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`📊 Attempt ${attempt}: Fetching S&P 500 constituent list...`);
        
        const constituents = await Promise.race([
          fmpService.getSP500Constituents(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('S&P 500 fetch timeout')), 30000)
          )
        ]);
        
        if (!constituents || constituents.length === 0) {
          throw new Error('Empty S&P 500 constituent list received');
        }
        
        if (constituents.length < 400) {
          console.warn(`⚠️ Only ${constituents.length} constituents found, expected ~500`);
        }
        
        return constituents;
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.config.maxRetries) {
          throw new Error(`Failed to fetch S&P 500 constituents after ${this.config.maxRetries} attempts: ${error.message}`);
        }
        
        console.log(`⏳ Waiting ${this.config.retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
  }

  /**
   * Enhanced company data collection with better error handling
   */
  async collectCompanyDataEnhanced(sp500List) {
    const results = [];
    const errors = [];
    const batchSize = this.config.batchSize;
    
    console.log(`📈 Processing ${sp500List.length} companies in batches of ${batchSize}...`);
    
    for (let i = 0; i < sp500List.length; i += batchSize) {
      const batch = sp500List.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(sp500List.length / batchSize);
      
      console.log(`📊 Processing batch ${batchNumber}/${totalBatches} (${batch.length} companies)...`);
      
      try {
        // Process batch with timeout protection
        const batchPromises = batch.map(company => 
          this.collectSingleCompanyDataEnhanced(company)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          } else {
            const company = batch[index];
            errors.push({
              symbol: company.symbol,
              error: result.reason?.message || 'Unknown error'
            });
          }
        });
        
        // Rate limiting between batches
        if (i + batchSize < sp500List.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        // Continue with next batch instead of failing entirely
      }
    }
    
    console.log(`✅ Data collection completed: ${results.length} successful, ${errors.length} errors`);
    if (errors.length > 0) {
      console.log(`⚠️ Sample errors: ${errors.slice(0, 3).map(e => `${e.symbol}: ${e.error}`).join(', ')}`);
    }
    
    return results;
  }

  /**
   * Enhanced single company data collection
   */
  async collectSingleCompanyDataEnhanced(company) {
    const symbol = company.symbol;
    const timeoutMs = this.config.companyTimeout;
    
    try {
      // Fetch data with individual timeouts
      const dataPromises = {
        quote: this.fetchWithTimeout(() => fmpService.getQuote(symbol), timeoutMs),
        ratios: this.fetchWithTimeout(() => fmpService.getFinancialRatios(symbol), timeoutMs),
        growth: this.fetchWithTimeout(() => fmpService.getFinancialGrowth(symbol), timeoutMs),
        keyMetrics: this.fetchWithTimeout(() => fmpService.getKeyMetrics(symbol), timeoutMs),
        historical: this.fetchWithTimeout(() => fmpService.getHistoricalPrices(symbol, '3months'), timeoutMs * 2),
        earnings: this.fetchWithTimeout(() => fmpService.getEarnings(symbol), timeoutMs)
      };
      
      const results = await Promise.allSettled(Object.values(dataPromises));
      const [quote, ratios, growth, keyMetrics, historical, earnings] = results;
      
      // Build company data with null fallbacks
      const companyData = {
        symbol,
        name: company.name || symbol,
        sector: company.sector || 'Unknown',
        marketCap: company.marketCap || 0,
        timestamp: new Date().toISOString(),
        quote: quote.status === 'fulfilled' ? quote.value : null,
        ratios: ratios.status === 'fulfilled' ? ratios.value : null,
        growth: growth.status === 'fulfilled' ? growth.value : null,
        keyMetrics: keyMetrics.status === 'fulfilled' ? keyMetrics.value : null,
        historical: historical.status === 'fulfilled' ? historical.value : null,
        earnings: earnings.status === 'fulfilled' ? earnings.value : null,
        dataQuality: this.assessDataQuality(results)
      };
      
      return companyData;
      
    } catch (error) {
      console.error(`❌ Failed to collect data for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Assess data quality for a company
   */
  assessDataQuality(results) {
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const total = results.length;
    const score = (successful / total) * 100;
    
    return {
      score: Math.round(score),
      successful,
      total,
      quality: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
    };
  }

  /**
   * Enhanced dual score calculation with fallbacks
   */
  async calculateDualScoresEnhanced(companyDataList) {
    try {
      const validCompanies = companyDataList.filter(data => 
        data !== null && data.dataQuality.score >= 40
      );
      
      if (validCompanies.length === 0) {
        throw new Error('No companies with sufficient data quality');
      }
      
      console.log(`🎯 Calculating scores for ${validCompanies.length} companies with good data quality...`);
      
      // Process companies in smaller batches to avoid overwhelming Python bridge
      const companyScores = [];
      const scoresBatchSize = 20;
      
      for (let i = 0; i < validCompanies.length; i += scoresBatchSize) {
        const batch = validCompanies.slice(i, i + scoresBatchSize);
        const batchScores = await Promise.all(
          batch.map(company => this.calculateCompanyScoresEnhanced(company))
        );
        companyScores.push(...batchScores);
        
        // Small delay between batches
        if (i + scoresBatchSize < validCompanies.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Aggregate market-wide scores
      const marketScores = this.aggregateMarketScores(companyScores);
      
      return {
        shortTerm: marketScores.shortTerm,
        longTerm: marketScores.longTerm,
        companies: companyScores,
        summary: {
          totalCompanies: companyScores.length,
          validDataCompanies: validCompanies.length,
          shortTermBullish: companyScores.filter(c => c.shortTermScore >= 70).length,
          longTermBullish: companyScores.filter(c => c.longTermScore >= 70).length,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Score calculation failed:', error);
      // Return neutral scores as fallback
      return {
        shortTerm: 50,
        longTerm: 50,
        companies: [],
        summary: {
          totalCompanies: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Enhanced company score calculation
   */
  async calculateCompanyScoresEnhanced(companyData) {
    try {
      const scores = {
        symbol: companyData.symbol,
        name: companyData.name,
        sector: companyData.sector,
        shortTermScore: 50,
        longTermScore: 50,
        dataQuality: companyData.dataQuality,
        components: {
          technical: 50,
          momentum: 50,
          valuation: 50,
          fundamental: 50
        }
      };
      
      // Technical Analysis (with timeout protection)
      if (companyData.historical && Array.isArray(companyData.historical) && companyData.historical.length >= 20) {
        try {
          const technicalScore = await Promise.race([
            this.calculateTechnicalScore(companyData.historical),
            new Promise(resolve => setTimeout(() => resolve(50), this.config.pythonTimeout))
          ]);
          scores.components.technical = technicalScore;
        } catch (error) {
          console.warn(`Technical analysis failed for ${companyData.symbol}: ${error.message}`);
        }
      }
      
      // Momentum Analysis
      if (companyData.growth || companyData.earnings) {
        scores.components.momentum = this.calculateMomentumScore(companyData);
      }
      
      // Valuation Analysis
      if (companyData.ratios || companyData.keyMetrics) {
        scores.components.valuation = this.calculateValuationScore(companyData);
      }
      
      // Fundamental Analysis
      if (companyData.ratios) {
        scores.components.fundamental = this.calculateFundamentalScore(companyData);
      }
      
      // Calculate composite scores
      scores.shortTermScore = Math.round(
        (scores.components.technical * 0.6) + (scores.components.momentum * 0.4)
      );
      
      scores.longTermScore = Math.round(
        (scores.components.valuation * 0.6) + (scores.components.fundamental * 0.4)
      );
      
      return scores;
      
    } catch (error) {
      console.error(`❌ Score calculation failed for ${companyData.symbol}:`, error);
      return {
        symbol: companyData.symbol,
        shortTermScore: 50,
        longTermScore: 50,
        error: error.message
      };
    }
  }

  /**
   * Enhanced results storage with verification
   */
  async storeResultsEnhanced(scores, companyData) {
    try {
      console.log('💾 Storing market environment results...');
      
      // Prepare data objects
      const shortTermData = {
        score: scores.shortTerm,
        timestamp: new Date().toISOString(),
        breadth: scores.breadth?.shortTerm || 0,
        average: scores.averages?.shortTerm || 0,
        methodology: 'Technical indicators (60%) + Earnings momentum (40%)',
        companiesAnalyzed: companyData.length
      };
      
      const longTermData = {
        score: scores.longTerm,
        timestamp: new Date().toISOString(),
        breadth: scores.breadth?.longTerm || 0,
        average: scores.averages?.longTerm || 0,
        methodology: 'Valuation metrics (60%) + Fundamental health (40%)',
        companiesAnalyzed: companyData.length
      };
      
      const sp500Data = {
        companies: scores.companies || [],
        summary: scores.summary || {},
        lastUpdate: new Date().toISOString(),
        dataQuality: {
          totalAttempted: companyData.length,
          successful: scores.companies.length,
          qualityScore: Math.round((scores.companies.length / companyData.length) * 100)
        }
      };
      
      // Store with error handling
      await Promise.all([
        redisService.set(this.cacheKeys.shortTerm, shortTermData, this.cacheTTL),
        redisService.set(this.cacheKeys.longTerm, longTermData, this.cacheTTL),
        redisService.set(this.cacheKeys.sp500Data, sp500Data, this.cacheTTL)
      ]);
      
      // Verify storage
      const verification = await Promise.all([
        redisService.get(this.cacheKeys.shortTerm),
        redisService.get(this.cacheKeys.longTerm),
        redisService.get(this.cacheKeys.sp500Data)
      ]);
      
      if (verification.every(v => v !== null)) {
        console.log('✅ All data stored and verified successfully');
      } else {
        throw new Error('Data verification failed - some keys not stored properly');
      }
      
    } catch (error) {
      console.error('❌ Failed to store results:', error);
      throw error;
    }
  }

  // Keep all the existing calculation methods...
  async calculateTechnicalScore(historicalData) {
    try {
      const result = await PythonBridge.runScript('technical_indicators.py', {
        price_data: historicalData,
        indicators: ['rsi', 'ma', 'macd', 'bollinger', 'momentum']
      });
      
      if (result && typeof result.score === 'number') {
        return Math.max(0, Math.min(100, result.score));
      }
      
      return 50;
      
    } catch (error) {
      console.error('❌ Technical score calculation failed:', error);
      return 50;
    }
  }

  /**
   * REDESIGNED: Investment-oriented momentum scoring 
   * Growth acceleration = HIGH score (good for momentum trading)
   */
  calculateMomentumScore(companyData) {
    let score = 50;
    
    try {
      if (companyData.growth && companyData.growth.length > 0) {
        const growth = companyData.growth[0];
        
        // Revenue growth momentum (40% weight) - REWARD strong growth
        if (growth.revenueGrowth > 0.20) score += 25; // Excellent growth
        else if (growth.revenueGrowth > 0.10) score += 15; // Good growth  
        else if (growth.revenueGrowth > 0.05) score += 8; // Moderate growth
        else if (growth.revenueGrowth < -0.05) score -= 20; // Declining revenue
        
        // Earnings growth momentum (40% weight) - REWARD earnings acceleration
        if (growth.netIncomeGrowth > 0.25) score += 25; // Excellent earnings
        else if (growth.netIncomeGrowth > 0.15) score += 15; // Good earnings
        else if (growth.netIncomeGrowth > 0.10) score += 8; // Moderate earnings
        else if (growth.netIncomeGrowth < -0.10) score -= 20; // Declining earnings
        
        // Cash flow growth (20% weight)
        if (growth.freeCashFlowGrowth > 0.20) score += 15; // Excellent FCF
        else if (growth.freeCashFlowGrowth > 0.10) score += 8; // Good FCF
        else if (growth.freeCashFlowGrowth < -0.15) score -= 10; // Poor FCF
      }
      
      // Recent price momentum boost
      if (companyData.quote && companyData.quote.length > 0) {
        const quote = companyData.quote[0];
        
        if (quote.changesPercentage > 10) score += 15; // Strong recent move
        else if (quote.changesPercentage > 5) score += 8; // Good recent move
        else if (quote.changesPercentage < -10) score -= 15; // Weak recent move
      }
      
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      console.error('❌ Investment momentum score calculation failed:', error);
      return 50;
    }
  }

  /**
   * REDESIGNED: Investment valuation scoring
   * Expensive valuations = LOW score (poor for long-term wealth building)
   */
  calculateValuationScore(companyData) {
    let score = 50;
    
    try {
      let ratioData = null;
      
      if (companyData.ratios && companyData.ratios.length > 0) {
        ratioData = companyData.ratios[0];
      } else if (companyData.keyMetrics && companyData.keyMetrics.length > 0) {
        ratioData = companyData.keyMetrics[0];
      }
      
      if (!ratioData) return 50;
      
      // P/E Ratio analysis (30% weight) - PENALIZE expensive P/E
      if (ratioData.priceEarningsRatio && ratioData.priceEarningsRatio > 0) {
        const pe = ratioData.priceEarningsRatio;
        if (pe < 12) score += 20; // Cheap = EXCELLENT for long-term
        else if (pe < 18) score += 10; // Reasonable = GOOD
        else if (pe < 25) score -= 5; // Slightly expensive = OK
        else if (pe < 35) score -= 15; // Expensive = BAD
        else score -= 25; // Very expensive = TERRIBLE
      }
      
      // P/B Ratio analysis (25% weight) - PENALIZE high P/B
      if (ratioData.priceToBookRatio && ratioData.priceToBookRatio > 0) {
        const pb = ratioData.priceToBookRatio;
        if (pb < 1.5) score += 15; // Cheap book value = GOOD
        else if (pb < 3) score += 5; // Reasonable = OK  
        else if (pb < 5) score -= 10; // Expensive = BAD
        else score -= 20; // Very expensive = TERRIBLE
      }
      
      // EV/EBITDA analysis (25% weight) - PENALIZE high multiples
      if (ratioData.enterpriseValueMultiple && ratioData.enterpriseValueMultiple > 0) {
        const evEbitda = ratioData.enterpriseValueMultiple;
        if (evEbitda < 8) score += 15; // Cheap = EXCELLENT
        else if (evEbitda < 12) score += 8; // Reasonable = GOOD
        else if (evEbitda < 18) score -= 5; // Expensive = BAD
        else score -= 15; // Very expensive = TERRIBLE
      }
      
      // P/S Ratio analysis (20% weight) - PENALIZE high P/S
      if (ratioData.priceToSalesRatio && ratioData.priceToSalesRatio > 0) {
        const ps = ratioData.priceToSalesRatio;
        if (ps < 1.5) score += 10; // Cheap sales multiple = GOOD
        else if (ps < 3) score += 5; // Reasonable = OK
        else if (ps < 6) score -= 8; // Expensive = BAD
        else score -= 15; // Very expensive = TERRIBLE
      }
      
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      console.error('❌ Investment valuation score calculation failed:', error);
      return 50;
    }
  }

  /**
   * REDESIGNED: Investment fundamental scoring
   * High quality fundamentals = HIGH score (good for long-term wealth building)
   */
  calculateFundamentalScore(companyData) {
    let score = 50;
    
    try {
      if (!companyData.ratios || companyData.ratios.length === 0) return 50;
      
      const ratios = companyData.ratios[0];
      
      // Return on Equity (30% weight) - REWARD high ROE
      if (ratios.returnOnEquity && ratios.returnOnEquity > 0) {
        const roe = ratios.returnOnEquity;
        if (roe > 0.25) score += 25; // Excellent profitability
        else if (roe > 0.18) score += 18; // Very good profitability
        else if (roe > 0.12) score += 12; // Good profitability
        else if (roe > 0.08) score += 5; // Moderate profitability
        else score -= 10; // Poor profitability
      }
      
      // Debt management (25% weight) - REWARD low debt
      if (ratios.debtEquityRatio !== undefined && ratios.debtEquityRatio >= 0) {
        const de = ratios.debtEquityRatio;
        if (de < 0.2) score += 20; // Very low debt = EXCELLENT
        else if (de < 0.4) score += 15; // Low debt = VERY GOOD
        else if (de < 0.6) score += 10; // Moderate debt = GOOD
        else if (de < 1.0) score += 0; // Normal debt = OK
        else if (de < 2.0) score -= 10; // High debt = BAD
        else score -= 20; // Very high debt = TERRIBLE
      }
      
      // Liquidity (20% weight) - REWARD strong liquidity
      if (ratios.currentRatio && ratios.currentRatio > 0) {
        const cr = ratios.currentRatio;
        if (cr > 2.5) score += 15; // Excellent liquidity
        else if (cr > 2.0) score += 12; // Very good liquidity
        else if (cr > 1.5) score += 10; // Good liquidity
        else if (cr > 1.2) score += 5; // Adequate liquidity  
        else if (cr > 1.0) score -= 5; // Weak liquidity
        else score -= 15; // Poor liquidity
      }
      
      // Profitability margins (25% weight) - REWARD high margins
      if (ratios.netProfitMargin && ratios.netProfitMargin > 0) {
        const margin = ratios.netProfitMargin;
        if (margin > 0.20) score += 20; // Excellent margins
        else if (margin > 0.15) score += 15; // Very good margins
        else if (margin > 0.10) score += 10; // Good margins
        else if (margin > 0.05) score += 5; // Moderate margins
        else score -= 10; // Poor margins
      }
      
      return Math.max(0, Math.min(100, score));
      
    } catch (error) {
      console.error('❌ Investment fundamental score calculation failed:', error);
      return 50;
    }
  }

  aggregateMarketScores(companyScores) {
    try {
      const validScores = companyScores.filter(score => 
        score.shortTermScore !== undefined && score.longTermScore !== undefined
      );
      
      if (validScores.length === 0) {
        return { shortTerm: 50, longTerm: 50 };
      }
      
      const shortTermSum = validScores.reduce((sum, score) => sum + score.shortTermScore, 0);
      const longTermSum = validScores.reduce((sum, score) => sum + score.longTermScore, 0);
      
      const shortTermAverage = shortTermSum / validScores.length;
      const longTermAverage = longTermSum / validScores.length;
      
      const shortTermBullish = validScores.filter(s => s.shortTermScore >= 60).length;
      const longTermBullish = validScores.filter(s => s.longTermScore >= 60).length;
      
      const shortTermBreadth = (shortTermBullish / validScores.length) * 100;
      const longTermBreadth = (longTermBullish / validScores.length) * 100;
      
      const shortTermFinal = (shortTermAverage * 0.7) + (shortTermBreadth * 0.3);
      const longTermFinal = (longTermAverage * 0.7) + (longTermBreadth * 0.3);
      
      return {
        shortTerm: Math.round(Math.max(0, Math.min(100, shortTermFinal))),
        longTerm: Math.round(Math.max(0, Math.min(100, longTermFinal))),
        breadth: {
          shortTerm: Math.round(shortTermBreadth),
          longTerm: Math.round(longTermBreadth)
        },
        averages: {
          shortTerm: Math.round(shortTermAverage),
          longTerm: Math.round(longTermAverage)
        }
      };
      
    } catch (error) {
      console.error('❌ Market score aggregation failed:', error);
      return { shortTerm: 50, longTerm: 50 };
    }
  }

  async updateCollectionStatus(status, message) {
    try {
      const statusData = {
        status,
        message,
        timestamp: new Date().toISOString(),
        isRunning: this.isRunning,
        lastCollection: this.lastCollection
      };
      
      await redisService.set(this.cacheKeys.collectionStatus, statusData, this.cacheTTL);
      
    } catch (error) {
      console.error('❌ Failed to update collection status:', error);
    }
  }

  fetchWithTimeout(promiseFunction, timeoutMs) {
    return Promise.race([
      promiseFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  async getCurrentScores() {
    try {
      const [shortTermData, longTermData] = await Promise.all([
        redisService.get(this.cacheKeys.shortTerm),
        redisService.get(this.cacheKeys.longTerm)
      ]);
      
      return {
        shortTerm: shortTermData || null,
        longTerm: longTermData || null,
        available: !!(shortTermData && longTermData)
      };
      
    } catch (error) {
      console.error('❌ Failed to get current scores:', error);
      return {
        shortTerm: null,
        longTerm: null,
        available: false,
        error: error.message
      };
    }
  }

  async getCollectionStatus() {
    try {
      const statusData = await redisService.get(this.cacheKeys.collectionStatus);
      return statusData || null;
    } catch (error) {
      console.error('❌ Failed to get collection status:', error);
      return null;
    }
  }

  async triggerManualCollection() {
    if (this.isRunning) {
      throw new Error('Collection already in progress');
    }
    
    console.log('🔧 Manual collection triggered');
    return await this.runNightlyCollection();
  }

  stop() {
    if (this.scheduledJob) {
      this.scheduledJob.stop();
      console.log('⏹️ Market Environment Nightly Collector stopped');
    }
  }
}

export default new MarketEnvironmentNightlyCollector();
