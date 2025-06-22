import edgarService from './edgarService.js';
import eodService from './eodService.js';

class PortfolioAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
  }

  // Get fundamental data for all portfolio holdings
  async getPortfolioFundamentals(holdings) {
    const symbols = Object.keys(holdings);
    const fundamentalData = {};
    
    console.log(`🔍 Fetching fundamentals for ${symbols.length} holdings...`);
    
    // Fetch fundamentals for all holdings in parallel (respecting rate limits)
    const batchSize = 5; // Process 5 at a time to respect SEC rate limits
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const cacheKey = `fundamentals_${symbol}`;
          
          // Check cache first
          if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
              return [symbol, cached.data];
            }
          }
          
          // Fetch from EDGAR
          const data = await edgarService.getCompanyFacts(symbol);
          
          // Extract key metrics for portfolio display
          const metrics = {
            pe: null,
            pb: null,
            roe: data.fundamentals.roe || null,
            profitMargin: data.fundamentals.profitMargin || null,
            revenueGrowth: data.fundamentals.revenueGrowthYoY || null,
            debtToEquity: data.fundamentals.debtToEquity || null,
            eps: data.fundamentals.eps || null,
            bookValue: data.fundamentals.bookValuePerShare || null,
            lastUpdated: new Date().toISOString()
          };
          
          // Calculate P/E and P/B with current price
          const currentPrice = holdings[symbol].currentPrice;
          if (currentPrice && metrics.eps) {
            metrics.pe = currentPrice / metrics.eps;
          }
          if (currentPrice && metrics.bookValue) {
            metrics.pb = currentPrice / metrics.bookValue;
          }
          
          // Cache the result
          this.cache.set(cacheKey, {
            data: metrics,
            timestamp: Date.now()
          });
          
          console.log(`✅ ${symbol}: P/E=${metrics.pe?.toFixed(2) || 'N/A'}, ROE=${metrics.roe?.toFixed(1) || 'N/A'}%`);
          
          return [symbol, metrics];
          
        } catch (error) {
          console.error(`❌ Error fetching fundamentals for ${symbol}:`, error.message);
          return [symbol, null];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(([symbol, data]) => {
        if (data) {
          fundamentalData[symbol] = data;
        }
      });
      
      // Small delay between batches to be respectful to SEC servers
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return fundamentalData;
  }

  // Calculate portfolio-wide fundamental metrics
  calculatePortfolioMetrics(holdings, fundamentalData) {
    const portfolioMetrics = {
      weightedPE: 0,
      weightedROE: 0,
      weightedProfitMargin: 0,
      avgRevenueGrowth: 0,
      qualityScore: 0,
      valueScore: 0,
      growthScore: 0,
      financialHealthScore: 0,
      sectorAllocation: {},
      styleAllocation: {
        growth: 0,
        value: 0,
        blend: 0
      }
    };

    let totalValue = 0;
    let validPECount = 0;
    let validROECount = 0;
    let validGrowthCount = 0;
    
    // Calculate weighted averages
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      const marketValue = holding.currentValue || (holding.quantity * holding.currentPrice);
      totalValue += marketValue;
      const weight = marketValue;
      
      // Weighted P/E
      if (fundamentals.pe && fundamentals.pe > 0 && fundamentals.pe < 100) {
        portfolioMetrics.weightedPE += fundamentals.pe * weight;
        validPECount += weight;
      }
      
      // Weighted ROE
      if (fundamentals.roe && fundamentals.roe > -50 && fundamentals.roe < 100) {
        portfolioMetrics.weightedROE += fundamentals.roe * weight;
        validROECount += weight;
      }
      
      // Average Revenue Growth
      if (fundamentals.revenueGrowth && fundamentals.revenueGrowth > -50 && fundamentals.revenueGrowth < 200) {
        portfolioMetrics.avgRevenueGrowth += fundamentals.revenueGrowth;
        validGrowthCount++;
      }
      
      // Style Classification
      const pe = fundamentals.pe || 0;
      const growth = fundamentals.revenueGrowth || 0;
      
      if (pe < 15 && growth < 10) {
        portfolioMetrics.styleAllocation.value += weight;
      } else if (pe > 25 || growth > 15) {
        portfolioMetrics.styleAllocation.growth += weight;
      } else {
        portfolioMetrics.styleAllocation.blend += weight;
      }
    });
    
    // Finalize calculations
    if (validPECount > 0) {
      portfolioMetrics.weightedPE = portfolioMetrics.weightedPE / validPECount;
    }
    
    if (validROECount > 0) {
      portfolioMetrics.weightedROE = portfolioMetrics.weightedROE / validROECount;
    }
    
    if (validGrowthCount > 0) {
      portfolioMetrics.avgRevenueGrowth = portfolioMetrics.avgRevenueGrowth / validGrowthCount;
    }
    
    // Convert style allocation to percentages
    Object.keys(portfolioMetrics.styleAllocation).forEach(style => {
      portfolioMetrics.styleAllocation[style] = (portfolioMetrics.styleAllocation[style] / totalValue) * 100;
    });
    
    // Calculate composite scores (0-100)
    portfolioMetrics.qualityScore = this.calculateQualityScore(fundamentalData, holdings);
    portfolioMetrics.valueScore = this.calculateValueScore(fundamentalData, holdings);
    portfolioMetrics.growthScore = this.calculateGrowthScore(fundamentalData, holdings);
    portfolioMetrics.financialHealthScore = this.calculateFinancialHealthScore(fundamentalData, holdings);
    
    return portfolioMetrics;
  }
  
  // Calculate quality score based on ROE, profit margins, debt levels
  calculateQualityScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      let score = 50; // Start at neutral
      
      // ROE scoring
      if (fundamentals.roe > 15) score += 20;
      else if (fundamentals.roe > 10) score += 10;
      else if (fundamentals.roe < 5) score -= 15;
      
      // Profit margin scoring
      if (fundamentals.profitMargin > 20) score += 15;
      else if (fundamentals.profitMargin > 10) score += 8;
      else if (fundamentals.profitMargin < 5) score -= 10;
      
      // Debt to equity scoring
      if (fundamentals.debtToEquity < 0.3) score += 15;
      else if (fundamentals.debtToEquity < 0.6) score += 5;
      else if (fundamentals.debtToEquity > 1.5) score -= 20;
      
      totalScore += Math.max(0, Math.min(100, score));
      validCount++;
    });
    
    return validCount > 0 ? totalScore / validCount : 50;
  }
  
  // Calculate value score based on P/E, P/B ratios
  calculateValueScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      let score = 50; // Start at neutral
      
      // P/E scoring (lower is better for value)
      if (fundamentals.pe < 12) score += 25;
      else if (fundamentals.pe < 18) score += 15;
      else if (fundamentals.pe < 25) score += 5;
      else if (fundamentals.pe > 35) score -= 20;
      
      // P/B scoring
      if (fundamentals.pb < 1.0) score += 20;
      else if (fundamentals.pb < 2.0) score += 10;
      else if (fundamentals.pb > 4.0) score -= 15;
      
      totalScore += Math.max(0, Math.min(100, score));
      validCount++;
    });
    
    return validCount > 0 ? totalScore / validCount : 50;
  }
  
  // Calculate growth score based on revenue and earnings growth
  calculateGrowthScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals || !fundamentals.revenueGrowth) return;
      
      let score = 50; // Start at neutral
      
      // Revenue growth scoring
      if (fundamentals.revenueGrowth > 20) score += 30;
      else if (fundamentals.revenueGrowth > 10) score += 20;
      else if (fundamentals.revenueGrowth > 5) score += 10;
      else if (fundamentals.revenueGrowth < 0) score -= 20;
      
      totalScore += Math.max(0, Math.min(100, score));
      validCount++;
    });
    
    return validCount > 0 ? totalScore / validCount : 50;
  }
  
  // Calculate financial health score
  calculateFinancialHealthScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      let score = 50; // Start at neutral
      
      // Debt to equity (lower is better)
      if (fundamentals.debtToEquity < 0.2) score += 25;
      else if (fundamentals.debtToEquity < 0.5) score += 15;
      else if (fundamentals.debtToEquity < 1.0) score += 5;
      else if (fundamentals.debtToEquity > 2.0) score -= 25;
      
      // ROE (higher is better)
      if (fundamentals.roe > 20) score += 20;
      else if (fundamentals.roe > 15) score += 10;
      else if (fundamentals.roe < 5) score -= 15;
      
      // Profit margin (higher is better)
      if (fundamentals.profitMargin > 15) score += 15;
      else if (fundamentals.profitMargin > 8) score += 8;
      else if (fundamentals.profitMargin < 3) score -= 10;
      
      totalScore += Math.max(0, Math.min(100, score));
      validCount++;
    });
    
    return validCount > 0 ? totalScore / validCount : 50;
  }

  // Get fundamental alerts and recommendations
  async getPortfolioInsights(holdings, fundamentalData, portfolioMetrics) {
    const insights = {
      alerts: [],
      recommendations: [],
      strengths: [],
      risks: []
    };
    
    // Analyze individual holdings
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      // High P/E alert
      if (fundamentals.pe > 40) {
        insights.alerts.push({
          type: 'warning',
          symbol,
          message: `${symbol} has high P/E ratio (${fundamentals.pe.toFixed(1)}) - potential overvaluation risk`
        });
      }
      
      // High debt alert
      if (fundamentals.debtToEquity > 2.0) {
        insights.alerts.push({
          type: 'warning',
          symbol,
          message: `${symbol} has high debt-to-equity ratio (${fundamentals.debtToEquity.toFixed(1)}) - financial risk`
        });
      }
      
      // Strong fundamentals
      if (fundamentals.roe > 20 && fundamentals.profitMargin > 15 && fundamentals.debtToEquity < 0.5) {
        insights.strengths.push({
          symbol,
          message: `${symbol} shows strong fundamentals: ROE ${fundamentals.roe.toFixed(1)}%, Profit Margin ${fundamentals.profitMargin.toFixed(1)}%`
        });
      }
      
      // Value opportunities
      if (fundamentals.pe < 12 && fundamentals.revenueGrowth > 5) {
        insights.recommendations.push({
          type: 'opportunity',
          symbol,
          message: `${symbol} may be undervalued: P/E ${fundamentals.pe.toFixed(1)} with ${fundamentals.revenueGrowth.toFixed(1)}% revenue growth`
        });
      }
    });
    
    // Portfolio-level insights
    if (portfolioMetrics.weightedPE > 25) {
      insights.risks.push({
        message: `Portfolio has high average P/E (${portfolioMetrics.weightedPE.toFixed(1)}) - consider rebalancing toward value`
      });
    }
    
    if (portfolioMetrics.styleAllocation.growth > 70) {
      insights.recommendations.push({
        type: 'rebalance',
        message: `Portfolio heavily tilted toward growth (${portfolioMetrics.styleAllocation.growth.toFixed(1)}%) - consider adding value positions`
      });
    }
    
    if (portfolioMetrics.qualityScore > 75) {
      insights.strengths.push({
        message: `Strong portfolio quality score (${portfolioMetrics.qualityScore.toFixed(1)}/100) indicates high-quality holdings`
      });
    }
    
    return insights;
  }
}

export default new PortfolioAnalyticsService();
