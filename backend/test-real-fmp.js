/**
 * Direct test of REAL FMP earnings endpoints
 */

import axios from 'axios';

const FMP_API_KEY = '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
const symbol = 'ORCL';

console.log('🔍 Testing REAL FMP Earnings Endpoints...\n');

// Test the correct endpoint
async function testRealEndpoint() {
  console.log('Testing REAL earnings transcript endpoint:');
  console.log('─'.repeat(50));
  
  // The CORRECT FMP endpoint
  const url = `https://financialmodelingprep.com/api/v3/earning_call_transcript/${symbol}`;
  
  console.log(`URL: ${url}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`API Key: ${FMP_API_KEY.substring(0, 10)}...`);
  
  try {
    const response = await axios.get(url, {
      params: {
        apikey: FMP_API_KEY,
        limit: 5
      }
    });
    
    console.log(`\n✅ SUCCESS! Status: ${response.status}`);
    console.log(`Data type: ${typeof response.data}`);
    console.log(`Is array: ${Array.isArray(response.data)}`);
    
    if (Array.isArray(response.data)) {
      console.log(`\n📊 Found ${response.data.length} transcripts\n`);
      
      response.data.forEach((transcript, index) => {
        console.log(`Transcript ${index + 1}:`);
        console.log(`  Date: ${transcript.date}`);
        console.log(`  Quarter: ${transcript.quarter}`);
        console.log(`  Year: ${transcript.year}`);
        console.log(`  Symbol: ${transcript.symbol}`);
        console.log(`  Has content: ${!!transcript.content}`);
        if (transcript.content) {
          console.log(`  Content length: ${transcript.content.length} chars`);
          console.log(`  Content preview: ${transcript.content.substring(0, 100)}...`);
        }
        console.log('');
      });
    } else if (response.data) {
      console.log('Single transcript received:');
      console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data:`, error.response.data);
    }
  }
}

// Also test the v4 endpoint
async function testV4Endpoint() {
  console.log('\n\nTesting V4 endpoint:');
  console.log('─'.repeat(50));
  
  const url = `https://financialmodelingprep.com/api/v4/earning_call_transcript`;
  
  try {
    const response = await axios.get(url, {
      params: {
        symbol: symbol,
        apikey: FMP_API_KEY
      }
    });
    
    console.log(`✅ V4 Success! Status: ${response.status}`);
    if (response.data) {
      console.log('Data received:', JSON.stringify(response.data, null, 2).substring(0, 300));
    }
  } catch (error) {
    console.log(`❌ V4 Error: ${error.response ? error.response.status : error.message}`);
  }
}

// Run tests
async function runTests() {
  await testRealEndpoint();
  await testV4Endpoint();
  
  console.log('\n✅ Test complete!');
  process.exit(0);
}

runTests();
