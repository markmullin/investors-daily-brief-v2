/**
 * Quick Test Script - Shows exactly what's happening
 * Run this to see the data flow
 */

const axios = require('axios');

async function testDataFlow() {
  console.log('\n📊 TESTING DATA FLOW\n');
  console.log('=' .repeat(50));

  // Test 1: Check real FMP data
  console.log('\n1️⃣ REAL FMP DATA:');
  try {
    const fmpResponse = await axios.get(
      'https://financialmodelingprep.com/api/v3/quote/SPY,TLT,EEM,EFA?apikey=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1'
    );
    
    const spy = fmpResponse.data.find(d => d.symbol === 'SPY');
    const eem = fmpResponse.data.find(d => d.symbol === 'EEM');
    
    console.log(`   SPY: $${spy.price} (${spy.changesPercentage}%)`);
    console.log(`   EEM: $${eem.price} (${eem.changesPercentage}%)`);
  } catch (error) {
    console.log('   ❌ FMP Error:', error.message);
  }

  // Test 2: Check Python service
  console.log('\n2️⃣ PYTHON SERVICE:');
  try {
    const pythonResponse = await axios.post('http://localhost:8000/analyze', {
      type: 'correlations',
      data: {
        pair: 'spy-vs-eem-vs-efa',
        asset1: 'SPY',
        asset2: 'EEM',
        asset3: 'EFA'
      }
    });
    
    console.log(`   ${pythonResponse.data.asset1}: ${pythonResponse.data.asset1Performance}%`);
    console.log(`   ${pythonResponse.data.asset2}: ${pythonResponse.data.asset2Performance}%`);
    console.log(`   Correlation: ${pythonResponse.data.correlation}`);
  } catch (error) {
    console.log('   ❌ Python not running!');
    console.log('   Run: npm run analysis:start');
  }

  // Test 3: Check backend intelligent analysis
  console.log('\n3️⃣ BACKEND ANALYSIS:');
  try {
    const analysisResponse = await axios.get(
      'http://localhost:5000/api/intelligent-analysis/correlations/spy-vs-eem-vs-efa'
    );
    
    if (analysisResponse.data.success) {
      const calc = analysisResponse.data.calculations;
      console.log(`   Analysis for: ${calc.pair}`);
      console.log(`   ${calc.asset1}: ${calc.asset1Performance}%`);
      console.log(`   ${calc.asset2}: ${calc.asset2Performance}%`);
      
      // Check if AI is using right data
      const insight = analysisResponse.data.insight;
      const mentionsSPY = insight.includes('SPY');
      const mentionsEEM = insight.includes('EEM');
      const mentionsCorrectAssets = mentionsSPY && mentionsEEM;
      
      console.log(`\n   ✅ AI mentions correct assets: ${mentionsCorrectAssets ? 'YES' : 'NO'}`);
      
      if (!mentionsCorrectAssets) {
        console.log('   ❌ AI is analyzing wrong assets!');
        console.log(`   Insight: "${insight.substring(0, 100)}..."`);
      }
    }
  } catch (error) {
    console.log('   ❌ Backend error:', error.message);
  }

  // Test 4: Check sector data
  console.log('\n4️⃣ SECTOR DATA:');
  try {
    const sectorResponse = await axios.get(
      'https://financialmodelingprep.com/api/v3/sector-performance?apikey=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1'
    );
    
    const sectors = sectorResponse.data;
    const sorted = sectors.sort((a, b) => 
      parseFloat(b.changesPercentage) - parseFloat(a.changesPercentage)
    );
    
    console.log(`   Top: ${sorted[0].sector} (${sorted[0].changesPercentage})`);
    console.log(`   Worst: ${sorted[sorted.length-1].sector} (${sorted[sorted.length-1].changesPercentage})`);
  } catch (error) {
    console.log('   ❌ Sector data error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Data flow test complete!');
  console.log('\nIf you see wrong assets or percentages above,');
  console.log('the issue is in the data pipeline.\n');
}

// Run test
testDataFlow().catch(console.error);
