/**
 * Test Earnings API Endpoints
 * Verify all earnings-related endpoints are working
 */

import fmpService from './src/services/fmpService.js';
import axios from 'axios';

console.log('🔍 Testing Earnings API System...\n');

// Test 1: Check if FMP service has the right methods
console.log('1. Testing FMP Service Methods:');
console.log('─'.repeat(50));

const methods = [
  'getEarningsCallTranscripts',
  'getEarningsTranscriptByQuarter',
  'getEarningsCalendar',
  'getComprehensiveEarningsAnalysis'
];

methods.forEach(method => {
  const exists = typeof fmpService[method] === 'function';
  console.log(`${exists ? '✅' : '❌'} ${method}: ${exists ? 'Available' : 'MISSING'}`);
});

// Test 2: Try to fetch transcripts directly
console.log('\n2. Testing Direct FMP Call:');
console.log('─'.repeat(50));

try {
  const transcripts = await fmpService.getEarningsCallTranscripts('AAPL', 3);
  console.log(`✅ Got ${transcripts.length} transcripts for AAPL`);
  if (transcripts.length > 0) {
    console.log(`   First transcript: ${transcripts[0].quarter || transcripts[0].date}`);
  }
} catch (error) {
  console.log(`❌ Failed to get transcripts: ${error.message}`);
}

// Test 3: Check API endpoints
console.log('\n3. Testing API Endpoints:');
console.log('─'.repeat(50));

const endpoints = [
  { url: 'http://localhost:5000/api/themes/earnings/AAPL/analyze', name: 'Theme Earnings Analysis' },
  { url: 'http://localhost:5000/api/research/earnings/AAPL/transcripts', name: 'Research Earnings Transcripts' },
  { url: 'http://localhost:5000/api/themes/trending', name: 'Trending Themes' },
  { url: 'http://localhost:5000/api/themes/company/AAPL', name: 'Company Themes' }
];

for (const endpoint of endpoints) {
  try {
    const response = await axios.get(endpoint.url);
    console.log(`✅ ${endpoint.name}: Status ${response.status}`);
    if (response.data) {
      const keys = Object.keys(response.data).slice(0, 5);
      console.log(`   Response keys: ${keys.join(', ')}`);
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${endpoint.name}: Status ${error.response.status} - ${error.response.statusText}`);
    } else {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

// Test 4: Check if routes are loaded
console.log('\n4. Checking Route Registration:');
console.log('─'.repeat(50));

try {
  const healthResponse = await axios.get('http://localhost:5000/health');
  console.log(`✅ Server is running: ${healthResponse.data.status}`);
} catch (error) {
  console.log(`❌ Server not responding: ${error.message}`);
}

console.log('\n✅ Test complete!');
process.exit(0);
