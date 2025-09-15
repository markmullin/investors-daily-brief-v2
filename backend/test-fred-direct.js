// Direct test of fredService to bypass all routing layers
import fredService from './src/services/fredService.js';

console.log('=== DIRECT FRED SERVICE TEST ===\n');
console.log('Testing fredService.getAllMacroData() directly...\n');

async function testDirectly() {
  try {
    const data = await fredService.getAllMacroData();
    
    console.log('✅ Data received from fredService.getAllMacroData()\n');
    
    // Check what's in the response
    console.log('Top-level keys:', Object.keys(data));
    
    // Check leading indicators
    if (data.leadingIndicators) {
      console.log('\n📊 LEADING INDICATORS:');
      console.log('  Has data?', !!data.leadingIndicators.data);
      if (data.leadingIndicators.data) {
        const keys = Object.keys(data.leadingIndicators.data);
        console.log('  Data keys:', keys);
        
        // Check for specific series
        console.log('\n  Series check:');
        console.log('    CFNAI?', keys.includes('CFNAI'));
        console.log('    ICSA_YOY?', keys.includes('ICSA_YOY'));
        console.log('    TLMFGCONS_YOY?', keys.includes('TLMFGCONS_YOY'));
        console.log('    NEWORDER_YOY?', keys.includes('NEWORDER_YOY'));
        console.log('    PERMIT_YOY?', keys.includes('PERMIT_YOY'));
      }
    } else {
      console.log('\n❌ NO leadingIndicators in response!');
    }
    
    // Check housing
    if (data.housing) {
      console.log('\n🏠 HOUSING:');
      console.log('  Has data?', !!data.housing.data);
      if (data.housing.data) {
        const keys = Object.keys(data.housing.data);
        console.log('  Data keys:', keys);
        
        // Check for specific series
        console.log('\n  Series check:');
        console.log('    SPCS20RSA?', keys.includes('SPCS20RSA'));
        console.log('    SPCS20RSA_YOY?', keys.includes('SPCS20RSA_YOY'));
        console.log('    EXHOSLUSM495S?', keys.includes('EXHOSLUSM495S'));
        console.log('    HOUST?', keys.includes('HOUST'));
      }
    } else {
      console.log('\n❌ NO housing in response!');
    }
    
    // Check monetary policy YoY
    if (data.monetaryPolicy) {
      console.log('\n💰 MONETARY POLICY:');
      console.log('  Has data?', !!data.monetaryPolicy.data);
      if (data.monetaryPolicy.data) {
        const keys = Object.keys(data.monetaryPolicy.data);
        console.log('  Data keys:', keys);
        
        // Check for YoY series
        console.log('\n  YoY series check:');
        console.log('    M2_YOY?', keys.includes('M2_YOY'));
        console.log('    MMF_YOY?', keys.includes('MMF_YOY'));
        console.log('    FEDFUNDS_YOY?', keys.includes('FEDFUNDS_YOY'));
        console.log('    DGS2_YOY?', keys.includes('DGS2_YOY'));
        console.log('    DGS10_YOY?', keys.includes('DGS10_YOY'));
      }
    }
    
    // Check labor/consumer YoY
    if (data.laborConsumer) {
      console.log('\n👥 LABOR & CONSUMER:');
      console.log('  Has data?', !!data.laborConsumer.data);
      if (data.laborConsumer.data) {
        const keys = Object.keys(data.laborConsumer.data);
        console.log('  Data keys:', keys);
        
        // Check for YoY series
        console.log('\n  YoY series check:');
        console.log('    UNEMPLOYMENT_YOY?', keys.includes('UNEMPLOYMENT_YOY'));
        console.log('    RETAIL_YOY?', keys.includes('RETAIL_YOY'));
        console.log('    REAL_PERSONAL_INCOME_YOY?', keys.includes('REAL_PERSONAL_INCOME_YOY'));
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testDirectly();
