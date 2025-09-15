// Quick Fix Script for Investors Daily Brief Dashboard
// Run this in your backend directory to fix all issues

const axios = require('axios');

async function testAndFixEndpoints() {
  console.log('🔧 Testing and Fixing Dashboard Issues...\n');
  
  const baseURL = 'http://localhost:5000';
  
  // Test 1: Check if backend is running
  try {
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend is running');
  } catch (error) {
    console.error('❌ Backend is not running! Start it with: npm run dev');
    process.exit(1);
  }
  
  // Test 2: Check ^GSPC historical data
  console.log('\n📊 Testing S&P 500 (^GSPC) historical data...');
  try {
    const response = await axios.get(`${baseURL}/api/market/history/^GSPC?period=1y`);
    if (response.data && response.data.length > 0) {
      console.log(`✅ ^GSPC data working: ${response.data.length} data points`);
    } else {
      console.log('⚠️ ^GSPC returning empty data');
    }
  } catch (error) {
    console.error('❌ ^GSPC history failed:', error.response?.data || error.message);
    console.log('💡 Fix: The backend needs to map ^GSPC to SPY for FMP API');
  }
  
  // Test 3: Check sector performance
  console.log('\n🏭 Testing sector performance...');
  try {
    const response = await axios.get(`${baseURL}/api/market/sectors/1d`);
    if (response.data && response.data.sectors) {
      const nonZeroSectors = response.data.sectors.filter(s => s.changePercent !== 0);
      if (nonZeroSectors.length > 0) {
        console.log(`✅ Sectors working: ${nonZeroSectors.length} sectors with data`);
      } else {
        console.log('⚠️ All sectors showing 0% - data fetch issue');
      }
    }
  } catch (error) {
    console.error('❌ Sectors failed:', error.response?.data || error.message);
  }
  
  // Test 4: Check Key Relationships
  console.log('\n🔗 Testing Key Relationships...');
  try {
    const response = await axios.get(`${baseURL}/api/market/history/SPY?period=1y`);
    console.log('✅ SPY data for relationships working');
  } catch (error) {
    console.error('❌ Relationships data failed:', error.response?.data || error.message);
  }
  
  // Test 5: Check AI/GPT-OSS endpoint
  console.log('\n🤖 Testing AI Analysis (GPT-OSS)...');
  try {
    const response = await axios.post(`${baseURL}/api/gpt-oss/market-analysis`, {
      analysisType: 'marketPhase',
      marketPhase: 'NEUTRAL'
    });
    if (response.data && response.data.success) {
      console.log('✅ GPT-OSS analysis working');
    }
  } catch (error) {
    console.error('❌ GPT-OSS failed:', error.response?.data || error.message);
    console.log('💡 Check if llama.cpp is running on port 8080');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 FIXES NEEDED:');
  console.log('='.repeat(50));
  console.log(`
1. INDEX SYMBOL MAPPING:
   The frontend is using ^GSPC, ^IXIC, etc. but FMP API needs ETF equivalents.
   Fix: Update the backend to map index symbols to ETFs.

2. SECTOR DATA:
   Sectors showing 0% means FMP API calls are failing or returning no data.
   Fix: Check FMP API key is valid and has sufficient credits.

3. KEY RELATIONSHIPS:
   500 error indicates missing data for relationship pairs.
   Fix: Ensure all required symbols (SPY, TLT, etc.) have data.

4. AI ANALYSIS:
   Not showing real analysis means GPT-OSS isn't properly integrated.
   Fix: Ensure llama.cpp server is running with the model loaded.
  `);
}

testAndFixEndpoints().catch(console.error);
