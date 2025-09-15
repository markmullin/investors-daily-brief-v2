import express from 'express';
import marketService from '../services/marketService.js';
import portfolioAnalyticsService from '../services/portfolioAnalyticsService.js';
import portfolioRiskService from '../services/portfolioRiskService.js';
import portfolioOptimizationService from '../services/portfolioOptimizationService.js';
import portfolioAdvancedAnalyticsService from '../services/portfolioAdvancedAnalyticsService.js';
import portfolioAIService from '../services/portfolioAIService.js';
import persistenceService from '../services/productionPortfolioPersistenceService.js';

const router = express.Router();

// *** FIXED: Using persistent storage instead of in-memory storage ***
// Removed: let portfolios = {...} 
// Now using: productionPortfolioPersistenceService for all portfolio data

console.log('🔄 Portfolio routes initialized with persistent storage');

// ========================================
// 🔧 PORTFOLIO PERSISTENCE HELPERS
// ========================================

/**
 * Get portfolio from persistent storage with error handling
 */
async function getPortfolioSafely(portfolioId) {
  try {
    const portfolio = await persistenceService.loadPortfolio(portfolioId);
    return portfolio;
  } catch (error) {
    console.error(`Error loading portfolio ${portfolioId}:`, error);
    return persistenceService.createDefaultPortfolio(portfolioId);
  }
}

/**
 * Save portfolio to persistent storage with error handling
 */
async function savePortfolioSafely(portfolioId, portfolioData) {
  try {
    await persistenceService.savePortfolio(portfolioId, portfolioData);
    console.log(`✅ Portfolio ${portfolioId} saved successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving portfolio ${portfolioId}:`, error);
    return false;
  }
}

// ========================================
// 🤖 AI-POWERED INVESTMENT INTELLIGENCE
// ========================================

// NEW: Get comprehensive AI investment intelligence
router.get('/:id/ai-intelligence', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('🧠 Generating comprehensive AI investment intelligence...');
    
    // Check if portfolio has holdings for AI analysis
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
      return res.json({
        portfolio: portfolio,
        aiIntelligence: {
          error: 'AI intelligence requires portfolio holdings',
          mlPredictions: null,
          marketRegime: null,
          sentimentAnalysis: null,
          dynamicAllocation: null,
          aiRecommendations: null
        }
      });
    }

    // Get live prices for holdings
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced portfolio with current market values
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    // Create portfolio object for AI analysis
    const portfolioForAI = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    // Get AI parameters from query string
    const aiParameters = {
      predictionHorizon: req.query.predictionHorizon ? 
        req.query.predictionHorizon.split(',').map(h => parseInt(h)) : 
        [1, 5, 21],
      includeRegimeAnalysis: req.query.includeRegimeAnalysis !== 'false',
      includeSentimentAnalysis: req.query.includeSentimentAnalysis !== 'false',
      includeMLPredictions: req.query.includeMLPredictions !== 'false',
      includeDynamicAllocation: req.query.includeDynamicAllocation !== 'false'
    };

    // Generate comprehensive AI investment intelligence
    console.log('🤖 Running AI analysis with ML predictions, regime detection, sentiment analysis...');
    const aiIntelligence = await portfolioAIService.generateInvestmentIntelligence(
      portfolioForAI, 
      aiParameters
    );

    console.log('✅ AI investment intelligence complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      aiIntelligence: aiIntelligence,
      parameters: aiParameters
    });

  } catch (error) {
    console.error('❌ Error generating AI investment intelligence:', error);
    res.status(500).json({
      error: 'Failed to generate AI investment intelligence',
      message: error.message
    });
  }
});

// NEW: Post endpoint for custom AI intelligence with specific parameters
router.post('/:id/ai-intelligence', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    const {
      predictionHorizon = [1, 5, 21],
      includeRegimeAnalysis = true,
      includeSentimentAnalysis = true,
      includeMLPredictions = true,
      includeDynamicAllocation = true,
      riskTolerance = 'moderate',
      investmentHorizon = 'long_term'
    } = req.body;

    console.log(`🧠 Custom AI intelligence: ${predictionHorizon.join(',')} day horizons, ${riskTolerance} risk...`);

    // Check holdings count
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
      return res.status(400).json({
        error: 'AI intelligence requires portfolio holdings'
      });
    }

    // Get live prices
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced holdings
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    const portfolioForAI = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    const aiParameters = {
      predictionHorizon,
      includeRegimeAnalysis,
      includeSentimentAnalysis,
      includeMLPredictions,
      includeDynamicAllocation,
      riskTolerance,
      investmentHorizon
    };

    // Generate AI intelligence
    const aiIntelligence = await portfolioAIService.generateInvestmentIntelligence(
      portfolioForAI,
      aiParameters
    );

    console.log('✅ Custom AI investment intelligence complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      aiIntelligence: aiIntelligence,
      parameters: aiParameters
    });

  } catch (error) {
    console.error('❌ Error in custom AI intelligence:', error);
    res.status(500).json({
      error: 'Failed to generate custom AI intelligence',
      message: error.message
    });
  }
});

// NEW: Get ML predictions for portfolio holdings
router.get('/:id/ml-predictions', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('🔮 Generating ML predictions for portfolio...');
    
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
      return res.json({
        portfolio: portfolio,
        mlPredictions: {
          error: 'ML predictions require portfolio holdings',
          predictions: {},
          modelPerformance: {}
        }
      });
    }

    // Get live prices
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const currentPrice = quote.price || holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    const portfolioForML = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    // Get prediction parameters
    const horizons = req.query.horizons ? 
      req.query.horizons.split(',').map(h => parseInt(h)) : 
      [1, 5, 21];

    // Generate ML predictions
    const mlPredictions = await portfolioAIService.generateMLPredictions(
      portfolioForML, 
      {},  // marketData will be gathered internally
      horizons
    );

    console.log('✅ ML predictions complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      mlPredictions: mlPredictions,
      predictionHorizons: horizons
    });

  } catch (error) {
    console.error('❌ Error generating ML predictions:', error);
    res.status(500).json({
      error: 'Failed to generate ML predictions',
      message: error.message
    });
  }
});

