/**
 * API Connectivity Test Utility
 * 
 * Provides test endpoints and utilities to verify connectivity between frontend and backend,
 * validate API keys, and test CORS proxy functionality.
 */

import express from 'express';
import axios from 'axios';

// Create router
const router = express.Router();

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend connectivity test successful',
    timestamp: new Date().toISOString(),
    serverInfo: {
      node: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime())
    }
  });
});

// CORS test endpoint
router.get('/cors-test', (req, res) => {
  const origin = req.headers.origin || 'Unknown';
  
  res.json({
    status: 'ok',
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    requestInfo: {
      origin,
      method: req.method,
      path: req.path,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      }
    }
  });
});

// API key validation endpoint
router.get('/api-keys', (req, res) => {
  // Get API keys from environment
  const eodApiKey = process.env.EOD_API_KEY || '';
  const braveApiKey = process.env.BRAVE_API_KEY || '';
  const mistralApiKey = process.env.MISTRAL_API_KEY || '';
  
  // Check if keys are valid (not checking actual API response, just format)
  const eodKeyValid = eodApiKey && eodApiKey.length > 10;
  const braveKeyValid = braveApiKey && braveApiKey.length > 10;
  const mistralKeyValid = mistralApiKey && mistralApiKey.length > 10;
  
  res.json({
    status: 'ok',
    message: 'API key validation check',
    timestamp: new Date().toISOString(),
    keys: {
      eodApi: {
        status: eodKeyValid ? 'valid' : 'invalid',
        key: eodKeyValid ? `${eodApiKey.substring(0, 5)}...` : null
      },
      braveApi: {
        status: braveKeyValid ? 'valid' : 'invalid',
        key: braveKeyValid ? `${braveApiKey.substring(0, 5)}...` : null
      },
      mistralApi: {
        status: mistralKeyValid ? 'valid' : 'invalid',
        key: mistralKeyValid ? `${mistralApiKey.substring(0, 5)}...` : null
      }
    }
  });
});

// Proxy connectivity test
router.get('/proxy-test', async (req, res) => {
  try {
    const proxyUrl = 'http://localhost:8080';
    const targetUrl = 'http://localhost:5000/api/connectivity/ping';
    
    const directResult = await axios.get('http://localhost:5000/api/connectivity/ping', { timeout: 3000 })
      .catch(err => ({ error: err.message }));
    
    let proxyResult;
    try {
      proxyResult = await axios.get(`${proxyUrl}/api/connectivity/ping`, { timeout: 3000 });
    } catch (error) {
      proxyResult = { error: error.message };
    }
    
    res.json({
      status: 'ok',
      message: 'Proxy connectivity test',
      timestamp: new Date().toISOString(),
      results: {
        direct: directResult.data || directResult,
        proxy: proxyResult.data || proxyResult,
        proxyWorking: proxyResult.data && proxyResult.data.status === 'ok'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error testing proxy connectivity',
      error: error.message
    });
  }
});

// Full connectivity test (tests all endpoints used by the dashboard)
router.get('/full-test', async (req, res) => {
  const testResults = {
    timestamp: new Date().toISOString(),
    baseConnectivity: true,
    endpointTests: {}
  };
  
  // Test endpoints
  const endpoints = [
    '/api/market/data',
    '/api/market/indices',
    '/api/market/sectors',
    '/api/market/history/SPY.US',
    '/api/market/macro',
    '/api/market-environment/score',
    '/api/enhanced-market/industry-analysis/all',
    '/api/enhanced-market/macro-analysis/all'
  ];
  
  // Run tests in parallel
  const testPromises = endpoints.map(async (endpoint) => {
    try {
      const response = await axios.get(`http://localhost:5000${endpoint}`, { timeout: 5000 });
      const success = response.status >= 200 && response.status < 300;
      
      testResults.endpointTests[endpoint] = {
        status: success ? 'ok' : 'error',
        statusCode: response.status,
        responseTime: response.headers['x-response-time'] || 'unknown',
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data
      };
      
      return true;
    } catch (error) {
      testResults.baseConnectivity = false;
      testResults.endpointTests[endpoint] = {
        status: 'error',
        error: error.message,
        statusCode: error.response?.status || 'unknown'
      };
      
      return false;
    }
  });
  
  // Wait for all tests to complete
  await Promise.all(testPromises);
  
  // Count successful tests
  const successCount = Object.values(testResults.endpointTests)
    .filter(result => result.status === 'ok').length;
  
  testResults.summary = {
    success: `${successCount}/${endpoints.length}`,
    percentage: Math.round(successCount / endpoints.length * 100),
    dashboard: successCount >= endpoints.length - 1 ? 'ready' : 'issues-detected'
  };
  
  res.json(testResults);
});

export default router;
