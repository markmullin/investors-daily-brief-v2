import axios from 'axios';

async function testEarningsEndpoints() {
  console.log('Testing earnings endpoints...\n');
  
  const endpoints = [
    '/api/earnings/AVGO/analysis',
    '/api/earnings/AVGO/transcripts',
    '/api/earnings/AVGO/sentiment-trends',
    '/api/earnings/AVGO/key-themes',
    '/api/earnings/AVGO/next-earnings'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`http://localhost:5000${endpoint}`);
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      if (response.data) {
        console.log(`   Data keys: ${Object.keys(response.data).slice(0, 5).join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Also check what routes ARE available
  console.log('\n\nChecking available endpoints from 404 response...');
  try {
    await axios.get('http://localhost:5000/api/earnings/test');
  } catch (error) {
    if (error.response?.data) {
      console.log('Available endpoint groups:');
      const data = error.response.data;
      Object.keys(data).forEach(key => {
        if (key.includes('Endpoints') && Array.isArray(data[key])) {
          console.log(`\n${key}:`);
          data[key].forEach(ep => console.log(`  - ${ep}`));
        }
      });
    }
  }
}

testEarningsEndpoints();