// NEW: Get market regime analysis
router.get('/:id/market-regime', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('📈 Analyzing current market regime...');

    const holdingsArray = Object.values(portfolio.holdings);
    const symbols = holdingsArray.map(h => h.symbol);

    // Get market data for regime analysis (can work without portfolio holdings)
    const marketData = symbols.length > 0 ? 
      await portfolioAIService.gatherMarketData(symbols) : 
      await portfolioAIService.gatherMarketData(['SPY', 'QQQ', 'IWM']);

    // Detect market regime
    const marketRegime = await portfolioAIService.detectMarketRegime(marketData);

    console.log('✅ Market regime analysis complete');

    res.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        holdingsCount: holdingsArray.length
      },
      marketRegime: marketRegime,
      marketData: {
        vix: marketData.vix,
        indices: Object.keys(marketData.indices).length,
        sectors: Object.keys(marketData.sectors).length
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing market regime:', error);
    res.status(500).json({
      error: 'Failed to analyze market regime',
      message: error.message
    });
  }
});

// NEW: Get sentiment analysis
router.get('/:id/sentiment-analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('💭 Analyzing market sentiment...');

    const holdingsArray = Object.values(portfolio.holdings);
    const symbols = holdingsArray.map(h => h.symbol);

    // Analyze sentiment (can work with or without specific symbols)
    const sentimentSymbols = symbols.length > 0 ? symbols : ['SPY', 'QQQ', 'AAPL', 'MSFT'];
    const sentimentAnalysis = await portfolioAIService.analyzeSentiment(sentimentSymbols);

    console.log('✅ Sentiment analysis complete');

    res.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        holdingsCount: holdingsArray.length
      },
      sentimentAnalysis: sentimentAnalysis,
      analyzedSymbols: sentimentSymbols
    });

  } catch (error) {
    console.error('❌ Error analyzing sentiment:', error);
    res.status(500).json({
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
});

// NEW: Get dynamic allocation recommendations
router.get('/:id/dynamic-allocation', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('⚖️ Calculating dynamic allocation recommendations...');

    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length < 2) {
      return res.json({
        portfolio: portfolio,
        dynamicAllocation: {
          error: 'Dynamic allocation requires at least 2 holdings',
          currentAllocation: {},
          recommendedAllocation: {}
        }
      });
    }

    // Get live prices
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const currentPrice = quote.price || holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    const portfolioForAllocation = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    // Get current market regime for allocation decisions
    const marketData = await portfolioAIService.gatherMarketData(symbols);
    const marketRegime = await portfolioAIService.detectMarketRegime(marketData);

    // Get ML predictions for allocation optimization
    const mlPredictions = await portfolioAIService.generateMLPredictions(
      portfolioForAllocation, 
      marketData, 
      [21]  // Use 1-month horizon for allocation
    );

    // Calculate dynamic allocation
    const dynamicAllocation = await portfolioAIService.calculateDynamicAllocation(
      portfolioForAllocation,
      marketRegime,
      mlPredictions
    );

    console.log('✅ Dynamic allocation recommendations complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      dynamicAllocation: dynamicAllocation,
      marketContext: {
        regime: marketRegime.currentRegime,
        confidence: marketRegime.confidence
      }
    });

  } catch (error) {
    console.error('❌ Error calculating dynamic allocation:', error);
    res.status(500).json({
      error: 'Failed to calculate dynamic allocation',
      message: error.message
    });
  }
});

// NEW: Get AI recommendations only
router.get('/:id/ai-recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('🎯 Generating AI-powered investment recommendations...');

    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
      return res.json({
        portfolio: portfolio,
        aiRecommendations: {
          error: 'AI recommendations require portfolio holdings',
          immediateActions: [],
          shortTermOutlook: 'Portfolio analysis requires holdings'
        }
      });
    }

    // Get enhanced portfolio
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const currentPrice = quote.price || holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    const portfolioForAI = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    // Get minimal context for recommendations
    const marketData = await portfolioAIService.gatherMarketData(symbols);
    const marketRegime = await portfolioAIService.detectMarketRegime(marketData);
    const sentimentAnalysis = await portfolioAIService.analyzeSentiment(symbols.slice(0, 5));

    // Generate recommendations
    const aiRecommendations = await portfolioAIService.generateAIRecommendations(
      portfolioForAI,
      null,  // No ML predictions
      marketRegime,
      sentimentAnalysis,
      null   // No dynamic allocation
    );

    console.log('✅ AI recommendations complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      aiRecommendations: aiRecommendations,
      context: {
        marketRegime: marketRegime.currentRegime,
        sentimentLevel: sentimentAnalysis.overallSentiment
      }
    });

  } catch (error) {
    console.error('❌ Error generating AI recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate AI recommendations',
      message: error.message
    });
  }
});

// ========================================
// 📊 EXISTING ANALYTICS & OPTIMIZATION
// ========================================

// NEW: Get portfolio advanced analytics
router.get('/:id/advanced-analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('🔬 Fetching portfolio advanced analytics...');
    
    // Check if portfolio has enough holdings for advanced analytics
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
      return res.json({
        portfolio: portfolio,
        advancedAnalytics: {
          error: 'Advanced analytics requires portfolio holdings',
          attributionAnalysis: { totalAlpha: 0, sectorAttribution: [], securitySelection: [], summary: {} },
          monteCarloAnalysis: { projections: {}, paths: [], statistics: {} },
          backtestingAnalysis: { periods: [], summary: {} },
          factorAnalysis: { exposures: {}, factorContributions: [] },
          advancedRiskMetrics: { cvar: {}, expectedShortfall: {}, tailRisk: {} }
        }
      });
    }

    // Get live prices for holdings
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced holdings with current market values
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    // Create portfolio object for advanced analytics
    const portfolioForAnalytics = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    // Get analytics parameters from query string
    const analyticsParameters = {
      lookbackPeriod: req.query.lookbackPeriod || '3years',
      monteCarloSimulations: parseInt(req.query.monteCarloSimulations) || 10000,
      monteCarloHorizon: parseInt(req.query.monteCarloHorizon) || 252, // 1 year
      backtestPeriods: parseInt(req.query.backtestPeriods) || 12,
      confidenceLevels: req.query.confidenceLevels ? 
        req.query.confidenceLevels.split(',').map(c => parseFloat(c)) : 
        [0.95, 0.99]
    };

    // Perform advanced analytics
    console.log('🧪 Running comprehensive advanced analytics...');
    const advancedAnalyticsResult = await portfolioAdvancedAnalyticsService.performAdvancedAnalytics(
      portfolioForAnalytics, 
      analyticsParameters
    );

    console.log('✅ Portfolio advanced analytics complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      advancedAnalytics: advancedAnalyticsResult
    });

  } catch (error) {
    console.error('❌ Error fetching portfolio advanced analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio advanced analytics',
      message: error.message
    });
  }
});

