/**
 * Test the earnings and theme endpoints after fix
 */

console.log('🔍 Testing Earnings & Theme Endpoints...\n');

// Test endpoints
const endpoints = [
  'http://localhost:5000/api/themes/earnings/ORCL/analyze',
  'http://localhost:5000/api/research/earnings/ORCL/transcripts',
  'http://localhost:5000/api/themes/trending',
  'http://localhost:5000/api/themes/company/ORCL'
];

async function testEndpoints() {
  for (const url of endpoints) {
    try {
      const response = await fetch(url);
      const status = response.status;
      const statusText = response.statusText;
      
      if (status === 200) {
        console.log(`✅ ${url.replace('http://localhost:5000', '')}`);
        console.log(`   Status: ${status} ${statusText}`);
      } else {
        console.log(`❌ ${url.replace('http://localhost:5000', '')}`);
        console.log(`   Status: ${status} ${statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${url.replace('http://localhost:5000', '')}`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

console.log('⏳ Make sure the backend server is restarted with the fixes...\n');
console.log('Run this test after restarting the backend:\n');
console.log('1. Stop the backend server (Ctrl+C)');
console.log('2. Start it again: npm run dev');
console.log('3. Run this test: node test-earnings-fix.js\n');

testEndpoints();
