import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

console.log('=== Testing FRED API Endpoints with Fixed Series IDs ===\n');

async function testEndpoint(name, url) {
  console.log(`\nTesting ${name}...`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    
    console.log('✅ Endpoint responded successfully');
    
    // Check for specific series in the response
    if (data.leadingIndicators) {
      console.log('\n📊 Leading Indicators Data Keys:');
      const keys = Object.keys(data.leadingIndicators.data);
      console.log('  Available series:', keys.join(', '));
      
      // Check for the problematic series
      const checkSeries = ['ICSA', 'TLMFGCONS', 'SPCS20RSA'];
      checkSeries.forEach(series => {
        if (keys.includes(series)) {
          const seriesData = data.leadingIndicators.data[series];
          console.log(`  ✅ ${series}: ${seriesData?.length || 0} data points`);
          if (seriesData && seriesData.length > 0) {
            const latest = seriesData[seriesData.length - 1];
            console.log(`     Latest: ${latest.date} = ${latest.value}`);
          }
        } else {
          console.log(`  ❌ ${series}: NOT FOUND in response`);
        }
      });
    }
    
    if (data.housing) {
      console.log('\n🏠 Housing Indicators Data Keys:');
      const keys = Object.keys(data.housing.data);
      console.log('  Available series:', keys.join(', '));
      
      // Check for Case-Shiller
      if (keys.includes('SPCS20RSA')) {
        const seriesData = data.housing.data['SPCS20RSA'];
        console.log(`  ✅ SPCS20RSA: ${seriesData?.length || 0} data points`);
        if (seriesData && seriesData.length > 0) {
          const latest = seriesData[seriesData.length - 1];
          console.log(`     Latest: ${latest.date} = ${latest.value}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('Make sure your backend server is running on port 5000!\n');
  
  // Test the main macro endpoint that includes all indicators
  await testEndpoint('All Macro Data', `${BASE_URL}/macro/all`);
  
  // Test individual endpoints
  await testEndpoint('Leading Indicators', `${BASE_URL}/macro/leading`);
  await testEndpoint('Housing Indicators', `${BASE_URL}/macro/housing`);
  
  console.log('\n=== Test Complete ===');
  console.log('\nIf you see ICSA, TLMFGCONS, and SPCS20RSA with data points above,');
  console.log('then the fix is working correctly!');
}

runTests().catch(console.error);
