/**
 * Test Market Phase Detection
 */

import axios from 'axios';

async function testMarketPhase() {
  console.log('🎯 Testing Market Phase Detection...\n');
  
  try {
    // Test the phase endpoint directly
    const response = await axios.get('http://localhost:5000/api/market-env/phase');
    
    console.log('Response received:', response.data.success ? '✅ Success' : '❌ Failed');
    
    if (response.data.data) {
      const phase = response.data.data;
      console.log('\n📊 Phase Data:');
      console.log('  Phase:', phase.phase);
      console.log('  Confidence:', phase.confidence);
      
      if (phase.metrics) {
        console.log('\n📈 Metrics:');
        console.log('  Current Price:', phase.metrics.currentPrice);
        console.log('  52-Week High:', phase.metrics.high52Week);
        console.log('  52-Week Low:', phase.metrics.low52Week);
        console.log('  % From High:', phase.metrics.percentFromHigh?.toFixed(2) + '%');
        console.log('  % From Low:', phase.metrics.percentFromLow?.toFixed(2) + '%');
      }
      
      if (phase.error) {
        console.log('\n⚠️ Error in phase detection:', phase.error);
      }
    } else {
      console.log('No data in response');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

testMarketPhase();
