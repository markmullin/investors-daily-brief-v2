const axios = require('axios');

const API_URL = 'http://localhost:5000';

console.log('=== Testing SPECIFIC Macro Issues ===');
console.log('Checking: Housing data, MMF dual axis, Real Personal Income\n');

async function testSpecificIssues() {
  try {
    const response = await axios.get(`${API_URL}/api/macro/all`);
    const data = response.data;
    
    console.log('1. HOUSING DATA CHECK:');
    console.log('--------------------');
    if (data.housing?.data) {
      console.log('✅ Housing data exists');
      console.log('   - SPCS20RSA (Case-Shiller):', data.housing.data.SPCS20RSA ? data.housing.data.SPCS20RSA.length + ' points' : 'MISSING');
      console.log('   - EXHOSLUSM495S (Existing Sales):', data.housing.data.EXHOSLUSM495S ? data.housing.data.EXHOSLUSM495S.length + ' points' : 'MISSING');
      console.log('   - HOUST (Housing Starts):', data.housing.data.HOUST ? data.housing.data.HOUST.length + ' points' : 'MISSING');
      
      // Show sample data
      if (data.housing.data.SPCS20RSA && data.housing.data.SPCS20RSA.length > 0) {
        const latest = data.housing.data.SPCS20RSA[data.housing.data.SPCS20RSA.length - 1];
        console.log('   Latest Case-Shiller:', latest);
      }
    } else {
      console.log('❌ Housing data is missing from backend response!');
    }
    
    console.log('\n2. MONETARY POLICY DATA CHECK (for dual axis):');
    console.log('----------------------------------------------');
    if (data.monetaryPolicy?.data) {
      console.log('✅ Monetary policy data exists');
      console.log('   Available keys:', Object.keys(data.monetaryPolicy.data));
      
      // Check M2 absolute values
      if (data.monetaryPolicy.data.M2SL) {
        const m2Latest = data.monetaryPolicy.data.M2SL[data.monetaryPolicy.data.M2SL.length - 1];
        console.log('   M2SL latest value:', m2Latest.value, '(should be in billions, need to divide by 1000 for trillions)');
        console.log('   M2SL in trillions:', (m2Latest.value / 1000).toFixed(2));
      }
      
      // Check MMF absolute values
      if (data.monetaryPolicy.data.MMMFFAQ027S) {
        const mmfLatest = data.monetaryPolicy.data.MMMFFAQ027S[data.monetaryPolicy.data.MMMFFAQ027S.length - 1];
        console.log('   MMF latest value:', mmfLatest.value, '(should be in billions, need to divide by 1000 for trillions)');
        console.log('   MMF in trillions:', (mmfLatest.value / 1000).toFixed(2));
      }
      
      // Renamed keys check
      if (data.monetaryPolicy.data.MONEY_MARKET_FUNDS) {
        const mmfLatest = data.monetaryPolicy.data.MONEY_MARKET_FUNDS[data.monetaryPolicy.data.MONEY_MARKET_FUNDS.length - 1];
        console.log('   MONEY_MARKET_FUNDS latest value:', mmfLatest.value);
      }
    } else {
      console.log('❌ Monetary policy data is missing!');
    }
    
    console.log('\n3. LABOR CONSUMER DATA CHECK (Real Personal Income):');
    console.log('----------------------------------------------------');
    if (data.laborConsumer?.data) {
      console.log('✅ Labor consumer data exists');
      console.log('   Available keys:', Object.keys(data.laborConsumer.data));
      
      // Check for Real Personal Income (W875RX1)
      if (data.laborConsumer.data.W875RX1) {
        console.log('   ✅ W875RX1 (Real Personal Income) exists:', data.laborConsumer.data.W875RX1.length, 'points');
        const latest = data.laborConsumer.data.W875RX1[data.laborConsumer.data.W875RX1.length - 1];
        console.log('   Latest value:', latest);
      } else {
        console.log('   ❌ W875RX1 (Real Personal Income) is MISSING!');
      }
      
      // Check for alternative keys
      if (data.laborConsumer.data.REAL_PERSONAL_INCOME) {
        console.log('   ✅ REAL_PERSONAL_INCOME exists:', data.laborConsumer.data.REAL_PERSONAL_INCOME.length, 'points');
      }
      if (data.laborConsumer.data.REAL_INCOME_YOY) {
        console.log('   ✅ REAL_INCOME_YOY exists:', data.laborConsumer.data.REAL_INCOME_YOY.length, 'points');
      }
    } else {
      console.log('❌ Labor consumer data is missing!');
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('Issues found:');
    
    let issues = [];
    if (!data.housing?.data?.SPCS20RSA || !data.housing?.data?.EXHOSLUSM495S) {
      issues.push('Housing data missing or incomplete');
    }
    if (!data.laborConsumer?.data?.W875RX1 && !data.laborConsumer?.data?.REAL_PERSONAL_INCOME) {
      issues.push('Real Personal Income data missing');
    }
    if (data.monetaryPolicy?.data?.M2SL && data.monetaryPolicy.data.M2SL.length > 0) {
      const m2Val = data.monetaryPolicy.data.M2SL[data.monetaryPolicy.data.M2SL.length - 1].value;
      if (m2Val > 1000) {
        issues.push('M2 values are in billions, need to convert to trillions (divide by 1000)');
      }
    }
    
    if (issues.length > 0) {
      console.log('❌ Problems detected:');
      issues.forEach(issue => console.log('   -', issue));
    } else {
      console.log('✅ All data looks good!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSpecificIssues();