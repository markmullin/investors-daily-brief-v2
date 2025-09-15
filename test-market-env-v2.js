/**
 * Test script for Market Environment V2
 * Run this to verify all endpoints are working
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/market-env';

async function testEndpoint(name, endpoint) {
  console.log(`\n📊 Testing ${name}...`);
  console.log(`   Endpoint: ${endpoint}`);
  
  try {
    const startTime = Date.now();
    const response = await axios.get(endpoint);
    const duration = Date.now() - startTime;
    
    if (response.data.success || response.data.data) {
      console.log(`   ✅ Success (${duration}ms)`);
      
      // Show summary of data
      if (response.data.data) {
        const data = response.data.data;
        
        // Phase info
        if (data.phase) {
          console.log(`   📈 Phase: ${data.phase.phase} (${data.phase.confidence}% confidence)`);
        }
        
        // Breadth info
        if (data.breadth) {
          console.log(`   📊 Breadth: ${data.breadth.percentAbove50MA}% above 50MA`);
        }
        
        // Fundamentals info
        if (data.fundamentals) {
          console.log(`   💰 P/E: ${data.fundamentals.marketPE}, Growth: ${data.fundamentals.earningsGrowth}%`);
        }
        
        // Sentiment info
        if (data.sentiment) {
          console.log(`   😱 VIX: ${data.sentiment.vix} (${data.sentiment.vixZone})`);
        }
        
        // Synthesis info
        if (data.synthesis) {
          console.log(`   🤖 Confidence: ${data.synthesis.confidence}%`);
          if (data.synthesis.primaryInsight) {
            console.log(`   💡 Insight: ${data.synthesis.primaryInsight.substring(0, 100)}...`);
          }
        }
      }
      
      return true;
    } else {
      console.log(`   ❌ Failed: Invalid response structure`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Market Environment V2 Tests');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Full Market Environment', endpoint: `${BASE_URL}` },
    { name: 'Market Phase', endpoint: `${BASE_URL}/phase` },
    { name: 'Market Breadth', endpoint: `${BASE_URL}/breadth` },
    { name: 'Market Sentiment', endpoint: `${BASE_URL}/sentiment` },
    { name: 'S&P 500 Fundamentals', endpoint: `${BASE_URL}/fundamentals` },
    { name: 'AI Synthesis', endpoint: `${BASE_URL}/synthesis` }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.endpoint);
    if (result) passed++;
    else failed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Market Environment V2 is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
  
  // Test aggregation endpoint (requires admin key)
  console.log('\n' + '=' .repeat(50));
  console.log('📦 Testing S&P 500 Aggregation Trigger (Admin Only)');
  console.log('   Note: This would normally require an admin key');
  console.log('   To trigger aggregation manually:');
  console.log('   POST http://localhost:5000/api/market-env/aggregate');
  console.log('   Headers: { "x-admin-key": "your-admin-key" }');
}

// Run the tests
runTests().catch(console.error);
