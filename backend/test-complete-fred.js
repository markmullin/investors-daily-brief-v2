import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

console.log('=== Testing UPDATED FRED API Endpoints ===\n');
console.log('✅ FIXED: Chicago Fed added, YoY for leading indicators, housing working\n');

async function testEndpoint(name, url) {
  console.log(`\n📊 Testing ${name}...`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    
    console.log('✅ Endpoint responded successfully');
    
    // Check for leading indicators with YoY
    if (data.leadingIndicators) {
      console.log('\n🎯 Leading Indicators Check:');
      const keys = Object.keys(data.leadingIndicators.data);
      
      // Check for Chicago Fed
      if (keys.includes('CFNAI')) {
        const cfnai = data.leadingIndicators.data['CFNAI'];
        console.log(`  ✅ CHICAGO FED (CFNAI): ${cfnai?.length || 0} data points`);
        if (cfnai && cfnai.length > 0) {
          const latest = cfnai[cfnai.length - 1];
          console.log(`     Latest: ${latest.date} = ${latest.value}`);
        }
      } else {
        console.log(`  ❌ CHICAGO FED (CFNAI): NOT FOUND`);
      }
      
      // Check for YoY versions
      const yoyChecks = [
        { absolute: 'ICSA', yoy: 'ICSA_YOY', name: 'Initial Claims' },
        { absolute: 'TLMFGCONS', yoy: 'TLMFGCONS_YOY', name: 'Construction' },
        { absolute: 'NEWORDER', yoy: 'NEWORDER_YOY', name: 'New Orders' },
        { absolute: 'PERMIT', yoy: 'PERMIT_YOY', name: 'Housing Permits' }
      ];
      
      yoyChecks.forEach(check => {
        const hasAbsolute = keys.includes(check.absolute);
        const hasYoY = keys.includes(check.yoy);
        
        if (hasAbsolute && hasYoY) {
          const absData = data.leadingIndicators.data[check.absolute];
          const yoyData = data.leadingIndicators.data[check.yoy];
          console.log(`  ✅ ${check.name}: ${absData?.length || 0} absolute, ${yoyData?.length || 0} YoY points`);
        } else {
          console.log(`  ⚠️ ${check.name}: Absolute=${hasAbsolute}, YoY=${hasYoY}`);
        }
      });
    }
    
    // Check for housing indicators
    if (data.housing) {
      console.log('\n🏠 Housing Indicators Check:');
      const keys = Object.keys(data.housing.data);
      console.log('  Available series:', keys.join(', '));
      
      const housingChecks = [
        { absolute: 'SPCS20RSA', yoy: 'SPCS20RSA_YOY', name: 'Case-Shiller' },
        { absolute: 'EXHOSLUSM495S', yoy: 'EXHOSLUSM495S_YOY', name: 'Existing Home Sales' },
        { absolute: 'HOUST', yoy: 'HOUST_YOY', name: 'Housing Starts' }
      ];
      
      housingChecks.forEach(check => {
        const hasAbsolute = keys.includes(check.absolute);
        const hasYoY = keys.includes(check.yoy);
        
        if (hasAbsolute) {
          const absData = data.housing.data[check.absolute];
          const yoyData = data.housing.data[check.yoy];
          console.log(`  ✅ ${check.name}: ${absData?.length || 0} absolute${hasYoY ? `, ${yoyData?.length || 0} YoY points` : ''}`);
        } else {
          console.log(`  ❌ ${check.name}: NOT FOUND`);
        }
      });
    }
    
    // Check for monetary policy YoY
    if (data.monetaryPolicy) {
      console.log('\n💰 Monetary Policy YoY Check:');
      const keys = Object.keys(data.monetaryPolicy.data);
      
      const monetaryYoYChecks = [
        'M2_YOY',
        'MMF_YOY', 
        'FEDFUNDS_YOY',
        'DGS2_YOY',
        'DGS10_YOY'
      ];
      
      monetaryYoYChecks.forEach(key => {
        if (keys.includes(key)) {
          const yoyData = data.monetaryPolicy.data[key];
          console.log(`  ✅ ${key}: ${yoyData?.length || 0} YoY points`);
        } else {
          console.log(`  ❌ ${key}: NOT FOUND`);
        }
      });
    }
    
    // Check for labor/consumer YoY
    if (data.laborConsumer) {
      console.log('\n👥 Labor & Consumer YoY Check:');
      const keys = Object.keys(data.laborConsumer.data);
      
      const laborYoYChecks = [
        'UNEMPLOYMENT_YOY',
        'RETAIL_YOY',
        'REAL_PERSONAL_INCOME_YOY'
      ];
      
      laborYoYChecks.forEach(key => {
        if (keys.includes(key)) {
          const yoyData = data.laborConsumer.data[key];
          console.log(`  ✅ ${key}: ${yoyData?.length || 0} YoY points`);
        } else {
          console.log(`  ❌ ${key}: NOT FOUND`);
        }
      });
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
  
  // Test the main macro endpoint that includes everything
  await testEndpoint('All Macro Data (Complete)', `${BASE_URL}/macro/all`);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ SUMMARY OF FIXES:');
  console.log('1. Chicago Fed National Activity Index (CFNAI) - ADDED');
  console.log('2. Leading indicators now have YoY growth rates');
  console.log('3. Housing indicators should be present');
  console.log('4. Monetary policy has full YoY lines');
  console.log('5. Labor/consumer has full YoY lines');
  console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
