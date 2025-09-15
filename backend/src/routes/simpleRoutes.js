/**
 * SIMPLE WORKING SP500 AND DISCOVERY ROUTES
 * Direct implementation without complex dependencies
 */

import express from 'express';
const router = express.Router();

/**
 * GET /api/simple/sp500-top
 * Returns top S&P 500 companies for the ticker
 */
router.get('/sp500-top', async (req, res) => {
  try {
    console.log('📊 [SIMPLE] S&P 500 top endpoint called');
    
    // Return static data for now to verify the endpoint works
    const sp500Data = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 233.27, changePercent: 1.41 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 177.86, changePercent: 0.39 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', price: 512.37, changePercent: 2.27 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 241.10, changePercent: 0.30 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 228.38, changePercent: -0.68 },
      { symbol: 'META', name: 'Meta Platforms Inc.', price: 754.46, changePercent: 0.47 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 394.18, changePercent: 6.88 },
      { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 460.25, changePercent: 0.15 },
      { symbol: 'JPM', name: 'JPMorgan Chase', price: 306.37, changePercent: 0.26 },
      { symbol: 'V', name: 'Visa Inc.', price: 339.75, changePercent: -1.09 },
      { symbol: 'JNJ', name: 'Johnson & Johnson', price: 177.95, changePercent: -0.31 },
      { symbol: 'WMT', name: 'Walmart Inc.', price: 91.87, changePercent: 0.42 },
      { symbol: 'UNH', name: 'UnitedHealth Group', price: 589.34, changePercent: 0.73 },
      { symbol: 'MA', name: 'Mastercard Inc.', price: 520.43, changePercent: -0.52 },
      { symbol: 'XOM', name: 'Exxon Mobil', price: 120.58, changePercent: 1.24 }
    ];
    
    res.json(sp500Data);
    
  } catch (error) {
    console.error('❌ [SIMPLE] S&P 500 error:', error.message);
    res.status(500).json({ error: 'Failed to fetch S&P 500 data' });
  }
});

/**
 * GET /api/simple/discovery
 * Returns discovery data for the cards
 */
router.get('/discovery', async (req, res) => {
  try {
    console.log('🎯 [SIMPLE] Discovery endpoint called');
    
    const discoveryData = {
      market_pulse: {
        stocks: [
          { symbol: 'NVDA', name: 'NVIDIA', changePercent: 5.2, category: 'gainer' },
          { symbol: 'TSLA', name: 'Tesla', changePercent: 4.8, category: 'gainer' },
          { symbol: 'AMD', name: 'AMD', changePercent: 3.1, category: 'gainer' },
          { symbol: 'AAPL', name: 'Apple', changePercent: 2.5, category: 'gainer' },
          { symbol: 'MSFT', name: 'Microsoft', changePercent: 1.8, category: 'gainer' },
          { symbol: 'INTC', name: 'Intel', changePercent: -3.2, category: 'loser' },
          { symbol: 'BA', name: 'Boeing', changePercent: -2.8, category: 'loser' },
          { symbol: 'DIS', name: 'Disney', changePercent: -2.1, category: 'loser' },
          { symbol: 'NKE', name: 'Nike', changePercent: -1.9, category: 'loser' },
          { symbol: 'CVX', name: 'Chevron', changePercent: -1.5, category: 'loser' },
        ],
        lastUpdated: new Date().toISOString(),
        totalStocks: 10
      },
      earnings_spotlight: {
        stocks: [
          { symbol: 'ORCL', name: 'Oracle', date: '2025-09-15', time: 'After Close' },
          { symbol: 'ADBE', name: 'Adobe', date: '2025-09-17', time: 'After Close' },
          { symbol: 'FDX', name: 'FedEx', date: '2025-09-19', time: 'After Close' },
          { symbol: 'COST', name: 'Costco', date: '2025-09-21', time: 'After Close' },
          { symbol: 'NKE', name: 'Nike', date: '2025-09-24', time: 'After Close' }
        ],
        lastUpdated: new Date().toISOString(),
        totalStocks: 5
      },
      market_themes: {
        stocks: [
          { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', theme: 'AI Revolution' },
          { symbol: 'AMD', name: 'AMD', sector: 'Technology', theme: 'AI Revolution' },
          { symbol: 'GOOGL', name: 'Google', sector: 'Technology', theme: 'AI Revolution' },
          { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', theme: 'GLP-1 Drugs' },
          { symbol: 'NVO', name: 'Novo Nordisk', sector: 'Healthcare', theme: 'GLP-1 Drugs' }
        ],
        lastUpdated: new Date().toISOString(),
        totalStocks: 5
      },
      for_you: {
        stocks: [
          { symbol: 'AAPL', name: 'Apple', reason: 'Tech leader with strong fundamentals' },
          { symbol: 'MSFT', name: 'Microsoft', reason: 'Cloud and AI growth' },
          { symbol: 'JNJ', name: 'Johnson & Johnson', reason: 'Stable dividend aristocrat' },
          { symbol: 'BRK.B', name: 'Berkshire', reason: 'Value investing at its finest' },
          { symbol: 'V', name: 'Visa', reason: 'Digital payments growth' }
        ],
        lastUpdated: new Date().toISOString(),
        totalStocks: 5
      }
    };
    
    res.json({
      success: true,
      data: discoveryData,
      summary: {
        totalStocks: 25,
        marketPulse: 10,
        earnings: 5,
        themes: 5,
        forYou: 5
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [SIMPLE] Discovery error:', error.message);
    res.json({
      success: false,
      error: error.message,
      data: {
        market_pulse: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        earnings_spotlight: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        market_themes: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 },
        for_you: { stocks: [], lastUpdated: new Date().toISOString(), totalStocks: 0 }
      },
      summary: { totalStocks: 0, marketPulse: 0, earnings: 0, themes: 0, forYou: 0 },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
