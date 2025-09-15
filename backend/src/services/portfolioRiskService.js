import fmpService from './fmpService.js';

class PortfolioRiskService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 1800000; // 30 minutes cache for risk calculations
    this.riskFreeRate = 0.045; // Current risk-free rate (approximate 10-year Treasury)
  }

  // Main method to calculate all portfolio risk metrics
  async calculatePortfolioRisk(portfolio) {
    console.log(`📊 Calculating portfolio risk metrics for ${Object.keys(portfolio.holdings).length} holdings...`);
    
    try {
      const symbols = Object.keys(portfolio.holdings);
      if (symbols.length === 0) {
        throw new Error('No holdings found in portfolio');
      }

      // Get historical data for all holdings + SPY (benchmark)
      const historicalData = await this.getHistoricalData([...symbols, 'SPY']);
      
      // Calculate portfolio weights
      const weights = this.calculatePortfolioWeights(portfolio.holdings);
      
      // Calculate portfolio returns
      const portfolioReturns = this.calculatePortfolioReturns(historicalData, weights, symbols);
      const marketReturns = this.calculateReturns(historicalData['SPY']);
      
      // Calculate risk metrics
      const riskMetrics = {
        // Core risk metrics
        beta: this.calculateBeta(portfolioReturns, marketReturns),
        volatility: this.calculateVolatility(portfolioReturns),
        valueAtRisk: this.calculateVaR(portfolioReturns),
        sharpeRatio: this.calculateSharpeRatio(portfolioReturns),
        maxDrawdown: this.calculateMaxDrawdown(portfolioReturns),
        
        // Additional metrics
        alpha: this.calculateAlpha(portfolioReturns, marketReturns),
        sortinoRatio: this.calculateSortinoRatio(portfolioReturns),
        calmarRatio: this.calculateCalmarRatio(portfolioReturns),
        
        // Time-based volatility
        volatility30Day: this.calculateVolatility(portfolioReturns.slice(-30)),
        volatility90Day: this.calculateVolatility(portfolioReturns.slice(-90)),
        
        // Risk-adjusted returns
        trackingError: this.calculateTrackingError(portfolioReturns, marketReturns),
        informationRatio: this.calculateInformationRatio(portfolioReturns, marketReturns)
      };

      // Calculate correlation matrix
      const correlationMatrix = this.calculateCorrelationMatrix(historicalData, symbols);
      
      // Analyze concentration risk
      const concentrationAnalysis = this.analyzeConcentrationRisk(portfolio.holdings);
      
      // Perform stress testing
      const stressTests = this.performStressTests(portfolio.holdings, historicalData);
      
      // Generate risk insights
      const insights = this.generateRiskInsights(riskMetrics, concentrationAnalysis);

      const result = {
        riskMetrics,
        correlationMatrix,
        concentrationAnalysis,
        stressTests,
        insights,
        metadata: {
          calculationDate: new Date().toISOString(),
          dataPoints: portfolioReturns.length,
          riskFreeRate: this.riskFreeRate,
          benchmark: 'SPY'
        }
      };

      console.log(`✅ Portfolio risk calculation complete`);
      console.log(`📊 Key metrics: Beta=${riskMetrics.beta.toFixed(2)}, Vol=${(riskMetrics.volatility*100).toFixed(1)}%, VaR=${(riskMetrics.valueAtRisk*100).toFixed(1)}%`);

      return result;

    } catch (error) {
      console.error(`❌ Error calculating portfolio risk:`, error);
      throw error;
    }
  }

  // Get historical price data for symbols
  async getHistoricalData(symbols) {
    const historicalData = {};
    const batchSize = 5; // Process in batches to respect rate limits
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const cacheKey = `historical_${symbol}`;
          
          // Check cache
          if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
              return [symbol, cached.data];
            }
          }

          // Fetch 2 years of data for robust statistical analysis
          const data = await fmpService.getHistoricalPrices(symbol, '2years');
          
          if (data?.historical && data.historical.length > 0) {
            // Sort by date and extract prices
            const prices = data.historical
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(d => d.close);
            
            // Cache the result
            this.cache.set(cacheKey, {
              data: prices,
              timestamp: Date.now()
            });
            
            return [symbol, prices];
          } else {
            console.warn(`⚠️ No historical data for ${symbol}`);
            return [symbol, null];
          }
          
        } catch (error) {
          console.error(`❌ Error fetching data for ${symbol}:`, error.message);
          return [symbol, null];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(([symbol, data]) => {
        if (data && data.length > 0) {
          historicalData[symbol] = data;
        }
      });
      
      // Rate limiting delay
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return historicalData;
  }

  // Calculate portfolio weights based on current market values
  calculatePortfolioWeights(holdings) {
    const totalValue = Object.values(holdings).reduce((sum, holding) => {
      return sum + (holding.currentValue || holding.quantity * holding.currentPrice);
    }, 0);
    
    const weights = {};
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const value = holding.currentValue || holding.quantity * holding.currentPrice;
      weights[symbol] = value / totalValue;
    });
    
    return weights;
  }

  // Calculate returns from price series
  calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i-1]) / prices[i-1];
      returns.push(dailyReturn);
    }
    return returns;
  }

  // Calculate portfolio returns based on weighted average of individual returns
  calculatePortfolioReturns(historicalData, weights, symbols) {
    const validSymbols = symbols.filter(symbol => historicalData[symbol] && historicalData[symbol].length > 0);
    
    if (validSymbols.length === 0) {
      throw new Error('No valid historical data for portfolio calculations');
    }

    // Find minimum data length across all holdings
    const minLength = Math.min(...validSymbols.map(symbol => historicalData[symbol].length));
    
    // Calculate returns for each holding
    const holdingReturns = {};
    validSymbols.forEach(symbol => {
      const prices = historicalData[symbol].slice(-minLength);
      holdingReturns[symbol] = this.calculateReturns(prices);
    });
    
    // Calculate weighted portfolio returns
    const portfolioReturns = [];
    const returnsLength = Math.min(...Object.values(holdingReturns).map(returns => returns.length));
    
    for (let i = 0; i < returnsLength; i++) {
      let portfolioReturn = 0;
      validSymbols.forEach(symbol => {
        const weight = weights[symbol] || 0;
        const holdingReturn = holdingReturns[symbol][i] || 0;
        portfolioReturn += weight * holdingReturn;
      });
      portfolioReturns.push(portfolioReturn);
    }
    
    return portfolioReturns;
  }

  // Calculate Beta (portfolio's sensitivity to market movements)
  calculateBeta(portfolioReturns, marketReturns) {
    const minLength = Math.min(portfolioReturns.length, marketReturns.length);
    const portReturns = portfolioReturns.slice(-minLength);
    const mktReturns = marketReturns.slice(-minLength);
    
    const covariance = this.calculateCovariance(portReturns, mktReturns);
    const marketVariance = this.calculateVariance(mktReturns);
    
    return marketVariance !== 0 ? covariance / marketVariance : 1.0;
  }

  // Calculate portfolio volatility (annualized)
  calculateVolatility(returns) {
    if (returns.length < 2) return 0;
    
    const variance = this.calculateVariance(returns);
    const dailyVolatility = Math.sqrt(variance);
    
    // Annualize (assuming 252 trading days)
    return dailyVolatility * Math.sqrt(252);
  }

  // Calculate Value at Risk (95% confidence level)
  calculateVaR(returns, confidenceLevel = 0.05) {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(sortedReturns.length * confidenceLevel);
    
    return Math.abs(sortedReturns[index] || 0);
  }

  // Calculate Sharpe Ratio
  calculateSharpeRatio(returns) {
    if (returns.length === 0) return 0;
    
    const meanReturn = this.calculateMean(returns);
    const volatility = this.calculateVolatility(returns);
    
    // Annualize return (assuming 252 trading days)
    const annualizedReturn = meanReturn * 252;
    
    return volatility !== 0 ? (annualizedReturn - this.riskFreeRate) / volatility : 0;
  }

  // Calculate Maximum Drawdown
  calculateMaxDrawdown(returns) {
    if (returns.length === 0) return 0;
    
    let cumulativeReturn = 1;
    let peak = 1;
    let maxDrawdown = 0;
    
    returns.forEach(dailyReturn => {
      cumulativeReturn *= (1 + dailyReturn);
      
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      
      const drawdown = (peak - cumulativeReturn) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return maxDrawdown;
  }

  // Calculate Alpha (excess return over what Beta would predict)
  calculateAlpha(portfolioReturns, marketReturns) {
    const beta = this.calculateBeta(portfolioReturns, marketReturns);
    const portfolioMeanReturn = this.calculateMean(portfolioReturns) * 252; // Annualized
    const marketMeanReturn = this.calculateMean(marketReturns) * 252; // Annualized
    
    return portfolioMeanReturn - this.riskFreeRate - beta * (marketMeanReturn - this.riskFreeRate);
  }

  // Calculate Sortino Ratio (similar to Sharpe but only considers downside volatility)
  calculateSortinoRatio(returns) {
    if (returns.length === 0) return 0;
    
    const meanReturn = this.calculateMean(returns) * 252; // Annualized
    const downSideDeviations = returns.filter(r => r < 0).map(r => r * r);
    
    if (downSideDeviations.length === 0) return Infinity;
    
    const downSideVariance = downSideDeviations.reduce((sum, sq) => sum + sq, 0) / downSideDeviations.length;
    const downSideVolatility = Math.sqrt(downSideVariance) * Math.sqrt(252);
    
    return downSideVolatility !== 0 ? (meanReturn - this.riskFreeRate) / downSideVolatility : 0;
  }

  // Calculate Calmar Ratio (annual return / max drawdown)
  calculateCalmarRatio(returns) {
    const annualReturn = this.calculateMean(returns) * 252;
    const maxDrawdown = this.calculateMaxDrawdown(returns);
    
    return maxDrawdown !== 0 ? annualReturn / maxDrawdown : 0;
  }

  // Calculate Tracking Error
  calculateTrackingError(portfolioReturns, marketReturns) {
    const minLength = Math.min(portfolioReturns.length, marketReturns.length);
    const excessReturns = [];
    
    for (let i = 0; i < minLength; i++) {
      excessReturns.push(portfolioReturns[i] - marketReturns[i]);
    }
    
    return this.calculateVolatility(excessReturns);
  }

  // Calculate Information Ratio
  calculateInformationRatio(portfolioReturns, marketReturns) {
    const trackingError = this.calculateTrackingError(portfolioReturns, marketReturns);
    const alpha = this.calculateAlpha(portfolioReturns, marketReturns);
    
    return trackingError !== 0 ? alpha / trackingError : 0;
  }

  // Calculate correlation matrix between holdings
  calculateCorrelationMatrix(historicalData, symbols) {
    const validSymbols = symbols.filter(symbol => historicalData[symbol] && historicalData[symbol].length > 0);
    const correlationMatrix = {};
    
    // Calculate returns for each symbol
    const allReturns = {};
    const minLength = Math.min(...validSymbols.map(symbol => historicalData[symbol].length));
    
    validSymbols.forEach(symbol => {
      const prices = historicalData[symbol].slice(-minLength);
      allReturns[symbol] = this.calculateReturns(prices);
    });
    
    // Calculate correlation between each pair
    validSymbols.forEach(symbol1 => {
      correlationMatrix[symbol1] = {};
      validSymbols.forEach(symbol2 => {
        if (symbol1 === symbol2) {
          correlationMatrix[symbol1][symbol2] = 1.0;
        } else {
          const correlation = this.calculateCorrelation(allReturns[symbol1], allReturns[symbol2]);
          correlationMatrix[symbol1][symbol2] = correlation;
        }
      });
    });
    
    return correlationMatrix;
  }

  // Analyze concentration risk
  analyzeConcentrationRisk(holdings) {
    const totalValue = Object.values(holdings).reduce((sum, holding) => {
      return sum + (holding.currentValue || holding.quantity * holding.currentPrice);
    }, 0);
    
    const positions = Object.entries(holdings).map(([symbol, holding]) => {
      const value = holding.currentValue || holding.quantity * holding.currentPrice;
      const percentage = (value / totalValue) * 100;
      
      return {
        symbol,
        value,
        percentage,
        isConcentrated: percentage > 10 // Flag positions > 10%
      };
    }).sort((a, b) => b.percentage - a.percentage);
    
    const concentratedPositions = positions.filter(p => p.isConcentrated);
    const top5Concentration = positions.slice(0, 5).reduce((sum, p) => sum + p.percentage, 0);
    const top10Concentration = positions.slice(0, 10).reduce((sum, p) => sum + p.percentage, 0);
    
    return {
      totalPositions: positions.length,
      concentratedPositions: concentratedPositions.length,
      largestPosition: positions[0],
      top5Concentration,
      top10Concentration,
      positions: positions.slice(0, 10), // Top 10 positions
      riskLevel: this.getConcentrationRiskLevel(top5Concentration, concentratedPositions.length)
    };
  }

  // Get concentration risk level
  getConcentrationRiskLevel(top5Concentration, concentratedCount) {
    if (top5Concentration > 70 || concentratedCount > 3) return 'High';
    if (top5Concentration > 50 || concentratedCount > 1) return 'Moderate';
    return 'Low';
  }

  // Perform stress testing scenarios
  performStressTests(holdings, historicalData) {
    const scenarios = [
      { name: '2008 Financial Crisis', marketDrop: -0.37, correlationIncrease: 0.2 },
      { name: 'COVID-19 Crash (Mar 2020)', marketDrop: -0.34, correlationIncrease: 0.15 },
      { name: 'Tech Bubble Burst', marketDrop: -0.49, correlationIncrease: 0.25 },
      { name: 'Flash Crash', marketDrop: -0.10, correlationIncrease: 0.3 },
      { name: 'Interest Rate Shock', marketDrop: -0.15, correlationIncrease: 0.1 }
    ];
    
    const weights = this.calculatePortfolioWeights(holdings);
    const stressResults = [];
    
    scenarios.forEach(scenario => {
      let portfolioImpact = 0;
      
      Object.entries(weights).forEach(([symbol, weight]) => {
        // Simplified stress test: assume all positions move with market + correlation adjustment
        const symbolImpact = scenario.marketDrop * (1 + scenario.correlationIncrease);
        portfolioImpact += weight * symbolImpact;
      });
      
      stressResults.push({
        scenario: scenario.name,
        portfolioImpact: portfolioImpact * 100, // Convert to percentage
        riskLevel: Math.abs(portfolioImpact) > 0.25 ? 'High' : Math.abs(portfolioImpact) > 0.15 ? 'Moderate' : 'Low'
      });
    });
    
    return stressResults;
  }

  // Generate risk insights based on calculated metrics
  generateRiskInsights(riskMetrics, concentrationAnalysis) {
    const insights = {
      alerts: [],
      recommendations: [],
      strengths: [],
      risks: []
    };
    
    // Beta analysis
    if (riskMetrics.beta > 1.3) {
      insights.alerts.push({
        type: 'warning',
        message: `High portfolio beta (${riskMetrics.beta.toFixed(2)}) indicates significant market sensitivity`
      });
    } else if (riskMetrics.beta < 0.7) {
      insights.strengths.push({
        message: `Low portfolio beta (${riskMetrics.beta.toFixed(2)}) provides good downside protection`
      });
    }
    
    // Volatility analysis
    if (riskMetrics.volatility > 0.25) {
      insights.risks.push({
        message: `High portfolio volatility (${(riskMetrics.volatility * 100).toFixed(1)}%) may lead to significant price swings`
      });
    } else if (riskMetrics.volatility < 0.15) {
      insights.strengths.push({
        message: `Low portfolio volatility (${(riskMetrics.volatility * 100).toFixed(1)}%) indicates stable performance`
      });
    }
    
    // Sharpe ratio analysis
    if (riskMetrics.sharpeRatio > 1.0) {
      insights.strengths.push({
        message: `Excellent risk-adjusted returns with Sharpe ratio of ${riskMetrics.sharpeRatio.toFixed(2)}`
      });
    } else if (riskMetrics.sharpeRatio < 0.5) {
      insights.recommendations.push({
        type: 'improvement',
        message: `Low Sharpe ratio (${riskMetrics.sharpeRatio.toFixed(2)}) suggests poor risk-adjusted returns`
      });
    }
    
    // Concentration risk analysis
    if (concentrationAnalysis.riskLevel === 'High') {
      insights.alerts.push({
        type: 'warning',
        message: `High concentration risk - top 5 positions represent ${concentrationAnalysis.top5Concentration.toFixed(1)}% of portfolio`
      });
      insights.recommendations.push({
        type: 'diversification',
        message: 'Consider diversifying by reducing position sizes or adding more holdings'
      });
    }
    
    // Max drawdown analysis
    if (riskMetrics.maxDrawdown > 0.20) {
      insights.risks.push({
        message: `High maximum drawdown (${(riskMetrics.maxDrawdown * 100).toFixed(1)}%) indicates potential for significant losses`
      });
    }
    
    return insights;
  }

  // Statistical helper functions
  calculateMean(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  calculateVariance(values) {
    if (values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.calculateMean(squaredDiffs);
  }

  calculateCovariance(values1, values2) {
    if (values1.length !== values2.length || values1.length < 2) return 0;
    
    const mean1 = this.calculateMean(values1);
    const mean2 = this.calculateMean(values2);
    
    let covariance = 0;
    for (let i = 0; i < values1.length; i++) {
      covariance += (values1[i] - mean1) * (values2[i] - mean2);
    }
    
    return covariance / (values1.length - 1);
  }

  calculateCorrelation(values1, values2) {
    const covariance = this.calculateCovariance(values1, values2);
    const std1 = Math.sqrt(this.calculateVariance(values1));
    const std2 = Math.sqrt(this.calculateVariance(values2));
    
    return (std1 !== 0 && std2 !== 0) ? covariance / (std1 * std2) : 0;
  }
}

export default new PortfolioRiskService();
