/**
 * API Key Diagnostic Tool
 * Tests all API keys directly to identify authentication issues
 * 
 * Usage:
 * node api-key-diagnostic.js
 */
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Logger utility
const logger = {
  info: (msg) => console.log(`${colors.blue}ℹ ${colors.reset}${msg}`),
  success: (msg) => console.log(`${colors.green}✓ ${colors.reset}${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${colors.reset}${msg}`),
  error: (msg) => console.log(`${colors.red}✗ ${colors.reset}${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.magenta}=== ${msg} ===${colors.reset}\n`)
};

// API Configuration
const apiConfigs = {
  eod: {
    name: 'EOD Historical Data API',
    envKeyName: 'EOD_API_KEY',
    baseUrl: 'https://eodhd.com/api/real-time/AAPL.US',
    testFunction: testEODApi,
    keyFormat: 'Plain alphanumeric (no prefix)',
    paramName: 'api_token'
  },
  brave: {
    name: 'Brave Search API',
    envKeyName: 'BRAVE_API_KEY',
    baseUrl: 'https://api.search.brave.com/res/v1/news/search',
    testFunction: testBraveApi,
    keyFormat: 'BSAFHxxxxx (no prefix in headers)',
    headerName: 'X-Subscription-Token'
  },
  mistral: {
    name: 'Mistral AI API',
    envKeyName: 'MISTRAL_API_KEY',
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    testFunction: testMistralApi,
    keyFormat: 'Bearer format in Authorization header',
    headerName: 'Authorization'
  },
  fred: {
    name: 'FRED API',
    envKeyName: 'FRED_API_KEY',
    baseUrl: 'https://api.stlouisfed.org/fred/series',
    testFunction: testFredApi,
    keyFormat: 'Plain alphanumeric (no prefix)',
    paramName: 'api_key'
  }
};

/**
 * Test EOD API with multiple parameter formats
 */
