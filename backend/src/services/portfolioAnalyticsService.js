import fmpService from './fmpService.js';
import redisService from './redisService.js';

class PortfolioAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
  }

  // Get real fundamental data for all portfolio holdings using FMP API
  async getPortfolioFundamentals(holdings) {
    const symbols = Object.keys(holdings);
    const fundamentalData = {};
    
    console.log(`🔍 Fetching real FMP fundamentals for ${symbols.length} holdings...`);
    
    // Fetch fundamentals for all holdings in parallel (respecting rate limits)
    const batchSize = 5; // Process 5 at a time to respect rate limits
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const cacheKey = `fundamentals_${symbol}`;
          
          // Check Redis cache first
          const cached = await redisService.get(cacheKey);
          if (cached) {
            console.log(`📚 Cache hit for ${symbol} fundamentals`);
            return [symbol, cached];
          }
          
          // Use real FMP API for fundamentals
          console.log(`📊 Fetching real FMP fundamentals for ${symbol}...`);
          
          // Get comprehensive fundamental data from FMP API
          const [keyMetrics, ratios, growth, profile] = await Promise.all([
            fmpService.getKeyMetrics(symbol).catch(() => null),
            fmpService.getFinancialRatios(symbol).catch(() => null),
            fmpService.getFinancialGrowth(symbol).catch(() => null),
            fmpService.getCompanyProfile(symbol).catch(() => null)
          ]);
          
          if (!keyMetrics && !ratios && !growth) {
            console.warn(`⚠️ No fundamental data available for ${symbol}`);
            return [symbol, null];
          }
          
          // Extract real metrics from FMP API response
          const latestKeyMetrics = keyMetrics?.[0] || {};
          const latestRatios = ratios?.[0] || {};
          const latestGrowth = growth?.[0] || {};
          const companyInfo = profile?.[0] || {};
          
          const metrics = {
            // Valuation metrics
            pe: latestKeyMetrics.peRatio || latestRatios.priceEarningsRatio || null,
            pb: latestKeyMetrics.pbRatio || latestRatios.priceToBookRatio || null,
            peg: latestKeyMetrics.pegRatio || null,
            priceToSales: latestKeyMetrics.priceToSalesRatio || null,
            
            // Profitability metrics  
            roe: latestKeyMetrics.roe || latestRatios.returnOnEquity || null,
            roa: latestKeyMetrics.roa || latestRatios.returnOnAssets || null,
            profitMargin: latestKeyMetrics.netProfitMargin || latestRatios.netProfitMargin || null,
            operatingMargin: latestKeyMetrics.operatingMargin || latestRatios.operatingProfitMargin || null,
            grossMargin: latestRatios.grossProfitMargin || null,
            
            // Growth metrics
            revenueGrowth: latestGrowth.revenueGrowth || null,
            netIncomeGrowth: latestGrowth.netIncomeGrowth || null,
            epsGrowth: latestGrowth.epsgrowth || null,
            
            // Financial health metrics
            debtToEquity: latestKeyMetrics.debtToEquity || latestRatios.debtEquityRatio || null,
            currentRatio: latestRatios.currentRatio || null,
            quickRatio: latestRatios.quickRatio || null,
            interestCoverage: latestRatios.interestCoverage || null,
            
            // Dividend metrics
            dividendYield: latestKeyMetrics.dividendYield || null,
            payoutRatio: latestRatios.payoutRatio || null,
            
            // Book value and EPS
            bookValuePerShare: latestKeyMetrics.bookValuePerShare || null,
            eps: latestKeyMetrics.earningsPerShare || null,
            
            // Company info
            sector: companyInfo.sector || null,
            industry: companyInfo.industry || null,
            marketCap: latestKeyMetrics.marketCap || companyInfo.mktCap || null,
            
            lastUpdated: new Date().toISOString(),
            source: 'FMP_API'
          };
          
          // Cache the real result in Redis
          await redisService.set(cacheKey, metrics, 3600); // 1 hour cache
          
          console.log(`✅ ${symbol}: Real FMP data - P/E=${metrics.pe?.toFixed(2) || 'N/A'}, ROE=${metrics.roe?.toFixed(1) || 'N/A'}%`);
          
          return [symbol, metrics];
          
        } catch (error) {
          console.error(`❌ Error fetching real fundamentals for ${symbol}:`, error.message);
          return [symbol, null];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(([symbol, data]) => {
        if (data) {
          fundamentalData[symbol] = data;
        }
      });
      
      // Small delay between batches to be respectful to FMP API
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Retrieved real fundamental data for ${Object.keys(fundamentalData).length}/${symbols.length} holdings`);
    return fundamentalData;
  }

  // Calculate portfolio-wide fundamental metrics using real data
  calculatePortfolioMetrics(holdings, fundamentalData) {
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
        withFundamentals: Object.keys(fundamentalData).length,
        avgMarketCap: 0,
        totalMarketCap: 0
      }
    };

    let totalValue = 0;
    let validPECount = 0, validPBCount = 0, validROECount = 0;
    let validGrowthCount = 0, validIncomeGrowthCount = 0;
    let totalMarketCap = 0, marketCapCount = 0;
    
    // Calculate weighted averages using real data
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      const marketValue = holding.currentValue || (holding.quantity * holding.currentPrice);
      totalValue += marketValue;
      const weight = marketValue;
      
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
    });
    
    // Finalize calculations
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
    
    // Summary stats
    portfolioMetrics.summary.avgMarketCap = marketCapCount > 0 ? totalMarketCap / marketCapCount : 0;
    portfolioMetrics.summary.totalMarketCap = totalMarketCap;
    
    // Calculate composite scores using real data
    portfolioMetrics.qualityScore = this.calculateQualityScore(fundamentalData, holdings);
    portfolioMetrics.valueScore = this.calculateValueScore(fundamentalData, holdings);
    portfolioMetrics.growthScore = this.calculateGrowthScore(fundamentalData, holdings);
    portfolioMetrics.financialHealthScore = this.calculateFinancialHealthScore(fundamentalData, holdings);
    
    console.log(`📊 Portfolio Metrics: P/E=${portfolioMetrics.weightedPE?.toFixed(1) || 'N/A'}, ROE=${portfolioMetrics.weightedROE?.toFixed(1) || 'N/A'}%, Quality=${portfolioMetrics.qualityScore?.toFixed(0) || 'N/A'}`);
    
    return portfolioMetrics;
  }
  
  // Calculate quality score based on real ROE, profit margins, debt levels
  calculateQualityScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      let score = 50; // Start at neutral
      
      // ROE scoring (using real data)
      if (fundamentals.roe > 20) score += 25;
      else if (fundamentals.roe > 15) score += 15;
      else if (fundamentals.roe > 10) score += 5;
      else if (fundamentals.roe < 5) score -= 15;
      
      // Profit margin scoring (using real data)
      if (fundamentals.profitMargin > 25) score += 20;
      else if (fundamentals.profitMargin > 15) score += 12;
      else if (fundamentals.profitMargin > 8) score += 5;
      else if (fundamentals.profitMargin < 3) score -= 12;
      
      // Debt to equity scoring (using real data)
      if (fundamentals.debtToEquity < 0.2) score += 15;
      else if (fundamentals.debtToEquity < 0.5) score += 8;
      else if (fundamentals.debtToEquity < 1.0) score += 2;
      else if (fundamentals.debtToEquity > 2.0) score -= 20;
      
      // Interest coverage (if available)
      if (fundamentals.interestCoverage > 10) score += 10;
      else if (fundamentals.interestCoverage > 5) score += 5;
      else if (fundamentals.interestCoverage < 2) score -= 15;
      
      totalScore += Math.max(0, Math.min(100, score));
      validCount++;
    });
    
    return validCount > 0 ? totalScore / validCount : 50;
  }
  
  // Calculate value score based on real P/E, P/B ratios
  calculateValueScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      let score = 50; // Start at neutral
      
      // P/E scoring (lower is better for value)
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
  }
  
  // Calculate growth score based on real revenue and earnings growth
  calculateGrowthScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      let score = 50; // Start at neutral
      
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
  }
  
  // Calculate financial health score using real metrics
  calculateFinancialHealthScore(fundamentalData, holdings) {
    let totalScore = 0;
    let validCount = 0;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      let score = 50; // Start at neutral
      
      // Debt to equity (lower is better)
      if (fundamentals.debtToEquity !== null && fundamentals.debtToEquity !== undefined) {
        if (fundamentals.debtToEquity < 0.1) score += 25;
        else if (fundamentals.debtToEquity < 0.3) score += 18;
        else if (fundamentals.debtToEquity < 0.6) score += 10;
        else if (fundamentals.debtToEquity < 1.0) score += 2;
        else if (fundamentals.debtToEquity > 3.0) score -= 30;
      }
      
      // Current ratio (liquidity)
      if (fundamentals.currentRatio > 2.0) score += 15;
      else if (fundamentals.currentRatio > 1.5) score += 10;
      else if (fundamentals.currentRatio > 1.0) score += 5;
      else if (fundamentals.currentRatio < 0.8) score -= 20;
      
      // ROE (profitability)
      if (fundamentals.roe > 25) score += 20;
      else if (fundamentals.roe > 15) score += 12;
      else if (fundamentals.roe > 8) score += 5;
      else if (fundamentals.roe < 3) score -= 15;
      
      // Interest coverage (ability to service debt)
      if (fundamentals.interestCoverage > 15) score += 15;
      else if (fundamentals.interestCoverage > 8) score += 10;
      else if (fundamentals.interestCoverage > 3) score += 5;
      else if (fundamentals.interestCoverage < 1.5) score -= 25;
      
      totalScore += Math.max(0, Math.min(100, score));
      validCount++;
    });
    
    return validCount > 0 ? totalScore / validCount : 50;
  }

  // Get fundamental alerts and recommendations using real data
  async getPortfolioInsights(holdings, fundamentalData, portfolioMetrics) {
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
    
    // Analyze individual holdings with real data
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const fundamentals = fundamentalData[symbol];
      if (!fundamentals) return;
      
      // High P/E alert (using real data)
      if (fundamentals.pe && fundamentals.pe > 50) {
        insights.alerts.push({
          type: 'warning',
          symbol,
          message: `${symbol} has very high P/E ratio (${fundamentals.pe.toFixed(1)}) - potential overvaluation risk`,
          severity: 'high'
        });
      }
      
      // High debt alert (using real data)
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
      
      // Strong fundamentals (using real data)
      if (fundamentals.roe > 20 && fundamentals.profitMargin > 15 && 
          fundamentals.debtToEquity && fundamentals.debtToEquity < 0.5) {
        insights.strengths.push({
          symbol,
          message: `${symbol} shows excellent fundamentals: ROE ${fundamentals.roe.toFixed(1)}%, Profit Margin ${fundamentals.profitMargin.toFixed(1)}%, Low Debt`,
          type: 'excellence'
        });
      }
      
      // Value opportunities (using real data)
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
    });
    
    // Portfolio-level insights using real metrics
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
    
    console.log(`🎯 Portfolio Insights: ${insights.alerts.length} alerts, ${insights.recommendations.length} recommendations, ${insights.strengths.length} strengths`);
    
    return insights;
  }
}

export default new PortfolioAnalyticsService();
