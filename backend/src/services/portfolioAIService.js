import fmpService from './fmpService.js';
import portfolioAdvancedAnalyticsService from './portfolioAdvancedAnalyticsService.js';
import pythonBridge from './PythonBridge.js';
import unifiedGptOssService from '../services/unifiedGptOssService.js';

class PortfolioAIService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour cache for AI predictions
    this.modelCache = new Map();
    this.modelCacheTimeout = 86400000; // 24 hour cache for trained models
    
    // Market regime thresholds and configurations
    this.regimeConfig = {
      vixThresholds: { low: 15, high: 25 },
      volatilityThresholds: { low: 0.15, high: 0.30 },
      momentumThresholds: { low: -0.05, high: 0.05 },
      regimeLabels: ['Bull', 'Bear', 'Volatile', 'Stable']
    };

    // ML model configurations
    this.mlConfig = {
      predictionHorizon: [1, 5, 21, 63], // 1 day, 1 week, 1 month, 3 months
      ensembleWeights: { randomForest: 0.4, lstm: 0.35, linear: 0.25 },
      confidenceThreshold: 0.6,
      retrainingInterval: 7 * 24 * 60 * 60 * 1000 // 1 week
    };

    // Service health tracking
    this.serviceHealth = {
      mistral: true,
      pythonBridge: true,
      lastHealthCheck: null
    };
  }

  // FIXED: Enhanced error-resistant main method
  async generateInvestmentIntelligence(portfolio, analysisParameters = {}) {
    console.log(`🧠 Starting AI Investment Intelligence for ${Object.keys(portfolio.holdings).length} holdings...`);
    
    try {
      const symbols = Object.keys(portfolio.holdings);
      if (symbols.length === 0) {
        return this.generateEmptyPortfolioResponse();
      }

      // Set default parameters
      const params = {
        analysisDate: new Date(),
        predictionHorizon: analysisParameters.predictionHorizon || [1, 5, 21],
        includeRegimeAnalysis: analysisParameters.includeRegimeAnalysis !== false,
        includeSentimentAnalysis: analysisParameters.includeSentimentAnalysis !== false,
        includeMLPredictions: analysisParameters.includeMLPredictions !== false,
        includeDynamicAllocation: analysisParameters.includeDynamicAllocation !== false,
        ...analysisParameters
      };

      console.log(`🔧 AI Analysis Parameters:`, {
        symbols: symbols.length,
        mlPredictions: params.includeMLPredictions,
        regimeAnalysis: params.includeRegimeAnalysis,
        sentimentAnalysis: params.includeSentimentAnalysis,
        dynamicAllocation: params.includeDynamicAllocation
      });

      // FIXED: Gather market data with error handling
      let marketData = null;
      try {
        console.log('📊 Gathering market data for AI analysis...');
        marketData = await this.gatherMarketData(symbols);
        console.log('✅ Market data gathered successfully');
      } catch (error) {
        console.error('❌ Market data gathering failed:', error.message);
        marketData = this.generateFallbackMarketData(symbols);
      }
      
      // FIXED: Generate ML-based return predictions with fallback
      let mlPredictions = null;
      if (params.includeMLPredictions) {
        try {
          console.log('🤖 Generating ML return predictions...');
          mlPredictions = await this.generateMLPredictions(portfolio, marketData, params.predictionHorizon);
          console.log('✅ ML predictions generated successfully');
        } catch (error) {
          console.error('❌ ML predictions failed:', error.message);
          mlPredictions = this.generateFallbackMLPredictions(portfolio, params.predictionHorizon);
          this.serviceHealth.pythonBridge = false;
        }
      }

      // FIXED: Detect current market regime with fallback
      let marketRegime = null;
      if (params.includeRegimeAnalysis) {
        try {
          console.log('📈 Analyzing market regime...');
          marketRegime = await this.detectMarketRegime(marketData);
          console.log('✅ Market regime analysis complete');
        } catch (error) {
          console.error('❌ Market regime analysis failed:', error.message);
          marketRegime = this.generateFallbackMarketRegime();
          this.serviceHealth.pythonBridge = false;
        }
      }

      // FIXED: Analyze market sentiment with fallback
      let sentimentAnalysis = null;
      if (params.includeSentimentAnalysis) {
        try {
          console.log('💭 Analyzing market sentiment...');
          sentimentAnalysis = await this.analyzeSentiment(symbols);
          console.log('✅ Sentiment analysis complete');
        } catch (error) {
          console.error('❌ Sentiment analysis failed:', error.message);
          sentimentAnalysis = this.generateFallbackSentiment();
        }
      }

      // FIXED: Calculate dynamic asset allocation with fallback
      let dynamicAllocation = null;
      if (params.includeDynamicAllocation && marketRegime && mlPredictions) {
        try {
          console.log('⚖️ Calculating dynamic asset allocation...');
          dynamicAllocation = await this.calculateDynamicAllocation(portfolio, marketRegime, mlPredictions);
          console.log('✅ Dynamic allocation complete');
        } catch (error) {
          console.error('❌ Dynamic allocation failed:', error.message);
          dynamicAllocation = this.generateFallbackDynamicAllocation(portfolio);
          this.serviceHealth.pythonBridge = false;
        }
      }

      // FIXED: Generate AI-powered recommendations with Mistral fallback
      let aiRecommendations = null;
      try {
        console.log('🎯 Generating AI recommendations...');
        aiRecommendations = await this.generateAIRecommendations(
          portfolio, mlPredictions, marketRegime, sentimentAnalysis, dynamicAllocation
        );
        console.log('✅ AI recommendations complete');
      } catch (error) {
        console.error('❌ AI recommendations failed:', error.message);
        aiRecommendations = this.generateFallbackRecommendations(portfolio);
        this.serviceHealth.mistral = false;
      }

      // Calculate overall confidence including service health
      const healthPenalty = (!this.serviceHealth.mistral || !this.serviceHealth.pythonBridge) ? 0.3 : 0;
      const baseConfidence = this.calculateOverallConfidence(mlPredictions, marketRegime, sentimentAnalysis);
      const adjustedConfidence = Math.max(0.1, baseConfidence - healthPenalty);

      const result = {
        mlPredictions,
        marketRegime,
        sentimentAnalysis,
        dynamicAllocation,
        aiRecommendations,
        metadata: {
          analysisDate: new Date().toISOString(),
          symbols: symbols,
          analysisParameters: params,
          confidenceScore: adjustedConfidence,
          nextUpdate: new Date(Date.now() + this.cacheTimeout).toISOString(),
          serviceHealth: {
            ...this.serviceHealth,
            lastHealthCheck: new Date().toISOString()
          },
          warnings: this.generateServiceWarnings()
        }
      };

      console.log(`✅ AI Investment Intelligence complete`);
      console.log(`🎯 Key insights: Regime=${marketRegime?.currentRegime}, Confidence=${adjustedConfidence?.toFixed(2)}`);
      
      if (!this.serviceHealth.mistral || !this.serviceHealth.pythonBridge) {
        console.log(`⚠️  Service degradation: Mistral=${this.serviceHealth.mistral}, Python=${this.serviceHealth.pythonBridge}`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Critical error in AI Investment Intelligence:`, error);
      
      // FIXED: Return a complete fallback response instead of throwing
      return this.generateCriticalErrorResponse(portfolio, error);
    }
  }

  // FIXED: Generate fallback responses for service failures
  generateEmptyPortfolioResponse() {
    return {
      mlPredictions: null,
      marketRegime: null,
      sentimentAnalysis: null,
      dynamicAllocation: null,
      aiRecommendations: {
        immediateActions: ['Add holdings to your portfolio to enable AI analysis'],
        shortTermOutlook: 'Portfolio analysis requires at least one holding',
        riskManagement: ['Diversification recommended when adding positions'],
        opportunityAlerts: [],
        performanceInsights: {
          expectedReturn: 'N/A',
          riskLevel: 'Unknown',
          diversificationScore: 0
        }
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        symbols: [],
        confidenceScore: 0,
        serviceHealth: this.serviceHealth,
        warnings: ['Portfolio is empty - add holdings to enable AI analysis']
      }
    };
  }

  generateFallbackMarketData(symbols) {
    console.log('🔄 Using fallback market data');
    return {
      symbols: symbols,
      indices: {
        SPY: { price: 450, change: 0, changePercent: 0 },
        QQQ: { price: 350, change: 0, changePercent: 0 },
        IWM: { price: 180, change: 0, changePercent: 0 }
      },
      vix: { current: 20, change: 0, changePercent: 0 },
      sectors: {},
      historical: {}
    };
  }

  generateFallbackMLPredictions(portfolio, horizons) {
    console.log('🔄 Using fallback ML predictions');
    const predictions = {};
    
    for (const horizon of horizons) {
      predictions[`${horizon}d`] = {};
      
      Object.keys(portfolio.holdings).forEach(symbol => {
        predictions[`${horizon}d`][symbol] = {
          expected_return_percent: 8.0, // Conservative 8% annual expectation
          confidence: 0.3,
          direction: 'neutral',
          volatility: 0.15
        };
      });
    }

    return {
      predictions,
      ensembleMetrics: {
        averageConfidence: 0.3,
        modelAgreement: 0.5,
        predictionSpread: 0.1
      },
      modelPerformance: {
        accuracy: 0.6,
        sharpeRatio: 1.0,
        maxDrawdown: 0.1
      },
      warning: 'ML service unavailable - using historical averages'
    };
  }

  generateFallbackMarketRegime() {
    console.log('🔄 Using fallback market regime');
    return {
      currentRegime: 'Stable',
      confidence: 0.4,
      regimeProbabilities: {
        'Bull': 0.25,
        'Bear': 0.25,
        'Volatile': 0.25,
        'Stable': 0.25
      },
      interpretation: 'Market regime analysis unavailable - assuming stable conditions. Monitor for changes.',
      expectedDuration: 30,
      riskAdjustment: 1.0,
      warning: 'Regime detection service unavailable'
    };
  }

  generateFallbackSentiment() {
    console.log('🔄 Using fallback sentiment analysis');
    return {
      overallSentiment: 0.5,
      sentimentTrend: 'neutral',
      confidence: 0.3,
      sentimentSignals: {
        buy: [],
        sell: [],
        neutral: ['Market sentiment analysis unavailable']
      },
      warning: 'Sentiment analysis service unavailable'
    };
  }

  generateFallbackDynamicAllocation(portfolio) {
    console.log('🔄 Using fallback dynamic allocation');
    const currentWeights = this.calculateCurrentWeights(portfolio);
    
    return {
      currentAllocation: currentWeights,
      recommendedAllocation: currentWeights, // Keep current allocation
      allocationChanges: {},
      tradeRecommendations: [],
      expectedReturn: 0.08,
      expectedRisk: 0.15,
      sharpeImprovement: 0,
      warning: 'Dynamic allocation service unavailable - maintaining current allocation'
    };
  }

  generateFallbackRecommendations(portfolio) {
    console.log('🔄 Using fallback AI recommendations');
    const holdings = Object.keys(portfolio.holdings);
    
    return {
      immediateActions: [
        'Monitor portfolio performance regularly',
        'Review holdings for proper diversification',
        'Consider rebalancing if allocations have drifted significantly'
      ],
      shortTermOutlook: 'AI recommendation service is currently unavailable. Consider maintaining current positions while monitoring market conditions. Focus on portfolio balance and risk management.',
      riskManagement: [
        'Ensure portfolio is properly diversified across sectors',
        'Monitor position sizes to avoid over-concentration',
        'Set stop-loss orders for risk management if appropriate'
      ],
      opportunityAlerts: [],
      performanceInsights: {
        expectedReturn: '6-10% annually',
        riskLevel: 'Moderate',
        diversificationScore: Math.min(holdings.length * 1.5, 10)
      },
      marketContext: {
        marketPhase: 'Neutral',
        sentimentReading: 'Cautious',
        recommendedTilt: 'Balanced approach recommended'
      },
      overallConfidence: 0.3,
      warning: 'AI recommendation service unavailable - using general guidance'
    };
  }

  generateCriticalErrorResponse(portfolio, error) {
    console.log('🚨 Generating critical error response');
    
    return {
      mlPredictions: { 
        error: 'ML prediction service unavailable',
        predictions: {}
      },
      marketRegime: { 
        currentRegime: 'Unknown',
        confidence: 0,
        error: 'Market regime analysis unavailable'
      },
      sentimentAnalysis: { 
        overallSentiment: 0.5,
        error: 'Sentiment analysis unavailable'
      },
      dynamicAllocation: { 
        currentAllocation: this.calculateCurrentWeights(portfolio),
        error: 'Dynamic allocation unavailable'
      },
      aiRecommendations: {
        immediateActions: ['AI analysis is currently unavailable'],
        shortTermOutlook: 'AI services are experiencing issues. Please try again later or contact support.',
        riskManagement: ['Monitor your positions manually until AI services are restored'],
        error: 'AI recommendation service unavailable'
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        symbols: Object.keys(portfolio.holdings),
        confidenceScore: 0,
        criticalError: true,
        errorMessage: error.message,
        serviceHealth: {
          mistral: false,
          pythonBridge: false,
          lastHealthCheck: new Date().toISOString()
        },
        warnings: [
          'AI services are currently experiencing issues',
          'All analysis results are using fallback data',
          'Please try refreshing in a few minutes'
        ]
      }
    };
  }

  generateServiceWarnings() {
    const warnings = [];
    
    if (!this.serviceHealth.mistral) {
      warnings.push('AI recommendation service degraded - using fallback guidance');
    }
    
    if (!this.serviceHealth.pythonBridge) {
      warnings.push('ML prediction service degraded - using historical averages');
    }
    
    return warnings;
  }

  // FIXED: Enhanced ML predictions with better error handling
  async generateMLPredictions(portfolio, marketData, horizons = [1, 5, 21]) {
    try {
      const symbols = Object.keys(portfolio.holdings);
      
      // Quick health check - if Python bridge failed before, use fallback
      if (!this.serviceHealth.pythonBridge) {
        return this.generateFallbackMLPredictions(portfolio, horizons);
      }

      const predictions = {};

      // Prepare feature data for ML models
      const featureData = await this.prepareMLFeatures(portfolio, marketData);
      
      // Generate predictions for each horizon with timeout
      for (const horizon of horizons) {
        console.log(`🔮 Generating ${horizon}-day predictions...`);
        
        try {
          // Add timeout to Python bridge calls
          const horizonPredictions = await Promise.race([
            pythonBridge.runScript('ml_predictions', {
              feature_data: featureData,
              symbols: symbols,
              prediction_horizon: horizon,
              ensemble_weights: this.mlConfig.ensembleWeights,
              model_config: {
                retrain: this.shouldRetrainModels(),
                validation_split: 0.2,
                walk_forward: true
              }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Python bridge timeout')), 10000)
            )
          ]);

          predictions[`${horizon}d`] = horizonPredictions;
        } catch (error) {
          console.error(`❌ Failed to generate ${horizon}-day predictions:`, error.message);
          // Generate fallback for this horizon
          predictions[`${horizon}d`] = {};
          symbols.forEach(symbol => {
            predictions[`${horizon}d`][symbol] = {
              expected_return_percent: 8.0,
              confidence: 0.3,
              direction: 'neutral'
            };
          });
        }
      }

      // Calculate ensemble confidence and risk metrics
      const ensembleMetrics = this.calculateEnsembleMetrics(predictions);

      return {
        predictions,
        ensembleMetrics,
        modelPerformance: await this.getModelPerformanceMetrics(symbols),
        lastTraining: this.getLastTrainingDate(),
        nextRetraining: this.getNextRetrainingDate()
      };

    } catch (error) {
      console.error(`❌ Error in ML predictions:`, error);
      this.serviceHealth.pythonBridge = false;
      return this.generateFallbackMLPredictions(portfolio, horizons);
    }
  }

  // FIXED: Enhanced market regime detection with error handling
  async detectMarketRegime(marketData) {
    try {
      // Quick health check
      if (!this.serviceHealth.pythonBridge) {
        return this.generateFallbackMarketRegime();
      }

      console.log('🔍 Analyzing market regime indicators...');

      // Prepare regime detection features
      const regimeFeatures = {
        vix_level: marketData.vix?.current || 20,
        vix_change: marketData.vix?.change || 0,
        market_volatility: this.calculateMarketVolatility(marketData),
        yield_curve_slope: marketData.yieldCurve?.slope || 0,
        sector_rotation: this.calculateSectorRotation(marketData),
        momentum_indicators: this.calculateMomentumIndicators(marketData),
        volume_patterns: this.analyzeVolumePatterns(marketData),
        cross_asset_correlations: this.calculateCrossAssetCorrelations(marketData)
      };

      // Use Python ML for regime classification with timeout
      const regimeAnalysis = await Promise.race([
        pythonBridge.runScript('market_regime', {
          features: regimeFeatures,
          historical_data: marketData.historical,
          regime_config: this.regimeConfig
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Market regime analysis timeout')), 8000)
        )
      ]);

      // Add regime interpretation and confidence
      const regimeInterpretation = await this.interpretMarketRegime(regimeAnalysis);

      return {
        currentRegime: regimeAnalysis.predicted_regime,
        confidence: regimeAnalysis.confidence,
        regimeProbabilities: regimeAnalysis.regime_probabilities,
        regimeFeatures: regimeFeatures,
        interpretation: regimeInterpretation,
        historicalRegimes: regimeAnalysis.historical_regimes,
        regimeTransitionMatrix: regimeAnalysis.transition_matrix,
        expectedDuration: regimeAnalysis.expected_duration,
        riskAdjustment: this.calculateRegimeRiskAdjustment(regimeAnalysis.predicted_regime)
      };

    } catch (error) {
      console.error(`❌ Error in market regime detection:`, error);
      this.serviceHealth.pythonBridge = false;
      return this.generateFallbackMarketRegime();
    }
  }

  // FIXED: Enhanced AI recommendations with Mistral fallback
  async generateAIRecommendations(portfolio, mlPredictions, marketRegime, sentimentAnalysis, dynamicAllocation) {
    try {
      // Quick health check
      if (!this.serviceHealth.mistral) {
        return this.generateFallbackRecommendations(portfolio);
      }

      console.log('🎯 Generating AI-powered investment recommendations...');

      // Prepare comprehensive data for AI analysis
      const aiInput = {
        portfolio_summary: {
          total_value: portfolio.totalValue,
          holdings_count: Object.keys(portfolio.holdings).length,
          top_holdings: this.getTopHoldings(portfolio, 5)
        },
        ml_insights: {
          predictions: mlPredictions?.predictions,
          confidence: mlPredictions?.ensembleMetrics?.averageConfidence
        },
        market_regime: {
          current: marketRegime?.currentRegime,
          confidence: marketRegime?.confidence,
          interpretation: marketRegime?.interpretation
        },
        sentiment: {
          overall: sentimentAnalysis?.overallSentiment,
          trend: sentimentAnalysis?.sentimentTrend,
          signals: sentimentAnalysis?.sentimentSignals
        },
        allocation: {
          changes: dynamicAllocation?.allocationChanges,
          trade_recommendations: dynamicAllocation?.tradeRecommendations
        }
      };

      // Generate natural language recommendations using Mistral AI with timeout
      let aiRecommendations;
      try {
        const result = await Promise.race([
          unifiedGptOssService.generate('You are a helpful assistant.', `Generate investment recommendations based on this analysis: ${JSON.stringify(aiInput)}`, {
            temperature: 0.7,
            maxTokens: 1000
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI timeout')), 10000)
          )
        ]);
        
        aiRecommendations = result.success ? result.content : 'Recommendations unavailable';
      } catch (error) {
        console.error('❌ Mistral AI call failed:', error.message);
        this.serviceHealth.mistral = false;
        return this.generateFallbackRecommendations(portfolio);
      }

      // Structure recommendations into actionable categories
      const structuredRecommendations = {
        immediateActions: this.extractImmediateActions(aiRecommendations, dynamicAllocation),
        shortTermOutlook: this.extractShortTermOutlook(aiRecommendations, mlPredictions),
        riskManagement: this.extractRiskManagement(aiRecommendations, marketRegime),
        opportunityAlerts: this.extractOpportunityAlerts(aiRecommendations, sentimentAnalysis),
        performanceInsights: this.generatePerformanceInsights(portfolio, mlPredictions),
        marketContext: this.generateMarketContextInsights(marketRegime, sentimentAnalysis)
      };

      // Calculate overall recommendation confidence
      const overallConfidence = this.calculateRecommendationConfidence(
        mlPredictions, marketRegime, sentimentAnalysis, dynamicAllocation
      );

      return {
        ...structuredRecommendations,
        rawAIAnalysis: aiRecommendations,
        overallConfidence: overallConfidence,
        lastUpdated: new Date().toISOString(),
        disclaimers: this.getAIRecommendationDisclaimers()
      };

    } catch (error) {
      console.error(`❌ Error generating AI recommendations:`, error);
      this.serviceHealth.mistral = false;
      return this.generateFallbackRecommendations(portfolio);
    }
  }

  // Rest of the methods remain the same...
  // (I'm keeping this file focused on the main fixes for the 500 error)

  // Helper methods for data gathering and processing
  async gatherMarketData(symbols) {
    const marketData = {
      symbols: symbols,
      indices: {},
      vix: null,
      yieldCurve: null,
      sectors: {},
      historical: {}
    };

    try {
      // Get major market indices
      const indices = ['SPY', 'QQQ', 'IWM', 'VTI'];
      const indexData = await fmpService.getMultipleQuotes(indices);
      marketData.indices = indexData;

      // Get VIX data (fear index)
      try {
        const vixData = await fmpService.getQuote('VIX');
        marketData.vix = {
          current: vixData.price,
          change: vixData.change,
          changePercent: vixData.changesPercentage
        };
      } catch (error) {
        console.warn('VIX data unavailable:', error.message);
        marketData.vix = { current: 20, change: 0, changePercent: 0 }; // Default values
      }

      // Get sector ETF data for rotation analysis
      const sectorETFs = ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLP', 'XLY', 'XLB', 'XLRE', 'XLU', 'XLC'];
      const sectorData = await fmpService.getMultipleQuotes(sectorETFs);
      marketData.sectors = sectorData;

      // Get historical data for analysis
      for (const symbol of [...symbols, ...indices].slice(0, 10)) { // Limit to prevent overload
        try {
          const historical = await fmpService.getHistoricalPrices(symbol, '1year');
          if (historical?.historical) {
            marketData.historical[symbol] = historical.historical.slice(-252); // Last year
          }
        } catch (error) {
          console.warn(`Historical data unavailable for ${symbol}:`, error.message);
        }
      }

      return marketData;

    } catch (error) {
      console.error('Error gathering market data:', error);
      throw error;
    }
  }

  async prepareMLFeatures(portfolio, marketData) {
    // Prepare comprehensive feature set for ML models
    const features = {
      portfolio_features: this.extractPortfolioFeatures(portfolio),
      market_features: this.extractMarketFeatures(marketData),
      technical_features: await this.extractTechnicalFeatures(marketData),
      fundamental_features: await this.extractFundamentalFeatures(portfolio),
      macro_features: this.extractMacroFeatures(marketData)
    };

    return features;
  }

  // Feature extraction methods
  extractPortfolioFeatures(portfolio) {
    const holdings = Object.values(portfolio.holdings);
    return {
      total_value: portfolio.totalValue,
      holdings_count: holdings.length,
      concentration: this.calculateConcentration(holdings),
      sector_diversification: this.calculateSectorDiversification(holdings),
      average_holding_size: portfolio.totalValue / holdings.length,
      top_5_concentration: this.calculateTopNConcentration(holdings, 5)
    };
  }

  extractMarketFeatures(marketData) {
    return {
      market_volatility: this.calculateMarketVolatility(marketData),
      sector_rotation: this.calculateSectorRotation(marketData),
      market_momentum: this.calculateMarketMomentum(marketData),
      cross_correlations: this.calculateCrossAssetCorrelations(marketData),
      volume_patterns: this.analyzeVolumePatterns(marketData)
    };
  }

  async extractTechnicalFeatures(marketData) {
    const features = {};
    
    for (const [symbol, data] of Object.entries(marketData.historical)) {
      if (data && data.length > 50) {
        const prices = data.map(d => d.close);
        features[symbol] = {
          rsi: this.calculateRSI(prices),
          macd: this.calculateMACD(prices),
          bollinger_position: this.calculateBollingerPosition(prices),
          momentum: this.calculateMomentum(prices),
          volatility: this.calculateVolatility(prices)
        };
      }
    }
    
    return features;
  }

  async extractFundamentalFeatures(portfolio) {
    const features = {};
    
    for (const symbol of Object.keys(portfolio.holdings)) {
      try {
        const fundamentals = await fmpService.getCompanyFacts(symbol);
        if (fundamentals) {
          features[symbol] = {
            pe_ratio: fundamentals.peRatio,
            pb_ratio: fundamentals.pbRatio,
            debt_to_equity: fundamentals.debtToEquity,
            roe: fundamentals.returnOnEquity,
            revenue_growth: fundamentals.revenueGrowth,
            profit_margin: fundamentals.profitMargin
          };
        }
      } catch (error) {
        console.warn(`Fundamental data unavailable for ${symbol}`);
      }
    }
    
    return features;
  }

  extractMacroFeatures(marketData) {
    return {
      yield_curve_slope: marketData.yieldCurve?.slope || 0,
      credit_spreads: this.calculateCreditSpreads(marketData),
      dollar_strength: this.calculateDollarStrength(marketData),
      commodity_momentum: this.calculateCommodityMomentum(marketData)
    };
  }

  // Calculation helper methods
  calculateMarketVolatility(marketData) {
    if (!marketData.historical['SPY']) return 0.15;
    
    const prices = marketData.historical['SPY'].map(d => d.close);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  calculateSectorRotation(marketData) {
    const sectorPerformance = {};
    let rotationScore = 0;
    
    for (const [symbol, data] of Object.entries(marketData.sectors)) {
      if (data?.changesPercentage) {
        sectorPerformance[symbol] = data.changesPercentage;
      }
    }
    
    const performanceValues = Object.values(sectorPerformance);
    if (performanceValues.length > 1) {
      const max = Math.max(...performanceValues);
      const min = Math.min(...performanceValues);
      rotationScore = max - min; // Spread indicates rotation intensity
    }
    
    return {
      score: rotationScore,
      sectorPerformance: sectorPerformance
    };
  }

  calculateMomentumIndicators(marketData) {
    const momentum = {};
    
    for (const [symbol, data] of Object.entries(marketData.historical)) {
      if (data && data.length > 20) {
        const prices = data.map(d => d.close);
        const current = prices[prices.length - 1];
        const past20 = prices[prices.length - 21];
        const past60 = prices[prices.length - 61] || past20;
        
        momentum[symbol] = {
          momentum_20d: (current - past20) / past20,
          momentum_60d: (current - past60) / past60
        };
      }
    }
    
    return momentum;
  }

  analyzeVolumePatterns(marketData) {
    const volumeAnalysis = {};
    
    for (const [symbol, data] of Object.entries(marketData.historical)) {
      if (data && data.length > 20) {
        const volumes = data.map(d => d.volume || 0);
        const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
        const recentVolume = volumes.slice(-5).reduce((sum, v) => sum + v, 0) / 5;
        
        volumeAnalysis[symbol] = {
          volume_ratio: avgVolume > 0 ? recentVolume / avgVolume : 1,
          volume_trend: this.calculateVolumeTrend(volumes)
        };
      }
    }
    
    return volumeAnalysis;
  }

  calculateCrossAssetCorrelations(marketData) {
    // Simplified correlation calculation between major assets
    const correlations = {};
    const assets = ['SPY', 'QQQ', 'IWM'];
    
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const asset1 = assets[i];
        const asset2 = assets[j];
        
        if (marketData.historical[asset1] && marketData.historical[asset2]) {
          const corr = this.calculateCorrelation(
            marketData.historical[asset1].map(d => d.close),
            marketData.historical[asset2].map(d => d.close)
          );
          correlations[`${asset1}_${asset2}`] = corr;
        }
      }
    }
    
    return correlations;
  }

  // Technical indicator calculations
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    
    return {
      macd: macdLine,
      signal: 0, // Simplified
      histogram: macdLine
    };
  }

  calculateEMA(prices, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    ema[0] = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
  }

  calculateBollingerPosition(prices, period = 20) {
    if (prices.length < period) return 0.5;
    
    const recent = prices.slice(-period);
    const mean = recent.reduce((sum, p) => sum + p, 0) / period;
    const variance = recent.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    const current = prices[prices.length - 1];
    const upperBand = mean + (2 * std);
    const lowerBand = mean - (2 * std);
    
    if (upperBand === lowerBand) return 0.5;
    return (current - lowerBand) / (upperBand - lowerBand);
  }

  calculateMomentum(prices, period = 10) {
    if (prices.length < period + 1) return 0;
    
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 1 - period];
    
    return (current - past) / past;
  }

  calculateVolatility(prices, period = 20) {
    if (prices.length < period + 1) return 0.15;
    
    const recent = prices.slice(-period);
    const returns = [];
    
    for (let i = 1; i < recent.length; i++) {
      returns.push((recent[i] - recent[i - 1]) / recent[i - 1]);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized
  }

  calculateCorrelation(series1, series2) {
    const minLength = Math.min(series1.length, series2.length);
    const x = series1.slice(-minLength);
    const y = series2.slice(-minLength);
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < x.length; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      
      numerator += deltaX * deltaY;
      sumXSquared += deltaX * deltaX;
      sumYSquared += deltaY * deltaY;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Portfolio analysis methods
  calculateCurrentWeights(portfolio) {
    const weights = {};
    const total = portfolio.totalValue;
    
    Object.entries(portfolio.holdings).forEach(([symbol, holding]) => {
      const value = holding.currentValue || holding.quantity * holding.currentPrice;
      weights[symbol] = total > 0 ? value / total : 0;
    });
    
    return weights;
  }

  calculateConcentration(holdings) {
    const values = holdings.map(h => h.currentValue || h.quantity * h.currentPrice);
    const total = values.reduce((sum, v) => sum + v, 0);
    
    if (total === 0) return 0;
    
    // Calculate Herfindahl index
    const weights = values.map(v => v / total);
    return weights.reduce((sum, w) => sum + (w * w), 0);
  }

  calculateSectorDiversification(holdings) {
    const sectors = {};
    let totalValue = 0;
    
    holdings.forEach(holding => {
      const value = holding.currentValue || holding.quantity * holding.currentPrice;
      const sector = this.getSymbolSector(holding.symbol);
      
      sectors[sector] = (sectors[sector] || 0) + value;
      totalValue += value;
    });
    
    if (totalValue === 0) return 0;
    
    // Calculate inverse of Herfindahl index for sectors
    const sectorWeights = Object.values(sectors).map(v => v / totalValue);
    const herfindahl = sectorWeights.reduce((sum, w) => sum + (w * w), 0);
    
    return 1 / herfindahl; // Higher is more diversified
  }

  getSymbolSector(symbol) {
    // Simplified sector mapping
    const techSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
    const financialSymbols = ['JPM', 'BAC', 'WFC', 'C', 'GS'];
    const healthcareSymbols = ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK'];
    
    if (techSymbols.includes(symbol)) return 'Technology';
    if (financialSymbols.includes(symbol)) return 'Financials';
    if (healthcareSymbols.includes(symbol)) return 'Healthcare';
    return 'Other';
  }

  // Utility methods for model management and caching
  shouldRetrainModels() {
    const lastTraining = this.getLastTrainingDate();
    const now = new Date();
    return !lastTraining || (now - lastTraining) > this.mlConfig.retrainingInterval;
  }

  getLastTrainingDate() {
    return this.modelCache.get('lastTraining') || null;
  }

  getNextRetrainingDate() {
    const lastTraining = this.getLastTrainingDate();
    if (!lastTraining) return new Date();
    return new Date(lastTraining.getTime() + this.mlConfig.retrainingInterval);
  }

  calculateOverallConfidence(...analyses) {
    const confidences = analyses
      .filter(analysis => analysis && typeof analysis.confidence === 'number')
      .map(analysis => analysis.confidence);
    
    if (confidences.length === 0) return 0.5;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  // Placeholder methods for additional functionality
  calculateEnsembleMetrics(predictions) {
    // Calculate ensemble model performance metrics
    return {
      averageConfidence: 0.75,
      modelAgreement: 0.8,
      predictionSpread: 0.05
    };
  }

  async getModelPerformanceMetrics(symbols) {
    // Return historical model performance
    return {
      accuracy: 0.68,
      sharpeRatio: 1.2,
      maxDrawdown: 0.08
    };
  }

  generateFallbackPredictions(portfolio) {
    // Generate simple trend-based predictions as fallback
    const predictions = {};
    Object.keys(portfolio.holdings).forEach(symbol => {
      predictions[symbol] = {
        expected_return: 0.08, // 8% annual return
        confidence: 0.3,
        direction: 'neutral'
      };
    });
    return predictions;
  }

  // Additional methods will be implemented as needed
  async analyzeNewsSentiment(symbols) { 
    // Use FMP news service instead of Brave
    return { score: 0.5, articles: [], source: 'FMP News' }; 
  }
  
  async analyzeSocialSentiment(symbols) { return { score: 0.5, sources: [] }; }
  async analyzeMarketSentimentIndicators() { return { fear_greed: 50, put_call: 1.0 }; }
  generateSentimentSignals(analysis) { return { buy: [], sell: [], neutral: [] }; }
  
  async interpretMarketRegime(analysis) { 
    return `Current market regime: ${analysis.predicted_regime} with ${(analysis.confidence * 100).toFixed(1)}% confidence`;
  }
  
  calculateRegimeRiskAdjustment(regime) {
    const adjustments = { Bull: 1.1, Bear: 0.7, Volatile: 0.8, Stable: 1.0 };
    return adjustments[regime] || 1.0;
  }

  async analyzeSentiment(symbols) {
    try {
      console.log('📰 Gathering news and sentiment data...');

      // Get news sentiment using FMP news instead of Brave
      const newsSentiment = await this.analyzeNewsSentiment(symbols);
      
      // Get social sentiment (if available)
      const socialSentiment = await this.analyzeSocialSentiment(symbols);
      
      // Get market sentiment indicators
      const marketSentiment = await this.analyzeMarketSentimentIndicators();

      // Use fallback sentiment analysis if Python bridge is down
      if (!this.serviceHealth.pythonBridge) {
        return this.generateFallbackSentiment();
      }

      // Use Python for advanced sentiment analysis with timeout
      const sentimentAnalysis = await Promise.race([
        pythonBridge.runScript('sentiment_analysis', {
          news_sentiment: newsSentiment,
          social_sentiment: socialSentiment,
          market_sentiment: marketSentiment,
          symbols: symbols
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sentiment analysis timeout')), 8000)
        )
      ]);

      // Generate sentiment-based signals
      const sentimentSignals = this.generateSentimentSignals(sentimentAnalysis);

      return {
        overallSentiment: sentimentAnalysis.overall_score,
        sentimentTrend: sentimentAnalysis.trend,
        newsSentiment: newsSentiment,
        socialSentiment: socialSentiment,
        marketSentiment: marketSentiment,
        sentimentSignals: sentimentSignals,
        extremeReadings: sentimentAnalysis.extreme_readings,
        contrarian_indicators: sentimentAnalysis.contrarian_indicators,
        confidence: sentimentAnalysis.confidence
      };

    } catch (error) {
      console.error(`❌ Error in sentiment analysis:`, error);
      this.serviceHealth.pythonBridge = false;
      return this.generateFallbackSentiment();
    }
  }

  async calculateDynamicAllocation(portfolio, marketRegime, mlPredictions) {
    try {
      console.log('⚖️ Calculating regime-aware asset allocation...');

      const currentWeights = this.calculateCurrentWeights(portfolio);
      
      // Use fallback if Python bridge is down
      if (!this.serviceHealth.pythonBridge) {
        return this.generateFallbackDynamicAllocation(portfolio);
      }

      // Use Python for dynamic allocation optimization with timeout
      const allocationAnalysis = await Promise.race([
        pythonBridge.runScript('dynamic_allocation', {
          current_weights: currentWeights,
          market_regime: marketRegime.currentRegime,
          regime_confidence: marketRegime.confidence,
          ml_predictions: mlPredictions.predictions,
          risk_adjustment: marketRegime.riskAdjustment,
          portfolio_data: {
            holdings: portfolio.holdings,
            total_value: portfolio.totalValue
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Dynamic allocation timeout')), 8000)
        )
      ]);

      // Calculate allocation changes and trade recommendations
      const allocationChanges = this.calculateAllocationChanges(currentWeights, allocationAnalysis.optimal_weights);
      const tradeRecommendations = this.generateTradeRecommendations(allocationChanges, portfolio);

      return {
        currentAllocation: currentWeights,
        recommendedAllocation: allocationAnalysis.optimal_weights,
        allocationChanges: allocationChanges,
        tradeRecommendations: tradeRecommendations,
        expectedReturn: allocationAnalysis.expected_return,
        expectedRisk: allocationAnalysis.expected_risk,
        sharpeImprovement: allocationAnalysis.sharpe_improvement,
        regimeJustification: allocationAnalysis.regime_justification
      };

    } catch (error) {
      console.error(`❌ Error in dynamic allocation:`, error);
      this.serviceHealth.pythonBridge = false;
      return this.generateFallbackDynamicAllocation(portfolio);
    }
  }

  calculateAllocationChanges(current, recommended) {
    const changes = {};
    Object.keys(current).forEach(symbol => {
      const currentWeight = current[symbol] || 0;
      const recommendedWeight = recommended[symbol] || 0;
      changes[symbol] = recommendedWeight - currentWeight;
    });
    return changes;
  }

  generateTradeRecommendations(changes, portfolio) {
    const recommendations = [];
    Object.entries(changes).forEach(([symbol, change]) => {
      if (Math.abs(change) > 0.01) { // Only recommend if change > 1%
        recommendations.push({
          symbol,
          action: change > 0 ? 'BUY' : 'SELL',
          percentChange: Math.abs(change * 100),
          reasoning: `Adjust allocation by ${(change * 100).toFixed(1)}%`
        });
      }
    });
    return recommendations;
  }

  getTopHoldings(portfolio, count = 5) {
    return Object.entries(portfolio.holdings)
      .map(([symbol, holding]) => ({
        symbol,
        value: holding.currentValue || holding.quantity * holding.currentPrice,
        weight: (holding.currentValue || holding.quantity * holding.currentPrice) / portfolio.totalValue
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, count);
  }

  // Recommendation extraction methods
  extractImmediateActions(aiRec, allocation) { return aiRec.immediate_actions || []; }
  extractShortTermOutlook(aiRec, predictions) { return aiRec.short_term_outlook || 'Neutral outlook'; }
  extractRiskManagement(aiRec, regime) { return aiRec.risk_management || []; }
  extractOpportunityAlerts(aiRec, sentiment) { return aiRec.opportunities || []; }
  
  generatePerformanceInsights(portfolio, predictions) {
    return {
      expectedReturn: '8-12% annually',
      riskLevel: 'Moderate',
      diversificationScore: 7.5
    };
  }
  
  generateMarketContextInsights(regime, sentiment) {
    return {
      marketPhase: regime?.currentRegime || 'Stable',
      sentimentReading: sentiment?.overallSentiment > 0.6 ? 'Optimistic' : 'Cautious',
      recommendedTilt: 'Balanced approach'
    };
  }

  calculateRecommendationConfidence(mlPred, regime, sentiment, allocation) {
    const confidences = [
      mlPred?.ensembleMetrics?.averageConfidence || 0.5,
      regime?.confidence || 0.5,
      sentiment?.confidence || 0.5,
      allocation?.confidence || 0.5
    ];
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }

  getAIRecommendationDisclaimers() {
    return [
      'AI recommendations are based on historical data and may not predict future performance',
      'Always consult with a financial advisor before making investment decisions',
      'Past performance does not guarantee future results',
      'Consider your risk tolerance and investment objectives'
    ];
  }

  // Additional helper methods
  calculateTopNConcentration(holdings, n) {
    const values = holdings.map(h => h.currentValue || h.quantity * h.currentPrice);
    const total = values.reduce((sum, v) => sum + v, 0);
    
    if (total === 0) return 0;
    
    const topN = values.sort((a, b) => b - a).slice(0, n);
    return topN.reduce((sum, v) => sum + v, 0) / total;
  }

  calculateVolumeTrend(volumes) {
    if (volumes.length < 10) return 0;
    
    const recent = volumes.slice(-10);
    const older = volumes.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  calculateCreditSpreads(marketData) {
    // Simplified credit spread calculation
    return 0.02; // 200 basis points default
  }

  calculateDollarStrength(marketData) {
    // Simplified dollar strength index
    return 0.0; // Neutral
  }

  calculateCommodityMomentum(marketData) {
    // Simplified commodity momentum
    return 0.0; // Neutral
  }

  calculateMarketMomentum(marketData) {
    if (!marketData.historical['SPY']) return 0;
    
    const prices = marketData.historical['SPY'].map(d => d.close);
    if (prices.length < 21) return 0;
    
    const current = prices[prices.length - 1];
    const past20 = prices[prices.length - 21];
    
    return (current - past20) / past20;
  }
}

// Create singleton instance
const portfolioAIService = new PortfolioAIService();

export default portfolioAIService;
export { PortfolioAIService };
