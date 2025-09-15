const axios = require('axios');

const FRED_API_KEY = 'dca5bb7524d0b194a9963b449e69c655';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// Series IDs that were shown working in user's screenshots
const verifiedSeries = {
  'BBKMLEIX': 'Brave-Butters-Kelley Leading Index',
  'ICSA': 'Initial Claims',
  'TLMFGCONS': 'Total Construction Spending: Manufacturing', 
  'NEWORDER': 'Manufacturers New Orders',
  'PERMIT': 'Building Permits',
  'SPCS20RSA': 'S&P/Case-Shiller 20-City Home Price Index',
  'EXHOSLUSM495S': 'Existing Home Sales',
  'MORTGAGE30US': '30-Year Mortgage Rate'
};

async function testFixedSeriesIDs() {
  console.log('=== Testing FIXED FRED Series IDs ===\n');
  console.log('These series were verified working on FRED website by user\n');

  const results = {
    working: [],
    failed: []
  };

  for (const [seriesId, description] of Object.entries(verifiedSeries)) {
    process.stdout.write(`Testing ${seriesId} (${description})... `);
    
    try {
      const response = await axios.get(`${FRED_BASE_URL}/series/observations`, {
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY,
          file_type: 'json',
          limit: 5,
          sort_order: 'desc'
        }
      });

      if (response.data.observations && response.data.observations.length > 0) {
        const latest = response.data.observations[0];
        console.log(`✅ SUCCESS - Latest: ${latest.date} = ${latest.value}`);
        results.working.push(seriesId);
      } else {
        console.log(`⚠️ No data returned`);
        results.failed.push(seriesId);
      }

    } catch (error) {
      console.log(`❌ FAILED - ${error.response?.status || error.message}`);
      results.failed.push(seriesId);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Working: ${results.working.length}/${Object.keys(verifiedSeries).length}`);
  console.log(`   Series: ${results.working.join(', ')}`);
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}/${Object.keys(verifiedSeries).length}`);
    console.log(`   Series: ${results.failed.join(', ')}`);
    
    // Re-test failed series with different parameters
    console.log('\n=== Retrying Failed Series with Different Parameters ===\n');
    
    for (const seriesId of results.failed) {
      console.log(`Retrying ${seriesId} with date range...`);
      
      try {
        const response = await axios.get(`${FRED_BASE_URL}/series/observations`, {
          params: {
            series_id: seriesId,
            api_key: FRED_API_KEY,
            file_type: 'json',
            observation_start: '2023-01-01',
            limit: 5,
            sort_order: 'desc'
          }
        });
        
        if (response.data.observations && response.data.observations.length > 0) {
          const latest = response.data.observations[0];
          console.log(`  ✅ SUCCESS with date range - Latest: ${latest.date} = ${latest.value}`);
        } else {
          console.log(`  ⚠️ Still no data with date range`);
        }
      } catch (error) {
        console.log(`  ❌ Still failing: ${error.response?.status || error.message}`);
      }
    }
  }
}

testFixedSeriesIDs().catch(console.error);
