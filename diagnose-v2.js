/**
 * Quick diagnostic for Market Environment V2
 */

import axios from 'axios';

async function diagnose() {
  console.log('🔍 Diagnosing Market Environment V2...\n');
  
  // Check if server is running
  try {
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Server is running:', health.data);
  } catch (error) {
    console.log('❌ Server is not running! Start it with: npm run dev');
    return;
  }
  
  // Check V2 endpoint
  console.log('\n📊 Checking V2 endpoint...');
  try {
    const response = await axios.get('http://localhost:5000/api/market-environment/v2');
    console.log('✅ V2 endpoint is accessible');
    
    if (response.data.success) {
      console.log('✅ V2 returns success');
      
      // Check data structure
      const data = response.data.data;
      console.log('\n📋 Data structure:');
      console.log('  - Phase:', data.phase ? '✓' : '✗');
      console.log('  - Trend:', data.trend ? '✓' : '✗');
      console.log('  - Breadth:', data.breadth ? '✓' : '✗');
      console.log('  - Fundamentals:', data.fundamentals ? '✓' : '✗');
      console.log('  - Sentiment:', data.sentiment ? '✓' : '✗');
      console.log('  - Synthesis:', data.synthesis ? '✓' : '✗');
      
      // Check if fundamentals need aggregation
      if (data.fundamentals?.dataQuality?.status === 'STALE' || 
          data.fundamentals?.dataQuality?.status === 'DEFAULT') {
        console.log('\n⚠️ S&P 500 data needs aggregation!');
        console.log('   Run: curl -X POST http://localhost:5000/api/market-environment/v2/aggregate');
        console.log('   Or wait for automatic aggregation at 3 AM ET');
      } else {
        console.log('\n✅ S&P 500 data is current');
      }
      
    } else {
      console.log('⚠️ V2 endpoint returns but success is false');
    }
    
  } catch (error) {
    console.log('❌ V2 endpoint error:', error.message);
    if (error.response) {
      console.log('   Response:', error.response.data);
    }
  }
  
  // Check individual components
  console.log('\n📊 Checking individual components...');
  const components = ['phase', 'breadth', 'sentiment', 'fundamentals'];
  
  for (const component of components) {
    try {
      await axios.get(`http://localhost:5000/api/market-environment/v2/${component}`);
      console.log(`  ✅ ${component} endpoint works`);
    } catch (error) {
      console.log(`  ❌ ${component} endpoint failed:`, error.message);
    }
  }
  
  console.log('\n🔧 Diagnosis complete!');
}

diagnose().catch(console.error);
