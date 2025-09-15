import redisService from './redisService.js';
import pythonBridge from './PythonBridge.js';

class CustomIndexService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
    
    // Default benchmark indices for comparison
    this.benchmarks = {
      'SPY': 'S&P 500',
      'QQQ': 'NASDAQ 100',
      'DIA': 'Dow Jones',
      'IWM': 'Russell 2000',
      'VTI': 'Total Stock Market'
    };
  }

  /**
   * Create a new custom index
   * @param {string} userId - User identifier
   * @param {object} indexData - Index configuration
   * @returns {Promise<object>} - Created index with metrics
   */
  async createIndex(userId, indexData) {
    try {
      const indexId = `index_${userId}_${Date.now()}`;
      
      const index = {
        id: indexId,
        name: indexData.name || 'My Custom Index',
        description: indexData.description || '',
        holdings: indexData.holdings || [],
        rebalanceFrequency: indexData.rebalanceFrequency || 'quarterly',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId
      };

      // Validate and normalize holdings
      index.holdings = await this.validateHoldings(index.holdings);
      
      // Calculate initial metrics
      const metrics = await this.calculateIndexMetrics(index);
      index.metrics = metrics;

      // Save to Redis
      await redisService.set(`custom_index:${indexId}`, index);
      await this.addToUserIndices(userId, indexId);

      return {
        success: true,
        index: index,
        indexId: indexId
      };

    } catch (error) {
      console.error('Create index error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing custom index
   * @param {string} indexId - Index identifier
   * @param {object} updates - Updates to apply
   * @returns {Promise<object>} - Updated index
   */
  async updateIndex(indexId, updates) {
    try {
      const index = await redisService.get(`custom_index:${indexId}`);
      if (!index) {
        throw new Error('Index not found');
      }

      // Apply updates
      Object.assign(index, updates);
      index.updatedAt = new Date().toISOString();

      // Validate holdings if updated
      if (updates.holdings) {
        index.holdings = await this.validateHoldings(updates.holdings);
      }

      // Recalculate metrics
      const metrics = await this.calculateIndexMetrics(index);
      index.metrics = metrics;

      // Save updated index
      await redisService.set(`custom_index:${indexId}`, index);

      return {
        success: true,
        index: index
      };

    } catch (error) {
      console.error('Update index error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate and normalize holdings with real-time data
   * @param {Array} holdings - Array of holdings with symbol and weight
   * @returns {Promise<Array>} - Validated holdings with current data
   */
  async validateHoldings(holdings) {
    try {
      if (!holdings || holdings.length === 0) return [];

      const symbols = holdings.map(h => h.symbol).join(',');
      
      // Get real-time quotes
      const quotesResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${this.fmpApiKey}`
      );
      const quotes = await quotesResponse.json();

      // Get company profiles for additional data
      const profilesResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbols}?apikey=${this.fmpApiKey}`
      );
      const profiles = await profilesResponse.json();

      const validatedHoldings = holdings.map(holding => {
        const quote = quotes.find(q => q.symbol === holding.symbol);
        const profile = profiles.find(p => p.symbol === holding.symbol);

        if (!quote) {
          console.warn(`Symbol ${holding.symbol} not found`);
          return null;
        }

        return {
          symbol: holding.symbol,
          name: quote.name || profile?.companyName || holding.symbol,
          weight: Math.max(0, Math.min(100, holding.weight || 0)), // Clamp between 0-100
          price: quote.price,
          marketCap: profile?.mktCap || quote.marketCap,
          sector: profile?.sector || 'Unknown',
          industry: profile?.industry || 'Unknown',
          beta: profile?.beta || 1.0,
          dividendYield: profile?.lastDiv / quote.price || 0,
          pe: quote.pe || null,
          change: quote.change,
          changePercent: quote.changesPercentage,
          volume: quote.volume,
          lastUpdated: new Date().toISOString()
        };
      }).filter(Boolean); // Remove null entries

      // Normalize weights to sum to 100%
      const totalWeight = validatedHoldings.reduce((sum, h) => sum + h.weight, 0);
      if (totalWeight > 0) {
        validatedHoldings.forEach(holding => {
          holding.weight = (holding.weight / totalWeight) * 100;
        });
      }

      return validatedHoldings;

    } catch (error) {
      console.error('Holdings validation error:', error);
      return holdings; // Return original if validation fails
    }
  }

  /**
   * Calculate comprehensive index metrics
   * @param {object} index - Index object with holdings
   * @returns {Promise<object>} - Calculated metrics
   */
  async calculateIndexMetrics(index) {
    try {
      const holdings = index.holdings || [];
      
      if (holdings.length === 0) {
        return this.getEmptyMetrics();
      }

      // Basic portfolio metrics
      const basicMetrics = this.calculateBasicMetrics(holdings);
      
      // Advanced metrics using Python scripts
      const advancedMetrics = await this.calculateAdvancedMetrics(holdings);
      
      // Performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(holdings);
      
      // Risk metrics
      const riskMetrics = await this.calculateRiskMetrics(holdings);
      
      // Sector allocation
      const sectorAllocation = this.calculateSectorAllocation(holdings);

      return {
        basic: basicMetrics,
        advanced: advancedMetrics,
        performance: performanceMetrics,
        risk: riskMetrics,
        allocation: {
          sector: sectorAllocation,
          marketCap: this.calculateMarketCapAllocation(holdings)
        },
        lastCalculated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Metrics calculation error:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Calculate basic portfolio metrics
   * @param {Array} holdings - Portfolio holdings
   * @returns {object} - Basic metrics
   */
  calculateBasicMetrics(holdings) {
    const totalValue = holdings.reduce((sum, h) => sum + (h.weight * h.price), 0);
    const totalMarketCap = holdings.reduce((sum, h) => sum + (h.marketCap || 0) * (h.weight / 100), 0);
    
    const weightedPE = holdings.reduce((sum, h) => {
      return h.pe ? sum + (h.pe * h.weight / 100) : sum;
    }, 0);
    
    const weightedDividendYield = holdings.reduce((sum, h) => {
      return sum + (h.dividendYield * h.weight / 100);
    }, 0);
    
    const weightedBeta = holdings.reduce((sum, h) => {
      return sum + (h.beta * h.weight / 100);
    }, 0);

    const avgDailyChange = holdings.reduce((sum, h) => {
      return sum + (h.changePercent * h.weight / 100);
    }, 0);

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      totalMarketCap: totalMarketCap,
      weightedPE: Math.round(weightedPE * 100) / 100,
      weightedDividendYield: Math.round(weightedDividendYield * 10000) / 100, // Convert to percentage
      weightedBeta: Math.round(weightedBeta * 100) / 100,
      avgDailyChange: Math.round(avgDailyChange * 100) / 100,
      numberOfHoldings: holdings.length,
      concentrationRisk: this.calculateConcentrationRisk(holdings)
    };
  }

  /**
   * Calculate advanced metrics using Python integration
   * @param {Array} holdings - Portfolio holdings
   * @returns {Promise<object>} - Advanced metrics
   */
  async calculateAdvancedMetrics(holdings) {
    try {
      // Prepare data for Python analysis
      const portfolioData = {
        holdings: holdings.map(h => ({
          symbol: h.symbol,
          weight: h.weight / 100,
          price: h.price,
          beta: h.beta || 1.0,
          marketCap: h.marketCap || 0
        }))
      };

      // Use Python bridge for advanced calculations
      const pythonResult = await pythonBridge.analyzePortfolioMetrics(
        portfolioData,
        ['SPY', 'QQQ', 'DIA'] // Benchmarks
      );

      if (pythonResult.error) {
        console.warn('Python analysis failed, using fallback');
        return this.getFallbackAdvancedMetrics(holdings);
      }

      return {
        sharpeRatio: pythonResult.sharpe_ratio || 0,
        volatility: pythonResult.volatility || 0,
        maxDrawdown: pythonResult.max_drawdown || 0,
        informationRatio: pythonResult.information_ratio || 0,
        treynorRatio: pythonResult.treynor_ratio || 0,
        calmarRatio: pythonResult.calmar_ratio || 0,
        correlation: pythonResult.correlation || {},
        expectedReturn: pythonResult.expected_return || 0
      };

    } catch (error) {
      console.error('Advanced metrics calculation error:', error);
      return this.getFallbackAdvancedMetrics(holdings);
    }
  }

  /**
   * Calculate performance metrics
   * @param {Array} holdings - Portfolio holdings
   * @returns {Promise<object>} - Performance metrics
   */
  async calculatePerformanceMetrics(holdings) {
    try {
      // Get historical performance for backtesting
      const symbols = holdings.map(h => h.symbol);
      const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y'];
      
      const performance = {};
      
      for (const timeframe of timeframes) {
        performance[timeframe] = await this.calculateTimeframePerformance(holdings, timeframe);
      }

      return {
        performance,
        riskAdjustedReturn: this.calculateRiskAdjustedReturn(holdings),
        consistency: this.calculateConsistency(performance),
        upCaptureRatio: 0.95, // Placeholder - would calculate from historical data
        downCaptureRatio: 0.85 // Placeholder - would calculate from historical data
      };

    } catch (error) {
      console.error('Performance metrics error:', error);
      return {};
    }
  }

  /**
   * Calculate risk metrics
   * @param {Array} holdings - Portfolio holdings
   * @returns {Promise<object>} - Risk metrics
   */
  async calculateRiskMetrics(holdings) {
    const portfolioBeta = holdings.reduce((sum, h) => sum + (h.beta * h.weight / 100), 0);
    const concentrationRisk = this.calculateConcentrationRisk(holdings);
    const sectorConcentration = this.calculateSectorConcentration(holdings);
    
    return {
      portfolioBeta: Math.round(portfolioBeta * 100) / 100,
      concentrationRisk: concentrationRisk,
      sectorConcentration: sectorConcentration,
      diversificationScore: this.calculateDiversificationScore(holdings),
      liquidityRisk: this.calculateLiquidityRisk(holdings),
      valueAtRisk: await this.calculateVaR(holdings), // 95% VaR
      riskGrade: this.calculateRiskGrade(portfolioBeta, concentrationRisk)
    };
  }

  /**
   * Calculate sector allocation
   * @param {Array} holdings - Portfolio holdings
   * @returns {Array} - Sector allocation breakdown
   */
  calculateSectorAllocation(holdings) {
    const sectorMap = {};
    
    holdings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      if (!sectorMap[sector]) {
        sectorMap[sector] = {
          sector: sector,
          weight: 0,
          holdings: []
        };
      }
      sectorMap[sector].weight += holding.weight;
      sectorMap[sector].holdings.push(holding.symbol);
    });

    return Object.values(sectorMap)
      .sort((a, b) => b.weight - a.weight)
      .map(sector => ({
        ...sector,
        weight: Math.round(sector.weight * 100) / 100
      }));
  }

  /**
   * Calculate market cap allocation
   * @param {Array} holdings - Portfolio holdings
   * @returns {object} - Market cap allocation
   */
  calculateMarketCapAllocation(holdings) {
    const allocation = { large: 0, mid: 0, small: 0, micro: 0 };
    
    holdings.forEach(holding => {
      const marketCap = holding.marketCap || 0;
      const weight = holding.weight;
      
      if (marketCap > 10000000000) allocation.large += weight;
      else if (marketCap > 2000000000) allocation.mid += weight;
      else if (marketCap > 300000000) allocation.small += weight;
      else allocation.micro += weight;
    });

    return {
      largeCap: Math.round(allocation.large * 100) / 100,
      midCap: Math.round(allocation.mid * 100) / 100,
      smallCap: Math.round(allocation.small * 100) / 100,
      microCap: Math.round(allocation.micro * 100) / 100
    };
  }

  /**
   * Calculate concentration risk
   * @param {Array} holdings - Portfolio holdings
   * @returns {object} - Concentration risk metrics
   */
  calculateConcentrationRisk(holdings) {
    const sortedWeights = holdings.map(h => h.weight).sort((a, b) => b - a);
    
    const top5Weight = sortedWeights.slice(0, 5).reduce((sum, w) => sum + w, 0);
    const top10Weight = sortedWeights.slice(0, 10).reduce((sum, w) => sum + w, 0);
    const maxWeight = sortedWeights[0] || 0;
    
    // Herfindahl-Hirschman Index
    const hhi = sortedWeights.reduce((sum, w) => sum + Math.pow(w, 2), 0);
    
    return {
      top5Concentration: Math.round(top5Weight * 100) / 100,
      top10Concentration: Math.round(top10Weight * 100) / 100,
      maxPosition: Math.round(maxWeight * 100) / 100,
      herfindahlIndex: Math.round(hhi * 100) / 100,
      riskLevel: hhi > 2500 ? 'High' : hhi > 1500 ? 'Medium' : 'Low'
    };
  }

  /**
   * Get user's custom indices
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} - User's indices
   */
  async getUserIndices(userId) {
    try {
      const userIndices = await redisService.get(`user_indices:${userId}`) || [];
      const indices = [];

      for (const indexId of userIndices) {
        const index = await redisService.get(`custom_index:${indexId}`);
        if (index) {
          indices.push({
            id: index.id,
            name: index.name,
            description: index.description,
            holdings: index.holdings?.length || 0,
            createdAt: index.createdAt,
            lastReturn: index.metrics?.performance?.['1D'] || 0
          });
        }
      }

      return indices;

    } catch (error) {
      console.error('Get user indices error:', error);
      return [];
    }
  }

  /**
   * Add index to user's list
   * @param {string} userId - User identifier
   * @param {string} indexId - Index identifier
   */
  async addToUserIndices(userId, indexId) {
    const userIndices = await redisService.get(`user_indices:${userId}`) || [];
    userIndices.push(indexId);
    await redisService.set(`user_indices:${userId}`, userIndices);
  }

  /**
   * Helper methods for metrics calculation
   */
  getEmptyMetrics() {
    return {
      basic: { numberOfHoldings: 0, totalValue: 0 },
      advanced: {},
      performance: {},
      risk: {},
      allocation: { sector: [], marketCap: {} }
    };
  }

  getFallbackAdvancedMetrics(holdings) {
    const beta = holdings.reduce((sum, h) => sum + (h.beta * h.weight / 100), 0);
    return {
      sharpeRatio: 0.8, // Estimated
      volatility: Math.abs(beta - 1) * 0.15 + 0.15, // Estimated based on beta
      maxDrawdown: -0.15, // Conservative estimate
      expectedReturn: 0.08 + (beta - 1) * 0.04 // CAPM estimate
    };
  }

  calculateRiskGrade(beta, concentrationRisk) {
    let riskScore = 0;
    
    if (beta > 1.5) riskScore += 3;
    else if (beta > 1.2) riskScore += 2;
    else if (beta > 0.8) riskScore += 1;
    
    if (concentrationRisk.maxPosition > 25) riskScore += 2;
    else if (concentrationRisk.maxPosition > 15) riskScore += 1;
    
    if (riskScore >= 4) return 'High';
    if (riskScore >= 2) return 'Medium';
    return 'Low';
  }

  calculateTimeframePerformance(holdings, timeframe) {
    // Simplified calculation - in production would use historical data
    const avgChange = holdings.reduce((sum, h) => sum + (h.changePercent * h.weight / 100), 0);
    const multiplier = { '1D': 1, '1W': 5, '1M': 20, '3M': 60, '6M': 120, '1Y': 250 };
    return avgChange * (multiplier[timeframe] || 1);
  }

  calculateDiversificationScore(holdings) {
    const uniqueSectors = new Set(holdings.map(h => h.sector)).size;
    const numberOfHoldings = holdings.length;
    const concentrationRisk = this.calculateConcentrationRisk(holdings);
    
    let score = 0;
    score += Math.min(uniqueSectors * 10, 50); // Sector diversity
    score += Math.min(numberOfHoldings * 2, 30); // Number of holdings
    score += Math.max(0, 20 - concentrationRisk.maxPosition); // Concentration penalty
    
    return Math.min(100, score);
  }

  calculateLiquidityRisk(holdings) {
    // Simplified - would use actual volume data in production
    const avgVolume = holdings.reduce((sum, h) => sum + (h.volume || 0) * (h.weight / 100), 0);
    if (avgVolume > 1000000) return 'Low';
    if (avgVolume > 100000) return 'Medium';
    return 'High';
  }

  async calculateVaR(holdings) {
    // Simplified 95% VaR calculation
    const portfolioBeta = holdings.reduce((sum, h) => sum + (h.beta * h.weight / 100), 0);
    const marketVol = 0.16; // Assumed market volatility
    const portfolioVol = portfolioBeta * marketVol;
    return -1.65 * portfolioVol; // 95% confidence level
  }

  calculateSectorConcentration(holdings) {
    const sectorAllocation = this.calculateSectorAllocation(holdings);
    const maxSectorWeight = Math.max(...sectorAllocation.map(s => s.weight));
    
    if (maxSectorWeight > 50) return 'High';
    if (maxSectorWeight > 30) return 'Medium';
    return 'Low';
  }

  calculateRiskAdjustedReturn(holdings) {
    // Simplified calculation
    const avgReturn = holdings.reduce((sum, h) => sum + (h.changePercent * h.weight / 100), 0);
    const portfolioBeta = holdings.reduce((sum, h) => sum + (h.beta * h.weight / 100), 0);
    return avgReturn / Math.max(portfolioBeta, 0.5);
  }

  calculateConsistency(performance) {
    const returns = Object.values(performance);
    if (returns.length === 0) return 0;
    
    const avg = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
    
    return Math.max(0, 100 - Math.sqrt(variance) * 10);
  }
}

// Create singleton instance
const customIndexService = new CustomIndexService();

export default customIndexService;
export { CustomIndexService };
