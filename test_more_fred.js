// Quick test for additional FRED series
const axios = require('axios');

const FRED_API_KEY = 'dca5bb7524d0b194a9963b449e69c655';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

// Additional series to test for missing indicators
const additionalSeries = [
  // Initial Claims alternatives
  { id: 'CCSA', name: 'Continued Claims' },
  { id: 'ICNSA', name: 'Initial Claims Not Seasonally Adjusted' },
  { id: 'IURNSA', name: 'Insured Unemployment Rate' },
  
  // Home Price alternatives
  { id: 'MSPUS', name: 'Median Sales Price of Houses' },
  { id: 'USSTHPI', name: 'All-Transactions House Price Index' },
  { id: 'CSUSHPINSA', name: 'Case-Shiller U.S. National' },
  
  // Already working (for reference)
  { id: 'USSLIND', name: 'Conference Board LEI' },
  { id: 'CFNAI', name: 'Chicago Fed National Activity' }
];

async function testSeriesId(seriesId, name) {
  try {
    const response = await axios.get(FRED_BASE_URL, {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json',
        limit: 1,
        sort_order: 'desc'
      }
    });
    
    if (response.data && response.data.observations && response.data.observations.length > 0) {
      const latestObs = response.data.observations[0];
      console.log(`✅ ${seriesId} (${name}): VALID - Latest: ${latestObs.value} on ${latestObs.date}`);
      return true;
    } else {
      console.log(`❌ ${seriesId} (${name}): NO DATA`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${seriesId} (${name}): INVALID - ${error.response?.status || error.message}`);
    return false;
  }
}

async function testAll() {
  console.log('Testing additional FRED Series IDs...\n');
  
  for (const series of additionalSeries) {
    await testSeriesId(series.id, series.name);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\nDone!');
}

testAll();