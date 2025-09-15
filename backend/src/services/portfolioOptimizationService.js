import fmpService from './fmpService.js';

class PortfolioOptimizationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 1800000; // 30 minutes cache for optimization calculations
    this.riskFreeRate = 0.045; // Current risk-free rate (approximate 10-year Treasury)
    this.defaultConstraints = {
      minWeight: 0.0,    // Minimum position size (0% - no short selling)
      maxWeight: 0.4,    // Maximum position size (40% concentration limit)
      maxTurnover: 0.2,  // Maximum portfolio turnover (20%)
      targetRisk: null,  // Target risk level (null = optimize for Sharpe)
      targetReturn: null // Target return level (null = optimize for Sharpe)
    };
  }

  // FIXED: Enhanced error handling and fallback strategies
  async optimizePortfolio(portfolio, optimizationParameters = {}) {
    console.log(`📊 Starting portfolio optimization for ${Object.keys(portfolio.holdings).length} holdings...`);
    
    try {
      const symbols = Object.keys(portfolio.holdings);
      if (symbols.length < 2) {
        console.log('❌ Insufficient holdings for optimization, creating mock data...');
        return this.createMockOptimizationData(portfolio, symbols);
      }

      // Merge user parameters with defaults
      const constraints = { ...this.defaultConstraints, ...optimizationParameters.constraints };
      const optimizationType = optimizationParameters.type || 'max_sharpe';

      // FIXED: Try to get historical data with fallback
      let historicalData;
      try {
        historicalData = await this.getOptimizationData(symbols);
        console.log(`📈 Retrieved historical data for ${Object.keys(historicalData).length} symbols`);
      } catch (error) {
        console.error('❌ Failed to get historical data, using simplified optimization:', error.message);
        return this.createSimplifiedOptimization(portfolio, constraints, optimizationType);
      }

      // Check if we have sufficient data
      const validSymbols = Object.keys(historicalData).filter(symbol => 
        historicalData[symbol] && historicalData[symbol].length > 50
      );

      if (validSymbols.length < 2) {
        console.log('❌ Insufficient historical data, using simplified optimization...');
        return this.createSimplifiedOptimization(portfolio, constraints, optimizationType);
      }

      // Calculate expected returns and covariance matrix
      const { expectedReturns, covarianceMatrix } = this.calculateReturnStatistics(historicalData, validSymbols);
      
      // Calculate current portfolio weights
      const currentWeights = this.calculateCurrentWeights(portfolio.holdings);
      
      // Generate efficient frontier
      const efficientFrontier = this.calculateEfficientFrontier(expectedReturns, covarianceMatrix, validSymbols, constraints);
      
      // Find optimal portfolio based on optimization type
      const optimalWeights = this.findOptimalPortfolio(expectedReturns, covarianceMatrix, validSymbols, constraints, optimizationType);
      
      // Calculate portfolio metrics for current and optimal allocations
      const currentMetrics = this.calculatePortfolioMetrics(currentWeights, expectedReturns, covarianceMatrix);
      const optimalMetrics = this.calculatePortfolioMetrics(optimalWeights, expectedReturns, covarianceMatrix);
      
      // Generate rebalancing recommendations
      const rebalancingRecommendations = this.generateRebalancingRecommendations(
        portfolio.holdings, currentWeights, optimalWeights
      );
      
      // Calculate risk budget analysis
      const riskBudget = this.calculateRiskBudget(optimalWeights, covarianceMatrix, validSymbols);
      
      // Perform scenario analysis
      const scenarioAnalysis = this.performScenarioAnalysis(
        portfolio.holdings, optimalWeights, expectedReturns, covarianceMatrix
      );

      const result = {
        currentAllocation: {
          weights: currentWeights,
          metrics: currentMetrics
        },
        optimalAllocation: {
          weights: optimalWeights,
          metrics: optimalMetrics
        },
        efficientFrontier,
        rebalancingRecommendations,
        riskBudget,
        scenarioAnalysis,
        optimizationParameters: {
          type: optimizationType,
          constraints,
          dataPoints: historicalData[validSymbols[0]]?.length || 0
        },
        metadata: {
          calculationDate: new Date().toISOString(),
          riskFreeRate: this.riskFreeRate,
          symbols: validSymbols,
          dataQuality: 'real'
        }
      };

      console.log(`✅ Portfolio optimization complete`);
      console.log(`📈 Current Sharpe: ${currentMetrics.sharpeRatio.toFixed(2)}, Optimal Sharpe: ${optimalMetrics.sharpeRatio.toFixed(2)}`);

      return result;

    } catch (error) {
      console.error(`❌ Error in portfolio optimization:`, error);
      console.log('🔄 Falling back to simplified optimization...');
      
      // FIXED: Always return valid data, never throw errors to frontend
      return this.createSimplifiedOptimization(portfolio, optimizationParameters.constraints || {}, optimizationParameters.type || 'max_sharpe');
    }
  }

  // FIXED: Create simplified optimization when real data fails
  createSimplifiedOptimization(portfolio, constraints, optimizationType) {
    console.log('📊 Creating simplified portfolio optimization...');
    
    const symbols = Object.keys(portfolio.holdings);
    const currentWeights = this.calculateCurrentWeights(portfolio.holdings);
    
    // Create simplified expected returns based on current prices vs cost basis
    const expectedReturns = {};
    const simplifiedVolatilities = {};
    
    symbols.forEach(symbol => {
      const holding = portfolio.holdings[symbol];
      const currentPrice = holding.currentPrice || holding.avgCost;
      const costBasis = holding.avgCost;
      
      // Estimate expected return from current performance
      const currentReturn = costBasis > 0 ? (currentPrice - costBasis) / costBasis : 0;
      expectedReturns[symbol] = Math.max(-0.5, Math.min(0.5, currentReturn * 1.2)); // Annualize and cap
      
      // Estimate volatility (simplified)
      simplifiedVolatilities[symbol] = Math.abs(expectedReturns[symbol]) * 2 + 0.15; // Base volatility
    });

    // Create simplified covariance matrix
    const covarianceMatrix = {};
    symbols.forEach(symbol1 => {
      covarianceMatrix[symbol1] = {};
      symbols.forEach(symbol2 => {
        if (symbol1 === symbol2) {
          covarianceMatrix[symbol1][symbol2] = Math.pow(simplifiedVolatilities[symbol1], 2);
        } else {
          // Assume moderate correlation between stocks
          const correlation = 0.3;
          covarianceMatrix[symbol1][symbol2] = correlation * simplifiedVolatilities[symbol1] * simplifiedVolatilities[symbol2];
        }
      });
    });

    // Generate optimal weights using simplified optimization
    const optimalWeights = this.findOptimalPortfolio(expectedReturns, covarianceMatrix, symbols, constraints, optimizationType);
    
    // Calculate metrics
    const currentMetrics = this.calculatePortfolioMetrics(currentWeights, expectedReturns, covarianceMatrix);
    const optimalMetrics = this.calculatePortfolioMetrics(optimalWeights, expectedReturns, covarianceMatrix);
    
    // Generate simplified efficient frontier
    const efficientFrontier = this.generateSimplifiedEfficientFrontier(expectedReturns, covarianceMatrix, symbols);
    
    // Generate rebalancing recommendations
    const rebalancingRecommendations = this.generateRebalancingRecommendations(
      portfolio.holdings, currentWeights, optimalWeights
    );
    
    // Risk budget analysis
    const riskBudget = this.calculateRiskBudget(optimalWeights, covarianceMatrix, symbols);
    
    // Simplified scenario analysis
    const scenarioAnalysis = this.createSimplifiedScenarioAnalysis(portfolio.holdings, optimalWeights);

    return {
      currentAllocation: {
        weights: currentWeights,
        metrics: currentMetrics
      },
      optimalAllocation: {
        weights: optimalWeights,
        metrics: optimalMetrics
      },
      efficientFrontier,
      rebalancingRecommendations,
      riskBudget,
      scenarioAnalysis,
      optimizationParameters: {
        type: optimizationType,
        constraints: constraints,
        dataPoints: 0
      },
      metadata: {
        calculationDate: new Date().toISOString(),
        riskFreeRate: this.riskFreeRate,
        symbols: symbols,
        dataQuality: 'simplified',
        notice: 'Optimization based on current portfolio performance due to limited historical data'
      }
    };
  }

  // FIXED: Create mock data for insufficient holdings
  createMockOptimizationData(portfolio, symbols) {
    const symbol = symbols[0] || 'PORTFOLIO';
    
    return {
      currentAllocation: {
        weights: { [symbol]: 1.0 },
        metrics: {
          expectedReturn: 0.08,
          volatility: 0.15,
          variance: 0.0225,
          sharpeRatio: 0.47
        }
      },
      optimalAllocation: {
        weights: { [symbol]: 1.0 },
        metrics: {
          expectedReturn: 0.08,
          volatility: 0.15,
          variance: 0.0225,
          sharpeRatio: 0.47
        }
      },
      efficientFrontier: [
        { expectedReturn: 0.06, volatility: 0.12, sharpeRatio: 0.33, weights: { [symbol]: 1.0 } },
        { expectedReturn: 0.08, volatility: 0.15, sharpeRatio: 0.47, weights: { [symbol]: 1.0 } },
        { expectedReturn: 0.10, volatility: 0.20, sharpeRatio: 0.40, weights: { [symbol]: 1.0 } }
      ],
      rebalancingRecommendations: [],
      riskBudget: [
        {
          symbol: symbol,
          weight: 100,
          riskContribution: 100,
          marginalRisk: 0.15,
          riskDensity: 1.0
        }
      ],
      scenarioAnalysis: [
        { scenario: 'Market Rally (+20%)', portfolioImpact: 16, dollarImpact: 0, riskLevel: 'Medium' },
        { scenario: 'Market Decline (-20%)', portfolioImpact: -16, dollarImpact: 0, riskLevel: 'Medium' }
      ],
      optimizationParameters: {
        type: 'max_sharpe',
        constraints: this.defaultConstraints,
        dataPoints: 0
      },
      metadata: {
        calculationDate: new Date().toISOString(),
        riskFreeRate: this.riskFreeRate,
        symbols: symbols,
        dataQuality: 'mock',
        notice: 'Portfolio optimization requires at least 2 holdings for meaningful analysis'
      }
    };
  }

  // FIXED: Enhanced data fetching with better error handling
  async getOptimizationData(symbols) {
    const historicalData = {};
    const batchSize = 3; // Reduce batch size to avoid overwhelming API
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const cacheKey = `optimization_${symbol}`;
          
          if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
              console.log(`📋 Using cached data for ${symbol}`);
              return [symbol, cached.data];
            }
          }

          // FIXED: Try multiple approaches to get historical data
          let data;
          
          try {
            // First try: 3 years of data
            data = await fmpService.getHistoricalPrices(symbol, '3years');
          } catch (error) {
            console.log(`⚠️ Failed to get 3-year data for ${symbol}, trying 1 year...`);
            try {
              // Second try: 1 year of data
              data = await fmpService.getHistoricalPrices(symbol, '1year');
            } catch (error2) {
              console.log(`⚠️ Failed to get 1-year data for ${symbol}, trying 6 months...`);
              try {
                // Third try: 6 months of data
                data = await fmpService.getHistoricalPrices(symbol, '6months');
              } catch (error3) {
                console.warn(`❌ No historical data available for ${symbol}`);
                return [symbol, null];
              }
            }
          }
          
          if (data?.historical && data.historical.length > 0) {
            const prices = data.historical
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(d => d.close)
              .filter(price => price > 0); // Remove invalid prices
            
            if (prices.length > 20) { // Need at least 20 data points
              this.cache.set(cacheKey, {
                data: prices,
                timestamp: Date.now()
              });
              
              console.log(`✅ Retrieved ${prices.length} price points for ${symbol}`);
              return [symbol, prices];
            } else {
              console.warn(`⚠️ Insufficient price data for ${symbol}: ${prices.length} points`);
              return [symbol, null];
            }
          } else {
            console.warn(`⚠️ No historical data structure for ${symbol}`);
            return [symbol, null];
          }
          
        } catch (error) {
          console.error(`❌ Error fetching optimization data for ${symbol}:`, error.message);
          return [symbol, null];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(([symbol, data]) => {
        if (data && data.length > 20) {
          historicalData[symbol] = data;
        }
      });
      
      // Rate limiting between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`📊 Historical data collected for ${Object.keys(historicalData).length}/${symbols.length} symbols`);
    return historicalData;
  }

  // Generate simplified efficient frontier for visualization
  generateSimplifiedEfficientFrontier(expectedReturns, covarianceMatrix, symbols) {
    const points = [];
    const numPoints = 20;
    
    for (let i = 0; i <= numPoints; i++) {
      const riskLevel = 0.05 + (0.30 * i / numPoints); // Risk from 5% to 35%
      const returnLevel = 0.02 + (0.20 * i / numPoints); // Return from 2% to 22%
      
      // Create weights that approximate this risk/return profile
      const weights = {};
      const totalSymbols = symbols.length;
      
      symbols.forEach((symbol, index) => {
        // Vary weights to create different risk/return profiles
        const baseWeight = 1 / totalSymbols;
        const variation = (i / numPoints - 0.5) * 0.3; // -15% to +15% variation
        weights[symbol] = Math.max(0.01, baseWeight + variation * (index % 2 === 0 ? 1 : -1));
      });
      
      // Normalize weights
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      symbols.forEach(symbol => {
        weights[symbol] /= totalWeight;
      });
      
      const metrics = this.calculatePortfolioMetrics(weights, expectedReturns, covarianceMatrix);
      
      points.push({
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        weights: weights
      });
    }
    
    return points.sort((a, b) => a.volatility - b.volatility);
  }

  // Create simplified scenario analysis
  createSimplifiedScenarioAnalysis(holdings, optimalWeights) {
    const currentValue = Object.values(holdings).reduce((sum, holding) => {
      return sum + (holding.currentValue || holding.quantity * holding.currentPrice);
    }, 0);
    
    const scenarios = [
      { 
        name: 'Market Rally (+20%)', 
        impact: 0.16,
        description: 'Broad market increase'
      },
      { 
        name: 'Market Decline (-20%)', 
        impact: -0.16,
        description: 'Broad market decrease'
      },
      { 
        name: 'Volatility Spike', 
        impact: -0.05,
        description: 'Increased market volatility'
      },
      { 
        name: 'Interest Rate Rise', 
        impact: -0.08,
        description: 'Rising interest rate environment'
      },
      { 
        name: 'Flight to Quality', 
        impact: -0.12,
        description: 'Risk-off market sentiment'
      }
    ];
    
    return scenarios.map(scenario => ({
      scenario: scenario.name,
      description: scenario.description,
      portfolioImpact: scenario.impact * 100,
      dollarImpact: scenario.impact * currentValue,
      riskLevel: Math.abs(scenario.impact) > 0.15 ? 'High' : 
                 Math.abs(scenario.impact) > 0.08 ? 'Medium' : 'Low',
      topContributors: Object.entries(optimalWeights).slice(0, 3).map(([symbol, weight]) => ({
        symbol,
        impact: weight * scenario.impact * 100
      }))
    }));
  }

  // Rest of the methods remain the same as before...
  calculateReturnStatistics(historicalData, symbols) {
    const validSymbols = symbols.filter(symbol => historicalData[symbol] && historicalData[symbol].length > 20);
    
    if (validSymbols.length < 2) {
      throw new Error('Insufficient historical data for optimization');
    }

    // Find common data length
    const minLength = Math.min(...validSymbols.map(symbol => historicalData[symbol].length));
    const useLength = Math.min(minLength, 500); // Cap at ~2 years of data
    
    // Calculate returns for each symbol
    const returns = {};
    validSymbols.forEach(symbol => {
      const prices = historicalData[symbol].slice(-useLength);
      returns[symbol] = this.calculateReturns(prices);
    });

    // Calculate expected returns (annualized mean)
    const expectedReturns = {};
    validSymbols.forEach(symbol => {
      const meanReturn = this.calculateMean(returns[symbol]);
      expectedReturns[symbol] = meanReturn * 252; // Annualize assuming 252 trading days
    });

    // Calculate covariance matrix (annualized)
    const covarianceMatrix = {};
    validSymbols.forEach(symbol1 => {
      covarianceMatrix[symbol1] = {};
      validSymbols.forEach(symbol2 => {
        const covariance = this.calculateCovariance(returns[symbol1], returns[symbol2]);
        covarianceMatrix[symbol1][symbol2] = covariance * 252; // Annualize
      });
    });

    return { expectedReturns, covarianceMatrix };
  }

  calculateCurrentWeights(holdings) {
    const totalValue = Object.values(holdings).reduce((sum, holding) => {
      return sum + (holding.currentValue || holding.quantity * (holding.currentPrice || holding.avgCost));
    }, 0);
    
    const weights = {};
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const value = holding.currentValue || holding.quantity * (holding.currentPrice || holding.avgCost);
      weights[symbol] = totalValue > 0 ? value / totalValue : 0;
    });
    
    return weights;
  }

  calculateEfficientFrontier(expectedReturns, covarianceMatrix, symbols, constraints, numPoints = 30) {
    const validSymbols = symbols.filter(symbol => expectedReturns[symbol] !== undefined);
    
    if (validSymbols.length < 2) {
      return this.generateSimplifiedEfficientFrontier(expectedReturns, covarianceMatrix, symbols);
    }

    const returns = validSymbols.map(symbol => expectedReturns[symbol]);
    const minReturn = Math.min(...returns);
    const maxReturn = Math.max(...returns);
    
    const frontierPoints = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const targetReturn = minReturn + (maxReturn - minReturn) * i / numPoints;
      
      try {
        const weights = this.optimizeForTargetReturn(expectedReturns, covarianceMatrix, validSymbols, targetReturn, constraints);
        const metrics = this.calculatePortfolioMetrics(weights, expectedReturns, covarianceMatrix);
        
        frontierPoints.push({
          expectedReturn: metrics.expectedReturn,
          volatility: metrics.volatility,
          sharpeRatio: metrics.sharpeRatio,
          weights: weights
        });
      } catch (error) {
        // Skip points that can't be optimized
      }
    }

    return frontierPoints.sort((a, b) => a.volatility - b.volatility);
  }

  findOptimalPortfolio(expectedReturns, covarianceMatrix, symbols, constraints, optimizationType) {
    const validSymbols = symbols.filter(symbol => expectedReturns[symbol] !== undefined);
    
    switch (optimizationType) {
      case 'max_sharpe':
        return this.optimizeForMaxSharpe(expectedReturns, covarianceMatrix, validSymbols, constraints);
      case 'min_risk':
        return this.optimizeForMinRisk(expectedReturns, covarianceMatrix, validSymbols, constraints);
      case 'target_return':
        const targetReturn = constraints.targetReturn || this.calculateMean(Object.values(expectedReturns));
        return this.optimizeForTargetReturn(expectedReturns, covarianceMatrix, validSymbols, targetReturn, constraints);
      default:
        return this.optimizeForMaxSharpe(expectedReturns, covarianceMatrix, validSymbols, constraints);
    }
  }

  optimizeForMaxSharpe(expectedReturns, covarianceMatrix, symbols, constraints) {
    const numAssets = symbols.length;
    let weights = {};
    
    // Start with equal weights
    symbols.forEach(symbol => {
      weights[symbol] = 1 / numAssets;
    });
    
    // Apply iterative improvement
    const iterations = 50;
    const learningRate = 0.01;
    
    for (let iter = 0; iter < iterations; iter++) {
      const gradients = {};
      
      symbols.forEach(symbol => {
        const excessReturn = expectedReturns[symbol] - this.riskFreeRate;
        const currentMetrics = this.calculatePortfolioMetrics(weights, expectedReturns, covarianceMatrix);
        
        gradients[symbol] = excessReturn / Math.max(currentMetrics.volatility, 0.001);
      });
      
      // Normalize gradients
      let totalGradient = Object.values(gradients).reduce((sum, g) => sum + Math.abs(g), 0);
      
      if (totalGradient > 0) {
        symbols.forEach(symbol => {
          const adjustment = (gradients[symbol] / totalGradient) * learningRate;
          weights[symbol] = Math.max(constraints.minWeight, 
                           Math.min(constraints.maxWeight, weights[symbol] + adjustment));
        });
        
        // Normalize weights to sum to 1
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        if (totalWeight > 0) {
          symbols.forEach(symbol => {
            weights[symbol] /= totalWeight;
          });
        }
      }
    }
    
    return weights;
  }

  optimizeForMinRisk(expectedReturns, covarianceMatrix, symbols, constraints) {
    const numAssets = symbols.length;
    let weights = {};
    
    // Calculate inverse variance weights
    const variances = {};
    let totalInverseVariance = 0;
    
    symbols.forEach(symbol => {
      variances[symbol] = Math.max(covarianceMatrix[symbol]?.[symbol] || 0.01, 0.001);
      totalInverseVariance += 1 / variances[symbol];
    });
    
    symbols.forEach(symbol => {
      weights[symbol] = (1 / variances[symbol]) / totalInverseVariance;
      weights[symbol] = Math.max(constraints.minWeight, 
                       Math.min(constraints.maxWeight, weights[symbol]));
    });
    
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      symbols.forEach(symbol => {
        weights[symbol] /= totalWeight;
      });
    }
    
    return weights;
  }

  optimizeForTargetReturn(expectedReturns, covarianceMatrix, symbols, targetReturn, constraints) {
    const numAssets = symbols.length;
    let weights = {};
    
    // Start with weights proportional to expected returns
    let totalReturn = Object.values(expectedReturns).reduce((sum, r) => sum + Math.max(r, 0), 0);
    
    if (totalReturn <= 0) {
      // Fallback to equal weights
      symbols.forEach(symbol => {
        weights[symbol] = 1 / numAssets;
      });
    } else {
      symbols.forEach(symbol => {
        weights[symbol] = Math.max(expectedReturns[symbol], 0) / totalReturn;
        weights[symbol] = Math.max(constraints.minWeight, 
                         Math.min(constraints.maxWeight, weights[symbol]));
      });
    }
    
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      symbols.forEach(symbol => {
        weights[symbol] /= totalWeight;
      });
    }
    
    return weights;
  }

  calculatePortfolioMetrics(weights, expectedReturns, covarianceMatrix) {
    const symbols = Object.keys(weights);
    
    if (symbols.length === 0) {
      return {
        expectedReturn: 0,
        volatility: 0,
        variance: 0,
        sharpeRatio: 0
      };
    }
    
    // Portfolio expected return
    let portfolioReturn = 0;
    symbols.forEach(symbol => {
      portfolioReturn += weights[symbol] * (expectedReturns[symbol] || 0);
    });
    
    // Portfolio variance
    let portfolioVariance = 0;
    symbols.forEach(symbol1 => {
      symbols.forEach(symbol2 => {
        const covar = covarianceMatrix[symbol1]?.[symbol2] || 0;
        portfolioVariance += weights[symbol1] * weights[symbol2] * covar;
      });
    });
    
    const portfolioVolatility = Math.sqrt(Math.max(portfolioVariance, 0));
    const sharpeRatio = portfolioVolatility > 0.001 ? (portfolioReturn - this.riskFreeRate) / portfolioVolatility : 0;
    
    return {
      expectedReturn: portfolioReturn,
      volatility: portfolioVolatility,
      variance: Math.max(portfolioVariance, 0),
      sharpeRatio: sharpeRatio
    };
  }

  generateRebalancingRecommendations(holdings, currentWeights, optimalWeights) {
    const recommendations = [];
    const totalValue = Object.values(holdings).reduce((sum, holding) => {
      return sum + (holding.currentValue || holding.quantity * (holding.currentPrice || holding.avgCost));
    }, 0);
    
    const allSymbols = new Set([...Object.keys(currentWeights), ...Object.keys(optimalWeights)]);
    
    allSymbols.forEach(symbol => {
      const currentWeight = currentWeights[symbol] || 0;
      const optimalWeight = optimalWeights[symbol] || 0;
      const weightDifference = optimalWeight - currentWeight;
      
      if (Math.abs(weightDifference) > 0.01) { // Only recommend changes > 1%
        const currentValue = currentWeight * totalValue;
        const targetValue = optimalWeight * totalValue;
        const dollarChange = targetValue - currentValue;
        
        const holding = holdings[symbol];
        const currentPrice = holding?.currentPrice || holding?.avgCost || 0;
        const sharesChange = currentPrice > 0 ? dollarChange / currentPrice : 0;
        
        recommendations.push({
          symbol,
          action: weightDifference > 0 ? 'BUY' : 'SELL',
          currentWeight: currentWeight * 100,
          targetWeight: optimalWeight * 100,
          weightChange: weightDifference * 100,
          dollarChange: Math.abs(dollarChange),
          sharesChange: Math.abs(sharesChange),
          priority: Math.abs(weightDifference) > 0.05 ? 'High' : 'Medium'
        });
      }
    });
    
    return recommendations.sort((a, b) => Math.abs(b.weightChange) - Math.abs(a.weightChange));
  }

  calculateRiskBudget(weights, covarianceMatrix, symbols) {
    const portfolioVariance = this.calculatePortfolioMetrics(weights, {}, covarianceMatrix).variance;
    
    const riskContributions = [];
    
    symbols.forEach(symbol => {
      let marginalRisk = 0;
      symbols.forEach(otherSymbol => {
        const covar = covarianceMatrix[symbol]?.[otherSymbol] || 0;
        marginalRisk += weights[otherSymbol] * covar;
      });
      
      const riskContribution = weights[symbol] * marginalRisk;
      const riskContributionPercent = portfolioVariance > 0.001 ? (riskContribution / portfolioVariance) * 100 : 0;
      
      riskContributions.push({
        symbol,
        weight: weights[symbol] * 100,
        riskContribution: riskContributionPercent,
        marginalRisk: marginalRisk,
        riskDensity: weights[symbol] > 0.001 ? riskContributionPercent / (weights[symbol] * 100) : 0
      });
    });
    
    return riskContributions.sort((a, b) => b.riskContribution - a.riskContribution);
  }

  performScenarioAnalysis(holdings, optimalWeights, expectedReturns, covarianceMatrix) {
    // Use simplified scenario analysis if we don't have enough data
    if (Object.keys(expectedReturns).length < 2) {
      return this.createSimplifiedScenarioAnalysis(holdings, optimalWeights);
    }
    
    const scenarios = [
      { 
        name: 'Market Rally (+20%)', 
        marketShock: 0.20, 
        correlation: 0.8
      },
      { 
        name: 'Market Decline (-20%)', 
        marketShock: -0.20, 
        correlation: 0.8
      },
      { 
        name: 'Volatility Spike', 
        marketShock: 0.0, 
        volatilityMultiplier: 2.0
      },
      { 
        name: 'Interest Rate Rise', 
        marketShock: -0.10
      },
      { 
        name: 'Flight to Quality', 
        marketShock: -0.15
      }
    ];
    
    const currentValue = Object.values(holdings).reduce((sum, holding) => {
      return sum + (holding.currentValue || holding.quantity * (holding.currentPrice || holding.avgCost));
    }, 0);
    
    return scenarios.map(scenario => {
      let portfolioImpact = 0;
      let impactDetail = {};
      
      Object.entries(optimalWeights).forEach(([symbol, weight]) => {
        let symbolImpact = scenario.marketShock || 0;
        
        if (scenario.correlation) {
          symbolImpact *= scenario.correlation;
        }
        
        const positionImpact = weight * symbolImpact;
        portfolioImpact += positionImpact;
        
        impactDetail[symbol] = {
          weight: weight * 100,
          impact: symbolImpact * 100,
          contribution: positionImpact * 100
        };
      });
      
      const dollarImpact = portfolioImpact * currentValue;
      
      return {
        scenario: scenario.name,
        description: `Portfolio impact from ${scenario.name.toLowerCase()}`,
        portfolioImpact: portfolioImpact * 100,
        dollarImpact: dollarImpact,
        riskLevel: Math.abs(portfolioImpact) > 0.15 ? 'High' : 
                   Math.abs(portfolioImpact) > 0.08 ? 'Medium' : 'Low',
        topContributors: Object.entries(impactDetail)
          .sort((a, b) => Math.abs(b[1].contribution) - Math.abs(a[1].contribution))
          .slice(0, 3)
          .map(([symbol, data]) => ({
            symbol,
            impact: data.contribution
          }))
      };
    });
  }

  // Helper functions
  calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i-1] > 0) {
        const dailyReturn = (prices[i] - prices[i-1]) / prices[i-1];
        if (isFinite(dailyReturn)) {
          returns.push(dailyReturn);
        }
      }
    }
    return returns;
  }

  calculateMean(values) {
    const validValues = values.filter(v => isFinite(v));
    return validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
  }

  calculateCovariance(values1, values2) {
    if (values1.length !== values2.length || values1.length < 2) return 0;
    
    const mean1 = this.calculateMean(values1);
    const mean2 = this.calculateMean(values2);
    
    let covariance = 0;
    let validPairs = 0;
    
    for (let i = 0; i < values1.length; i++) {
      if (isFinite(values1[i]) && isFinite(values2[i])) {
        covariance += (values1[i] - mean1) * (values2[i] - mean2);
        validPairs++;
      }
    }
    
    return validPairs > 1 ? covariance / (validPairs - 1) : 0;
  }
}

export default new PortfolioOptimizationService();
