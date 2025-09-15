// Test FRED series IDs to see which ones are valid
import axios from 'axios';

const FRED_API_KEY = 'dca5bb7524d0b194a9963b449e69c655';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

// Series IDs to test
const seriesToTest = [
  // Current problematic ones
  { id: 'BBKMLEIX', name: 'Brave-Butters-Kelley Index' },
  { id: 'ICSA', name: 'Initial Claims' },
  { id: 'TLMFGCONS', name: 'Construction Spending Manufacturing' },
  { id: 'NEWORDER', name: 'New Orders' },
  { id: 'PERMIT', name: 'Building Permits' },
  
  // Alternative/correct series IDs
  { id: 'BBRINDX', name: 'Alt: Brave-Butters Index' },
  { id: 'IC4WSA', name: 'Alt: 4-Week Moving Average Initial Claims' },
  { id: 'TTLCONS', name: 'Alt: Total Construction Spending' },
  { id: 'TLMFCONS', name: 'Alt: Total Construction Manufacturing' },
  { id: 'NEWORDER', name: 'Alt: New Orders Durable Goods' },
  { id: 'DGORDER', name: 'Alt: Durable Goods Orders' },
  { id: 'AMTMNO', name: 'Alt: New Orders Manufacturing' },
  { id: 'PERMIT', name: 'Building Permits Total' },
  { id: 'HOUST', name: 'Alt: Housing Starts' },
  
  // Housing indicators
  { id: 'SPCS20RSA', name: 'Case-Shiller 20-City' },
  { id: 'EXHOSLUSM495S', name: 'Existing Home Sales' },
  { id: 'MORTGAGE30US', name: '30-Year Mortgage Rate' }
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

async function testAllSeries() {
  console.log('Testing FRED Series IDs...\n');
  console.log('=====================================\n');
  
  for (const series of seriesToTest) {
    await testSeriesId(series.id, series.name);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n=====================================');
  console.log('Test complete!');
}

testAllSeries();