// NEW: Post endpoint for custom advanced analytics with parameters
router.post('/:id/advanced-analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    const {
      lookbackPeriod = '3years',
      monteCarloSimulations = 10000,
      monteCarloHorizon = 252,
      backtestPeriods = 12,
      confidenceLevels = [0.95, 0.99],
      includeAttribution = true,
      includeMonteCarlo = true,
      includeBacktesting = true,
      includeFactorAnalysis = true,
      includeAdvancedRisk = true
    } = req.body;

    console.log(`🔬 Custom advanced analytics: ${lookbackPeriod} lookback, ${monteCarloSimulations} simulations...`);

    // Check holdings count
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
      return res.status(400).json({
        error: 'Advanced analytics requires portfolio holdings'
      });
    }

    // Get live prices
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced holdings
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    const portfolioForAnalytics = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    const analyticsParameters = {
      lookbackPeriod,
      monteCarloSimulations,
      monteCarloHorizon,
      backtestPeriods,
      confidenceLevels,
      includeAttribution,
      includeMonteCarlo,
      includeBacktesting,
      includeFactorAnalysis,
      includeAdvancedRisk
    };

    // Perform advanced analytics
    const advancedAnalyticsResult = await portfolioAdvancedAnalyticsService.performAdvancedAnalytics(
      portfolioForAnalytics,
      analyticsParameters
    );

    console.log('✅ Custom portfolio advanced analytics complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      advancedAnalytics: advancedAnalyticsResult,
      parameters: analyticsParameters
    });

  } catch (error) {
    console.error('❌ Error in custom portfolio advanced analytics:', error);
    res.status(500).json({
      error: 'Failed to perform custom portfolio advanced analytics',
      message: error.message
    });
  }
});

// NEW: Get portfolio optimization analysis
router.get('/:id/optimization', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('🎯 Fetching portfolio optimization analysis...');
    
    // Check if portfolio has enough holdings for optimization
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length < 2) {
      return res.json({
        portfolio: portfolio,
        optimization: {
          error: 'Portfolio optimization requires at least 2 holdings',
          currentAllocation: { weights: {}, metrics: {} },
          optimalAllocation: { weights: {}, metrics: {} },
          efficientFrontier: [],
          rebalancingRecommendations: [],
          riskBudget: [],
          scenarioAnalysis: []
        }
      });
    }

    // Get live prices for holdings
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced holdings with current market values
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    // Create portfolio object for optimization
    const portfolioForOptimization = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    // Get optimization parameters from query string
    const optimizationParameters = {
      type: req.query.type || 'max_sharpe', // max_sharpe, min_risk, target_return
      constraints: {
        minWeight: parseFloat(req.query.minWeight) || 0.0,
        maxWeight: parseFloat(req.query.maxWeight) || 0.4,
        maxTurnover: parseFloat(req.query.maxTurnover) || 0.2,
        targetRisk: req.query.targetRisk ? parseFloat(req.query.targetRisk) : null,
        targetReturn: req.query.targetReturn ? parseFloat(req.query.targetReturn) : null
      }
    };

    // Perform optimization
    console.log('🔬 Running portfolio optimization algorithms...');
    const optimizationResult = await portfolioOptimizationService.optimizePortfolio(
      portfolioForOptimization, 
      optimizationParameters
    );

    console.log('✅ Portfolio optimization analysis complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      optimization: optimizationResult
    });

  } catch (error) {
    console.error('❌ Error fetching portfolio optimization:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio optimization',
      message: error.message
    });
  }
});

// NEW: Post endpoint for custom optimization with parameters
router.post('/:id/optimization', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    const {
      optimizationType = 'max_sharpe',
      constraints = {},
      riskTolerance = 'moderate',
      investmentHorizon = 'long_term'
    } = req.body;

    console.log(`🎯 Custom portfolio optimization: ${optimizationType} with ${riskTolerance} risk tolerance...`);

    // Check holdings count
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length < 2) {
      return res.status(400).json({
        error: 'Portfolio optimization requires at least 2 holdings'
      });
    }

    // Get live prices
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced holdings
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    // Adjust constraints based on risk tolerance
    const riskAdjustedConstraints = {
      minWeight: 0.0,
      maxWeight: riskTolerance === 'conservative' ? 0.25 : 
                 riskTolerance === 'moderate' ? 0.35 : 0.5,
      maxTurnover: riskTolerance === 'conservative' ? 0.1 : 
                   riskTolerance === 'moderate' ? 0.2 : 0.3,
      ...constraints
    };

    const portfolioForOptimization = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    const optimizationParameters = {
      type: optimizationType,
      constraints: riskAdjustedConstraints,
      riskTolerance,
      investmentHorizon
    };

    // Perform optimization
    const optimizationResult = await portfolioOptimizationService.optimizePortfolio(
      portfolioForOptimization,
      optimizationParameters
    );

    console.log('✅ Custom portfolio optimization complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      optimization: optimizationResult,
      parameters: optimizationParameters
    });

  } catch (error) {
    console.error('❌ Error in custom portfolio optimization:', error);
    res.status(500).json({
      error: 'Failed to perform custom portfolio optimization',
      message: error.message
    });
  }
});

