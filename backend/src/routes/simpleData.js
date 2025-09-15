/**
 * SIMPLE TICKER AND DISCOVERY DATA
 * Direct endpoints for ticker and discovery cards - no complexity
 */

import express from 'express';
const router = express.Router();

// Simple S&P 500 top companies endpoint
router.get('/sp500-ticker', async (req, res) => {
  try {
    // Hardcode the response for now to ensure it works
    const sp500Companies = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 233.27, changePercent: 1.41 },
      { symbol: 'NVDA', name: 'NVIDIA Corp', price: 177.86, changePercent: -0.39 },
      { symbol: 'MSFT', name: 'Microsoft', price: 512.37, changePercent: 2.27 },
      { symbol: 'GOOGL', name: 'Alphabet', price: 241.10, changePercent: 0.30 },
      { symbol: 'AMZN', name: 'Amazon', price: 228.38, changePercent: -0.68 },
      { symbol: 'META', name: 'Meta', price: 754.46, changePercent: 0.47 },
      { symbol: 'TSLA', name: 'Tesla', price: 394.18, changePercent: 6.88 },
      { symbol: 'BRK.B', name: 'Berkshire', price: 474.25, changePercent: 0.15 },
      { symbol: 'JPM', name: 'JPMorgan', price: 306.37, changePercent: 0.26 },
      { symbol: 'V', name: 'Visa', price: 339.75, changePercent: -1.09 },
      { symbol: 'JNJ', name: 'Johnson & Johnson', price: 177.95, changePercent: -0.31 },
      { symbol: 'WMT', name: 'Walmart', price: 156.42, changePercent: 0.82 },
      { symbol: 'UNH', name: 'UnitedHealth', price: 608.71, changePercent: 1.24 },
      { symbol: 'MA', name: 'Mastercard', price: 285.93, changePercent: -0.45 },
      { symbol: 'XOM', name: 'Exxon Mobil', price: 121.57, changePercent: 0.93 }
    ];
    
    console.log('✅ [SIMPLE-DATA] Returning S&P 500 ticker data');
    res.json(sp500Companies);
    
  } catch (error) {
    console.error('❌ [SIMPLE-DATA] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch S&P 500 data' });
  }
});

// Simple discovery data endpoint
router.get('/discovery-simple', async (req, res) => {
  try {
    const discoveryData = {
      success: true,
      data: {
        market_pulse: {
          stocks: [
            { symbol: 'TSLA', name: 'Tesla Inc', changePercent: 6.88, category: 'gainer' },
            { symbol: 'AAPL', name: 'Apple Inc', changePercent: 1.41, category: 'gainer' },
            { symbol: 'MSFT', name: 'Microsoft', changePercent: 2.27, category: 'gainer' },
            { symbol: 'AMZN', name: 'Amazon', changePercent: -0.68, category: 'loser' },
            { symbol: 'V', name: 'Visa Inc', changePercent: -1.09, category: 'loser' }
          ],
          lastUpdated: new Date().toISOString(),
          totalStocks: 5
        },
        earnings_spotlight: {
          stocks: [
            { symbol: 'ORCL', name: 'Oracle', date: '2025-09-16', time: 'After Market' },
            { symbol: 'ADBE', name: 'Adobe', date: '2025-09-17', time: 'After Market' },
            { symbol: 'FDX', name: 'FedEx', date: '2025-09-19', time: 'After Market' }
          ],
          lastUpdated: new Date().toISOString(),
          totalStocks: 3
        },
        market_themes: {
          stocks: [
            { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', sectorPerformance: 2.1 },
            { symbol: 'AMD', name: 'AMD', sector: 'Technology', sectorPerformance: 2.1 },
            { symbol: 'XOM', name: 'Exxon', sector: 'Energy', sectorPerformance: 1.8 },
            { symbol: 'CVX', name: 'Chevron', sector: 'Energy', sectorPerformance: 1.8 }
          ],
          lastUpdated: new Date().toISOString(),
          totalStocks: 4
        },
        for_you: {
          stocks: [
            { symbol: 'AAPL', name: 'Apple', reason: 'Strong fundamentals', dividendYield: 0.44 },
            { symbol: 'MSFT', name: 'Microsoft', reason: 'Consistent growth', dividendYield: 0.72 },
            { symbol: 'JNJ', name: 'Johnson & Johnson', reason: 'Dividend aristocrat', dividendYield: 2.95 }
          ],
          lastUpdated: new Date().toISOString(),
          totalStocks: 3
        }
      },
      summary: {
        totalStocks: 15,
        marketPulse: 5,
        earnings: 3,
        themes: 4,
        forYou: 3
      }
    };
    
    console.log('✅ [SIMPLE-DATA] Returning discovery data');
    res.json(discoveryData);
    
  } catch (error) {
    console.error('❌ [SIMPLE-DATA] Error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch discovery data',
      data: {
        market_pulse: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        earnings_spotlight: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        market_themes: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        for_you: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 }
      },
      summary: { totalStocks: 0, marketPulse: 0, earnings: 0, themes: 0, forYou: 0 }
    });
  }
});

export default router;
