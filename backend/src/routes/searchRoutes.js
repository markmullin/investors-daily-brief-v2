import express from 'express';
import searchService from '../services/searchService.js';
import { isValidStockSymbol, formatSymbolForAPI } from '../data/stockTickers.js';
import { marketService } from '../services/apiServices.js';

const router = express.Router();

// Search stocks by query (symbol or name)
router.get('/stocks', async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const results = await searchService.searchStocks(q, parseInt(limit));
    res.json(results);
  } catch (error) {
    console.error('Stock search error:', error);
    next(error);
  }
});

// Search by exact symbol (for direct searches)
router.get('/symbol/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        error: 'Invalid symbol',
        message: 'Stock symbol is required'
      });
    }
    
    // Format the symbol properly for API call
    const apiSymbol = formatSymbolForAPI(symbol);
    
    try {
      // Get quote data
      const quote = await marketService.getDataForSymbols([apiSymbol]);
      const history = await marketService.getHistoricalData(apiSymbol);
      
      if (!quote || !quote[apiSymbol]) {
        return res.status(404).json({
          error: 'Symbol not found',
          message: `No data found for symbol ${symbol}`
        });
      }
      
      res.json({
        quote: quote[apiSymbol],
        history: history || []
      });
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      res.status(500).json({
        error: 'Search error',
        message: error.message
      });
    }
  } catch (error) {
    console.error('Symbol search error:', error);
    next(error);
  }
});

// Validate if a stock symbol exists
router.get('/validate/:symbol', (req, res) => {
  const { symbol } = req.params;
  const isValid = isValidStockSymbol(symbol);
  
  res.json({
    symbol: symbol.toUpperCase(),
    valid: isValid
  });
});

// Search fallback for when searchService fails
router.get('/fallback', (req, res) => {
  const { q } = req.query;
  
  // Return top stocks as fallback
  const fallbackResults = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', score: 90 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', score: 89 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', score: 88 },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (Google) Class A', type: 'stock', score: 87 },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', score: 86 },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', score: 85 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', score: 84 },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf', score: 83 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', type: 'etf', score: 82 },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'etf', score: 81 }
  ];
  
  res.json(fallbackResults);
});

export default router;