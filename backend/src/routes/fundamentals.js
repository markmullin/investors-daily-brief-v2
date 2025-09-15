import express from 'express';
import unifiedDataService from '../services/unifiedDataService.js';
import { redis } from '../config/database.js';

const router = express.Router();

/**
 * *** UNIFIED FUNDAMENTALS ROUTES ***
 * 
 * UPDATED: Now uses unifiedDataService for ALL data operations
 * - No more multiple collectors
 * - Single source of truth
 * - Raw FMP data (no conversions)
 * - Cash position metric included
 */

/**
 * *** GET TOP PERFORMERS - UNIFIED DATA ***
 */
router.get('/top-performers', async (req, res) => {
  try {
    console.log('📊 [UNIFIED FUNDAMENTALS] Getting top performers...');
    
    // Define available metrics
    const metrics = [
      'revenue_growth_yoy',
      'earnings_growth_yoy', 
      'fcf_growth_yoy',
      'profit_margin',
      'roe',
      'cash_position',      // Cash as % of market cap
      'current_ratio'
    ];
    
    const results = {};
    let successCount = 0;
    let errorCount = 0;
    
    // Get top performers for each metric
    for (const metric of metrics) {
      try {
        const topPerformers = await unifiedDataService.getSP500TopPerformers(metric);
        results[metric] = topPerformers;
        successCount++;
        console.log(`✅ [UNIFIED] ${metric}: ${topPerformers.length} performers`);
        
      } catch (error) {
        console.error(`❌ [UNIFIED] ${metric} failed:`, error.message);
        results[metric] = [];
        errorCount++;
      }
    }
    
    const summary = {
      lastUpdated: new Date().toISOString(),
      totalMetrics: metrics.length,
      successfulMetrics: successCount,
      failedMetrics: errorCount,
      displayCount: 10,
      dataSource: 'Unified Data Service - FMP API',
      updateFrequency: 'Weekly or on-demand',
      mode: 'unified_pipeline'
    };
    
    res.json({
      success: true,
      data: results,
      summary: summary,
      metrics: {
        revenue_growth_yoy: 'Revenue Growth YoY',
        earnings_growth_yoy: 'Earnings Growth YoY',
        fcf_growth_yoy: 'FCF Growth YoY', 
        profit_margin: 'Profit Margin',
        roe: 'Return on Equity',
        cash_position: 'Cash Position',
        current_ratio: 'Current Ratio'
      },
      dataQuality: {
        source: 'FMP Premium API',
        format: 'Raw decimals (no conversions)',
        validation: 'Extreme values logged but preserved',
        synthetic: 'No synthetic or capped data'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [UNIFIED FUNDAMENTALS] Failed to get top performers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load fundamental rankings',
      details: error.message,
      suggestion: 'Run POST /api/fundamentals/collect to populate data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** COLLECT SP500 FUNDAMENTALS - UNIFIED ***
 */
router.post('/collect', async (req, res) => {
  try {
    console.log('🚀 [UNIFIED FUNDAMENTALS] Starting unified SP500 collection...');
    
    const result = await unifiedDataService.collectSP500Fundamentals();
    
    res.json({
      success: true,
      message: 'Unified SP500 collection completed successfully',
      result: result,
      features: [
        'Single data pipeline (unifiedDataService)',
        'Raw FMP decimals preserved',
        'Cash position metric included',
        'No synthetic data or capping',
        'Old collector caches cleared'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [UNIFIED FUNDAMENTALS] Collection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Unified collection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** COLLECTION STATUS - UNIFIED ***
 */
router.get('/status', async (req, res) => {
  try {
    const health = await unifiedDataService.getSystemHealth();
    const sp500Key = 'unified:sp500:fundamentals';
    const sp500Data = await redis.get(sp500Key);
    
    const status = {
      dataAvailable: !!sp500Data,
      companiesCount: sp500Data ? JSON.parse(sp500Data).length : 0,
      cacheStats: health.cacheStats,
      services: health.services,
      unifiedPipeline: true,
      oldCollectorsRemoved: true,
      metrics_available: 7,
      metrics: {
        revenue_growth_yoy: 'Revenue Growth YoY',
        earnings_growth_yoy: 'Earnings Growth YoY', 
        fcf_growth_yoy: 'FCF Growth YoY',
        profit_margin: 'Profit Margin',
        roe: 'Return on Equity',
        cash_position: 'Cash Position (%)',
        current_ratio: 'Current Ratio'
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      status: status,
      recommendation: !sp500Data ? 'Run POST /api/fundamentals/collect to populate data' : 'Data available',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [UNIFIED STATUS] Failed to get status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** SUMMARY ENDPOINT - UNIFIED ***
 */
router.get('/summary', async (req, res) => {
  try {
    const sp500Key = 'unified:sp500:fundamentals';
    const sp500Data = await redis.get(sp500Key);
    
    if (sp500Data) {
      const data = JSON.parse(sp500Data);
      
      const summary = {
        lastUpdated: data[0]?.dataTimestamp || new Date().toISOString(),
        totalMetrics: 7,
        totalCompanies: data.length,
        displayCount: 10,
        dataSource: 'Unified Data Service - FMP Premium API',
        updateFrequency: 'Weekly or on-demand',
        cacheStatus: 'Active',
        mode: 'unified_pipeline',
        enhancements: [
          'Cash Position metric shows financial flexibility',
          'Raw decimal values from FMP (no conversions)',
          'Extreme values preserved for transparency',
          'Single data pipeline eliminates conflicts',
          'No synthetic data or artificial capping'
        ]
      };
      
      res.json({ 
        success: true, 
        summary,
        timestamp: new Date().toISOString() 
      });
    } else {
      res.json({
        success: false,
        error: 'No fundamental data available',
        message: 'Run POST /api/fundamentals/collect to populate data',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ [UNIFIED SUMMARY] Failed to get summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load summary',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** CLEAR CACHE - EMERGENCY USE ***
 */
router.post('/clear-cache', async (req, res) => {
  try {
    console.log('🧹 [UNIFIED] Clearing all caches...');
    
    // Clear unified caches
    await unifiedDataService.invalidateCache('unified:*');
    
    // Clear old collector caches
    await unifiedDataService.clearOldCollectorCaches();
    
    console.log('✅ [UNIFIED] All caches cleared');
    
    res.json({
      success: true,
      message: 'All caches cleared successfully',
      cleared: [
        'unified:*',
        'sp500:*',
        'fundamentals:*',
        'market:*',
        'analyst_coverage:*',
        'screening_stats:*'
      ],
      next_step: 'Run POST /api/fundamentals/collect to repopulate',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [UNIFIED] Cache clearing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** MIGRATE FROM OLD COLLECTORS ***
 */
router.post('/migrate', async (req, res) => {
  try {
    console.log('🔄 [UNIFIED] Starting migration from old collectors...');
    
    const result = await unifiedDataService.migrateFromOldCollectors();
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      result: result,
      actions_taken: [
        'Cleared old collector cache patterns',
        'Removed conflicting data',
        'Pre-populated market data',
        'Ready for unified collection'
      ],
      next_step: 'Run POST /api/fundamentals/collect',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [UNIFIED] Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** DEBUG SPECIFIC COMPANY ***
 */
router.get('/debug/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🔍 [UNIFIED DEBUG] Fetching enhanced fundamentals for ${symbol}...`);
    
    const data = await unifiedDataService.getEnhancedFundamentals(symbol);
    
    res.json({
      success: true,
      symbol: symbol,
      data: data,
      raw_values: {
        revenue_growth: data.revenueGrowthYoY,
        earnings_growth: data.earningsGrowthYoY,
        roe: data.roe,
        profit_margin: data.profitMargin,
        cash_position: data.cashPosition,
        current_ratio: data.currentRatio
      },
      formatted_values: {
        revenue_growth: data.revenueGrowthYoY ? `${(data.revenueGrowthYoY * 100).toFixed(1)}%` : 'N/A',
        earnings_growth: data.earningsGrowthYoY ? `${(data.earningsGrowthYoY * 100).toFixed(1)}%` : 'N/A',
        roe: data.roe ? `${(data.roe * 100).toFixed(1)}%` : 'N/A',
        profit_margin: data.profitMargin ? `${(data.profitMargin * 100).toFixed(1)}%` : 'N/A',
        cash_position: data.cashPosition ? `${(data.cashPosition * 100).toFixed(1)}%` : 'N/A',
        current_ratio: data.currentRatio ? `${data.currentRatio.toFixed(2)}x` : 'N/A'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [UNIFIED DEBUG] Failed for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Debug failed',
      details: error.message,
      symbol: req.params.symbol,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
