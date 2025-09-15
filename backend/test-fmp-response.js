import 'dotenv/config';  // Load env vars FIRST
import fmpService from './src/services/fmpService.js';

async function test() {
  try {
    console.log('Testing FMP getHistoricalPrices...');
    const data = await fmpService.getHistoricalPrices('SPY', '1y');
    console.log('Response type:', typeof data);
    console.log('Response is array?:', Array.isArray(data));
    console.log('Response has historical?:', data?.historical ? 'yes' : 'no');
    console.log('Response keys:', Object.keys(data || {}));
    if (data?.historical) {
      console.log('Historical is array?:', Array.isArray(data.historical));
      console.log('Historical length:', data.historical?.length);
      console.log('First item:', data.historical?.[0]);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

test();