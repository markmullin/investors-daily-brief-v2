/**
 * Test FMP API connection
 */

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const FMP_API_KEY = process.env.FMP_API_KEY;

console.log('🔍 Testing FMP API Connection...\n');
console.log('API Key:', FMP_API_KEY ? `${FMP_API_KEY.substring(0, 10)}...` : 'NOT SET');

async function testFMP() {
  const tests = [
    {
      name: 'SPY Quote',
      url: `https://financialmodelingprep.com/api/v3/quote/SPY?apikey=${FMP_API_KEY}`
    },
    {
      name: 'S&P 500 Constituents',
      url: `https://financialmodelingprep.com/api/v3/sp500_constituent?apikey=${FMP_API_KEY}`
    },
    {
      name: 'VIX Quote',
      url: `https://financialmodelingprep.com/api/v3/quote/^VIX?apikey=${FMP_API_KEY}`
    }
  ];

  for (const test of tests) {
    console.log(`\nTesting ${test.name}...`);
    try {
      const response = await axios.get(test.url, { timeout: 5000 });
      if (response.data && response.data.length > 0) {
        console.log(`✅ Success - Got ${response.data.length} results`);
        if (test.name === 'SPY Quote') {
          console.log(`   Price: $${response.data[0].price}`);
          console.log(`   Change: ${response.data[0].changesPercentage}%`);
        }
      } else {
        console.log('⚠️ Empty response');
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response?.status === 401) {
        console.log('   → API Key issue - check your FMP_API_KEY in .env');
      }
    }
  }
}

testFMP().catch(console.error);
