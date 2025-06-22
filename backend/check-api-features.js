// Test script to check if EOD API supports intraday data
const axios = require('axios');
require('dotenv').config({ path: '../backend/.env' });

const API_KEY = process.env.EOD_API_KEY;
const BASE_URL = 'https://eodhd.com/api';

async function checkApiAccess() {
  console.log('Checking EOD API access and features...\n');
  
  try {
    // Test 1: Check basic API access
    console.log('1. Testing basic API access with daily data...');
    const dailyResponse = await axios.get(`${BASE_URL}/eod/SPY.US`, {
      params: {
        api_token: API_KEY,
        from: '2025-05-20',
        to: '2025-05-23',
        fmt: 'json'
      }
    });
    console.log('✓ Daily data access: SUCCESS');
    console.log(`  Data points: ${dailyResponse.data.length}`);
    
    // Test 2: Check intraday access
    console.log('\n2. Testing intraday data access...');
    try {
      const intradayResponse = await axios.get(`${BASE_URL}/intraday/SPY.US`, {
        params: {
          api_token: API_KEY,
          interval: '5m',
          fmt: 'json'
        }
      });
      console.log('✓ Intraday data access: SUCCESS');
      console.log(`  Data points: ${intradayResponse.data.length}`);
    } catch (intradayError) {
      console.log('✗ Intraday data access: FAILED');
      console.log(`  Error: ${intradayError.response?.status} - ${intradayError.response?.data || intradayError.message}`);
      console.log('  Note: Intraday data may require a paid subscription');
    }
    
    // Test 3: Check API tier/subscription
    console.log('\n3. Checking API subscription details...');
    const userResponse = await axios.get(`${BASE_URL}/user`, {
      params: { api_token: API_KEY, fmt: 'json' }
    });
    console.log('API Subscription Info:');
    console.log(`  Daily API Limit: ${userResponse.data.apiRequests || 'Unknown'}`);
    console.log(`  Subscription Type: ${userResponse.data.subscriptionType || 'Unknown'}`);
    
  } catch (error) {
    console.error('Error checking API:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

checkApiAccess();