// Test script to check intraday data fetching
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../backend/.env') });

const API_KEY = process.env.EOD_API_KEY;
const BASE_URL = 'https://eodhd.com/api';

async function testIntradayData() {
  console.log('Testing EOD API intraday data...\n');
  
  const symbols = ['SPY.US'];
  const intervals = ['5m', '1h'];
  
  for (const symbol of symbols) {
    for (const interval of intervals) {
      console.log(`\nTesting ${symbol} with ${interval} interval:`);
      console.log('='.repeat(50));
      
      try {
        const endpoint = `${BASE_URL}/intraday/${symbol}`;
        const params = {
          api_token: API_KEY,
          fmt: 'json',
          interval: interval,
          from: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
          to: new Date().toISOString().split('T')[0]
        };
        
        console.log('Endpoint:', endpoint);
        console.log('Params:', params);
        
        const response = await axios.get(endpoint, { params });
        
        console.log(`Data points received: ${response.data.length}`);
        
        if (response.data.length > 0) {
          console.log('First data point:', response.data[0]);
          console.log('Last data point:', response.data[response.data.length - 1]);
          
          // Check data format
          const sample = response.data[0];
          console.log('\nData structure:');
          console.log('- Has datetime:', 'datetime' in sample);
          console.log('- Has timestamp:', 'timestamp' in sample);
          console.log('- Has close:', 'close' in sample);
          console.log('- Has volume:', 'volume' in sample);
        } else {
          console.log('ERROR: No data received!');
        }
      } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
      }
    }
  }
}

// Also test the local backend
async function testLocalBackend() {
  console.log('\n\nTesting Local Backend intraday endpoints...\n');
  
  const periods = ['1d', '5d'];
  
  for (const period of periods) {
    console.log(`\nTesting SPY.US with ${period} period:`);
    console.log('='.repeat(50));
    
    try {
      const url = `http://localhost:5000/api/market/history/SPY.US?period=${period}`;
      console.log('URL:', url);
      
      const response = await axios.get(url);
      
      console.log(`Data points received: ${response.data.length}`);
      
      if (response.data.length > 0) {
        console.log('First data point:', response.data[0]);
        console.log('Last data point:', response.data[response.data.length - 1]);
      } else {
        console.log('ERROR: No data received from backend!');
      }
    } catch (error) {
      console.error('Backend ERROR:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }
}

// Run tests
async function runTests() {
  await testIntradayData();
  await testLocalBackend();
}

runTests().catch(console.error);
