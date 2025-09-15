/**
 * PROFESSIONAL WATCHLIST ROUTES
 * Bloomberg Terminal-quality watchlist with real-time metrics
 * Uses FMP Ultimate API for comprehensive data
 */

import express from 'express';
import fmpService from '../../services/fmpService.js';
import { redis } from '../../config/database.js';

const router = express.Router();

/**
 * GET /api/watchlist/batch-quotes
 * Get real-time quotes with comprehensive metrics for multiple symbols
 * Used by: Professional Watchlist component
 */
router.post('/batch-quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No symbols provided'
      });
    }
    
    console.log(`📊 [WATCHLIST] Fetching batch quotes for ${symbols.length} symbols`);
    
    // Get quotes, key metrics, and technical indicators in parallel
    const [quotes, keyMetrics, technicals] = await Promise.allSettled([
      fmpService.getQuoteBatch(symbols),
      Promise.all(symbols.map(s => fmpService.makeRequest(`/v3/key-metrics/${s}`, { limit: 1 }))),
      Promise.all(symbols.map(s => fmpService.makeRequest(`/v3/technical_indicator/daily/${s}`, { 
        type: 'rsi',
        period: 14
      })))
    ]);
    
    // Process quotes
    const quotesData = quotes.status === 'fulfilled' ? quotes.value : [];
    const metricsData = keyMetrics.status === 'fulfilled' ? keyMetrics.value : [];
    const technicalsData = technicals.status === 'fulfilled' ? technicals.value : [];
    
    // Combine all data
    const watchlistData = symbols.map((symbol, index) => {
      const quote = quotesData.find(q => q.symbol === symbol) || {};
      const metrics = metricsData[index]?.[0] || {};
      const rsi = technicalsData[index]?.[0]?.rsi || null;
      
      return {
        symbol: symbol,
        name: quote.name || symbol,
        price: quote.price || 0,
        change: quote.change || 0,
        changePercent: quote.changesPercentage || 0,
        volume: quote.volume || 0,
        avgVolume: quote.avgVolume || 0,
        marketCap: quote.marketCap || 0,
        dayHigh: quote.dayHigh || 0,
        dayLow: quote.dayLow || 0,
        yearHigh: quote.yearHigh || 0,
        yearLow: quote.yearLow || 0,
        
        // Key Metrics
        pe: quote.pe || metrics.peRatio || null,
        eps: quote.eps || null,
        beta: metrics.beta || null,
        dividendYield: metrics.dividendYield || 0,
        priceToBook: metrics.priceToBookRatio || null,
        priceToSales: metrics.priceToSalesRatio || null,
        evToEbitda: metrics.enterpriseValueOverEBITDA || null,
        pegRatio: metrics.pegRatio || null,
        
        // Technical Indicators
        rsi: rsi,
        fiftyDayMA: quote.priceAvg50 || null,
        twoHundredDayMA: quote.priceAvg200 || null,
        
        // Performance
        changePercent1M: metrics.changePercent1M || null,
        changePercent3M: metrics.changePercent3M || null,
        changePercent6M: metrics.changePercent6M || null,
        changePercent1Y: metrics.changePercent1Y || null,
        
        // Additional
        exchange: quote.exchange || 'NASDAQ',
        sector: metrics.sector || 'Unknown',
        industry: metrics.industry || 'Unknown',
        lastUpdated: new Date().toISOString()
      };
    });
    
    res.json({
      success: true,
      data: watchlistData,
      symbolCount: watchlistData.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WATCHLIST] Batch quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist data',
      message: error.message
    });
  }
});

/**
 * GET /api/watchlist/analyst-pulse
 * Get recent analyst rating changes for watchlist symbols
 */
router.post('/analyst-pulse', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbols array'
      });
    }
    
    console.log(`🎯 [WATCHLIST] Getting analyst pulse for ${symbols.length} symbols`);
    
    // Get analyst data for each symbol
    const analystPromises = symbols.map(async (symbol) => {
      try {
        const [ratings, priceTargets] = await Promise.all([
          fmpService.makeRequest(`/v3/grade/${symbol}`, { limit: 5 }),
          fmpService.makeRequest(`/v3/price-target-summary/${symbol}`)
        ]);
        
        return {
          symbol,
          recentRatingChanges: ratings?.slice(0, 3) || [],
          priceTarget: priceTargets?.[0] || null,
          hasActivity: ratings && ratings.length > 0
        };
      } catch (err) {
        console.warn(`Failed to get analyst data for ${symbol}:`, err.message);
        return {
          symbol,
          recentRatingChanges: [],
          priceTarget: null,
          hasActivity: false
        };
      }
    });
    
    const analystData = await Promise.all(analystPromises);
    
    // Filter for symbols with recent activity
    const activeSymbols = analystData.filter(d => d.hasActivity);
    
    res.json({
      success: true,
      data: analystData,
      activeSymbols: activeSymbols.map(d => d.symbol),
      totalActivity: activeSymbols.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WATCHLIST] Analyst pulse error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analyst pulse',
      message: error.message
    });
  }
});

/**
 * GET /api/watchlist/insider-activity
 * Get insider trading activity for watchlist symbols
 */
