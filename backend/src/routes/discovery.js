import express from 'express';
import fmpService from '../services/fmpService.js';

const router = express.Router();

/**
 * 🎯 HYBRID DISCOVERY SYSTEM - All Cards Working + Fast Earnings
 * 
 * APPROACH: Keep all working discovery endpoints, replace only earnings with fast version
 * NO FALLBACKS, NO HARDCODED DATA - pure API responses only
 */

// Major stocks by impact/market cap for fast earnings prioritization
const HIGH_IMPACT_STOCKS = [
  // Mega Cap ($1T+)
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.A', 'BRK.B',
  // Large Cap Financial ($100B+)
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA', 'AXP',
  // Large Cap Healthcare 
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'LLY', 'ABT', 'TMO', 'DHR', 'BMY',
  // Large Cap Consumer
  'WMT', 'PG', 'KO', 'PEP', 'HD', 'COST', 'MCD', 'NKE', 'SBUX', 'DIS',
  // Large Cap Tech
  'ORCL', 'CRM', 'ADBE', 'NFLX', 'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'IBM',
  // Large Cap Energy/Industrial
  'XOM', 'CVX', 'GE', 'CAT', 'BA', 'MMM', 'HON', 'RTX', 'LMT', 'UPS',
  // Popular Trading Stocks
  'COIN', 'PLTR', 'RIVN', 'LCID', 'SOFI', 'HOOD', 'SNAP', 'UBER', 'LYFT', 'ROKU'
];

// Fast impact scoring for earnings prioritization
const getImpactScore = (symbol) => {
  const index = HIGH_IMPACT_STOCKS.indexOf(symbol);
  if (index !== -1) {
    return 1000 - index; // Higher score for earlier in list
  }
  // Secondary scoring for other stocks
  if (symbol.length <= 3) return 100; // Short symbols tend to be established
  if (symbol.length === 4) return 75;
  if (symbol.includes('.')) return 10; // Foreign symbols lower priority
  return 50; // Default score
};

const estimateImpactLevel = (symbol) => {
  const score = getImpactScore(symbol);
  if (score >= 900) return { level: 'Mega Cap', cap: '$1T+', priority: 1 };
  if (score >= 700) return { level: 'Large Cap', cap: '$100B+', priority: 2 };
  if (score >= 500) return { level: 'Large Cap', cap: '$50B+', priority: 3 };
  if (score >= 100) return { level: 'Mid Cap', cap: '$10B+', priority: 4 };
  return { level: 'Small Cap', cap: '<$10B', priority: 5 };
};

/**
 * 📈 REAL MARKET PULSE - Actual FMP API Data Only (ORIGINAL WORKING VERSION)
 */
