import express from 'express';
import eodService from '../services/eodService.js';
import braveService from '../services/braveService.js';
import mistralService from '../services/mistralService.js';
import fredService from '../services/fredService.js';

const router = express.Router();

// Test individual endpoints
const testEndpoint = async (url, method = 'GET') => {
  try {
    const startTime = Date.now();
    const response = await fetch(`http://localhost:5000${url}`, { method });
    const endTime = Date.now();
    
    return {
      status: response.ok ? 'ok' : 'error',
      statusCode: response.status,
      responseTime: endTime - startTime
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

// Full connectivity test
router.get('/full-test', async (req, res) => {
  try {
    // Test critical endpoints
    const endpointTests = {
      '/api/health': await testEndpoint('/api/health'),
      '/api/market/data': await testEndpoint('/api/market/data'),
      '/api/market/sectors': await testEndpoint('/api/market/sectors'),
      '/api/market/sector-rotation': await testEndpoint('/api/market/sector-rotation'),
      '/api/market/news': await testEndpoint('/api/market/news'),
      '/api/market-environment/score': await testEndpoint('/api/market-environment/score'),
      '/api/enhanced-market/industry-analysis/all': await testEndpoint('/api/enhanced-market/industry-analysis/all'),
      '/api/enhanced-market/macro-analysis/all': await testEndpoint('/api/enhanced-market/macro-analysis/all')
    };
    
    // Test external API connectivity
    const apiTests = {
      eod: await eodService.checkAPIStatus(),
      brave: await braveService.checkApiStatus(),
      mistral: await mistralService.checkApiStatus(),
      fred: await fredService.checkApiStatus()
    };
    
    // Count failures
    const endpointFailures = Object.values(endpointTests).filter(test => test.status !== 'ok').length;
    const apiFailures = Object.values(apiTests).filter(test => test.status !== 'active').length;
    
    // Overall status
    const overallStatus = endpointFailures === 0 && apiFailures === 0 ? 'success' : 
                         endpointFailures > 3 || apiFailures > 2 ? 'critical' : 'partial';
    
    res.json({
      timestamp: new Date().toISOString(),
      endpointTests,
      apiTests,
      summary: {
        totalEndpoints: Object.keys(endpointTests).length,
        failedEndpoints: endpointFailures,
        totalApis: Object.keys(apiTests).length,
        failedApis: apiFailures,
        overallStatus,
        dashboard: overallStatus === 'success' ? 'ready' : 'not ready'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to run connectivity test',
      message: error.message
    });
  }
});

// Individual API status checks
router.get('/api-status/:service', async (req, res) => {
  try {
    const { service } = req.params;
    let status;
    
    switch (service) {
      case 'eod':
        status = await eodService.checkAPIStatus();
        break;
      case 'brave':
        status = await braveService.checkApiStatus();
        break;
      case 'mistral':
        status = await mistralService.checkApiStatus();
        break;
      case 'fred':
        status = await fredService.checkApiStatus();
        break;
      default:
        return res.status(400).json({ error: 'Invalid service name' });
    }
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check API status',
      message: error.message
    });
  }
});

export default router;