// NEW: Get portfolio risk analysis
router.get('/:id/risk-analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('📊 Fetching portfolio risk analysis...');
    
    // Check if portfolio has holdings
    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
      return res.json({
        portfolio: portfolio,
        riskAnalysis: {
          riskMetrics: {},
          correlationMatrix: {},
          concentrationAnalysis: { totalPositions: 0, concentratedPositions: 0, positions: [] },
          stressTests: [],
          insights: { alerts: [], recommendations: [], strengths: [], risks: [] }
        }
      });
    }

    // Get live prices for holdings
    const symbols = holdingsArray.map(h => h.symbol);
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced holdings with current market values
    const enhancedHoldings = {};
    let totalValue = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue
      };

      totalValue += currentValue;
    }

    // Create portfolio object for risk calculations
    const portfolioForRisk = {
      holdings: enhancedHoldings,
      totalValue: totalValue
    };

    // Calculate risk metrics
    console.log('📈 Calculating risk metrics...');
    const riskAnalysis = await portfolioRiskService.calculatePortfolioRisk(portfolioForRisk);

    console.log('✅ Portfolio risk analysis complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        totalValue: totalValue
      },
      riskAnalysis: riskAnalysis
    });

  } catch (error) {
    console.error('❌ Error fetching portfolio risk analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio risk analysis',
      message: error.message
    });
  }
});

// NEW: Get portfolio with fundamentals analysis
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await getPortfolioSafely(id);

    console.log('🔍 Fetching portfolio analytics with fundamentals...');
    
    // First get the portfolio with live prices (reuse existing logic)
    const holdingsArray = Object.values(portfolio.holdings);
    const symbols = holdingsArray.map(h => h.symbol);
    
    if (symbols.length === 0) {
      return res.json({
        portfolio: portfolio,
        fundamentals: {},
        analytics: {
          portfolioMetrics: {},
          insights: { alerts: [], recommendations: [], strengths: [], risks: [] }
        }
      });
    }

    // Get live prices
    const priceData = await marketService.getMultipleQuotes(symbols);
    
    // Build enhanced holdings with live prices
    const enhancedHoldings = {};
    let totalValue = 0;
    let totalCost = 0;

    for (const holding of holdingsArray) {
      const quote = priceData[holding.symbol] || {};
      const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
      const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
      const currentValue = holding.quantity * currentPrice;
      const costBasis = holding.quantity * holding.avgCost;

      enhancedHoldings[holding.symbol] = {
        ...holding,
        currentPrice: currentPrice,
        currentValue: currentValue,
        costBasis: costBasis,
        gain: currentValue - costBasis,
        gainPercent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0
      };

      totalValue += currentValue;
      totalCost += costBasis;
    }

    // Get fundamental data for all holdings
    console.log('📊 Fetching fundamental data...');
    const fundamentalData = await portfolioAnalyticsService.getPortfolioFundamentals(enhancedHoldings);
    
    // Calculate portfolio-wide metrics
    console.log('📈 Calculating portfolio metrics...');
    const portfolioMetrics = portfolioAnalyticsService.calculatePortfolioMetrics(enhancedHoldings, fundamentalData);
    
    // Get insights and recommendations
    console.log('💡 Generating insights...');
    const insights = await portfolioAnalyticsService.getPortfolioInsights(enhancedHoldings, fundamentalData, portfolioMetrics);

    console.log('✅ Portfolio analytics complete');

    res.json({
      portfolio: {
        ...portfolio,
        holdings: enhancedHoldings,
        summary: {
          totalValue,
          totalCost,
          totalGain: totalValue - totalCost,
          totalGainPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
          lastUpdated: new Date().toISOString()
        }
      },
      fundamentals: fundamentalData,
      analytics: {
        portfolioMetrics,
        insights
      }
    });

  } catch (error) {
    console.error('❌ Error fetching portfolio analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio analytics',
      message: error.message
    });
  }
});

// ========================================
// 📂 PORTFOLIO MANAGEMENT
// ========================================

