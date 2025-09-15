const axios = require('axios');

const FRED_API_KEY = 'dca5bb7524d0b194a9963b449e69c655';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// Test the problematic series with detailed error logging
const problematicSeries = [
  'ICSA',         // Initial Claims - shown working in your screenshot
  'TLMFGCONS',    // Total Construction Spending - shown working in your screenshot  
  'SPCS20RSA'     // Case-Shiller 20-City - shown working in your screenshot
];

async function debugFredSeries() {
  console.log('=== FRED API Debug Test ===\n');
  console.log('Testing series that work on FRED website but fail via API...\n');

  for (const seriesId of problematicSeries) {
    console.log(`\nTesting ${seriesId}:`);
    console.log('-'.repeat(50));
    
    try {
      // Try the standard endpoint
      const url = `${FRED_BASE_URL}/series/observations`;
      console.log(`URL: ${url}`);
      console.log(`Params: series_id=${seriesId}, api_key=***`);
      
      const response = await axios.get(url, {
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY,
          file_type: 'json',
          limit: 1,
          sort_order: 'desc'
        }
      });

      console.log(`✅ SUCCESS - Status: ${response.status}`);
      if (response.data.observations && response.data.observations.length > 0) {
        const latest = response.data.observations[0];
        console.log(`Latest data: ${latest.date} = ${latest.value}`);
      }

    } catch (error) {
      console.log(`❌ FAILED - Status: ${error.response?.status || 'Network Error'}`);
      
      // Log detailed error information
      if (error.response) {
        console.log(`Status Code: ${error.response.status}`);
        console.log(`Status Text: ${error.response.statusText}`);
        console.log(`Headers:`, error.response.headers);
        
        // Log the actual error message from FRED
        if (error.response.data) {
          console.log(`Error Response:`, JSON.stringify(error.response.data, null, 2));
        }
      } else {
        console.log(`Error Message: ${error.message}`);
      }

      // Try alternative approaches
      console.log('\nTrying alternative request...');
      
      // Try with observation_start parameter
      try {
        const altResponse = await axios.get(`${FRED_BASE_URL}/series/observations`, {
          params: {
            series_id: seriesId,
            api_key: FRED_API_KEY,
            file_type: 'json',
            observation_start: '2024-01-01',
            limit: 1,
            sort_order: 'desc'
          }
        });
        console.log(`✅ Alternative request SUCCESS`);
        if (altResponse.data.observations && altResponse.data.observations.length > 0) {
          const latest = altResponse.data.observations[0];
          console.log(`Latest data: ${latest.date} = ${latest.value}`);
        }
      } catch (altError) {
        console.log(`❌ Alternative request also failed`);
      }
    }
  }

  // Also test if these series exist at all
  console.log('\n\n=== Testing Series Info Endpoint ===\n');
  
  for (const seriesId of problematicSeries) {
    try {
      const response = await axios.get(`${FRED_BASE_URL}/series`, {
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY,
          file_type: 'json'
        }
      });
      
      if (response.data.seriess && response.data.seriess.length > 0) {
        const series = response.data.seriess[0];
        console.log(`\n${seriesId}:`);
        console.log(`  Title: ${series.title}`);
        console.log(`  Units: ${series.units}`);
        console.log(`  Frequency: ${series.frequency}`);
        console.log(`  Last Updated: ${series.last_updated}`);
      }
    } catch (error) {
      console.log(`\n${seriesId}: Cannot retrieve series info - ${error.response?.status || error.message}`);
    }
  }
}

debugFredSeries().catch(console.error);
