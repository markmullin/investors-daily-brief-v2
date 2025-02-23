import express from 'express';
import enhancedMarketScore from '../services/enhancedMarketScore.js';
import errorTracker from '../utils/errorTracker.js';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Get enhanced market score
router.get('/score', async (req, res) => {
  try {
    const cacheKey = 'enhanced_market_score';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const score = await enhancedMarketScore.calculateEnhancedScore();
    cache.set(cacheKey, score);
    
    res.json(score);
  } catch (error) {
    errorTracker.track(error, 'Enhanced Market Score');
    res.status(500).json({ 
      error: 'Failed to calculate enhanced market score',
      details: error.message
    });
  }
});

// Get detailed timeframe analysis
router.get('/timeframes', async (req, res) => {
  try {
    const cacheKey = 'timeframe_analysis';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const timeframeScores = await enhancedMarketScore.getTimeframeAnalysis();
    cache.set(cacheKey, timeframeScores);
    
    res.json(timeframeScores);
  } catch (error) {
    errorTracker.track(error, 'Timeframe Analysis');
    res.status(500).json({ 
      error: 'Failed to fetch timeframe analysis',
      details: error.message
    });
  }
});

// Get relationship insights
router.get('/relationships', async (req, res) => {
  try {
    const cacheKey = 'relationship_insights';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const relationships = await enhancedMarketScore.getRelationshipAnalysis();
    cache.set(cacheKey, relationships);
    
    res.json(relationships);
  } catch (error) {
    errorTracker.track(error, 'Relationship Analysis');
    res.status(500).json({ 
      error: 'Failed to fetch relationship insights',
      details: error.message
    });
  }
});

// Get full market analysis
router.get('/analysis', async (req, res) => {
  try {
    const cacheKey = 'full_market_analysis';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const analysis = await enhancedMarketScore.getFullAnalysis();
    cache.set(cacheKey, analysis);
    
    res.json(analysis);
  } catch (error) {
    errorTracker.track(error, 'Full Market Analysis');
    res.status(500).json({ 
      error: 'Failed to fetch full market analysis',
      details: error.message
    });
  }
});

export default router;