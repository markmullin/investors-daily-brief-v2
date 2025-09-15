/**
 * Market Environment V2 Routes
 * Provides comprehensive market analysis with no hardcoded data
 * Everything generated from real-time FMP and FRED data
 */

import express from 'express';
import marketPhaseServiceV2 from '../services/marketEnvironment/marketPhaseServiceV2.js';
import breadthServiceV2 from '../services/marketEnvironment/breadthServiceV2.js';
import sentimentServiceV2 from '../services/marketEnvironment/sentimentServiceV2.js';
import sp500AggregationServiceV2 from '../services/marketEnvironment/sp500AggregationServiceV2.js';
import marketSynthesisServiceV2 from '../services/marketEnvironment/marketSynthesisServiceV2.js';

const router = express.Router();

/**
 * GET /api/market-env
 * Main endpoint for comprehensive market environment analysis
 */
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching Market Environment V2 analysis...');
    
    // Fetch all components in parallel
    const [phase, trendBreadth, fundamentals, sentiment] = await Promise.all([
      marketPhaseServiceV2.detectPhase(),
      breadthServiceV2.calculateBreadth(),
      sp500AggregationServiceV2.getLatestAggregation(),
      sentimentServiceV2.analyzeSentiment()
    ]);

    // Generate dynamic synthesis
    const synthesis = await marketSynthesisServiceV2.generateSynthesis(
      phase,
      trendBreadth,
      fundamentals,
      sentiment
    );

    // Combine all data
    const response = {
      success: true,
      data: {
        phase,
        trend: trendBreadth.trend,
        breadth: trendBreadth.breadth,
        fundamentals,
        sentiment,
        synthesis
      },
      timestamp: new Date().toISOString(),
      version: '2.0'
    };

    console.log('✅ Market Environment V2 analysis complete');
    res.json(response);

  } catch (error) {
    console.error('❌ Error in Market Environment V2:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate market environment analysis',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/market-env/phase
 * Get just the market phase analysis
 */
router.get('/phase', async (req, res) => {
  try {
    const phase = await marketPhaseServiceV2.detectPhase();
    res.json({ success: true, data: phase });
  } catch (error) {
    console.error('Error fetching market phase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/market-env/breadth
 * Get market breadth and trend analysis
 */
router.get('/breadth', async (req, res) => {
  try {
    const breadth = await breadthServiceV2.calculateBreadth();
    res.json({ success: true, data: breadth });
  } catch (error) {
    console.error('Error fetching breadth:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/market-env/sentiment
 * Get market sentiment analysis
 */
router.get('/sentiment', async (req, res) => {
  try {
    const sentiment = await sentimentServiceV2.analyzeSentiment();
    res.json({ success: true, data: sentiment });
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/market-env/fundamentals
 * Get S&P 500 aggregated fundamentals
 */
router.get('/fundamentals', async (req, res) => {
  try {
    const fundamentals = await sp500AggregationServiceV2.getLatestAggregation();
    res.json({ success: true, data: fundamentals });
  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/market-env/aggregate
 * Trigger S&P 500 fundamentals aggregation (manual trigger for testing)
 * In production, this should be called by a cron job
 */
router.post('/aggregate', async (req, res) => {
  try {
    // Check for admin key or authentication
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized. Admin key required for aggregation.' 
      });
    }

    console.log('🚀 Starting manual S&P 500 aggregation...');
    
    // Start aggregation in background
    res.json({ 
      success: true, 
      message: 'S&P 500 aggregation started. This will take 30-45 minutes to complete.',
      checkStatusAt: '/api/market-env/fundamentals'
    });

    // Run aggregation with force flag (don't await)
    sp500AggregationServiceV2.runNightlyAggregation(true)  // Force run bypasses time check
      .then(result => {
        console.log('✅ S&P 500 aggregation completed successfully');
      })
      .catch(error => {
        console.error('❌ S&P 500 aggregation failed:', error);
      });

  } catch (error) {
    console.error('Error starting aggregation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/market-env/synthesis
 * Get just the AI synthesis
 */
router.get('/synthesis', async (req, res) => {
  try {
    // Need all data for synthesis
    const [phase, trendBreadth, fundamentals, sentiment] = await Promise.all([
      marketPhaseServiceV2.detectPhase(),
      breadthServiceV2.calculateBreadth(),
      sp500AggregationServiceV2.getLatestAggregation(),
      sentimentServiceV2.analyzeSentiment()
    ]);

    const synthesis = await marketSynthesisServiceV2.generateSynthesis(
      phase,
      trendBreadth,
      fundamentals,
      sentiment
    );

    res.json({ success: true, data: synthesis });
  } catch (error) {
    console.error('Error generating synthesis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
