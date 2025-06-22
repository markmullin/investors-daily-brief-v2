/**
 * API Diagnostic Tool
 * 
 * Comprehensive API testing and diagnostics for Investor's Daily Brief dashboard
 * Tests EOD API, Brave API, and Mistral API integrations
 * 
 * Run with: node api-diagnostic.js
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// API Keys from environment
const EOD_API_KEY = process.env.EOD_API_KEY || '';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

// Test symbols for EOD API
const TEST_SYMBOLS = ['SPY.US', 'QQQ.US', 'VIXY.US'];

// Test results
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    eod: false,
    brave: false,
    mistral: false,
    localBackend: false,
    corsProxy: false
  },
  tests: {
    environment: {},
    eod: {},
    brave: {},
    mistral: {},
    localBackend: {},
    corsProxy: {}
  },
  errors: [],
  fixes: []
};

// Console styling
const styles = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Print formatted message
function print(message, style = styles.reset) {
  console.log(`${style}${message}${styles.reset}`);
}

// Print section header
function printHeader(title) {
  console.log();
  print(`=== ${title.toUpperCase()} ===`, styles.bright + styles.cyan);
  console.log();
}

// Add a test result
function addTestResult(category, test, passed, message, data = null) {
  if (!testResults.tests[category]) {
    testResults.tests[category] = {};
  }
  
  testResults.tests[category][test] = {
    passed,
    message,
    data: data ? data : undefined
  };
  
  // Log the result
  const status = passed ? `${styles.green}✓ PASSED${styles.reset}` : `${styles.red}✗ FAILED${styles.reset}`;
  console.log(`${status} - ${message}`);
  
  // If data provided, log it
  if (data) {
    console.log('  Details:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  }
  
  // Add error if failed
  if (!passed) {
    testResults.errors.push({
      category,
      test,
      message
    });
  }
}

// Add a fix suggestion
function addFixSuggestion(category, issue, solution) {
  testResults.fixes.push({
    category,
    issue,
    solution
  });
  
  // Log the fix
  console.log(`${styles.yellow}! FIX${styles.reset} - ${issue}`);
  console.log(`  Solution: ${solution}`);
}

// Save test results to file
async function saveTestResults() {
  try {
    const filename = `api-diagnostic-results.json`;
    const filePath = path.join(__dirname, filename);
    
    await fs.writeFile(filePath, JSON.stringify(testResults, null, 2), 'utf8');
    
    print(`Test results saved to ${filename}`, styles.green);
  } catch (error) {
    print(`Error saving test results: ${error.message}`, styles.red);
  }
}

// Check environment variables
async function checkEnvironment() {
  printHeader('Environment Check');
  
  // Check EOD API Key
  const eodKeyOk = EOD_API_KEY && EOD_API_KEY.length > 10;
  addTestResult('environment', 'eod_api_key', eodKeyOk, 
    eodKeyOk ? 'EOD API Key is configured' : 'EOD API Key is missing or invalid');
  
  if (!eodKeyOk) {
    addFixSuggestion('environment', 'Missing or invalid EOD API Key', 
      'Add EOD_API_KEY=678aec6f82cd71.08686199 to your .env file');
  }
  
  // Check Brave API Key
  const braveKeyOk = BRAVE_API_KEY && BRAVE_API_KEY.length > 10;
  addTestResult('environment', 'brave_api_key', braveKeyOk, 
    braveKeyOk ? 'Brave API Key is configured' : 'Brave API Key is missing or invalid');
  
  if (!braveKeyOk) {
    addFixSuggestion('environment', 'Missing or invalid Brave API Key', 
      'Add BRAVE_API_KEY=BSAFHHikdsv2YXSYODQSPES2tTMILHI to your .env file');
  }
  
  // Check Mistral API Key
  const mistralKeyOk = MISTRAL_API_KEY && MISTRAL_API_KEY.length > 10;
  addTestResult('environment', 'mistral_api_key', mistralKeyOk, 
    mistralKeyOk ? 'Mistral API Key is configured' : 'Mistral API Key is missing or invalid');
  
  if (!mistralKeyOk) {
    addFixSuggestion('environment', 'Missing or invalid Mistral API Key', 
      'Add MISTRAL_API_KEY=mistral-8NPkpT6Z9SWnQAKVJk3j7NnJMDJlEbZC to your .env file');
  }
  
  // Check for .env file
  try {
    const envPath = path.join(__dirname, '.env');
    await fs.access(envPath);
    addTestResult('environment', 'env_file', true, '.env file exists');
  } catch (error) {
    addTestResult('environment', 'env_file', false, '.env file is missing');
    addFixSuggestion('environment', 'Missing .env file', 
      'Create a .env file in the backend directory with the required API keys');
  }
  
  // Check node version
  const nodeVersion = process.version;
  const nodeVersionNum = parseFloat(nodeVersion.substring(1));
  const nodeVersionOk = nodeVersionNum >= 16;
  
  addTestResult('environment', 'node_version', nodeVersionOk, 
    nodeVersionOk ? `Node.js version ${nodeVersion} is compatible` : `Node.js version ${nodeVersion} may be too old`,
    { version: nodeVersion, recommended: '>=16.0.0' });
  
  if (!nodeVersionOk) {
    addFixSuggestion('environment', 'Node.js version too old', 
      'Update Node.js to version 16 or later');
  }
}

// Test EOD API
async function testEodApi() {
  printHeader('EOD API Tests');
  
  if (!EOD_API_KEY || EOD_API_KEY.length < 10) {
    addTestResult('eod', 'api_key', false, 'EOD API Key is missing or invalid, skipping tests');
    return;
  }
  
  // Test EOD API connectivity
  try {
    const baseURL = 'https://eodhd.com/api';
    const response = await axios.get(`${baseURL}/real-time/AAPL.US`, {
      params: {
        api_token: EOD_API_KEY,
        fmt: 'json'
      },
      timeout: 10000
    });
    
    const data = response.data;
    const connectivityOk = data && typeof data === 'object' && (data.code || data.symbol);
    
    addTestResult('eod', 'connectivity', connectivityOk, 
      connectivityOk ? 'EOD API connection successful' : 'EOD API returned invalid data',
      connectivityOk ? { symbol: data.code || data.symbol } : data);
    
    // If connected but no valid data
    if (!connectivityOk) {
      addFixSuggestion('eod', 'EOD API returning invalid data', 
        'Check API key and verify account is active at https://eodhd.com/');
    }
  } catch (error) {
    addTestResult('eod', 'connectivity', false, `EOD API connection failed: ${error.message}`);
    
    // Add specific fix based on error
    if (error.response?.status === 401) {
      addFixSuggestion('eod', 'EOD API authentication failed', 
        'Check and update EOD_API_KEY in your .env file');
    } else if (error.code === 'ECONNABORTED') {
      addFixSuggestion('eod', 'EOD API connection timeout', 
        'Check network connection and firewall settings');
    } else {
      addFixSuggestion('eod', 'EOD API connection failed', 
        'Verify internet connection and API status at https://eodhd.com/status');
    }
    
    return; // Skip remaining tests if connectivity fails
  }
  
  // Test specific symbols with potential mapping issues
  for (const symbol of TEST_SYMBOLS) {
    try {
      const baseURL = 'https://eodhd.com/api';
      const response = await axios.get(`${baseURL}/real-time/${symbol}`, {
        params: {
          api_token: EOD_API_KEY,
          fmt: 'json'
        },
        timeout: 10000
      });
      
      const data = response.data;
      const symbolOk = data && typeof data === 'object' && (data.code || data.symbol);
      
      addTestResult('eod', `symbol_${symbol}`, symbolOk, 
        symbolOk ? `Symbol ${symbol} data retrieved successfully` : `Symbol ${symbol} returned invalid data`,
        symbolOk ? { price: data.close || data.price } : data);
      
      // If symbol fails but it's VIX
      if (!symbolOk && symbol.includes('VIX')) {
        addFixSuggestion('eod', `Symbol ${symbol} mapping issue`, 
          'Use VIXY.US as an alternative for VIX data in symbol mappings');
      }
    } catch (error) {
      addTestResult('eod', `symbol_${symbol}`, false, `Symbol ${symbol} test failed: ${error.message}`);
      
      // Add specific fix for VIX
      if (symbol.includes('VIX')) {
        addFixSuggestion('eod', `Symbol ${symbol} not available`, 
          'Update symbol mappings in eodService.js to use VIXY.US as an alternative');
      }
    }
  }
  
  // Test historical data
  try {
    const baseURL = 'https://eodhd.com/api';
    const response = await axios.get(`${baseURL}/eod/SPY.US`, {
      params: {
        api_token: EOD_API_KEY,
        period: '1m',
        fmt: 'json'
      },
      timeout: 15000
    });
    
    const data = response.data;
    const historyOk = Array.isArray(data) && data.length > 0;
    
    addTestResult('eod', 'historical_data', historyOk, 
      historyOk ? `Historical data retrieved (${data.length} points)` : 'Historical data retrieval failed',
      historyOk ? { points: data.length, firstDate: data[0].date } : data);
    
    if (!historyOk) {
      addFixSuggestion('eod', 'EOD historical data issue', 
        'Check period parameter and API limits in EOD account');
    }
  } catch (error) {
    addTestResult('eod', 'historical_data', false, `Historical data test failed: ${error.message}`);
    
    addFixSuggestion('eod', 'EOD historical data retrieval failed', 
      'Verify internet connection and check for rate limiting in EOD account');
  }
  
  // Update overall status
  testResults.summary.eod = 
    testResults.tests.eod.connectivity?.passed && 
    testResults.tests.eod.historical_data?.passed;
}

// Test Brave API
async function testBraveApi() {
  printHeader('Brave API Tests');
  
  if (!BRAVE_API_KEY || BRAVE_API_KEY.length < 10) {
    addTestResult('brave', 'api_key', false, 'Brave API Key is missing or invalid, skipping tests');
    return;
  }
  
  // Test Brave Search API
  try {
    const baseURL = 'https://api.search.brave.com/res/v1/web/search';
    const response = await axios.get(baseURL, {
      params: {
        q: 'stock market news',
        count: 5
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      },
      timeout: 10000
    });
    
    const data = response.data;
    const searchOk = data && data.web && Array.isArray(data.web.results);
    
    addTestResult('brave', 'search', searchOk, 
      searchOk ? `Brave Search API working (${data.web.results.length} results)` : 'Brave Search API returned invalid data',
      searchOk ? { resultCount: data.web.results.length } : data);
    
    if (!searchOk) {
      addFixSuggestion('brave', 'Brave Search API issues', 
        'Check API key and verify account status at https://brave.com/search/api/');
    }
  } catch (error) {
    addTestResult('brave', 'search', false, `Brave Search API test failed: ${error.message}`);
    
    if (error.response?.status === 401) {
      addFixSuggestion('brave', 'Brave API authentication failed', 
        'Check and update BRAVE_API_KEY in your .env file');
    } else if (error.response?.status === 429) {
      addFixSuggestion('brave', 'Brave API rate limited', 
        'Implement better rate limiting in braveService.js and reduce request frequency');
    } else {
      addFixSuggestion('brave', 'Brave Search API connection failed', 
        'Verify internet connection and Brave API status');
    }
  }
  
  // Test Brave News API
  try {
    const baseURL = 'https://api.search.brave.com/res/v1/news/search';
    const response = await axios.get(baseURL, {
      params: {
        q: 'stock market',
        count: 5
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      },
      timeout: 10000
    });
    
    const data = response.data;
    const newsOk = data && Array.isArray(data.results);
    
    addTestResult('brave', 'news', newsOk, 
      newsOk ? `Brave News API working (${data.results.length} results)` : 'Brave News API returned invalid data',
      newsOk ? { resultCount: data.results.length } : data);
    
    if (!newsOk) {
      addFixSuggestion('brave', 'Brave News API issues', 
        'Check response format in braveNewsService.js and update parser');
    }
  } catch (error) {
    addTestResult('brave', 'news', false, `Brave News API test failed: ${error.message}`);
    
    if (error.response?.status === 429) {
      addFixSuggestion('brave', 'Brave News API rate limited', 
        'Implement better rate limiting in braveNewsService.js and increase cache duration');
    } else {
      addFixSuggestion('brave', 'Brave News API connection failed', 
        'Check internet connection and verify API status');
    }
  }
  
  // Update overall status
  testResults.summary.brave = 
    testResults.tests.brave.search?.passed || 
    testResults.tests.brave.news?.passed;
}

// Test Mistral API
async function testMistralApi() {
  printHeader('Mistral API Tests');
  
  if (!MISTRAL_API_KEY || MISTRAL_API_KEY.length < 10) {
    addTestResult('mistral', 'api_key', false, 'Mistral API Key is missing or invalid, skipping tests');
    return;
  }
  
  // Test Mistral API connectivity with a simple completion
  try {
    const baseURL = 'https://api.mistral.ai/v1/chat/completions';
    const response = await axios.post(baseURL, 
      {
        model: 'mistral-tiny',
        messages: [
          { role: 'user', content: 'Hello, are you working?' }
        ],
        max_tokens: 20
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY.trim()}`
        },
        timeout: 15000
      }
    );
    
    const data = response.data;
    const completionOk = data && data.choices && data.choices.length > 0;
    
    addTestResult('mistral', 'connectivity', completionOk, 
      completionOk ? 'Mistral API connection successful' : 'Mistral API returned invalid data',
      completionOk ? { model: data.model, content: data.choices[0].message.content } : data);
    
    if (!completionOk) {
      addFixSuggestion('mistral', 'Mistral API invalid response', 
        'Check response format in mistralService.js and update parser');
    }
  } catch (error) {
    addTestResult('mistral', 'connectivity', false, `Mistral API connection failed: ${error.message}`);
    
    if (error.response?.status === 401) {
      addFixSuggestion('mistral', 'Mistral API authentication failed', 
        'Check and update MISTRAL_API_KEY in your .env file. Make sure to remove any "Bearer " prefix');
    } else if (error.response?.status === 429) {
      addFixSuggestion('mistral', 'Mistral API rate limited', 
        'Implement better rate limiting in mistralService.js with exponential backoff');
    } else {
      addFixSuggestion('mistral', 'Mistral API connection failed', 
        'Verify internet connection and check API status');
    }
    
    return; // Skip remaining tests if connectivity fails
  }
  
  // Test different models
  const models = ['mistral-tiny', 'mistral-small-latest'];
  
  for (const model of models) {
    try {
      const baseURL = 'https://api.mistral.ai/v1/chat/completions';
      const response = await axios.post(baseURL, 
        {
          model: model,
          messages: [
            { role: 'user', content: 'Give a one sentence answer: What are the pros and cons of index investing?' }
          ],
          max_tokens: 30
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY.trim()}`
          },
          timeout: 20000
        }
      );
      
      const data = response.data;
      const modelOk = data && data.choices && data.choices.length > 0;
      
      addTestResult('mistral', `model_${model}`, modelOk, 
        modelOk ? `Model ${model} working correctly` : `Model ${model} returned invalid data`,
        modelOk ? { content: data.choices[0].message.content } : data);
      
      if (!modelOk) {
        addFixSuggestion('mistral', `Model ${model} issues`, 
          `Update mistralService.js to use another model as fallback for ${model}`);
      }
    } catch (error) {
      addTestResult('mistral', `model_${model}`, false, `Model ${model} test failed: ${error.message}`);
      
      if (error.response?.status === 404) {
        addFixSuggestion('mistral', `Model ${model} not found`, 
          `Update model name in mistralService.js. Model ${model} may have been deprecated`);
      } else if (error.response?.status === 429) {
        addFixSuggestion('mistral', `Model ${model} rate limited`, 
          'Increase backoff parameters in mistralService.js');
      }
    }
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Update overall status
  testResults.summary.mistral = 
    testResults.tests.mistral.connectivity?.passed;
}

// Test local backend
async function testLocalBackend() {
  printHeader('Local Backend Tests');
  
  const backendUrl = 'http://localhost:5000';
  
  // Test if backend is running
  try {
    const response = await axios.get(`${backendUrl}/api/health`, { timeout: 3000 });
    const data = response.data;
    const healthOk = data && data.status === 'ok';
    
    addTestResult('localBackend', 'running', healthOk, 
      healthOk ? 'Backend server is running' : 'Backend returned invalid health data',
      healthOk ? { timestamp: data.timestamp } : data);
    
    if (!healthOk) {
      addFixSuggestion('localBackend', 'Backend health check issues', 
        'Check server.js and health endpoint implementation');
    }
  } catch (error) {
    const isConnectionRefused = error.code === 'ECONNREFUSED';
    
    addTestResult('localBackend', 'running', false, 
      isConnectionRefused ? 'Backend server is not running' : `Backend connectivity error: ${error.message}`);
    
    if (isConnectionRefused) {
      addFixSuggestion('localBackend', 'Backend server not running', 
        'Start the backend server using "node server.js" or "npm start" in the backend directory');
    } else {
      addFixSuggestion('localBackend', 'Backend connection issues', 
        'Check for firewall restrictions or port conflicts');
    }
    
    return; // Skip remaining tests if backend is not running
  }
  
  // Test API status endpoint
  try {
    const response = await axios.get(`${backendUrl}/api/status`, { timeout: 3000 });
    const data = response.data;
    const statusOk = data && data.status === 'ok' && data.apis;
    
    addTestResult('localBackend', 'api_status', statusOk, 
      statusOk ? 'Backend API status endpoint working' : 'Backend API status returned invalid data',
      statusOk ? { apis: data.apis } : data);
    
    // Check if APIs are configured
    if (statusOk) {
      const allApisConfigured = 
        data.apis.brave === 'configured' && 
        data.apis.eod === 'configured' && 
        data.apis.mistral === 'configured';
      
      addTestResult('localBackend', 'apis_configured', allApisConfigured, 
        allApisConfigured ? 'All APIs are configured in backend' : 'Some APIs are not configured in backend',
        data.apis);
      
      if (!allApisConfigured) {
        addFixSuggestion('localBackend', 'Missing API configurations', 
          'Check .env file for missing API keys and restart backend server');
      }
    }
  } catch (error) {
    addTestResult('localBackend', 'api_status', false, `Backend API status test failed: ${error.message}`);
    
    addFixSuggestion('localBackend', 'Backend API status endpoint issues', 
      'Check routes configuration and error handling');
  }
  
  // Test market data endpoint
  try {
    const response = await axios.get(`${backendUrl}/api/market/data`, { timeout: 5000 });
    const data = response.data;
    const marketDataOk = data && (Object.keys(data).length > 0 || Array.isArray(data));
    
    addTestResult('localBackend', 'market_data', marketDataOk, 
      marketDataOk ? 'Market data endpoint working' : 'Market data endpoint returned empty data',
      marketDataOk ? { dataType: Array.isArray(data) ? 'array' : 'object', items: Array.isArray(data) ? data.length : Object.keys(data).length } : data);
    
    if (!marketDataOk) {
      addFixSuggestion('localBackend', 'Market data endpoint issues', 
        'Check marketRoutes.js implementation and EOD API integration');
    }
  } catch (error) {
    addTestResult('localBackend', 'market_data', false, `Market data endpoint test failed: ${error.message}`);
    
    if (error.response?.status === 404) {
      addFixSuggestion('localBackend', 'Market data endpoint not found', 
        'Ensure market routes are correctly registered in index.js');
    } else {
      addFixSuggestion('localBackend', 'Market data endpoint error', 
        'Check error handling in marketRoutes.js');
    }
  }
  
  // Test missing route fixes
  const missingRoutes = [
    '/api/market-environment/score',
    '/api/enhanced-market/industry-analysis/all',
    '/api/enhanced-market/macro-analysis/all'
  ];
  
  for (const route of missingRoutes) {
    try {
      const response = await axios.get(`${backendUrl}${route}`, { timeout: 5000 });
      const data = response.data;
      const routeOk = data && typeof data === 'object';
      
      addTestResult('localBackend', `route_${route.split('/').pop()}`, routeOk, 
        routeOk ? `Fixed route ${route} is working` : `Fixed route ${route} returned invalid data`,
        routeOk ? { dataType: typeof data } : data);
      
      if (!routeOk) {
        addFixSuggestion('localBackend', `Route ${route} implementation issues`, 
          'Check fixMissingRoutes.js implementation for this endpoint');
      }
    } catch (error) {
      addTestResult('localBackend', `route_${route.split('/').pop()}`, false, `Route ${route} test failed: ${error.message}`);
      
      if (error.response?.status === 404) {
        addFixSuggestion('localBackend', `Route ${route} not implemented`, 
          'Add this route to fixMissingRoutes.js and ensure it\'s registered in routes/index.js');
      } else {
        addFixSuggestion('localBackend', `Route ${route} error`, 
          'Check error handling in the implementation');
      }
    }
  }
  
  // Update overall status
  testResults.summary.localBackend = 
    testResults.tests.localBackend.running?.passed && 
    testResults.tests.localBackend.api_status?.passed;
}

// Test CORS proxy
async function testCorsProxy() {
  printHeader('CORS Proxy Tests');
  
  const proxyUrl = 'http://localhost:8080';
  const targetUrl = 'http://localhost:5000/api/health';
  
  // Test if proxy is running
  try {
    const response = await axios.get(`${proxyUrl}/api/health`, { timeout: 3000 });
    const data = response.data;
    const proxyOk = data && data.status === 'ok';
    
    addTestResult('corsProxy', 'running', proxyOk, 
      proxyOk ? 'CORS proxy is running and working' : 'CORS proxy returned invalid data',
      proxyOk ? { timestamp: data.timestamp } : data);
    
    if (!proxyOk) {
      addFixSuggestion('corsProxy', 'CORS proxy issues', 
        'Check cors-proxy.js implementation');
    }
  } catch (error) {
    const isConnectionRefused = error.code === 'ECONNREFUSED';
    
    addTestResult('corsProxy', 'running', false, 
      isConnectionRefused ? 'CORS proxy is not running' : `CORS proxy connectivity error: ${error.message}`);
    
    if (isConnectionRefused) {
      addFixSuggestion('corsProxy', 'CORS proxy not running', 
        'Start the CORS proxy using "node cors-proxy.js" or the start-cors-proxy.bat script');
    } else {
      addFixSuggestion('corsProxy', 'CORS proxy connection issues', 
        'Check for firewall restrictions or port conflicts');
    }
    
    return; // Skip remaining tests if proxy is not running
  }
  
  // Test CORS headers
  try {
    const response = await axios.get(`${proxyUrl}/api/health`, { 
      timeout: 3000,
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    const corsHeadersOk = 
      response.headers['access-control-allow-origin'] && 
      response.headers['access-control-allow-methods'];
    
    addTestResult('corsProxy', 'cors_headers', corsHeadersOk, 
      corsHeadersOk ? 'CORS headers are properly set' : 'CORS headers are missing',
      corsHeadersOk ? { 
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods']
      } : response.headers);
    
    if (!corsHeadersOk) {
      addFixSuggestion('corsProxy', 'CORS headers not set correctly', 
        'Update cors-proxy.js to include proper CORS headers');
    }
  } catch (error) {
    addTestResult('corsProxy', 'cors_headers', false, `CORS headers test failed: ${error.message}`);
    
    addFixSuggestion('corsProxy', 'CORS headers test error', 
      'Check error handling in cors-proxy.js');
  }
  
  // Test OPTIONS request (preflight)
  try {
    const response = await axios({
      method: 'OPTIONS',
      url: `${proxyUrl}/api/health`,
      timeout: 3000,
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const preflightOk = response.status === 204 || response.status === 200;
    
    addTestResult('corsProxy', 'preflight', preflightOk, 
      preflightOk ? 'CORS preflight request working' : 'CORS preflight returned invalid status',
      { status: response.status });
    
    if (!preflightOk) {
      addFixSuggestion('corsProxy', 'CORS preflight not handled correctly', 
        'Update cors-proxy.js to handle OPTIONS requests properly');
    }
  } catch (error) {
    addTestResult('corsProxy', 'preflight', false, `CORS preflight test failed: ${error.message}`);
    
    addFixSuggestion('corsProxy', 'CORS preflight test error', 
      'Check OPTIONS method handling in cors-proxy.js');
  }
  
  // Update overall status
  testResults.summary.corsProxy = 
    testResults.tests.corsProxy.running?.passed && 
    testResults.tests.corsProxy.cors_headers?.passed;
}

// Generate final summary
function generateSummary() {
  printHeader('Test Summary');
  
  // Count passed and failed tests
  let totalTests = 0;
  let passedTests = 0;
  
  for (const category in testResults.tests) {
    for (const test in testResults.tests[category]) {
      totalTests++;
      if (testResults.tests[category][test].passed) {
        passedTests++;
      }
    }
  }
  
  // Calculate overall status
  const overallStatus = testResults.summary.eod && 
                        testResults.summary.brave && 
                        testResults.summary.mistral && 
                        testResults.summary.localBackend;
  
  // Print summary
  print(`Tests passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`, 
    passedTests === totalTests ? styles.green : passedTests > totalTests/2 ? styles.yellow : styles.red);
  
  console.log();
  print('Component Status:', styles.bright);
  print(`- EOD API: ${testResults.summary.eod ? styles.green + 'OK' + styles.reset : styles.red + 'Issues Detected' + styles.reset}`);
  print(`- Brave API: ${testResults.summary.brave ? styles.green + 'OK' + styles.reset : styles.red + 'Issues Detected' + styles.reset}`);
  print(`- Mistral API: ${testResults.summary.mistral ? styles.green + 'OK' + styles.reset : styles.red + 'Issues Detected' + styles.reset}`);
  print(`- Local Backend: ${testResults.summary.localBackend ? styles.green + 'OK' + styles.reset : styles.red + 'Issues Detected' + styles.reset}`);
  print(`- CORS Proxy: ${testResults.summary.corsProxy ? styles.green + 'OK' + styles.reset : styles.red + 'Issues Detected' + styles.reset}`);
  
  console.log();
  print('Overall Status:', styles.bright);
  print(overallStatus ? styles.green + 'READY' + styles.reset : styles.red + 'FIXES NEEDED' + styles.reset);
  
  // Print fixes if needed
  if (testResults.fixes.length > 0) {
    console.log();
    print(`Fixes Needed (${testResults.fixes.length}):`, styles.bright + styles.yellow);
    
    testResults.fixes.forEach((fix, index) => {
      print(`${index+1}. ${fix.category}: ${fix.issue}`, styles.yellow);
      print(`   Solution: ${fix.solution}`, styles.reset);
    });
  }
}

// Main function to run all tests
async function runTests() {
  print('Investor\'s Daily Brief - API Diagnostic Tool', styles.bright + styles.cyan);
  print('Running comprehensive API testing and diagnostics...', styles.reset);
  console.log();
  
  try {
    // Run all tests
    await checkEnvironment();
    await testEodApi();
    await testBraveApi();
    await testMistralApi();
    await testLocalBackend();
    await testCorsProxy();
    
    // Generate summary
    generateSummary();
    
    // Save test results
    await saveTestResults();
    
  } catch (error) {
    print(`Error running tests: ${error.message}`, styles.red);
    console.error(error);
  }
}

// Run tests
runTests();