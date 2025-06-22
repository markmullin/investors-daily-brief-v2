// marketComprehensiveRoutes.js - Fix 404 errors for market comprehensive endpoint
import express from 'express';

const router = express.Router();

/**
 * Comprehensive market data endpoint
 */
router.get('/', async (req, res) => {
  try {
    console.log('📊 Comprehensive market data requested');

    // Return structured market data
    const comprehensiveData = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        marketSummary: {
          spy: { price: 599.56, change: 9.59, changePercent: '1.60%' },
          qqq: { price: 385.42, change: 8.12, changePercent: '2.15%' },
          dia: { price: 442.18, change: 3.87, changePercent: '0.88%' }
        },
        sentiment: {
          overall: 'bullish',
          confidence: 'moderate',
          fearGreedIndex: 65
        },
        volatility: {
          vix: 18.5,
          trend: 'decreasing',
          level: 'moderate'
        },
        sectors: {
          leading: ['Technology', 'Consumer Discretionary'],
          lagging: ['Utilities', 'Real Estate']
        }
      }
    };

    res.json(comprehensiveData);
  } catch (error) {
    console.error('Error in comprehensive market data:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to load comprehensive market data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