// *** FIXED: Get portfolio data with live prices - now using persistent storage ***
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`📖 Loading portfolio ${id} from persistent storage...`);
    const portfolio = await getPortfolioSafely(id);
    
    // Get live prices for all holdings
    const holdingsArray = Object.values(portfolio.holdings);
    const symbols = holdingsArray.map(h => h.symbol);
    
    console.log(`Fetching prices for ${symbols.length} symbols:`, symbols);
    
    if (symbols.length > 0) {
      try {
        // Fetch current prices
        const priceData = await marketService.getMultipleQuotes(symbols);
        
        console.log('Price data received:', Object.keys(priceData).length, 'quotes');
        
        // Update holdings with live data
        const enhancedHoldings = {};
        let totalValue = 0;
        let totalCost = 0;
        let dayChange = 0;
        let pricesFetched = 0;
        let pricesFailed = 0;
        
        for (const holding of holdingsArray) {
          const quote = priceData[holding.symbol] || {};
          
          // Use live price if available, otherwise fall back to average cost
          const hasValidPrice = quote.price !== null && quote.price !== undefined && quote.price > 0;
          if (hasValidPrice) {
            pricesFetched++;
          } else {
            pricesFailed++;
            console.log(`No price for ${holding.symbol}, using cost basis ${holding.avgCost}`);
          }
          
          const currentPrice = hasValidPrice ? quote.price : holding.avgCost;
          
          const currentValue = holding.quantity * currentPrice;
          const costBasis = holding.quantity * holding.avgCost;
          const gain = currentValue - costBasis;
          const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
          
          // Calculate day change only if we have valid quote data
          const dayChangeAmount = hasValidPrice && quote.change !== undefined
            ? holding.quantity * quote.change
            : 0;
          
          enhancedHoldings[holding.symbol] = {
            ...holding,
            currentPrice: currentPrice,
            currentValue: currentValue,
            costBasis: costBasis,
            gain: gain,
            gainPercent: gainPercent,
            dayChange: dayChangeAmount,
            dayChangePercent: quote.changePercent || 0,
            previousClose: quote.previousClose || currentPrice,
            hasLivePrice: hasValidPrice,
            priceTimestamp: quote.timestamp || null,
            priceError: quote.error || null
          };
          
          totalValue += currentValue;
          totalCost += costBasis;
          dayChange += dayChangeAmount;
        }
        
        console.log(`Prices fetched: ${pricesFetched}, failed: ${pricesFailed}`);
        console.log(`Total value: ${totalValue}, total cost: ${totalCost}`);
        
        const totalGain = totalValue - totalCost;
        const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
        const dayChangePercent = (totalValue - dayChange) > 0 
          ? (dayChange / (totalValue - dayChange)) * 100 
          : 0;
        
        const enhancedPortfolio = {
          ...portfolio,
          holdings: enhancedHoldings,
          summary: {
            totalValue: totalValue,
            totalCost: totalCost,
            totalGain: totalGain,
            totalGainPercent: totalGainPercent,
            dayChange: dayChange,
            dayChangePercent: dayChangePercent,
            lastUpdated: new Date().toISOString(),
            pricesFetched: pricesFetched,
            pricesFailed: pricesFailed
          }
        };

        // Auto-save enhanced portfolio data
        await persistenceService.autoSave(id, enhancedPortfolio);
        
        return res.json(enhancedPortfolio);
      } catch (error) {
        console.error('Error fetching live prices:', error);
        console.error('Error stack:', error.stack);
        
        // Calculate values using cost basis when price fetch fails completely
        let totalCostBasis = 0;
        const fallbackHoldings = {};
        
        for (const holding of holdingsArray) {
          const costBasis = holding.quantity * holding.avgCost;
          totalCostBasis += costBasis;
          
          fallbackHoldings[holding.symbol] = {
            ...holding,
            currentPrice: holding.avgCost,
            currentValue: costBasis,
            costBasis: costBasis,
            gain: 0,
            gainPercent: 0,
            dayChange: 0,
            dayChangePercent: 0,
            previousClose: holding.avgCost,
            hasLivePrice: false,
            priceTimestamp: null,
            priceError: 'Price fetch failed'
          };
        }
        
        return res.json({
          ...portfolio,
          holdings: fallbackHoldings,
          summary: {
            totalValue: totalCostBasis,
            totalCost: totalCostBasis,
            totalGain: 0,
            totalGainPercent: 0,
            dayChange: 0,
            dayChangePercent: 0,
            error: 'Unable to fetch live prices - showing cost basis',
            lastUpdated: new Date().toISOString()
          }
        });
      }
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error(`Error loading portfolio ${id}:`, error);
    res.status(500).json({
      error: 'Failed to load portfolio',
      message: error.message
    });
  }
});

