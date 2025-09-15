import express from 'express';
import eodService from '../services/eodService.js';
import unifiedGptOssService from '../services/unifiedGptOssService.js';
import braveNewsService from '../services/braveNewsService.js';
import axios from 'axios';
import fredService from '../services/fredService.js';

const router = express.Router();

/**
 * Comprehensive API health check endpoint
 * Tests connectivity to all external APIs and internal services
 */
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const results = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.1.0',
    uptime: process.uptime(),
    apis: {},
    services: {},
    endpoints: {}
  };
  
  try {
    // Check EOD API
    try {
      const eodHealth = eodService.getHealthStatus();
      results.apis.eod = {
        status: eodHealth.isHealthy ? 'healthy' : 'degraded',
        lastChecked: eodHealth.lastChecked ? new Date(eodHealth.lastChecked).toISOString() : null,
        baseURL: eodHealth.currentBaseURL,
        failedEndpointCount: eodHealth.failedEndpoints ? Object.keys(eodHealth.failedEndpoints).length : 0,
        dailyApiCalls: eodHealth.dailyApiCalls,
        dailyApiLimit: eodHealth.dailyApiLimit,
        dailyApiUsagePercent: eodHealth.dailyApiUsagePercent,
        circuitBreakerStatus: eodHealth.circuitBreakerStatus,
        queueStats: eodHealth.queueStats
      };
      
      // If we have any failed endpoints, mark the API as degraded
      if (results.apis.eod.failedEndpointCount > 0) {
        results.apis.eod.status = 'degraded';
        results.status = 'degraded';
      }
    } catch (eodError) {
      results.apis.eod = {
        status: 'error',
        error: eodError.message
      };
      results.status = 'degraded';
    }
    
    // Check Brave News API
    try {
      const braveStatus = await braveNewsService.checkApiStatus();
      results.apis.brave = {
        status: braveStatus.status === 'active' ? 'healthy' : 'degraded',
        itemCount: braveStatus.itemCount,
        error: braveStatus.error
      };
      
      if (braveStatus.status !== 'active') {
        results.status = 'degraded';
      }
    } catch (braveError) {
      results.apis.brave = {
        status: 'error',
        error: braveError.message
      };
      results.status = 'degraded';
    }
    
    // Check Mistral AI API
    try {
      const mistralHealth = await unifiedGptOssService.healthCheck();
      results.apis.mistral = {
        status: mistralHealth.clientInitialized ? 'healthy' : 'degraded',
        initialized: mistralHealth.clientInitialized,
        endpoint: mistralHealth.endpoint,
        model: mistralHealth.model
      };
      
      if (!mistralHealth.clientInitialized) {
        results.status = 'degraded';
      }
    } catch (mistralError) {
      results.apis.mistral = {
        status: 'error',
        error: mistralError.message
      };
      results.status = 'degraded';
    }
    
    // Check API keys present
    results.apis.keys = {
      eod: Boolean(process.env.EOD_API_KEY),
      brave: Boolean(process.env.BRAVE_API_KEY),
      mistral: Boolean(process.env.MISTRAL_API_KEY),
      fred: Boolean(process.env.FRED_API_KEY)
    };
    
    // Check a few key endpoints
    const endpoints = [
      { name: 'market-data', path: '/api/market/data' },
      { name: 'macro', path: '/api/market/macro' },
      { name: 'sectors', path: '/api/market/sectors' },
      { name: 'news', path: '/api/market/news' }
    ];
    
    const endpointPromises = endpoints.map(async (endpoint) => {
      try {
        const url = `http://localhost:${process.env.PORT || 5000}${endpoint.path}`;
        const start = Date.now();
        const response = await axios.get(url, { timeout: 2000 });
        const duration = Date.now() - start;
        
        return {
          name: endpoint.name,
          status: response.status >= 200 && response.status < 300 ? 'ok' : 'error',
          responseTime: duration,
          statusCode: response.status
        };
      } catch (error) {
        return {
          name: endpoint.name,
          status: 'error',
          error: error.message,
          statusCode: error.response?.status
        };
      }
    });
    
    const endpointResults = await Promise.allSettled(endpointPromises);
    
    endpointResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.endpoints[endpoints[index].name] = result.value;
        
        // Mark overall status as degraded if any endpoint is failing
        if (result.value.status !== 'ok') {
          results.status = 'degraded';
        }
      } else {
        results.endpoints[endpoints[index].name] = {
          status: 'error',
          error: result.reason.message
        };
        results.status = 'degraded';
      }
    });
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    results.resources = {
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      }
    };
    
    // Add response time
    results.responseTime = Date.now() - startTime;
    
    res.json(results);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Simple health check endpoint
 * Just returns basic status without running extensive tests
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.1.0'
  });
});

/**
 * EOD API specific health check
 * Tests connectivity to the EOD API and returns detailed status
 */