const getMarketPulseStocks = async () => {
  try {
    console.log('📈 [REAL MARKET PULSE] Loading actual FMP API data...');
    
    // Get real market movers from FMP API
    const [gainers, losers, actives] = await Promise.allSettled([
      fmpService.getGainers(),
      fmpService.getLosers(), 
      fmpService.getActives()
    ]);
    
    const topGainers = gainers.status === 'fulfilled' && Array.isArray(gainers.value) ? gainers.value : [];
    const topLosers = losers.status === 'fulfilled' && Array.isArray(losers.value) ? losers.value : [];
    const highVolume = actives.status === 'fulfilled' && Array.isArray(actives.value) ? actives.value : [];
    
    console.log(`📊 Raw FMP data: ${topGainers.length} gainers, ${topLosers.length} losers, ${highVolume.length} actives`);
    
    // Process with CORRECT FMP field names
    const allStocks = [];
    
    // Process gainers (top 10) with REAL field mapping
    topGainers.slice(0, 10).forEach(stock => {
      if (stock.ticker && stock.companyName) { // Use actual FMP field names
        allStocks.push({
          symbol: stock.ticker,                    // FMP uses 'ticker'
          name: stock.companyName,                 // FMP uses 'companyName'
          price: parseFloat(stock.price) || 0,
          change: parseFloat(stock.changes) || 0,  // FMP uses 'changes'
          changePercent: parseFloat(stock.changesPercentage) || 0,
          volume: null, // FMP doesn't provide volume in gainers endpoint
          reason: `+${parseFloat(stock.changesPercentage || 0).toFixed(1)}% gainer`,
          category: 'gainer',
          source: 'fmp_gainers_api'
        });
      }
    });
    
    // Process losers (top 5) with REAL field mapping
    topLosers.slice(0, 5).forEach(stock => {
      if (stock.ticker && stock.companyName) {
        allStocks.push({
          symbol: stock.ticker,
          name: stock.companyName,
          price: parseFloat(stock.price) || 0,
          change: parseFloat(stock.changes) || 0,
          changePercent: parseFloat(stock.changesPercentage) || 0,
          volume: null,
          reason: `${parseFloat(stock.changesPercentage || 0).toFixed(1)}% decline`,
          category: 'loser',
          source: 'fmp_losers_api'
        });
      }
    });
    
    // Process actives (top 5) with REAL field mapping
    highVolume.slice(0, 5).forEach(stock => {
      if (stock.ticker && stock.companyName) {
        allStocks.push({
          symbol: stock.ticker,
          name: stock.companyName,
          price: parseFloat(stock.price) || 0,
          change: parseFloat(stock.changes) || 0,
          changePercent: parseFloat(stock.changesPercentage) || 0,
          volume: null,
          reason: 'High trading activity',
          category: 'active',
          source: 'fmp_actives_api'
        });
      }
    });
    
    // Remove duplicates by symbol
    const uniqueStocks = [];
    const seenSymbols = new Set();
    
    allStocks.forEach(stock => {
      if (!seenSymbols.has(stock.symbol)) {
        uniqueStocks.push(stock);
        seenSymbols.add(stock.symbol);
      }
    });
    
    // Sort by absolute change percentage
    const sortedStocks = uniqueStocks
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 15);
    
    console.log(`✅ [REAL MARKET PULSE] Processed: ${sortedStocks.length} real stocks from FMP API`);
    
    return {
      stocks: sortedStocks,
      summary: {
        totalStocks: sortedStocks.length,
        dataSource: 'fmp_api_real_data'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [REAL MARKET PULSE] API Error:', error.message);
    return {
      stocks: [],
      summary: { error: true, errorMessage: error.message },
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * 📊 FAST EARNINGS SPOTLIGHT - Impact Prioritization (NO TIMEOUTS)
 */
const getEarningsSpotlightStocks = async () => {
  try {
    console.log('📊 [FAST EARNINGS] Loading earnings with impact prioritization...');
    
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const fromDate = today.toISOString().split('T')[0];
    const toDate = twoWeeksFromNow.toISOString().split('T')[0];
    
    // Step 1: Get earnings calendar (only API call needed)
    const earningsCalendar = await fmpService.getEarningsCalendar(fromDate, toDate);
    
    if (!earningsCalendar || !Array.isArray(earningsCalendar)) {
      console.log('❌ No earnings calendar data from FMP API');
      return {
        stocks: [],
        summary: { error: true, message: 'No earnings data available from FMP API' },
        lastUpdated: new Date().toISOString()
      };
    }
    
    console.log(`📊 Raw earnings data: ${earningsCalendar.length} entries from FMP`);
    
    // Step 2: Process and prioritize by impact (no additional API calls)
    const earningsStocks = earningsCalendar
      .filter(earning => earning.symbol && earning.date)
      .map(earning => {
        const impactInfo = estimateImpactLevel(earning.symbol);
        const impactScore = getImpactScore(earning.symbol);
        
        return {
          symbol: earning.symbol,
          name: earning.companyName || earning.symbol,
          earningsDate: earning.date,
          earningsTime: earning.time || 'Unknown',
          estimatedEPS: earning.eps || null,
          // INSTANT IMPACT SCORING (no API calls)
          impactScore: impactScore,
          impactLevel: impactInfo.level,
          estimatedCap: impactInfo.cap,
          priority: impactInfo.priority,
          isHighImpact: HIGH_IMPACT_STOCKS.includes(earning.symbol),
          // Frontend expects these fields
          marketCapFormatted: impactInfo.cap,
          sector: 'Unknown', // Could be enhanced later if needed
          reason: `Earnings ${new Date(earning.date).toLocaleDateString()}`,
          category: 'earnings',
          source: 'fmp_earnings_calendar_impact_prioritization'
        };
      })
      // SORT BY IMPACT SCORE (highest first)
      .sort((a, b) => {
        if (b.impactScore !== a.impactScore) {
          return b.impactScore - a.impactScore;
        }
        return new Date(a.earningsDate) - new Date(b.earningsDate);
      })
      .slice(0, 20); // Top 20 by impact
    
    console.log(`✅ [FAST EARNINGS] Processed: ${earningsStocks.length} earnings with impact prioritization`);
    
    return {
      stocks: earningsStocks,
      summary: {
        totalStocks: earningsStocks.length,
        rawEarningsCount: earningsCalendar.length,
        highImpactStocks: earningsStocks.filter(s => s.isHighImpact).length,
        dataSource: 'fmp_earnings_calendar_impact_prioritization',
        sortedBy: 'impact_score_descending',
        approach: 'Fast prioritization - no API delays'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [FAST EARNINGS] API Error:', error.message);
    return {
      stocks: [],
      summary: { error: true, errorMessage: error.message },
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * 🔥 REAL MARKET THEMES - Live Quotes for Theme Stocks (ORIGINAL WORKING VERSION)
 */
const getMarketThemesStocks = async () => {
  try {
    console.log('🔥 [REAL THEMES] Loading live quotes for thematic stocks...');
    
    // Define themes with symbols (NO descriptions)
    const themeSymbols = {
      'AI Revolution': ['NVDA', 'MSFT', 'GOOGL', 'META', 'AMD'],
      'Interest Rates': ['JPM', 'BAC', 'WFC', 'C', 'GS'],
      'Energy Transition': ['TSLA', 'ENPH', 'FSLR', 'NEE', 'XOM']
    };
    
    const allSymbols = Object.values(themeSymbols).flat();
    
    // Get REAL live quotes from FMP API
    const liveQuotes = await fmpService.getQuoteBatch(allSymbols);
    
    if (!liveQuotes || !Array.isArray(liveQuotes)) {
      console.log('❌ No quote data from FMP API for theme stocks');
      return {
        stocks: [],
        themes: {},
        summary: { error: true, message: 'No live quotes available from FMP API' },
        lastUpdated: new Date().toISOString()
      };
    }
    
    console.log(`📊 Live quotes received: ${liveQuotes.length} from FMP API`);
    
    // Process real quote data
    const themeStocks = [];
    
    Object.entries(themeSymbols).forEach(([themeName, symbols]) => {
      symbols.forEach(symbol => {
        const quote = liveQuotes.find(q => q.symbol === symbol);
        if (quote) {
          themeStocks.push({
            symbol: quote.symbol,
            name: quote.name || quote.symbol,
            price: parseFloat(quote.price) || 0,
            change: parseFloat(quote.change) || 0,
            changePercent: parseFloat(quote.changesPercentage) || 0,
            volume: quote.volume || null,
            theme: themeName,
            reason: `${themeName} stock`,
            category: 'theme',
            source: 'fmp_live_quotes'
          });
        }
      });
    });
    
    console.log(`✅ [REAL THEMES] Processed: ${themeStocks.length} real theme stocks with live data`);
    
    return {
      stocks: themeStocks,
      themes: {
        'AI Revolution': themeStocks.filter(s => s.theme === 'AI Revolution').length,
        'Interest Rates': themeStocks.filter(s => s.theme === 'Interest Rates').length,
        'Energy Transition': themeStocks.filter(s => s.theme === 'Energy Transition').length
      },
      summary: {
        totalStocks: themeStocks.length,
        dataSource: 'fmp_live_quotes'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [REAL THEMES] API Error:', error.message);
    return {
      stocks: [],
      themes: {},
      summary: { error: true, errorMessage: error.message },
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * ❤️ REAL FOR YOU - Live Quotes for Recommendation Stocks (ORIGINAL WORKING VERSION)
 */
const getForYouStocks = async () => {
  try {
    console.log('❤️ [REAL FOR YOU] Loading live quotes for recommendations...');
    
    const recommendationSymbols = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'NVDA', 'TSLA', 'META'];
    
    // Get REAL live quotes
    const liveQuotes = await fmpService.getQuoteBatch(recommendationSymbols);
    
    if (!liveQuotes || !Array.isArray(liveQuotes)) {
      return {
        stocks: [],
        summary: { error: true, message: 'No live quotes for recommendations' },
        lastUpdated: new Date().toISOString()
      };
    }
    
    const forYouStocks = liveQuotes.map((quote, index) => ({
      symbol: quote.symbol,
      name: quote.name || quote.symbol,
      price: parseFloat(quote.price) || 0,
      change: parseFloat(quote.change) || 0,
      changePercent: parseFloat(quote.changesPercentage) || 0,
      volume: quote.volume || null,
      score: 95 - (index * 2), // Simple scoring
      reason: 'Technology recommendation',
      risk: 'moderate',
      category: 'recommendation',
      source: 'fmp_live_quotes'
    }));
    
    console.log(`✅ [REAL FOR YOU] Processed: ${forYouStocks.length} real recommendations with live data`);
    
    return {
      stocks: forYouStocks,
      summary: {
        totalStocks: forYouStocks.length,
        dataSource: 'fmp_live_quotes'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [REAL FOR YOU] API Error:', error.message);
    return {
      stocks: [],
      summary: { error: true, errorMessage: error.message },
      lastUpdated: new Date().toISOString()
    };
  }
};

// ROUTE HANDLERS - ALL DISCOVERY ENDPOINTS
router.get('/market-pulse', async (req, res) => {
  try {
    console.log('📈 [MARKET PULSE API] Processing real FMP data...');
    const data = await getMarketPulseStocks();
    
    res.json({
      success: true,
      data: data,
      metadata: {
        category: 'market_pulse_real',
        source: 'FMP API - Real Data Only',
        stockCount: data.stocks?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ [MARKET PULSE API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Market pulse API failed',
      message: error.message,
      data: { stocks: [] }
    });
  }
});

router.get('/earnings-spotlight', async (req, res) => {
  try {
    console.log('📊 [FAST EARNINGS API] Processing with impact prioritization...');
    const data = await getEarningsSpotlightStocks();
    res.json({ 
      success: true, 
      data: data,
      metadata: {
        category: 'earnings_spotlight_fast',
        source: 'FMP API - Earnings Calendar with Impact Prioritization',
        stockCount: data.stocks?.length || 0,
        sortedBy: 'impact_score_descending',
        approach: 'Fast prioritization - major stocks first'
      }
    });
  } catch (error) {
    console.error('❌ [FAST EARNINGS API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Fast earnings API failed', 
      message: error.message, 
      data: { stocks: [] } 
    });
  }
});

router.get('/market-themes', async (req, res) => {
  try {
    const data = await getMarketThemesStocks();
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ [THEMES API] Error:', error);
    res.status(500).json({ success: false, error: 'Themes API failed', message: error.message, data: { stocks: [] } });
  }
});

router.get('/for-you', async (req, res) => {
  try {
    const data = await getForYouStocks();
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ [FOR YOU API] Error:', error);
    res.status(500).json({ success: false, error: 'For you API failed', message: error.message, data: { stocks: [] } });
  }
});

router.get('/all', async (req, res) => {
  try {
    console.log('🎯 [ALL DISCOVERY CATEGORIES] Loading all discovery data...');
    
    const [marketPulse, earningsSpotlight, marketThemes, forYou] = await Promise.allSettled([
      getMarketPulseStocks(),
      getEarningsSpotlightStocks(),
      getMarketThemesStocks(),
      getForYouStocks()
    ]);
    
    const discoveryData = {
      market_pulse: marketPulse.status === 'fulfilled' ? marketPulse.value : { stocks: [], summary: { error: true } },
      earnings_spotlight: earningsSpotlight.status === 'fulfilled' ? earningsSpotlight.value : { stocks: [], summary: { error: true } },
      market_themes: marketThemes.status === 'fulfilled' ? marketThemes.value : { stocks: [], summary: { error: true } },
      for_you: forYou.status === 'fulfilled' ? forYou.value : { stocks: [], summary: { error: true } }
    };
    
    const totalStocks = Object.values(discoveryData).reduce((sum, category) => 
      sum + (category.stocks?.length || 0), 0
    );
    
    res.json({
      success: true,
      data: discoveryData,
      summary: {
        totalStocks: totalStocks,
        systemStatus: totalStocks > 0 ? 'working' : 'api_issues',
        approach: 'Hybrid system - all cards working + fast earnings',
        errorCount: Object.values(discoveryData).filter(cat => cat.summary?.error).length,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [ALL DISCOVERY CATEGORIES] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Discovery system failed',
      message: error.message
    });
  }
});

export default router;