// *** FIXED: Add a transaction - now with persistent storage ***
router.post('/:id/transaction', async (req, res) => {
  const { id } = req.params;
  const { date, symbol, action, quantity, price, fees = 0, account = 'Unknown' } = req.body;
  
  try {
    const portfolio = await getPortfolioSafely(id);
    
    // Validate required fields
    if (!symbol || !action || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields: symbol, action, quantity, price' });
    }
    
    // Add transaction
    const transaction = {
      id: `txn_${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      symbol: symbol.toUpperCase(),
      action: action.toUpperCase(),
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fees: parseFloat(fees),
      account: account,
      total: (parseFloat(quantity) * parseFloat(price)) + parseFloat(fees)
    };
    
    portfolio.transactions.push(transaction);
    
    // Update holdings
    if (!portfolio.holdings[transaction.symbol]) {
      portfolio.holdings[transaction.symbol] = {
        symbol: transaction.symbol,
        quantity: 0,
        avgCost: 0,
        totalCost: 0,
        accounts: {} // Track by account
      };
    }
    
    const holding = portfolio.holdings[transaction.symbol];
    
    // Track by account
    if (!holding.accounts[account]) {
      holding.accounts[account] = { quantity: 0, totalCost: 0 };
    }
    
    if (transaction.action === 'BUY') {
      const newTotalCost = holding.totalCost + transaction.total;
      const newQuantity = holding.quantity + transaction.quantity;
      holding.quantity = newQuantity;
      holding.totalCost = newTotalCost;
      holding.avgCost = newTotalCost / newQuantity;
      
      // Update account-specific data
      holding.accounts[account].quantity += transaction.quantity;
      holding.accounts[account].totalCost += transaction.total;
    } else if (transaction.action === 'SELL') {
      holding.quantity -= transaction.quantity;
      
      // Update account-specific data
      holding.accounts[account].quantity -= transaction.quantity;
      
      if (holding.quantity <= 0.001) { // Use small epsilon for floating point
        delete portfolio.holdings[transaction.symbol];
      } else {
        // For simplicity, keep the same average cost (in reality, we'd track lots)
        holding.totalCost = holding.avgCost * holding.quantity;
      }
    }
    
    // *** FIXED: Save portfolio to persistent storage ***
    await savePortfolioSafely(id, portfolio);
    
    res.json({ 
      message: 'Transaction added successfully', 
      transaction,
      holdings: portfolio.holdings 
    });
  } catch (error) {
    console.error(`Error adding transaction to portfolio ${id}:`, error);
    res.status(500).json({
      error: 'Failed to add transaction',
      message: error.message
    });
  }
});

// *** FIXED: Enhanced batch import with persistent storage ***
router.post('/:id/transactions/batch', async (req, res) => {
  const { id } = req.params;
  const { transactions, clearExisting = false, accountName = 'Unknown', mergeMode = 'add' } = req.body;
  
  try {
    const portfolio = await getPortfolioSafely(id);
    
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions must be an array' });
    }
    
    console.log(`\n=== FIXED: Batch import with persistent storage: ${transactions.length} transactions for account: ${accountName}, merge mode: ${mergeMode} ===`);
    
    // Check if this is a position import
    const isPositionImport = transactions.length > 0 && transactions.every(t => t.isPositionImport);
    console.log(`Is position import: ${isPositionImport}`);
    
    // *** FIXED: Handle replace mode with proper account isolation ***
    if (mergeMode === 'replace') {
      console.log(`\n*** FIXED: Handling replace mode for account: ${accountName} ***`);
      
      if (isPositionImport) {
        // For position imports, handle account-specific replacement
        console.log(`Position import - clearing positions for account: ${accountName}`);
        
        // Get current holdings for this account
        const currentAccountSymbols = new Set();
        Object.entries(portfolio.holdings).forEach(([symbol, holding]) => {
          if (holding.accounts && holding.accounts[accountName] && holding.accounts[accountName].quantity > 0) {
            currentAccountSymbols.add(symbol);
          }
        });
        
        console.log(`Current symbols in ${accountName}:`, Array.from(currentAccountSymbols));
        
        // Get symbols in the new import
        const newSymbols = new Set(transactions.map(t => t.symbol.toUpperCase()));
        console.log(`New symbols being imported:`, Array.from(newSymbols));
        
        // Find symbols that need to be sold (in current but not in new)
        const symbolsToSell = Array.from(currentAccountSymbols).filter(s => !newSymbols.has(s));
        console.log(`Symbols to sell (no longer in positions):`, symbolsToSell);
        
        // Create SELL transactions for missing symbols
        const sellDate = new Date().toISOString().split('T')[0];
        symbolsToSell.forEach(symbol => {
          const holding = portfolio.holdings[symbol];
          const accountData = holding.accounts[accountName];
          if (accountData && accountData.quantity > 0) {
            console.log(`Creating SELL transaction for ${symbol}: ${accountData.quantity} shares`);
            
            // Create a sell transaction to close the position
            const sellTransaction = {
              id: `txn_sell_${Date.now()}_${symbol}`,
              date: sellDate,
              symbol: symbol,
              action: 'SELL',
              quantity: accountData.quantity,
              price: holding.avgCost, // Use average cost for the sell
              fees: 0,
              account: accountName,
              total: accountData.quantity * holding.avgCost,
              autoGenerated: true,
              reason: 'Position not in latest import'
            };
            
            portfolio.transactions.push(sellTransaction);
            
            // *** FIXED: Update holdings properly with account isolation ***
            holding.quantity -= accountData.quantity;
            if (holding.quantity > 0) {
              holding.totalCost = holding.avgCost * holding.quantity;
            }
            accountData.quantity = 0;
            accountData.totalCost = 0;
            
            // Remove holding if quantity is zero across all accounts
            if (holding.quantity <= 0.001) {
              delete portfolio.holdings[symbol];
            }
          }
        });
      } else {
        // *** FIXED: For transaction imports, only clear transactions for this specific account ***
        console.log(`Transaction import - clearing transactions for account: ${accountName}`);
        
        const originalTransactionCount = portfolio.transactions.length;
        portfolio.transactions = portfolio.transactions.filter(t => t.account !== accountName);
        const removedTransactionCount = originalTransactionCount - portfolio.transactions.length;
        console.log(`Removed ${removedTransactionCount} transactions for account ${accountName}`);
        
        // *** FIXED: Rebuild holdings ONLY for affected symbols, preserving other accounts ***
        const affectedSymbols = new Set();
        
        // Find all symbols that were affected by removing transactions
        Object.keys(portfolio.holdings).forEach(symbol => {
          const holding = portfolio.holdings[symbol];
          if (holding.accounts && holding.accounts[accountName]) {
            affectedSymbols.add(symbol);
          }
        });
        
        console.log(`Affected symbols for account ${accountName}:`, Array.from(affectedSymbols));
        
        // *** FIXED: Only rebuild holdings for affected symbols, preserve other accounts ***
        affectedSymbols.forEach(symbol => {
          const holding = portfolio.holdings[symbol];
          if (holding.accounts && holding.accounts[accountName]) {
            // Remove this account's data
            delete holding.accounts[accountName];
            
            // Recalculate totals from remaining accounts
            let totalQuantity = 0;
            let totalCost = 0;
            
            Object.values(holding.accounts).forEach(accountData => {
              totalQuantity += accountData.quantity || 0;
              totalCost += accountData.totalCost || 0;
            });
            
            if (totalQuantity > 0) {
              holding.quantity = totalQuantity;
              holding.totalCost = totalCost;
              holding.avgCost = totalCost / totalQuantity;
            } else {
              // No holdings left for this symbol
              delete portfolio.holdings[symbol];
            }
          }
        });
        
        // *** FIXED: Rebuild account data from remaining transactions for affected symbols only ***
        portfolio.transactions.forEach(txn => {
          if (affectedSymbols.has(txn.symbol)) {
            const holding = portfolio.holdings[txn.symbol];
            if (!holding) {
              // This symbol was completely removed, recreate it
              portfolio.holdings[txn.symbol] = {
                symbol: txn.symbol,
                quantity: 0,
                avgCost: 0,
                totalCost: 0,
                accounts: {}
              };
            }
            
            const holdingRef = portfolio.holdings[txn.symbol];
            if (!holdingRef.accounts[txn.account]) {
              holdingRef.accounts[txn.account] = { quantity: 0, totalCost: 0 };
            }
            
            // Recalculate from scratch for this account
            if (txn.action === 'BUY') {
              holdingRef.accounts[txn.account].quantity += txn.quantity;
              holdingRef.accounts[txn.account].totalCost += txn.total;
            } else if (txn.action === 'SELL') {
              holdingRef.accounts[txn.account].quantity -= txn.quantity;
            }
          }
        });
        
        // Recalculate overall holdings for affected symbols
        affectedSymbols.forEach(symbol => {
          const holding = portfolio.holdings[symbol];
          if (holding) {
            let totalQuantity = 0;
            let totalCost = 0;
            
            Object.values(holding.accounts).forEach(accountData => {
              totalQuantity += accountData.quantity || 0;
              totalCost += accountData.totalCost || 0;
            });
            
            if (totalQuantity > 0) {
              holding.quantity = totalQuantity;
              holding.totalCost = totalCost;
              holding.avgCost = totalCost / totalQuantity;
            } else {
              delete portfolio.holdings[symbol];
            }
          }
        });
      }
    } else if (clearExisting) {
      // Clear everything
      portfolio.transactions = [];
      portfolio.holdings = {};
    }
    
    let successCount = 0;
    const errors = [];
    const importedSymbols = new Set();
    
    // Process each transaction with validation
    transactions.forEach((txnData, index) => {
      try {
        const { date, symbol, action, quantity, price, fees = 0, account, isPositionImport } = txnData;
        
        // Validate required fields
        if (!symbol || !action || !quantity || !price) {
          errors.push({ index, error: 'Missing required fields' });
          return;
        }
        
        // Validate numeric values
        const parsedQuantity = parseFloat(quantity);
        const parsedPrice = parseFloat(price);
        const parsedFees = parseFloat(fees);
        
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
          errors.push({ index, error: `Invalid quantity: ${quantity}` });
          return;
        }
        
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          errors.push({ index, error: `Invalid price: ${price}` });
          return;
        }
        
        const finalAccount = account || accountName;
        
        // Add transaction
        const transaction = {
          id: `txn_${Date.now()}_${index}`,
          date: date || new Date().toISOString().split('T')[0],
          symbol: symbol.toUpperCase(),
          action: action.toUpperCase(),
          quantity: parsedQuantity,
          price: parsedPrice,
          fees: parsedFees,
          account: finalAccount,
          total: (parsedQuantity * parsedPrice) + parsedFees,
          isPositionImport: isPositionImport || false
        };
        
        portfolio.transactions.push(transaction);
        importedSymbols.add(transaction.symbol);
        
        // Update holdings
        if (!portfolio.holdings[transaction.symbol]) {
          portfolio.holdings[transaction.symbol] = {
            symbol: transaction.symbol,
            quantity: 0,
            avgCost: 0,
            totalCost: 0,
            accounts: {}
          };
        }
        
        const holding = portfolio.holdings[transaction.symbol];
        
        // Initialize account tracking
        if (!holding.accounts[finalAccount]) {
          holding.accounts[finalAccount] = { quantity: 0, totalCost: 0, avgCost: 0 };
        }
        
        if (transaction.action === 'BUY') {
          // Update overall holding
          const newTotalCost = holding.totalCost + transaction.total;
          const newQuantity = holding.quantity + transaction.quantity;
          holding.quantity = newQuantity;
          holding.totalCost = newTotalCost;
          holding.avgCost = newTotalCost / newQuantity;
          
          // Update account-specific data
          const accountHolding = holding.accounts[finalAccount];
          const newAccountCost = accountHolding.totalCost + transaction.total;
          const newAccountQty = accountHolding.quantity + transaction.quantity;
          accountHolding.quantity = newAccountQty;
          accountHolding.totalCost = newAccountCost;
          accountHolding.avgCost = newAccountCost / newAccountQty;
        } else if (transaction.action === 'SELL') {
          // Update overall holding
          holding.quantity -= transaction.quantity;
          
          // Update account-specific data
          const accountHolding = holding.accounts[finalAccount];
          accountHolding.quantity -= transaction.quantity;
          
          // Adjust total costs proportionally
          if (holding.quantity <= 0.001) {
            delete portfolio.holdings[transaction.symbol];
          } else {
            holding.totalCost = holding.avgCost * holding.quantity;
            if (accountHolding.quantity > 0) {
              accountHolding.totalCost = accountHolding.avgCost * accountHolding.quantity;
            } else {
              accountHolding.totalCost = 0;
              accountHolding.avgCost = 0;
            }
          }
        }
        
        successCount++;
      } catch (error) {
        errors.push({ index, error: error.message });
      }
    });
    
    // *** FIXED: Save portfolio to persistent storage ***
    const saveSuccess = await savePortfolioSafely(id, portfolio);
    
    // Log summary
    console.log(`\n*** FIXED: Import complete with persistent storage: ${successCount} transactions imported for account ${accountName} ***`);
    console.log(`Symbols imported: ${Array.from(importedSymbols).join(', ')}`);
    console.log(`Persistent storage save: ${saveSuccess ? 'SUCCESS' : 'FAILED'}`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
      console.log('First few errors:', errors.slice(0, 5));
    }
    
    // Log current holdings after import
    console.log('\nCurrent holdings after import:');
    Object.values(portfolio.holdings).forEach(h => {
      console.log(`- ${h.symbol}: ${h.quantity} shares @ $${h.avgCost.toFixed(2)} = $${(h.quantity * h.avgCost).toFixed(2)}`);
      if (h.accounts) {
        Object.entries(h.accounts).forEach(([acc, data]) => {
          if (data.quantity > 0) {
            console.log(`  └─ ${acc}: ${data.quantity} shares @ $${(data.avgCost || 0).toFixed(2)}`);
          }
        });
      }
    });
    
    res.json({ 
      message: `*** FIXED: Imported ${successCount} transactions successfully for ${accountName} with persistent storage ***`,
      successCount,
      errors,
      totalHoldings: Object.keys(portfolio.holdings).length,
      accountName,
      importedSymbols: Array.from(importedSymbols),
      persistentStorageSave: saveSuccess
    });
  } catch (error) {
    console.error(`Error in batch import for portfolio ${id}:`, error);
    res.status(500).json({
      error: 'Failed to import transactions',
      message: error.message
    });
  }
});

// *** FIXED: Debug endpoint with persistent storage ***
router.get('/:id/debug', async (req, res) => {
  const { id } = req.params;
  
  try {
    const portfolio = await getPortfolioSafely(id);
    
    // Get account summary
    const accountSummary = {};
    portfolio.transactions.forEach(txn => {
      if (!accountSummary[txn.account]) {
        accountSummary[txn.account] = { transactions: 0, symbols: new Set() };
      }
      accountSummary[txn.account].transactions++;
      accountSummary[txn.account].symbols.add(txn.symbol);
    });
    
    // Convert sets to arrays
    Object.keys(accountSummary).forEach(account => {
      accountSummary[account].symbols = Array.from(accountSummary[account].symbols);
    });
    
    // Get persistence service stats
    const persistenceStats = await persistenceService.getStats();
    
    res.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        totalTransactions: portfolio.transactions.length,
        totalHoldings: Object.keys(portfolio.holdings).length
      },
      accountSummary,
      recentTransactions: portfolio.transactions.slice(-10),
      holdings: Object.keys(portfolio.holdings).map(symbol => ({
        symbol,
        quantity: portfolio.holdings[symbol].quantity,
        avgCost: portfolio.holdings[symbol].avgCost,
        totalCost: portfolio.holdings[symbol].totalCost,
        accounts: portfolio.holdings[symbol].accounts
      })),
      persistenceService: persistenceStats
    });
  } catch (error) {
    console.error(`Error in debug endpoint for portfolio ${id}:`, error);
    res.status(500).json({
      error: 'Failed to get debug information',
      message: error.message
    });
  }
});

// *** FIXED: Get all holdings with persistent storage ***
router.get('/:id/holdings', async (req, res) => {
  const { id } = req.params;
  
  try {
    const portfolio = await getPortfolioSafely(id);
    res.json(portfolio.holdings);
  } catch (error) {
    console.error(`Error getting holdings for portfolio ${id}:`, error);
    res.status(500).json({
      error: 'Failed to get holdings',
      message: error.message
    });
  }
});

// *** FIXED: Get all transactions with persistent storage ***
router.get('/:id/transactions', async (req, res) => {
  const { id } = req.params;
  
  try {
    const portfolio = await getPortfolioSafely(id);
    res.json(portfolio.transactions);
  } catch (error) {
    console.error(`Error getting transactions for portfolio ${id}:`, error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: error.message
    });
  }
});

// *** FIXED: Clear portfolio with persistent storage ***
router.delete('/:id/clear', async (req, res) => {
  const { id } = req.params;
  
  try {
    const portfolio = await getPortfolioSafely(id);
    
    const clearedPortfolio = {
      id: id,
      name: portfolio.name,
      created_date: portfolio.created_date,
      total_value: 0,
      transactions: [],
      holdings: {},
      accounts: {}
    };
    
    const saveSuccess = await savePortfolioSafely(id, clearedPortfolio);
    
    res.json({ 
      message: 'Portfolio cleared successfully',
      persistentStorageSave: saveSuccess
    });
  } catch (error) {
    console.error(`Error clearing portfolio ${id}:`, error);
    res.status(500).json({
      error: 'Failed to clear portfolio',
      message: error.message
    });
  }
});

// ENHANCED: Test endpoint for debugging price fetching with detailed diagnostics
router.get('/test/prices/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    console.log(`\n=== PRICE TEST for ${symbol} ===`);
    const startTime = Date.now();
    
    const quotes = await marketService.getMultipleQuotes([symbol]);
    const endTime = Date.now();
    
    const quote = quotes[symbol];
    const success = quote && quote.price !== null && quote.price > 0;
    
    console.log(`Test completed in ${endTime - startTime}ms`);
    console.log(`Success: ${success}`);
    
    res.json({
      symbol,
      quote: quote || null,
      success: success,
      timing: `${endTime - startTime}ms`,
      timestamp: new Date().toISOString(),
      debug: {
        hasQuote: !!quote,
        hasPrice: quote ? quote.price !== null : false,
        priceValue: quote ? quote.price : null,
        error: quote ? quote.error : null
      }
    });
  } catch (error) {
    console.error(`Price test error for ${symbol}:`, error);
    res.json({
      symbol,
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: API Diagnostics endpoint
router.get('/test/api-status', async (req, res) => {
  console.log('\n=== API DIAGNOSTICS ===');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      eodApiKey: process.env.EOD_API_KEY ? 'SET' : 'NOT SET',
      eodApiKeyLength: process.env.EOD_API_KEY ? process.env.EOD_API_KEY.length : 0,
      nodeEnv: process.env.NODE_ENV || 'not set'
    },
    tests: {}
  };
  
  // Test 1: Simple API connectivity
  try {
    console.log('Testing API connectivity...');
    const axios = (await import('axios')).default;
    
    // Test FMP connectivity instead
    const fmpService = (await import('../services/fmpService.js')).default;
    const response = await fmpService.getQuote('AAPL');
    
    diagnostics.tests.connectivity = {
      success: true,
      status: response && response.length ? 'OK' : 'No data',
      hasData: !!response,
      dataKeys: response && response[0] ? Object.keys(response[0]) : []
    };
    
    console.log('✓ API connectivity test passed');
  } catch (error) {
    diagnostics.tests.connectivity = {
      success: false,
      error: error.message,
      status: error.response ? error.response.status : 'no response'
    };
    console.log('✗ API connectivity test failed:', error.message);
  }
  
  // Test 2: Market service integration
  try {
    console.log('Testing market service...');
    const testResult = await marketService.getMultipleQuotes(['AAPL']);
    
    diagnostics.tests.marketService = {
      success: true,
      hasResult: !!testResult,
      symbolCount: Object.keys(testResult || {}).length,
      sampleResult: testResult['AAPL'] || null
    };
    
    console.log('✓ Market service test passed');
  } catch (error) {
    diagnostics.tests.marketService = {
      success: false,
      error: error.message
    };
    console.log('✗ Market service test failed:', error.message);
  }
  
  // Test 3: Persistence service health
  try {
    console.log('Testing persistence service...');
    const healthCheck = await persistenceService.healthCheck();
    
    diagnostics.tests.persistenceService = healthCheck;
    
    console.log('✓ Persistence service test completed');
  } catch (error) {
    diagnostics.tests.persistenceService = {
      healthy: false,
      error: error.message
    };
    console.log('✗ Persistence service test failed:', error.message);
  }
  
  console.log('=== DIAGNOSTICS COMPLETE ===\n');
  
  res.json(diagnostics);
});

// *** NEW: Persistence service endpoints ***
router.get('/persistence/stats', async (req, res) => {
  try {
    const stats = await persistenceService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get persistence stats',
      message: error.message
    });
  }
});

router.post('/persistence/clear-cache', (req, res) => {
  try {
    persistenceService.clearAllCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

router.get('/persistence/health', async (req, res) => {
  try {
    const health = await persistenceService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check persistence health',
      message: error.message,
      healthy: false
    });
  }
});

// Test endpoint
router.get('/test/hello', (req, res) => {
  res.json({ 
    message: 'Portfolio API is working with persistent storage!',
    timestamp: new Date().toISOString(),
    persistenceEnabled: true
  });
});

export default router;
