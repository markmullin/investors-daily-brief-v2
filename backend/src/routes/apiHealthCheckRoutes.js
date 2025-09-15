import express from 'express';
import eodService from '../services/eodService.js';
import braveNewsService from '../services/braveNewsService.js';
import braveInsightsService from '../services/braveInsightsService.js';
import braveService from '../services/braveService.js';
import braveAPIManager from '../services/braveAPIManager.js';
import unifiedGptOssService from '../services/unifiedGptOssService.js';
import fredService from '../services/fredService.js';

const router = express.Router();

/**
 * @route   GET /api/health-check/check
 * @desc    Check the health of all APIs
 * @access  Public
 */
router.get('/check', async (req, res) => {
  try {
    // Check all services
    const results = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: 'healthy'
    };
    
    // Check EOD API
    try {
      const eodStatus = await eodService.checkAPIStatus();
      results.services.eod = eodStatus;
    } catch (error) {
      results.services.eod = {
        status: 'error',
        message: `EOD API error: ${error.message}`
      };
      results.overall = 'degraded';
    }
    
    // Check Brave API with enhanced reporting
    try {
      const braveStatus = await braveNewsService.checkApiStatus();
      
      // Get detailed API manager status
      const apiManagerStatus = braveAPIManager.getStatus();
      
      results.services.brave = {
        ...braveStatus,
        manager: {
          queueLength: apiManagerStatus.queueLength,
          circuitOpen: apiManagerStatus.circuitOpen,
          rateLimited: apiManagerStatus.isRateLimited,
          backoff: `${Math.round(apiManagerStatus.currentBackoff / 1000)}s`,
          quotaUsed: apiManagerStatus.quotaUsed,
          quotaLimit: apiManagerStatus.quotaLimit,
          quotaRemaining: apiManagerStatus.quotaLimit - apiManagerStatus.quotaUsed
        }
      };
    } catch (error) {
      results.services.brave = {
        status: 'error',
        message: `Brave API error: ${error.message}`
      };
      results.overall = 'degraded';
    }
    
    // Check Mistral API
    try {
      const mistralStatus = await unifiedGptOssService.healthCheck();
      results.services.mistral = mistralStatus;
    } catch (error) {
      results.services.mistral = {
        status: 'error',
        message: `Mistral API error: ${error.message}`
      };
      results.overall = 'degraded';
    }
    
    // Check FRED API
    try {
      // For FRED, we'll try a basic series retrieval
      await fredService.getSeries('GDP', { limit: 1 });
      results.services.fred = {
        status: 'active',
        message: 'FRED API is working correctly',
        apiKey: process.env.FRED_API_KEY ? process.env.FRED_API_KEY.substring(0, 5) + '...' : 'Not set'
      };
    } catch (error) {
      results.services.fred = {
        status: 'error',
        message: `FRED API error: ${error.message}`
      };
      results.overall = 'degraded';
    }
    
    // Set critical status if most services are down
    const errorCount = Object.values(results.services).filter(s => s.status === 'error').length;
    if (errorCount >= 3) {
      results.overall = 'critical';
    }
    
    // Add recommended actions based on status
    results.recommendations = [];
    
    if (results.services.brave?.status === 'rate_limited') {
      results.recommendations.push(
        'Brave API is rate limited. Consider extending cache TTLs and reducing request frequency.'
      );
    }
    
    if (results.services.brave?.manager?.circuitOpen) {
      results.recommendations.push(
        'Brave API circuit breaker is open. Wait for automatic reset or manually reset using /api/health-check/reset endpoint.'
      );
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error checking API health:', error);
    res.status(500).json({
      error: 'Error checking API health',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/health-check/reset
 * @desc    Reset API rate limits and caches
 * @access  Public
 */
router.post('/reset', (req, res) => {
  try {
    // Get services to reset from query params, or reset all if not specified
    const { services } = req.query;
    const resetServices = services ? services.split(',') : ['all'];
    
    const results = {
      message: 'API services reset successfully',
      timestamp: new Date().toISOString(),
      details: {}
    };
    
    // Reset EOD Service to clear data cache
    if (resetServices.includes('all') || resetServices.includes('eod')) {
      // Clear EOD cache by deleting all keys
      const eodCacheKeys = eodService.cache.keys();
      eodCacheKeys.forEach(key => eodService.cache.del(key));
      
      results.details.eod = {
        status: 'reset_complete',
        clearedCacheItems: eodCacheKeys.length,
        message: `Cleared ${eodCacheKeys.length} cached items from EOD service`
      };
    }
    
    // Reset Brave API Manager
    if (resetServices.includes('all') || resetServices.includes('brave') || resetServices.includes('manager')) {
      results.details.braveManager = braveAPIManager.reset();
    }
    
    // Reset Brave News Service
    if (resetServices.includes('all') || resetServices.includes('brave') || resetServices.includes('news')) {
      results.details.braveNews = braveNewsService.resetService();
    }
    
    // Reset Brave Insights Service
    if (resetServices.includes('all') || resetServices.includes('brave') || resetServices.includes('insights')) {
      results.details.braveInsights = braveInsightsService.resetService();
    }
    
    // Reset Brave Sentiment Service
    if (resetServices.includes('all') || resetServices.includes('brave') || resetServices.includes('sentiment')) {
      results.details.braveSentiment = braveService.resetService();
    }
    
    // Reset AI Service
    if (resetServices.includes('all') || resetServices.includes('mistral') || resetServices.includes('ai')) {
      // AI service doesn't have reset or cache methods
      results.details.ai = {
        status: 'skipped',
        message: 'AI service does not support reset operation'
      };
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error resetting APIs:', error);
    res.status(500).json({
      error: 'Error resetting APIs',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/health-check/brave
 * @desc    Get detailed Brave API health status
 * @access  Public
 */
router.get('/brave', async (req, res) => {
  try {
    // Get API manager status
    const managerStatus = braveAPIManager.getStatus();
    
    // Check services status
    const newsStatus = await braveNewsService.checkApiStatus();
    
    // Get cache stats
    const newsCacheKeys = braveNewsService.cache.keys();
    const insightsCacheKeys = braveInsightsService.cache.keys();
    const sentimentCacheKeys = braveService.cache.keys();
    
    res.json({
      timestamp: new Date().toISOString(),
      status: newsStatus.status,
      manager: {
        isRateLimited: managerStatus.isRateLimited,
        rateLimitResetTime: managerStatus.rateLimitResetTime ? new Date(managerStatus.rateLimitResetTime).toISOString() : null,
        circuitOpen: managerStatus.circuitOpen,
        circuitResetTime: managerStatus.circuitResetTime ? new Date(managerStatus.circuitResetTime).toISOString() : null,
        queueLength: managerStatus.queueLength,
        backoff: Math.round(managerStatus.currentBackoff / 1000),
        consecutiveErrors: managerStatus.consecutiveErrors,
        quota: {
          used: managerStatus.quotaUsed,
          limit: managerStatus.quotaLimit,
          remaining: managerStatus.quotaLimit - managerStatus.quotaUsed,
          percentUsed: Math.round(managerStatus.quotaUsed / managerStatus.quotaLimit * 100)
        }
      },
      cache: {
        news: {
          keys: newsCacheKeys.length,
          items: newsCacheKeys.map(key => ({ key, ttl: braveNewsService.cache.getTtl(key) }))
        },
        insights: {
          keys: insightsCacheKeys.length,
          items: insightsCacheKeys.map(key => ({ key, ttl: braveInsightsService.cache.getTtl(key) }))
        },
        sentiment: {
          keys: sentimentCacheKeys.length,
          items: sentimentCacheKeys.map(key => ({ key, ttl: braveService.cache.getTtl(key) }))
        }
      }
    });
  } catch (error) {
    console.error('Error getting Brave API health status:', error);
    res.status(500).json({
      error: 'Error getting Brave API health status',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/health-check/eod
 * @desc    Get detailed EOD API health status and cache data
 * @access  Public
 */
router.get('/eod', async (req, res) => {
  try {
    // Get EOD service status
    const eodStatus = await eodService.checkAPIStatus();
    
    // Get cache stats
    const cacheKeys = eodService.cache.keys();
    const cacheStats = cacheKeys.reduce((stats, key) => {
      // Group cache keys by type
      if (key.startsWith('stock_')) {
        stats.stockData.push(key);
      } else if (key.startsWith('eod_')) {
        stats.historicalData.push(key);
      } else {
        stats.other.push(key);
      }
      return stats;
    }, { stockData: [], historicalData: [], other: [] });
    
    // Get sample of cache data for debugging
    const sampleData = {};
    
    // Sample stock data
    if (cacheStats.stockData.length > 0) {
      const sampleKey = cacheStats.stockData[0];
      sampleData.stockData = {
        key: sampleKey,
        value: eodService.cache.get(sampleKey),
        ttl: eodService.cache.getTtl(sampleKey)
      };
    }
    
    // Sample historical data
    if (cacheStats.historicalData.length > 0) {
      const sampleKey = cacheStats.historicalData[0];
      const data = eodService.cache.get(sampleKey);
      sampleData.historicalData = {
        key: sampleKey,
        length: data ? data.length : 0,
        firstPoint: data && data.length ? data[0] : null,
        lastPoint: data && data.length ? data[data.length - 1] : null,
        ttl: eodService.cache.getTtl(sampleKey)
      };
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      status: eodStatus.status,
      apiKey: eodStatus.apiKey,
      baseUrl: eodStatus.baseUrl,
      cache: {
        totalKeys: cacheKeys.length,
        stockDataKeys: cacheStats.stockData.length,
        historicalDataKeys: cacheStats.historicalData.length,
        otherKeys: cacheStats.other.length,
        keys: {
          stockData: cacheStats.stockData,
          historicalData: cacheStats.historicalData,
          other: cacheStats.other
        },
        sampleData
      }
    });
  } catch (error) {
    console.error('Error getting EOD API health status:', error);
    res.status(500).json({
      error: 'Error getting EOD API health status',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/health-check/force-fresh
 * @desc    Force fresh data for a specific endpoint
 * @access  Public
 */
router.get('/force-fresh', async (req, res) => {
  try {
    const { endpoint } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({
        error: 'Missing endpoint parameter',
        message: 'Please specify an endpoint to force fresh data for'
      });
    }
    
    let result;
    let success = true;
    let message = 'Successfully fetched fresh data';
    
    try {
      // Route the request to the appropriate service based on the endpoint
      if (endpoint === 'market-data' || endpoint === 'indices') {
        // Force fresh market data
        result = await eodService.getMainIndices();
      } else if (endpoint === 'sectors') {
        // Force fresh sector data
        result = await eodService.getSectorPerformance();
      } else if (endpoint.startsWith('history/')) {
        // Force fresh historical data for a symbol
        const symbol = endpoint.replace('history/', '');
        result = await eodService.getHistory(symbol, 12, true); // 12 months with force fresh
      } else if (endpoint.startsWith('quote/')) {
        // Force fresh quote for a symbol
        const symbol = endpoint.replace('quote/', '');
        result = await eodService.getQuote(symbol, true); // Force fresh
      } else if (endpoint === 'news') {
        // Force fresh news
        result = await braveNewsService.getMarketNews(true); // Force fresh
      } else {
        success = false;
        message = `Unknown endpoint: ${endpoint}`;
      }
    } catch (error) {
      success = false;
      message = `Error fetching fresh data: ${error.message}`;
      console.error(`Error forcing fresh data for ${endpoint}:`, error);
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      endpoint,
      success,
      message,
      data: result
    });
  } catch (error) {
    console.error('Error forcing fresh data:', error);
    res.status(500).json({
      error: 'Error forcing fresh data',
      message: error.message
    });
  }
});

export default router;
