import express from 'express';
import eodService from '../services/eodService.js';

const router = express.Router();

// Simple test route to check EOD API connectivity
router.get('/eod-status', async (req, res) => {
  try {
    const status = await eodService.checkAPIStatus();
    console.log('EOD API status check:', status);
    res.json(status);
  } catch (error) {
    console.error('EOD API status check failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test fetching a single symbol
router.get('/test-symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`Testing EOD API with symbol: ${symbol}`);
    const data = await eodService.getSingleStockData(symbol, true);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error(`Test failed for symbol ${req.params.symbol}:`, error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// Test fetch market data
router.get('/test-market-data', async (req, res) => {
  try {
    console.log('Testing market data fetch...');
    const data = await eodService.getMarketData(true);
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Market data test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

export default router;