/**
 * Direct test of FMP earnings transcript endpoint
 */

import axios from 'axios';

const FMP_API_KEY = '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
const symbol = 'ORCL';

console.log('🔍 Testing FMP Earnings Transcript Endpoint Directly...\n');

// Test 1: Check the transcript list endpoint
async function testTranscriptList() {
  console.log('1. Testing transcript list endpoint:');
  console.log('─'.repeat(50));
  
  const url = `https://financialmodelingprep.com/api/v3/earnings-call-transcript/${symbol}`;
  console.log(`URL: ${url}`);
  console.log(`API Key: ${FMP_API_KEY.substring(0, 10)}...`);
  
  try {
    const response = await axios.get(url, {
      params: {
        apikey: FMP_API_KEY,
        limit: 5
      }
    });
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`Data type: ${typeof response.data}`);
    console.log(`Is array: ${Array.isArray(response.data)}`);
    
    if (Array.isArray(response.data)) {
      console.log(`Number of transcripts: ${response.data.length}`);
      
      if (response.data.length > 0) {
        console.log('\nFirst transcript info:');
        const first = response.data[0];
        console.log(`  Symbol: ${first.symbol}`);
        console.log(`  Date: ${first.date}`);
        console.log(`  Quarter: ${first.quarter}`);
        console.log(`  Year: ${first.year}`);
        console.log(`  Has content: ${!!first.content}`);
        console.log(`  Content length: ${first.content ? first.content.length : 0}`);
      }
    } else {
      console.log('Response data:', JSON.stringify(response.data).substring(0, 200));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data:`, error.response.data);
    }
  }
}

// Test 2: Try alternative endpoints
async function testAlternativeEndpoints() {
  console.log('\n2. Testing alternative endpoints:');
  console.log('─'.repeat(50));
  
  const alternatives = [
    '/v4/earning_call_transcript',
    '/v3/earning_call_transcript',
    '/v3/earnings_call_transcript',
    '/v3/earnings-call-transcript',
    '/v3/earning-call-transcript'
  ];
  
  for (const endpoint of alternatives) {
    const url = `https://financialmodelingprep.com/api${endpoint}/${symbol}`;
    try {
      const response = await axios.get(url, {
        params: { apikey: FMP_API_KEY, limit: 1 },
        timeout: 5000
      });
      console.log(`✅ ${endpoint}: Status ${response.status}, Data: ${!!response.data}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response ? error.response.status : error.message}`);
    }
  }
}

// Test 3: Check available earnings dates
async function testEarningsDates() {
  console.log('\n3. Testing earnings calendar:');
  console.log('─'.repeat(50));
  
  const url = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${symbol}`;
  
  try {
    const response = await axios.get(url, {
      params: { apikey: FMP_API_KEY, limit: 10 }
    });
    
    console.log(`✅ Earnings calendar status: ${response.status}`);
    if (Array.isArray(response.data)) {
      console.log(`Number of earnings dates: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log('Recent earnings dates:');
        response.data.slice(0, 5).forEach(earning => {
          console.log(`  ${earning.date} - EPS: ${earning.eps}, Revenue: ${earning.revenue}`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  await testTranscriptList();
  await testAlternativeEndpoints();
  await testEarningsDates();
  
  console.log('\n✅ Test complete!');
  process.exit(0);
}

runTests();