router.post('/insider-activity', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbols array'
      });
    }
    
    console.log(`👥 [WATCHLIST] Getting insider activity for ${symbols.length} symbols`);
    
    const insiderPromises = symbols.map(async (symbol) => {
      try {
        const trades = await fmpService.makeRequest(`/v4/insider-trading`, { 
          symbol,
          limit: 10 
        });
        
        if (!trades || trades.length === 0) {
          return {
            symbol,
            recentTrades: [],
            netBuySell: 'neutral',
            totalVolume: 0
          };
        }
        
        // Calculate net buy/sell sentiment
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentTrades = trades.filter(t => new Date(t.filingDate) >= thirtyDaysAgo);
        const buys = recentTrades.filter(t => t.transactionType?.includes('Purchase'));
        const sells = recentTrades.filter(t => t.transactionType?.includes('Sale'));
        
        const buyVolume = buys.reduce((sum, t) => sum + (t.securitiesTransacted || 0), 0);
        const sellVolume = sells.reduce((sum, t) => sum + (t.securitiesTransacted || 0), 0);
        
        let sentiment = 'neutral';
        if (buyVolume > sellVolume * 1.5) sentiment = 'buying';
        else if (sellVolume > buyVolume * 1.5) sentiment = 'selling';
        
        return {
          symbol,
          recentTrades: recentTrades.slice(0, 3).map(t => ({
            date: t.filingDate,
            insider: t.reportingName,
            type: t.transactionType,
            shares: t.securitiesTransacted,
            value: t.securitiesTransacted * (t.price || 0)
          })),
          netBuySell: sentiment,
          totalVolume: buyVolume + sellVolume,
          buyCount: buys.length,
          sellCount: sells.length
        };
      } catch (err) {
        console.warn(`Failed to get insider data for ${symbol}:`, err.message);
        return {
          symbol,
          recentTrades: [],
          netBuySell: 'neutral',
          totalVolume: 0
        };
      }
    });
    
    const insiderData = await Promise.all(insiderPromises);
    
    // Find symbols with significant activity
    const activeInsiders = insiderData.filter(d => d.totalVolume > 0);
    
    res.json({
      success: true,
      data: insiderData,
      activeSymbols: activeInsiders.map(d => ({
        symbol: d.symbol,
        sentiment: d.netBuySell,
        volume: d.totalVolume
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WATCHLIST] Insider activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insider activity',
      message: error.message
    });
  }
});

/**
 * GET /api/watchlist/earnings-calendar
 * Get upcoming earnings for watchlist symbols
 */
router.post('/earnings-calendar', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbols array'
      });
    }
    
    console.log(`📅 [WATCHLIST] Getting earnings calendar for ${symbols.length} symbols`);
    
    // Get earnings calendar for next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const earnings = await fmpService.getEarningsCalendar(
      today.toISOString().split('T')[0],
      thirtyDaysLater.toISOString().split('T')[0]
    );
    
    // Filter for watchlist symbols
    const watchlistEarnings = earnings.filter(e => 
      symbols.includes(e.symbol)
    ).map(e => ({
      symbol: e.symbol,
      date: e.date,
      time: e.time || 'Unknown',
      epsEstimate: e.epsEstimated || null,
      revenueEstimate: e.revenueEstimated || null,
      fiscalQuarter: e.fiscalDateEnding || null
    }));
    
    res.json({
      success: true,
      data: watchlistEarnings,
      upcomingCount: watchlistEarnings.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WATCHLIST] Earnings calendar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings calendar',
      message: error.message
    });
  }
});

/**
 * GET /api/watchlist/sector-performance
 * Get sector performance for context
 */
router.get('/sector-performance', async (req, res) => {
  try {
    console.log('📊 [WATCHLIST] Getting sector performance');
    
    // Get sector performance
    const sectorPerf = await fmpService.makeRequest('/v3/sectors-performance');
    
    if (!sectorPerf) {
      return res.json({
        success: true,
        data: [],
        message: 'No sector performance data available'
      });
    }
    
    // Format sector data
    const formattedSectors = Object.entries(sectorPerf).map(([sector, change]) => ({
      sector: sector.replace('ChangesPercentage', ''),
      changePercent: parseFloat(change) || 0,
      isPositive: parseFloat(change) > 0
    })).sort((a, b) => b.changePercent - a.changePercent);
    
    res.json({
      success: true,
      data: formattedSectors,
      bestSector: formattedSectors[0],
      worstSector: formattedSectors[formattedSectors.length - 1],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WATCHLIST] Sector performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sector performance',
      message: error.message
    });
  }
});

/**
 * POST /api/watchlist/save
 * Save user's watchlist to localStorage/database
 */
router.post('/save', async (req, res) => {
  try {
    const { userId, watchlist } = req.body;
    
    if (!watchlist || !Array.isArray(watchlist)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid watchlist data'
      });
    }
    
    // For now, we'll use Redis to cache watchlists
    // In production, this would save to a database
    const key = `watchlist:${userId || 'default'}`;
    await redis.setex(key, 86400 * 30, JSON.stringify(watchlist)); // 30 days cache
    
    console.log(`✅ [WATCHLIST] Saved watchlist with ${watchlist.length} symbols`);
    
    res.json({
      success: true,
      message: 'Watchlist saved successfully',
      symbolCount: watchlist.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WATCHLIST] Save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save watchlist',
      message: error.message
    });
  }
});

/**
 * GET /api/watchlist/load/:userId
 * Load user's saved watchlist
 */
router.get('/load/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const key = `watchlist:${userId || 'default'}`;
    
    const cached = await redis.get(key);
    
    if (!cached) {
      return res.json({
        success: true,
        watchlist: [],
        message: 'No saved watchlist found'
      });
    }
    
    const watchlist = JSON.parse(cached);
    
    console.log(`✅ [WATCHLIST] Loaded watchlist with ${watchlist.length} symbols`);
    
    res.json({
      success: true,
      watchlist: watchlist,
      symbolCount: watchlist.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [WATCHLIST] Load error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load watchlist',
      message: error.message
    });
  }
});

export default router;
