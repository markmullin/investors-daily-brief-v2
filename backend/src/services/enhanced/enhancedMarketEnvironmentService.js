/**
 * Enhanced Market Environment Service
 * Analyzes individual S&P 500 companies for comprehensive market scoring
 * Integrates smart money tracking and forward-looking indicators
 */

const PythonBridge = require('../PythonBridge');
const redisService = require('../redisService');
const fmpService = require('../fmpService');
const logger = require('../../utils/logger');

class EnhancedMarketEnvironmentService {
  constructor() {
    this.cacheKey = 'enhanced_market_environment';
    this.cacheTTL = 15 * 60; // 15 minutes cache
    this.sp500CacheKey = 'sp500_individual_analysis';
    this.sp500CacheTTL = 60 * 60; // 1 hour cache for individual company analysis
  }

  /**
   * Get enhanced market environment analysis with S&P 500 individual company analysis
   */
  async getEnhancedAnalysis(options = {}) {
    try {
      logger.info('🌍 Starting enhanced market environment analysis...');

      // Check cache first
      const cachedResult = await redisService.get(this.cacheKey);
      if (cachedResult && !options.forceRefresh) {
        logger.info('✅ Returning cached enhanced market environment analysis');
        return JSON.parse(cachedResult);
      }

      // Get S&P 500 individual analysis
      const sp500Analysis = await this.getIndividualSP500Analysis();
      
      // Get traditional market environment data
      const marketEnvironmentData = await this.getTraditionalMarketData();
      
      // Get smart money analysis
      const smartMoneyData = await this.getSmartMoneyAnalysis();
      
      // Get macro environment
      const macroData = await this.getMacroEnvironmentData();
      
      // Calculate enhanced composite score
      const enhancedScore = this.calculateEnhancedScore({
        sp500Analysis,
        marketEnvironment: marketEnvironmentData,
        smartMoney: smartMoneyData,
        macro: macroData
      });

      const result = {
        score: enhancedScore,
        timestamp: new Date().toISOString(),
        sp500Analysis,
        marketEnvironment: marketEnvironmentData,
        smartMoney: smartMoneyData,
        macro: macroData,
        methodology: 'Enhanced algorithm with individual S&P 500 company analysis',
        source: 'enhanced_market_environment_service'
      };

      // Cache the result
      await redisService.setex(this.cacheKey, this.cacheTTL, JSON.stringify(result));
      
      logger.info(`✅ Enhanced market environment analysis complete: Score ${enhancedScore}`);
      return result;

    } catch (error) {
      logger.error('❌ Enhanced market environment analysis failed:', error);
      
      // Fallback to basic analysis
      try {
        const fallbackScore = await this.getFallbackScore();
        return {
          score: fallbackScore,
          timestamp: new Date().toISOString(),
          source: 'fallback',
          error: error.message
        };
      } catch (fallbackError) {
        throw new Error(`Enhanced analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * Analyze all S&P 500 companies individually
   */
  async getIndividualSP500Analysis() {
    try {
      logger.info('📊 Analyzing individual S&P 500 companies...');

      // Check cache
      const cachedSP500 = await redisService.get(this.sp500CacheKey);
      if (cachedSP500) {
        logger.info('✅ Using cached S&P 500 individual analysis');
        return JSON.parse(cachedSP500);
      }

      // Get S&P 500 constituent list
      const sp500List = await fmpService.getSP500Constituents();
      
      if (!sp500List || sp500List.length === 0) {
        throw new Error('Failed to fetch S&P 500 constituent list');
      }

      logger.info(`📈 Analyzing ${sp500List.length} S&P 500 companies individually...`);

      // Analyze companies in batches to avoid API rate limits
      const batchSize = 50;
      const analysisResults = {
        totalCompanies: sp500List.length,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        technicallyStrong: 0,
        fundamentallyHealthy: 0,
        earnings GrowthPositive: 0,
        insiderBuying: 0,
        averageScore: 0,
        sectorBreakdown: {},
        topPerformers: [],
        underperformers: []
      };

      const allScores = [];

      for (let i = 0; i < sp500List.length; i += batchSize) {
        const batch = sp500List.slice(i, i + batchSize);
        
        logger.info(`📊 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sp500List.length/batchSize)}...`);
        
        const batchResults = await Promise.allSettled(
          batch.map(company => this.analyzeIndividualCompany(company))
        );

        // Process batch results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const analysis = result.value;
            const company = batch[index];
            
            allScores.push(analysis.score);
            
            // Update counters
            if (analysis.score >= 70) {
              analysisResults.bullishCount++;
            } else if (analysis.score <= 40) {
              analysisResults.bearishCount++;
            } else {
              analysisResults.neutralCount++;
            }

            if (analysis.technical?.strong) analysisResults.technicallyStrong++;
            if (analysis.fundamental?.healthy) analysisResults.fundamentallyHealthy++;
            if (analysis.earnings?.growing) analysisResults.earningsGrowthPositive++;
            if (analysis.insider?.buying) analysisResults.insiderBuying++;

            // Track sector breakdown
            const sector = company.sector || 'Unknown';
            if (!analysisResults.sectorBreakdown[sector]) {
              analysisResults.sectorBreakdown[sector] = { total: 0, bullish: 0, average: 0 };
            }
            analysisResults.sectorBreakdown[sector].total++;
            if (analysis.score >= 70) analysisResults.sectorBreakdown[sector].bullish++;

            // Track top performers and underperformers
            if (analysis.score >= 80) {
              analysisResults.topPerformers.push({
                symbol: company.symbol,
                name: company.name,
                score: analysis.score,
                sector: sector
              });
            } else if (analysis.score <= 30) {
              analysisResults.underperformers.push({
                symbol: company.symbol,
                name: company.name,
                score: analysis.score,
                sector: sector
              });
            }
          }
        });

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Calculate final statistics
      analysisResults.averageScore = allScores.length > 0 ? 
        Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 50;

      // Sort performers
      analysisResults.topPerformers.sort((a, b) => b.score - a.score);
      analysisResults.underperformers.sort((a, b) => a.score - b.score);

      // Keep only top 10 of each
      analysisResults.topPerformers = analysisResults.topPerformers.slice(0, 10);
      analysisResults.underperformers = analysisResults.underperformers.slice(0, 10);

      // Calculate sector averages
      Object.keys(analysisResults.sectorBreakdown).forEach(sector => {
        const sectorData = analysisResults.sectorBreakdown[sector];
        sectorData.bullishPercent = Math.round((sectorData.bullish / sectorData.total) * 100);
      });

      // Cache the results
      await redisService.setex(this.sp500CacheKey, this.sp500CacheTTL, JSON.stringify(analysisResults));

      logger.info(`✅ S&P 500 individual analysis complete: ${analysisResults.bullishCount}/500 bullish companies`);
      return analysisResults;

    } catch (error) {
      logger.error('❌ S&P 500 individual analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze individual company using multiple factors
   */
  async analyzeIndividualCompany(company) {
    try {
      const symbol = company.symbol;
      
      // Get company data in parallel
      const [quote, ratios, growth, technical] = await Promise.allSettled([
        fmpService.getQuote(symbol),
        fmpService.getFinancialRatios(symbol),
        fmpService.getFinancialGrowth(symbol),
        this.getTechnicalAnalysis(symbol)
      ]);

      let score = 50; // Base score
      
      const analysis = {
        symbol,
        score: 50,
        technical: { strong: false },
        fundamental: { healthy: false },
        earnings: { growing: false },
        insider: { buying: false }
      };

      // Technical analysis (30% weight)
      if (technical.status === 'fulfilled' && technical.value) {
        const techScore = technical.value.score || 50;
        score += (techScore - 50) * 0.3;
        analysis.technical = {
          strong: techScore >= 70,
          score: techScore,
          trend: technical.value.trend || 'neutral'
        };
      }

      // Fundamental analysis (40% weight)
      if (ratios.status === 'fulfilled' && ratios.value && ratios.value.length > 0) {
        const ratio = ratios.value[0];
        let fundamentalScore = 50;
        
        // P/E ratio assessment
        if (ratio.priceEarningsRatio && ratio.priceEarningsRatio > 0 && ratio.priceEarningsRatio < 25) {
          fundamentalScore += 10;
        }
        
        // Debt to equity assessment
        if (ratio.debtEquityRatio && ratio.debtEquityRatio < 0.5) {
          fundamentalScore += 10;
        }
        
        // ROE assessment
        if (ratio.returnOnEquity && ratio.returnOnEquity > 0.15) {
          fundamentalScore += 15;
        }

        // Current ratio assessment
        if (ratio.currentRatio && ratio.currentRatio > 1.2) {
          fundamentalScore += 10;
        }

        score += (fundamentalScore - 50) * 0.4;
        analysis.fundamental = {
          healthy: fundamentalScore >= 70,
          score: fundamentalScore,
          pe: ratio.priceEarningsRatio,
          roe: ratio.returnOnEquity,
          debtEquity: ratio.debtEquityRatio
        };
      }

      // Growth analysis (30% weight)
      if (growth.status === 'fulfilled' && growth.value && growth.value.length > 0) {
        const growthData = growth.value[0];
        let growthScore = 50;
        
        // Revenue growth
        if (growthData.revenueGrowth && growthData.revenueGrowth > 0.05) {
          growthScore += 15;
        }
        
        // Earnings growth
        if (growthData.netIncomeGrowth && growthData.netIncomeGrowth > 0.1) {
          growthScore += 15;
        }

        score += (growthScore - 50) * 0.3;
        analysis.earnings = {
          growing: growthScore >= 70,
          revenueGrowth: growthData.revenueGrowth,
          earningsGrowth: growthData.netIncomeGrowth
        };
      }

      // Ensure score is within bounds
      analysis.score = Math.max(0, Math.min(100, Math.round(score)));
      
      return analysis;

    } catch (error) {
      logger.error(`❌ Failed to analyze company ${company.symbol}:`, error);
      return {
        symbol: company.symbol,
        score: 50,
        error: error.message,
        technical: { strong: false },
        fundamental: { healthy: false },
        earnings: { growing: false },
        insider: { buying: false }
      };
    }
  }

  /**
   * Get technical analysis for individual stock
   */
  async getTechnicalAnalysis(symbol) {
    try {
      // Get historical price data
      const historicalData = await fmpService.getHistoricalData(symbol, '3month');
      
      if (!historicalData || historicalData.length < 50) {
        return { score: 50, trend: 'neutral' };
      }

      // Use Python bridge for technical analysis
      const pythonResult = await PythonBridge.runScript('technical_indicators.py', {
        symbol,
        price_data: historicalData,
        indicators: ['rsi', 'ma', 'macd', 'bollinger']
      });

      if (pythonResult && pythonResult.score) {
        return {
          score: pythonResult.score,
          trend: pythonResult.trend || 'neutral',
          rsi: pythonResult.rsi,
          ma_position: pythonResult.ma_position
        };
      }

      return { score: 50, trend: 'neutral' };

    } catch (error) {
      logger.error(`❌ Technical analysis failed for ${symbol}:`, error);
      return { score: 50, trend: 'neutral' };
    }
  }

  /**
   * Get traditional market environment data
   */
  async getTraditionalMarketData() {
    try {
      // Get major index data
      const [spyData, vixData, sectorData] = await Promise.allSettled([
        fmpService.getQuote('SPY'),
        fmpService.getQuote('VXX'),
        fmpService.getSectorPerformance()
      ]);

      return {
        spy: spyData.status === 'fulfilled' ? spyData.value : null,
        volatility: vixData.status === 'fulfilled' ? vixData.value : null,
        sectors: sectorData.status === 'fulfilled' ? sectorData.value : null
      };

    } catch (error) {
      logger.error('❌ Traditional market data fetch failed:', error);
      return null;
    }
  }

  /**
   * Get smart money analysis (institutional flows, insider trading)
   */
  async getSmartMoneyAnalysis() {
    try {
      logger.info('💰 Analyzing smart money positioning...');

      // This would integrate with institutional flow data
      // For now, return placeholder structure
      return {
        sentiment: 'neutral',
        institutionalFlows: 0,
        insiderActivity: 'mixed',
        score: 50,
        confidence: 'medium'
      };

    } catch (error) {
      logger.error('❌ Smart money analysis failed:', error);
      return {
        sentiment: 'neutral',
        score: 50,
        error: error.message
      };
    }
  }

  /**
   * Get macro environment data
   */
  async getMacroEnvironmentData() {
    try {
      // Get FRED economic data
      const response = await fetch('/api/macroeconomic/summary');
      
      if (response.ok) {
        const macroData = await response.json();
        return {
          regime: macroData.regime || 'mixed',
          gdpGrowth: macroData.gdpGrowth,
          inflation: macroData.inflation,
          employment: macroData.employment,
          score: macroData.score || 50
        };
      }

      return {
        regime: 'mixed',
        score: 50
      };

    } catch (error) {
      logger.error('❌ Macro environment analysis failed:', error);
      return {
        regime: 'mixed',
        score: 50,
        error: error.message
      };
    }
  }

  /**
   * Calculate enhanced composite score
   */
  calculateEnhancedScore(data) {
    try {
      let compositeScore = 50;
      
      // S&P 500 individual analysis (40% weight)
      if (data.sp500Analysis) {
        const sp500Score = data.sp500Analysis.averageScore || 50;
        const bullishPercent = (data.sp500Analysis.bullishCount / data.sp500Analysis.totalCompanies) * 100;
        
        // Combine average score with bullish participation
        const participationScore = 40 + (bullishPercent - 50) * 0.6; // Convert % to score
        const sp500CompositeScore = (sp500Score * 0.7) + (participationScore * 0.3);
        
        compositeScore += (sp500CompositeScore - 50) * 0.4;
      }

      // Traditional market environment (30% weight)
      if (data.marketEnvironment) {
        const marketScore = this.calculateTraditionalScore(data.marketEnvironment);
        compositeScore += (marketScore - 50) * 0.3;
      }

      // Smart money analysis (20% weight)
      if (data.smartMoney) {
        const smartMoneyScore = data.smartMoney.score || 50;
        compositeScore += (smartMoneyScore - 50) * 0.2;
      }

      // Macro environment (10% weight)
      if (data.macro) {
        const macroScore = data.macro.score || 50;
        compositeScore += (macroScore - 50) * 0.1;
      }

      // Ensure score is within bounds
      return Math.max(0, Math.min(100, Math.round(compositeScore)));

    } catch (error) {
      logger.error('❌ Enhanced score calculation failed:', error);
      return 50;
    }
  }

  /**
   * Calculate traditional market score
   */
  calculateTraditionalScore(marketData) {
    let score = 50;
    
    try {
      // SPY analysis
      if (marketData.spy && marketData.spy.length > 0) {
        const spy = marketData.spy[0];
        if (spy.changesPercentage > 0) score += 10;
        if (spy.changesPercentage > 1) score += 5;
      }

      // Volatility analysis
      if (marketData.volatility && marketData.volatility.length > 0) {
        const vix = marketData.volatility[0];
        if (vix.price < 20) score += 15;
        else if (vix.price > 30) score -= 10;
      }

      // Sector breadth
      if (marketData.sectors && Array.isArray(marketData.sectors)) {
        const positiveSectors = marketData.sectors.filter(s => s.changesPercentage > 0).length;
        const breadthPercent = (positiveSectors / marketData.sectors.length) * 100;
        
        if (breadthPercent > 60) score += 10;
        else if (breadthPercent < 40) score -= 10;
      }

      return Math.max(0, Math.min(100, score));

    } catch (error) {
      logger.error('❌ Traditional score calculation failed:', error);
      return 50;
    }
  }

  /**
   * Get fallback score when analysis fails
   */
  async getFallbackScore() {
    try {
      // Try to get basic market data
      const spyQuote = await fmpService.getQuote('SPY');
      
      if (spyQuote && spyQuote.length > 0) {
        const spy = spyQuote[0];
        const baseScore = spy.changesPercentage > 0 ? 55 : 45;
        return Math.max(30, Math.min(70, baseScore + (spy.changesPercentage * 2)));
      }

      return 50;

    } catch (error) {
      logger.error('❌ Fallback score calculation failed:', error);
      return 50;
    }
  }

  /**
   * Force refresh of all cached data
   */
  async forceRefresh() {
    try {
      await redisService.del(this.cacheKey);
      await redisService.del(this.sp500CacheKey);
      logger.info('✅ Enhanced market environment cache cleared');
      return true;
    } catch (error) {
      logger.error('❌ Failed to clear enhanced market environment cache:', error);
      return false;
    }
  }
}

module.exports = new EnhancedMarketEnvironmentService();
