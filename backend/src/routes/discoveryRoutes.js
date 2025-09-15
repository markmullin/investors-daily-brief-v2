/**
 * DISCOVERY ROUTES - AI-POWERED STOCK DISCOVERY
 * Provides data for the discovery cards in the Research Hub
 */

import express from 'express';
import fmpService from '../services/fmpService.js';

const router = express.Router();

/**
 * GET /api/discovery/all
 * Fetch all discovery data for the cards
 */
router.get('/all', async (req, res) => {
  try {
    console.log('🎯 [DISCOVERY] Fetching all discovery data...');
    
    // Fetch market movers (gainers and losers)
    const [gainers, losers, actives] = await Promise.allSettled([
      fmpService.makeRequest('/v3/stock_market/gainers'),
      fmpService.makeRequest('/v3/stock_market/losers'),
      fmpService.makeRequest('/v3/stock_market/actives')
    ]);
    
    // Get upcoming earnings
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7); // Next 7 days
    
    const earnings = await fmpService.getEarningsCalendar(
    today.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
    );
    
    // Process market pulse data
    const marketPulseStocks = [];
    
    if (gainers.status === 'fulfilled' && gainers.value) {
      gainers.value.slice(0, 5).forEach(stock => {
        marketPulseStocks.push({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changesPercentage,
          volume: stock.volume,
          category: 'gainer'
        });
      });
    }
    
    if (losers.status === 'fulfilled' && losers.value) {
      losers.value.slice(0, 5).forEach(stock => {
        marketPulseStocks.push({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changesPercentage,
          volume: stock.volume,
          category: 'loser'
        });
      });
    }
    
    if (actives.status === 'fulfilled' && actives.value) {
      actives.value.slice(0, 5).forEach(stock => {
        marketPulseStocks.push({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changesPercentage,
          volume: stock.volume,
          category: 'active'
        });
      });
    }
    
    // Process earnings data
    const earningsStocks = [];
    if (earnings && Array.isArray(earnings)) {
      earnings.slice(0, 10).forEach(earning => {
        if (earning.symbol && earning.date) {
          earningsStocks.push({
            symbol: earning.symbol,
            name: earning.title || earning.symbol,
            date: earning.date,
            time: earning.time || 'TBD',
            eps: earning.eps,
            epsEstimated: earning.epsEstimated,
            revenue: earning.revenue,
            revenueEstimated: earning.revenueEstimated
          });
        }
      });
    }
    
    // Get sector performance for themes - using a simple request for now
    const sectors = [];
    // TODO: Add sectors-performance method to FMP service
    
    // Process themes data (sector-based themes)
    const themesStocks = [];
    if (sectors && Array.isArray(sectors)) {
      // For now, just use some sample theme stocks
      // TODO: Implement proper sector-based themes when sector methods are available
      const sampleThemeStocks = [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', theme: 'AI Revolution' },
        { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', theme: 'AI Revolution' },
        { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', theme: 'Energy Transition' },
        { symbol: 'CVX', name: 'Chevron', sector: 'Energy', theme: 'Energy Transition' },
        { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', theme: 'GLP-1 Drugs' }
      ];
      
      // Get quotes for theme stocks
      const themeSymbols = sampleThemeStocks.map(s => s.symbol);
      const themeQuotes = await fmpService.getQuoteBatch(themeSymbols);
      
      if (themeQuotes && Array.isArray(themeQuotes)) {
        themeQuotes.forEach((quote, index) => {
          const themeStock = sampleThemeStocks[index];
          if (quote && themeStock) {
            themesStocks.push({
              symbol: quote.symbol,
              name: quote.name || themeStock.name,
              sector: themeStock.sector,
              theme: themeStock.theme,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changesPercentage,
              marketCap: quote.marketCap,
              volume: quote.volume
            });
          }
        });
      }
    }
    
    // For You section - get some quality stocks
    const forYouStocks = [];
    const qualitySymbols = ['JNJ', 'PG', 'KO', 'PEP', 'WMT', 'HD', 'DIS', 'VZ', 'T', 'MCD'];
    
    const qualityQuotes = await fmpService.getQuoteBatch(qualitySymbols);
    
    if (qualityQuotes && Array.isArray(qualityQuotes)) {
      qualityQuotes.forEach(quote => {
        if (quote) {
          forYouStocks.push({
            symbol: quote.symbol,
            name: quote.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changesPercentage,
            marketCap: quote.marketCap,
            pe: quote.pe,
            dividendYield: quote.dividendYield || 0,
            beta: quote.beta || 1.0,
            reason: 'Quality dividend stock with stable returns'
          });
        }
      });
    }
    
    // Compile all discovery data
    const discoveryData = {
      market_pulse: {
        stocks: marketPulseStocks,
        lastUpdated: new Date().toISOString(),
        totalStocks: marketPulseStocks.length
      },
      earnings_spotlight: {
        stocks: earningsStocks,
        lastUpdated: new Date().toISOString(),
        totalStocks: earningsStocks.length
      },
      market_themes: {
        stocks: themesStocks,
        lastUpdated: new Date().toISOString(),
        totalStocks: themesStocks.length
      },
      for_you: {
        stocks: forYouStocks,
        lastUpdated: new Date().toISOString(),
        totalStocks: forYouStocks.length
      }
    };
    
    const totalStocks = marketPulseStocks.length + earningsStocks.length + 
                       themesStocks.length + forYouStocks.length;
    
    console.log(`✅ [DISCOVERY] Successfully fetched discovery data: ${totalStocks} total stocks`);
    
    res.json({
      success: true,
      data: discoveryData,
      summary: {
        totalStocks,
        marketPulse: marketPulseStocks.length,
        earnings: earningsStocks.length,
        themes: themesStocks.length,
        forYou: forYouStocks.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [DISCOVERY] Error fetching discovery data:', error.message);
    
    // Return empty data structure on error so frontend doesn't break
    res.json({
      success: false,
      error: error.message,
      data: {
        market_pulse: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        earnings_spotlight: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        market_themes: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        for_you: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 }
      },
      summary: {
        totalStocks: 0,
        marketPulse: 0,
        earnings: 0,
        themes: 0,
        forYou: 0
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
