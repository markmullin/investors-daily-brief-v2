// Test script to verify all API endpoints are working after deployment
const axios = require('axios');

// Change this to your local backend for testing locally
// const BASE_URL = 'http://localhost:5000';
const BASE_URL = 'https://investors-daily-brief.onrender.com';

const TEST_SYMBOL = 'NVDA';

async function testEndpoint(name, url) {
  try {
    console.log(`\nTesting ${name}...`);
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Data keys:`, Object.keys(response.data).slice(0, 5).join(', '));
      return true;
    }
  } catch (error) {
    console.log(`❌ ${name} - FAILED`);
    console.log(`   Error:`, error.response?.status || error.message);
    return false;
  }
}

async function runTests() {
  console.log('====================================');
  console.log('TESTING API ENDPOINTS');
  console.log(`Backend: ${BASE_URL}`);
  console.log(`Test Symbol: ${TEST_SYMBOL}`);
  console.log('====================================');
  
  const endpoints = [
    { name: 'Balance Sheet', path: `/api/fundamentals/balance-sheet/${TEST_SYMBOL}` },
    { name: 'Income Statement', path: `/api/fundamentals/income-statement/${TEST_SYMBOL}` },
    { name: 'Cash Flow', path: `/api/fundamentals/cash-flow/${TEST_SYMBOL}` },
    { name: 'Metrics', path: `/api/fundamentals/metrics/${TEST_SYMBOL}` },
    { name: 'Analyst Data', path: `/api/fundamentals/analyst/${TEST_SYMBOL}` },
    { name: 'Earnings', path: `/api/earnings/${TEST_SYMBOL}` },
    { name: 'Discovery', path: `/api/discovery` },
    { name: 'Health Check', path: `/api/health` }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint.name, BASE_URL + endpoint.path);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n====================================');
  console.log('TEST RESULTS');
  console.log('====================================');
  console.log(`✅ Passed: ${successCount}/${endpoints.length}`);
  console.log(`❌ Failed: ${failCount}/${endpoints.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your API is working correctly!');
  } else {
    console.log('\n⚠️ Some endpoints failed. Check the backend logs for details.');
    console.log('   Make sure:');
    console.log('   1. Backend is deployed and running');
    console.log('   2. FMP_API_KEY is set in environment variables');
    console.log('   3. Routes are properly registered');
  }
}

// Run the tests
runTests().catch(console.error);
