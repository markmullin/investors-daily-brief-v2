const axios = require('axios');

const FRED_API_KEY = 'dca5bb7524d0b194a9963b449e69c655';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// Test Chicago Fed and housing series
const testSeries = {
  'CFNAI': 'Chicago Fed National Activity Index',
  'SPCS20RSA': 'S&P/Case-Shiller 20-City Index',
  'HOUST': 'Housing Starts'
};

async function testNewSeries() {
  console.log('=== Testing New FRED Series ===\n');

  for (const [seriesId, description] of Object.entries(testSeries)) {
    process.stdout.write(`Testing ${seriesId} (${description})... `);
    
    try {
      const response = await axios.get(`${FRED_BASE_URL}/series/observations`, {
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY,
          file_type: 'json',
          limit: 3,
          sort_order: 'desc'
        }
      });

      if (response.data.observations && response.data.observations.length > 0) {
        const latest = response.data.observations[0];
        console.log(`✅ SUCCESS`);
        console.log(`   Latest value: ${latest.date} = ${latest.value}`);
      } else {
        console.log(`⚠️ No data returned`);
      }

    } catch (error) {
      console.log(`❌ FAILED - ${error.response?.status || error.message}`);
    }
  }
}

testNewSeries().catch(console.error);
