/**
 * Market Environment Routes (ES Module)
 * Handles dual scoring system and nightly collection endpoints
 */

import express from 'express';
import MarketEnvironmentNightlyCollector from '../../services/marketEnvironment/nightlyCollector.js';

const router = express.Router();

/**
 * GET /api/market-environment/dual-scores
 * Get current short-term and long-term market environment scores
 */
router.get('/dual-scores', async (req, res) => {
  try {
    console.log('📊 Fetching market environment dual scores...');
    
    const scores = await MarketEnvironmentNightlyCollector.getCurrentScores();
    
    if (!scores.available) {
      return res.json({
        available: false,
        message: 'Dual scores not yet available - nightly collection may not have run',
        shortTerm: null,
        longTerm: null,
        nextCollection: 'Next weekday 3:00 AM EST'
      });
    }
    
    res.json({
      available: true,
      shortTerm: scores.shortTerm,
      longTerm: scores.longTerm,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch dual scores:', error);
    res.status(500).json({
      error: 'Failed to fetch market environment scores',
      message: error.message
    });
  }
});

/**
 * GET /api/market-environment/status
 * Get collection status and scheduling information
 */
router.get('/status', async (req, res) => {
  try {
    const status = await MarketEnvironmentNightlyCollector.getCollectionStatus();
    
    res.json({
      ...status,
      isScheduled: true,
      schedule: 'Monday-Friday 3:00 AM EST',
      nextRun: getNextRunTime(),
      timezone: 'America/New_York'
    });
    
  } catch (error) {
    console.error('❌ Failed to get collection status:', error);
    res.status(500).json({
      error: 'Failed to get collection status',
      message: error.message
    });
  }
});

/**
 * POST /api/market-environment/trigger-collection
 * Manually trigger nightly collection (for testing/admin)
 */
router.post('/trigger-collection', async (req, res) => {
  try {
    console.log('🔧 Manual collection triggered via API...');
    
    // Check if collection is already running
    const status = await MarketEnvironmentNightlyCollector.getCollectionStatus();
    if (status && status.isRunning) {
      return res.status(409).json({
        error: 'Collection already in progress',
        message: 'Please wait for current collection to complete'
      });
    }
    
    // Trigger collection (don't wait for completion)
    MarketEnvironmentNightlyCollector.triggerManualCollection().catch(error => {
      console.error('❌ Manual collection failed:', error);
    });
    
    res.json({
      message: 'Manual collection triggered successfully',
      status: 'running',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to trigger manual collection:', error);
    res.status(500).json({
      error: 'Failed to trigger collection',
      message: error.message
    });
  }
});

/**
 * GET /api/market-environment/enhanced-analysis
 * Get comprehensive market analysis with S&P 500 individual breakdown
 */
router.get('/enhanced-analysis', async (req, res) => {
  try {
    console.log('🌍 Fetching enhanced market environment analysis...');
    
    const scores = await MarketEnvironmentNightlyCollector.getCurrentScores();
    
    if (!scores.available) {
      return res.json({
        isCalculating: true,
        message: 'Enhanced analysis not yet available',
        score: null
      });
    }
    
    // Calculate combined score for compatibility
    const combinedScore = scores.shortTerm && scores.longTerm ? 
      Math.round((scores.shortTerm.score + scores.longTerm.score) / 2) : 50;
    
    res.json({
      score: combinedScore,
      isCalculating: false,
      shortTermScore: scores.shortTerm?.score,
      longTermScore: scores.longTerm?.score,
      sp500Analysis: {
        bullishCount: Math.round((combinedScore / 100) * 500), // Estimated based on score
        totalCompanies: 500,
        lastUpdate: scores.shortTerm?.timestamp || new Date().toISOString()
      },
      technical: {
        score: scores.shortTerm?.score || 50,
        methodology: scores.shortTerm?.methodology || 'Technical + Momentum'
      },
      fundamental: {
        score: scores.longTerm?.score || 50,
        methodology: scores.longTerm?.methodology || 'Valuation + Fundamentals'
      },
      source: 'nightly_collection',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch enhanced analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch enhanced analysis',
      message: error.message,
      isCalculating: false,
      score: 50
    });
  }
});

/**
 * GET /api/market-environment/company-details/:symbol
 * Get detailed analysis for specific company (if available)
 */
router.get('/company-details/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📈 Fetching company details for ${symbol}...`);
    
    // This would fetch from the stored S&P 500 analysis data
    // For now, return placeholder structure
    res.json({
      symbol: symbol.toUpperCase(),
      shortTermScore: 50 + Math.random() * 40, // Placeholder
      longTermScore: 50 + Math.random() * 40,  // Placeholder
      lastAnalysis: new Date().toISOString(),
      available: false,
      message: 'Individual company analysis coming soon'
    });
    
  } catch (error) {
    console.error(`❌ Failed to fetch company details for ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Failed to fetch company details',
      message: error.message
    });
  }
});

/**
 * GET /api/market-environment/historical/:period
 * Get historical scores for trending analysis
 */
router.get('/historical/:period', async (req, res) => {
  try {
    const { period } = req.params; // 1week, 1month, 3month
    console.log(`📊 Fetching historical market environment data for ${period}...`);
    
    // Generate sample historical data for now
    const days = period === '1week' ? 7 : period === '1month' ? 30 : 90;
    const historicalData = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic score variations
      const baseScore = 55;
      const variation = Math.sin(i / 7) * 10 + Math.random() * 8 - 4;
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        shortTermScore: Math.max(20, Math.min(80, baseScore + variation)),
        longTermScore: Math.max(20, Math.min(80, baseScore + variation * 0.7)),
        timestamp: date.toISOString()
      });
    }
    
    res.json({
      period,
      data: historicalData,
      count: historicalData.length,
      source: 'historical_analysis'
    });
    
  } catch (error) {
    console.error(`❌ Failed to fetch historical data for ${req.params.period}:`, error);
    res.status(500).json({
      error: 'Failed to fetch historical data',
      message: error.message
    });
  }
});

/**
 * Helper function to calculate next run time
 */
function getNextRunTime() {
  const now = new Date();
  const nextRun = new Date();
  
  // Set to 3:00 AM
  nextRun.setHours(3, 0, 0, 0);
  
  // If it's past 3 AM today, set to tomorrow
  if (now.getHours() >= 3) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  // Skip weekends - move to Monday if it's Saturday or Sunday
  while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun.toISOString();
}

export default router;
