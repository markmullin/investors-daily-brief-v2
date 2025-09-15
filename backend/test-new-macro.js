import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

console.log('=== Testing NEW /api/macro Endpoints ===\n');
console.log('These are the DIRECT FRED endpoints with all fixes\n');

async function testNewEndpoints() {
  try {
    // Test the NEW /api/macro/all endpoint
    console.log('1️⃣ Testing /api/macro/all (NEW DIRECT ENDPOINT)...');
    const response = await axios.get(`${BASE_URL}/api/macro/all`);
    const data = response.data;
    
    console.log('\n✅ Response received from NEW endpoint!\n');
    
    // Check structure
    console.log('Top-level keys:', Object.keys(data));
    
    // Check for leading indicators with Chicago Fed
    if (data.leadingIndicators) {
      console.log('\n📊 LEADING INDICATORS in NEW endpoint:');
      const keys = Object.keys(data.leadingIndicators.data || {});
      console.log('  Available keys:', keys.join(', '));
      
      // Check for Chicago Fed
      if (data.leadingIndicators.data.CFNAI) {
        console.log('  ✅ CHICAGO FED (CFNAI) IS PRESENT!');
        console.log(`     Data points: ${data.leadingIndicators.data.CFNAI.length}`);
      } else {
        console.log('  ❌ CHICAGO FED (CFNAI) MISSING!');
      }
      
      // Check for YoY versions
      const yoyKeys = ['ICSA_YOY', 'TLMFGCONS_YOY', 'NEWORDER_YOY', 'PERMIT_YOY'];
      yoyKeys.forEach(key => {
        if (data.leadingIndicators.data[key]) {
          console.log(`  ✅ ${key} present with ${data.leadingIndicators.data[key].length} points`);
        } else {
          console.log(`  ❌ ${key} MISSING!`);
        }
      });
    }
    
    // Check for housing
    if (data.housing) {
      console.log('\n🏠 HOUSING in NEW endpoint:');
      const keys = Object.keys(data.housing.data || {});
      console.log('  Available keys:', keys.join(', '));
      
      if (keys.length === 0) {
        console.log('  ❌ Housing data is EMPTY!');
      } else {
        ['SPCS20RSA', 'SPCS20RSA_YOY', 'EXHOSLUSM495S', 'EXHOSLUSM495S_YOY', 'HOUST', 'HOUST_YOY'].forEach(key => {
          if (data.housing.data[key]) {
            console.log(`  ✅ ${key}: ${data.housing.data[key].length} points`);
          }
        });
      }
    }
    
    // Check monetary YoY
    if (data.monetaryPolicy) {
      console.log('\n💰 MONETARY YoY in NEW endpoint:');
      const yoyKeys = ['M2_YOY', 'MMF_YOY', 'FEDFUNDS_YOY', 'DGS2_YOY', 'DGS10_YOY'];
      yoyKeys.forEach(key => {
        if (data.monetaryPolicy.data && data.monetaryPolicy.data[key]) {
          console.log(`  ✅ ${key}: ${data.monetaryPolicy.data[key].length} points`);
        } else {
          console.log(`  ❌ ${key} MISSING!`);
        }
      });
    }
    
    console.log('\n=== NEW ENDPOINT TEST COMPLETE ===');
    console.log('\nIf data is present above, restart your frontend to use /api/macro instead of /api/macroeconomic');
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('❌ /api/macro endpoint NOT FOUND!');
      console.error('   The route is not loaded. Restart your backend server after the changes.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testNewEndpoints().catch(console.error);
