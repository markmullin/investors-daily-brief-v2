import express from 'express';
import institutionalPortfoliosService from '../services/institutional/institutionalPortfoliosService.js';

const router = express.Router();

/**
 * GET /api/institutional/portfolios
 * Get top institutional portfolios with rankings
 */
router.get('/portfolios', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const portfoliosData = await institutionalPortfoliosService.getTopInstitutionalPortfolios(limit);
    
    res.json({
      success: true,
      data: portfoliosData.portfolios || [],
      count: portfoliosData.portfolios?.length || 0,
      dataSource: portfoliosData.dataSource,
      isDemoData: portfoliosData.isDemoData,
      timestamp: portfoliosData.timestamp
    });
  } catch (error) {
    console.error('❌ [INSTITUTIONAL API] Error getting portfolios:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch institutional portfolios',
      details: error.message
    });
  }
});

/**
 * GET /api/institutional/portfolios/:name
 * Get specific institutional portfolio by name
 */
router.get('/portfolios/:name', async (req, res) => {
  try {
    const institutionName = decodeURIComponent(req.params.name);
    const portfolio = await institutionalPortfoliosService.getInstitutionByName(institutionName);
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found',
        institutionName: institutionName
      });
    }
    
    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ [INSTITUTIONAL API] Error getting institution ${req.params.name}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch institution portfolio',
      details: error.message
    });
  }
});

/**
 * GET /api/institutional/top-holdings
 * Get top holdings across all institutional portfolios
 */
router.get('/top-holdings', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const topHoldings = await institutionalPortfoliosService.getTopHoldings(limit);

    res.json({
      success: true,
      data: topHoldings,
      count: topHoldings.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [INSTITUTIONAL API] Error getting top holdings:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top holdings',
      details: error.message
    });
  }
});

/**
 * GET /api/institutional/performance-tiers
 * Get institutional portfolios grouped by performance tiers
 */
router.get('/performance-tiers', async (req, res) => {
  try {
    const portfoliosData = await institutionalPortfoliosService.getTopInstitutionalPortfolios(50);
    const portfolios = portfoliosData.portfolios || [];
    
    // Group by performance tiers
    const tiers = {
      Elite: portfolios.filter(p => p.tier === 'Elite'),
      Strong: portfolios.filter(p => p.tier === 'Strong'),
      Average: portfolios.filter(p => p.tier === 'Average'),
      'Below Average': portfolios.filter(p => p.tier === 'Below Average'),
      Weak: portfolios.filter(p => p.tier === 'Weak')
    };

    const tierSummary = Object.entries(tiers).map(([tier, portfolios]) => ({
      tier: tier,
      count: portfolios.length,
      averageScore: portfolios.reduce((sum, p) => sum + p.performanceScore, 0) / portfolios.length || 0,
      totalAUM: portfolios.reduce((sum, p) => sum + p.totalAUM, 0),
      portfolios: portfolios.slice(0, 10) // Top 10 per tier
    }));

    res.json({
      success: true,
      data: {
        tiers: tiers,
        summary: tierSummary
      },
      dataSource: portfoliosData.dataSource,
      timestamp: portfoliosData.timestamp
    });
  } catch (error) {
    console.error('❌ [INSTITUTIONAL API] Error getting performance tiers:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance tiers',
      details: error.message
    });
  }
});

/**
 * POST /api/institutional/clear-cache
 * Clear institutional portfolios cache (for development/testing)
 */
router.post('/clear-cache', async (req, res) => {
  try {
    await institutionalPortfoliosService.clearCache();
    
    res.json({
      success: true,
      message: 'Institutional portfolios cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [INSTITUTIONAL API] Error clearing cache:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

/**
 * GET /api/institutional/health
 * Health check endpoint for institutional portfolios service
 */
router.get('/health', async (req, res) => {
  try {
    // Test the service by getting a small sample
    const testPortfoliosData = await institutionalPortfoliosService.getTopInstitutionalPortfolios(1);
    
    res.json({
      success: true,
      status: 'healthy',
      message: 'Institutional portfolios service is operational',
      sampleCount: testPortfoliosData.portfolios?.length || 0,
      dataSource: testPortfoliosData.dataSource,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [INSTITUTIONAL API] Health check failed:', error.message);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Institutional portfolios service is not operational',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