async function testEODApi(apiKey) {
  const results = {
    success: false,
    formats: {}
  };
  
  // Format 1: Standard api_token parameter
  try {
    logger.info('Testing EOD API with standard parameter format');
    const response = await axios.get(apiConfigs.eod.baseUrl, {
      params: {
        api_token: apiKey,
        fmt: 'json'
      },
      timeout: 10000
    });
    
    if (response.status === 200 && response.data) {
      logger.success('EOD API (Standard format) - SUCCESS');
      results.formats.standard = {
        success: true,
        status: response.status
      };
      results.success = true;
    }
  } catch (error) {
    logger.error(`EOD API (Standard format) - FAILED: ${error.message}`);
    results.formats.standard = {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
  
  return results;
}

/**
 * Test Brave API with multiple header formats
 */
async function testBraveApi(apiKey) {
  const results = {
    success: false,
    formats: {}
  };
  
  // Format 1: Standard X-Subscription-Token header
  try {
    logger.info('Testing Brave API with X-Subscription-Token header');
    const response = await axios.get(apiConfigs.brave.baseUrl, {
      params: {
        q: 'market news',
        count: 1
      },
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
        'Accept-Encoding': 'gzip'
      },
      timeout: 10000
    });
    
    if (response.status === 200 && response.data) {
      logger.success('Brave API (X-Subscription-Token) - SUCCESS');
      results.formats.standard = {
        success: true,
        status: response.status
      };
      results.success = true;
    }
  } catch (error) {
    logger.error(`Brave API (X-Subscription-Token) - FAILED: ${error.message}`);
    results.formats.standard = {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
  
  // Format 2: Try with prefix
  try {
    // Only try with prefix if the original key doesn't already start with "Bearer "
    if (!apiKey.startsWith('Bearer ')) {
      logger.info('Testing Brave API with "Bearer" prefix');
      const response = await axios.get(apiConfigs.brave.baseUrl, {
        params: {
          q: 'market news',
          count: 1
        },
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': `Bearer ${apiKey}`,
          'Accept-Encoding': 'gzip'
        },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data) {
        logger.success('Brave API (with Bearer prefix) - SUCCESS');
        results.formats.bearer = {
          success: true,
          status: response.status
        };
        results.success = true;
      }
    }
  } catch (error) {
    logger.error(`Brave API (with Bearer prefix) - FAILED: ${error.message}`);
    results.formats.bearer = {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
  
  return results;
}

/**
 * Test Mistral API with multiple header formats
 */
async function testMistralApi(apiKey) {
  const results = {
    success: false,
    formats: {}
  };
  
  // Test data for Mistral API
  const requestData = {
    model: 'mistral-small-latest',
    messages: [
      { role: 'user', content: 'Say hello' }
    ],
    max_tokens: 5
  };
  
  // Format 1: Bearer token in Authorization header
  try {
    const authHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
    logger.info('Testing Mistral API with Authorization Bearer header');
    
    const response = await axios.post(
      apiConfigs.mistral.baseUrl,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        timeout: 10000
      }
    );
    
    if (response.status === 200 && response.data) {
      logger.success('Mistral API (Authorization Bearer) - SUCCESS');
      results.formats.bearer = {
        success: true,
        status: response.status
      };
      results.success = true;
    }
  } catch (error) {
    logger.error(`Mistral API (Authorization Bearer) - FAILED: ${error.message}`);
    results.formats.bearer = {
      success: false,
      error: error.message,
      status: error.response?.status
    };
    
    // If this fails with 401 and key has a mistral- prefix, try stripping it
    if (error.response?.status === 401 && apiKey.toLowerCase().startsWith('mistral-')) {
      try {
        const strippedKey = apiKey.substring(8); // remove 'mistral-' prefix
        logger.info('Testing Mistral API with stripped prefix');
        
        const response = await axios.post(
          apiConfigs.mistral.baseUrl,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${strippedKey}`
            },
            timeout: 10000
          }
        );
        
        if (response.status === 200 && response.data) {
          logger.success('Mistral API (stripped prefix) - SUCCESS');
          results.formats.strippedPrefix = {
            success: true,
            status: response.status,
            message: 'Key works when "mistral-" prefix is removed'
          };
          results.success = true;
        }
      } catch (innerError) {
        logger.error(`Mistral API (stripped prefix) - FAILED: ${innerError.message}`);
        results.formats.strippedPrefix = {
          success: false,
          error: innerError.message,
          status: innerError.response?.status
        };
      }
    }
  }
  
  return results;
}

/**
 * Test FRED API
 */
async function testFredApi(apiKey) {
  const results = {
    success: false,
    formats: {}
  };
  
  // Format 1: Standard api_key parameter
  try {
    logger.info('Testing FRED API with standard parameter format');
    const response = await axios.get(apiConfigs.fred.baseUrl, {
      params: {
        series_id: 'GDP',
        api_key: apiKey,
        file_type: 'json'
      },
      timeout: 10000
    });
    
    if (response.status === 200 && response.data) {
      logger.success('FRED API (Standard format) - SUCCESS');
      results.formats.standard = {
        success: true,
        status: response.status
      };
      results.success = true;
    }
  } catch (error) {
    logger.error(`FRED API (Standard format) - FAILED: ${error.message}`);
    results.formats.standard = {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
  
  return results;
}

/**
 * Check .env file location and content
 */
function checkEnvFile() {
  logger.section('Checking .env File');
  
  // Check current directory
  const currentDir = process.cwd();
  const envPath = path.join(currentDir, '.env');
  
  if (fs.existsSync(envPath)) {
    logger.success(`Found .env file at: ${envPath}`);
    
    // Read file content without exposing keys
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    logger.info(`Found ${lines.length} lines in .env file`);
    
    // Check for each expected key
    for (const [apiKey, config] of Object.entries(apiConfigs)) {
      const keyExists = lines.some(line => line.startsWith(`${config.envKeyName}=`));
      if (keyExists) {
        logger.success(`Found ${config.envKeyName} in .env file`);
      } else {
        logger.error(`Missing ${config.envKeyName} in .env file`);
      }
    }
  } else {
    logger.error(`No .env file found at: ${envPath}`);
    logger.info('Checking for environment variables anyway...');
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  logger.section('Checking Environment Variables');
  
  for (const [apiKey, config] of Object.entries(apiConfigs)) {
    const value = process.env[config.envKeyName];
    
    if (value) {
      const maskedValue = value.substring(0, 5) + '...' + value.substring(value.length - 3);
      logger.success(`${config.envKeyName}: Set (${maskedValue})`);
      
      // Output key format information
      logger.info(`Expected format: ${config.keyFormat}`);
      
      // Check for common issues
      if (config.envKeyName === 'BRAVE_API_KEY' && !value.startsWith('BSAF')) {
        logger.warn('Brave API key should typically start with "BSAF"');
      }
      
      if (config.envKeyName === 'MISTRAL_API_KEY' && value.startsWith('mistral-')) {
        logger.warn('Mistral API key has "mistral-" prefix which might need to be removed when used in Authorization header');
      }
    } else {
      logger.error(`${config.envKeyName}: Not set`);
    }
  }
}

/**
 * Run test for each API
 */
async function testAllApis() {
  logger.section('Testing APIs');
  
  const results = {};
  
  for (const [apiKey, config] of Object.entries(apiConfigs)) {
    logger.info(`\nTesting ${config.name}...`);
    
    const value = process.env[config.envKeyName];
    if (!value) {
      logger.error(`${config.envKeyName} is not set, skipping test`);
      results[apiKey] = {
        success: false,
        error: 'API key not set'
      };
      continue;
    }
    
    try {
      results[apiKey] = await config.testFunction(value);
    } catch (error) {
      logger.error(`Error testing ${config.name}: ${error.message}`);
      results[apiKey] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results) {
  logger.section('Recommendations');
  
  let recommendations = [];
  
  // Check each API result
  for (const [apiKey, config] of Object.entries(apiConfigs)) {
    const result = results[apiKey];
    
    if (!result) continue;
    
    if (!result.success) {
      // API failed completely
      if (apiKey === 'brave') {
        recommendations.push(`
Brave API failed with all tested formats. Try these solutions:
1. Verify your Brave API key is correct and active
2. Check if you've exceeded your monthly quota (2000 requests for free tier)
3. Update the request parameters to match Brave API requirements
4. Try disabling 'Accept-Encoding: gzip' header
5. Contact Brave API support if issues persist
        `);
      } else if (apiKey === 'eod') {
        recommendations.push(`
EOD API failed with all tested formats. Try these solutions:
1. Verify your EOD API key is correct and active
2. Make sure you're using the latest API endpoint URLs
3. Check if you've exceeded your API quota
        `);
      } else if (apiKey === 'mistral') {
        recommendations.push(`
Mistral API failed with all tested formats. Try these solutions:
1. Make sure your Mistral API key is correct and active
2. If your key starts with "mistral-", try removing this prefix when using it
3. Use the correct model name in your requests ('mistral-small-latest')
        `);
      }
    } else {
      // API succeeded with at least one format
      if (apiKey === 'brave' && result.formats.bearer?.success && !result.formats.standard?.success) {
        recommendations.push(`
Brave API works with 'Bearer' prefix, but not without it. Update braveAPIManager.js to use:
headers: {
  'X-Subscription-Token': \`Bearer \${this.apiKey}\`
}
        `);
      } else if (apiKey === 'mistral' && result.formats.strippedPrefix?.success) {
        recommendations.push(`
Mistral API works when the "mistral-" prefix is removed. Update mistralService.js to strip this prefix:
const apiKey = process.env.MISTRAL_API_KEY.startsWith('mistral-') 
  ? process.env.MISTRAL_API_KEY.substring(8) 
  : process.env.MISTRAL_API_KEY;
        `);
      }
    }
  }
  
  if (recommendations.length === 0) {
    logger.success('All APIs functioning correctly! No recommendations needed.');
  } else {
    recommendations.forEach(rec => {
      console.log(rec.trim());
    });
  }
}

/**
 * Save test results to file
 */
function saveResults(results) {
  const timestamp = new Date().toISOString();
  const filePath = path.join(process.cwd(), 'api-diagnostic-results.json');
  
  const output = {
    timestamp,
    results: {
      eod: results.eod?.success || false,
      brave: results.brave?.success || false,
      mistral: results.mistral?.success || false,
      fred: results.fred?.success || false
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  logger.success(`Results saved to: ${filePath}`);
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bold}${colors.cyan}=== API KEY DIAGNOSTIC TOOL ===${colors.reset}\n`);
  console.log(`${colors.cyan}Timestamp: ${new Date().toISOString()}${colors.reset}\n`);
  
  // Check .env file and environment variables
  checkEnvFile();
  checkEnvironmentVariables();
  
  // Test APIs
  const results = await testAllApis();
  
  // Generate recommendations
  generateRecommendations(results);
  
  // Save results
  saveResults(results);
  
  console.log(`\n${colors.bold}${colors.cyan}=== DIAGNOSTIC COMPLETE ===${colors.reset}\n`);
}

// Run main function
main().catch(error => {
  console.error('Error running diagnostics:', error);
});
