/**
 * Direct API Integration Test Script
 * Tests all API connections directly without service layers
 */
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API keys from environment
const EOD_API_KEY = process.env.EOD_API_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Configuration
const EOD_API_URL = 'https://eodhd.com/api/real-time/AAPL.US';
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/news/search';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Utility function for colorized console output
const logger = {
  success: (msg) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m✗ ${msg}\x1b[0m`),
  info: (msg) => console.log(`\x1b[36mi ${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m! ${msg}\x1b[0m`)
};

/**
 * Test EOD API directly
 */
async function testEODAPI() {
  logger.info('Testing EOD Historical Data API...');
  
  if (!EOD_API_KEY) {
    logger.error('EOD API Key not found in environment variables');
    return false;
  }
  
  try {
    const response = await axios.get(EOD_API_URL, {
      params: {
        api_token: EOD_API_KEY,
        fmt: 'json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      logger.success('EOD API responded successfully!');
      logger.info(`Data received: ${JSON.stringify(response.data).substring(0, 100)}...`);
      return true;
    } else {
      logger.error(`EOD API returned status code ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`EOD API test failed: ${error.message}`);
    logger.warn(`Status: ${error.response?.status || 'No status'}`);
    logger.warn(`Response: ${JSON.stringify(error.response?.data || {}).substring(0, 100)}`);
    return false;
  }
}

/**
 * Test Brave API directly
 */
async function testBraveAPI() {
  logger.info('Testing Brave Search API...');
  
  if (!BRAVE_API_KEY) {
    logger.error('Brave API Key not found in environment variables');
    return false;
  }
  
  try {
    const response = await axios.get(BRAVE_API_URL, {
      params: {
        q: 'stock market news',
        count: 3
      },
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      logger.success('Brave API responded successfully!');
      logger.info(`News count: ${response.data.news?.length || 0}`);
      return true;
    } else {
      logger.error(`Brave API returned status code ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Brave API test failed: ${error.message}`);
    logger.warn(`Status: ${error.response?.status || 'No status'}`);
    logger.warn(`Response: ${JSON.stringify(error.response?.data || {}).substring(0, 100)}`);
    return false;
  }
}

/**
 * Test Mistral API directly
 */
async function testMistralAPI() {
  logger.info('Testing Mistral AI API...');
  
  if (!MISTRAL_API_KEY) {
    logger.error('Mistral API Key not found in environment variables');
    return false;
  }
  
  try {
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-small-latest',
        messages: [
          { role: 'user', content: 'Hello, this is a test. Please respond with a single word.' }
        ],
        max_tokens: 5,
        temperature: 0.1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`
        },
        timeout: 10000
      }
    );
    
    if (response.status === 200) {
      logger.success('Mistral API responded successfully!');
      const content = response.data.choices?.[0]?.message?.content || 'No content';
      logger.info(`Response: ${content}`);
      return true;
    } else {
      logger.error(`Mistral API returned status code ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Mistral API test failed: ${error.message}`);
    logger.warn(`Status: ${error.response?.status || 'No status'}`);
    logger.warn(`Response: ${JSON.stringify(error.response?.data || {}).substring(0, 100)}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  logger.info('=== DIRECT API INTEGRATION TESTS ===');
  logger.info(`Timestamp: ${new Date().toISOString()}`);
  logger.info('');
  
  try {
    // Test all APIs
    const eodResult = await testEODAPI();
    console.log('');
    
    const braveResult = await testBraveAPI();
    console.log('');
    
    const mistralResult = await testMistralAPI();
    console.log('');
    
    // Summary
    logger.info('=== TEST RESULTS SUMMARY ===');
    logger.info(`EOD API: ${eodResult ? 'PASS' : 'FAIL'}`);
    logger.info(`Brave API: ${braveResult ? 'PASS' : 'FAIL'}`);
    logger.info(`Mistral API: ${mistralResult ? 'PASS' : 'FAIL'}`);
    
    // Overall status
    if (eodResult && braveResult && mistralResult) {
      logger.success('All API tests passed successfully!');
      logger.info('The Investors Daily Brief backend should work with real data.');
    } else {
      logger.error('Some API tests failed!');
      logger.warn('Check the logs above for detailed error information.');
    }
  } catch (error) {
    logger.error(`Unexpected error running tests: ${error.message}`);
  }
}

// Run the tests
runTests();