router.get('/eod', async (req, res) => {
  try {
    const eodHealth = eodService.getHealthStatus();
    
    res.json({
      status: eodHealth.isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      baseURL: eodHealth.currentBaseURL,
      lastChecked: eodHealth.lastChecked ? new Date(eodHealth.lastChecked).toISOString() : null,
      failedEndpoints: eodHealth.failedEndpoints || {},
      dailyApiCalls: eodHealth.dailyApiCalls,
      dailyApiLimit: eodHealth.dailyApiLimit,
      dailyApiUsagePercent: eodHealth.dailyApiUsagePercent,
      circuitBreakerStatus: eodHealth.circuitBreakerStatus,
      queueStats: eodHealth.queueStats
    });
  } catch (error) {
    console.error('EOD API health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Reset circuit breakers for all API services
 * This helps recover from rate limiting without restarting the server
 */
router.post('/reset-circuit-breakers', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    // Reset EOD circuit breaker if available
    try {
      if (typeof eodService.resetCircuitBreaker === 'function') {
        const resetResult = eodService.resetCircuitBreaker();
        results.services.eod = {
          status: 'reset',
          message: 'EOD API circuit breaker reset successfully',
          details: resetResult
        };
      } else {
        results.services.eod = {
          status: 'skipped',
          message: 'Reset method not available'
        };
      }
    } catch (eodError) {
      results.services.eod = {
        status: 'error',
        error: eodError.message
      };
    }
    
    // Clear Brave news cache
    try {
      if (typeof braveNewsService.clearCache === 'function') {
        braveNewsService.clearCache();
        results.services.brave = {
          status: 'reset',
          message: 'Brave News Service cache cleared successfully'
        };
      } else {
        results.services.brave = {
          status: 'skipped',
          message: 'Cache clear method not available'
        };
      }
    } catch (braveError) {
      results.services.brave = {
        status: 'error',
        error: braveError.message
      };
    }
    
    // Clear AI cache
    try {
      // AI service doesn't have a clearCache method
      results.services.ai = {
        status: 'skipped',
        message: 'Cache clear method not available'
      };
    } catch (aiError) {
      results.services.ai = {
        status: 'error',
        error: aiError.message
      };
    }
    
    // Return combined results
    res.json({
      message: 'Circuit breaker reset operation completed',
      ...results
    });
  } catch (error) {
    console.error('Error resetting circuit breakers:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * API status endpoint
 * Check status of all API integrations
 */
router.get('/api-status', async (req, res) => {
  try {
    // Check EOD API status
    const eodStatus = await eodService.checkApiStatus();
    
    // Check Brave API status
    let braveStatus;
    try {
      braveStatus = await braveNewsService.checkApiStatus();
    } catch (braveError) {
      braveStatus = {
        status: 'error',
        error: braveError.message
      };
    }
    
    // Check FRED API status
    let fredStatus = { status: 'unknown' };
    try {
      const fredData = await fredService.getSeries('DGS10', { limit: 1 });
      fredStatus = {
        status: 'active',
        data: fredData && fredData.length > 0
      };
    } catch (fredError) {
      fredStatus = {
        status: 'error',
        error: fredError.message
      };
    }
    
    // Check Mistral API status
    let mistralStatus = await unifiedGptOssService.healthCheck();
    try {
      // Optionally try to generate a test message to verify API is working
      const result = await unifiedGptOssService.generate('You are a helpful assistant.', 'Provide a brief one-sentence test response.', { maxTokens: 50 });
      const testText = result.success ? result.content : null;
      mistralStatus.testResponse = testText ? 'success' : 'failed';
    } catch (mistralError) {
      mistralStatus.testResponse = 'failed';
      mistralStatus.testError = mistralError.message;
    }
    
    // Return combined status
    res.json({
      timestamp: new Date().toISOString(),
      services: {
        eod: eodStatus,
        brave: braveStatus,
        fred: fredStatus,
        mistral: mistralStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Test specific API endpoints
 * Lets you test individual API endpoints for diagnostics
 */
router.get('/test', async (req, res) => {
  try {
    const { endpoint } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({
        error: 'Missing endpoint parameter',
        message: 'Please provide an endpoint to test, e.g. /api/health/test?endpoint=market/data'
      });
    }
    
    // Clean and format the endpoint
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullEndpoint = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`;
    
    try {
      // Test the endpoint
      console.log(`Testing endpoint: ${fullEndpoint}`);
      const start = Date.now();
      const response = await axios.get(`http://localhost:${process.env.PORT || 5000}${fullEndpoint}`, {
        timeout: 5000
      });
      const duration = Date.now() - start;
      
      // Return results
      res.json({
        endpoint: fullEndpoint,
        status: 'success',
        statusCode: response.status,
        responseTime: `${duration}ms`,
        responseSize: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        endpoint: fullEndpoint,
        status: 'error',
        statusCode: error.response?.status,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to run endpoint test',
      message: error.message
    });
  }
});

export default router;
