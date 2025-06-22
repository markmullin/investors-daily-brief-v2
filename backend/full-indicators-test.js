// Comprehensive test for historical data with indicators
import axios from 'axios';
import fs from 'fs';

async function fullIndicatorsTest() {
  try {
    console.log('=== COMPREHENSIVE INDICATORS TEST ===');
    
    // Test multiple symbols to ensure consistency
    const symbols = ['SPY.US', 'TLT.US', 'QQQ.US'];
    
    for (const symbol of symbols) {
      console.log(`\nTesting ${symbol}:`);
      
      // 1. Direct test to backend API
      const response = await axios.get(`http://localhost:5000/api/market/history/${symbol}?period=1y`);
      const data = response.data;
      
      console.log(`Received ${data.length} data points from backend`);
      
      // Check indicators
      const withMA200 = data.filter(d => d.ma200 !== null).length;
      const withRSI = data.filter(d => d.rsi !== null).length;
      
      console.log(`Points with MA200: ${withMA200} (${(withMA200/data.length*100).toFixed(1)}%)`);
      console.log(`Points with RSI: ${withRSI} (${(withRSI/data.length*100).toFixed(1)}%)`);
      
      // Log sample data
      if (data.length > 200) {
        console.log('\nData at index 200:');
        console.log(JSON.stringify({
          date: data[200].date,
          price: data[200].price || data[200].close,
          ma200: data[200].ma200,
          rsi: data[200].rsi
        }, null, 2));
      }
      
      // Test if the first 200 points have null MA200 (as expected)
      const firstNullMA200 = data.slice(0, 199).every(d => d.ma200 === null);
      console.log(`First 199 points have null MA200 (expected): ${firstNullMA200}`);
      
      // Test if points after 200 have non-null MA200
      const laterPointsHaveMA200 = data.slice(199).some(d => d.ma200 !== null);
      console.log(`Points after index 199 have non-null MA200: ${laterPointsHaveMA200}`);
      
      // Check actual values at key points
      if (data.length > 200) {
        const point200 = data[199];
        const point250 = data.length > 250 ? data[249] : null;
        
        console.log('\nMA200 at index 199:', point200.ma200);
        if (point250) console.log('MA200 at index 249:', point250.ma200);
      }
      
      // Write results to a test file for inspection
      const testFilePath = `./test-results-${symbol.replace('.', '-')}.json`;
      fs.writeFileSync(testFilePath, JSON.stringify({
        symbol,
        totalPoints: data.length,
        withMA200,
        withRSI,
        ma200Percentage: (withMA200/data.length*100),
        rsiPercentage: (withRSI/data.length*100),
        sample: data.length > 200 ? {
          point200: {
            date: data[199].date,
            price: data[199].price || data[199].close,
            ma200: data[199].ma200,
            rsi: data[199].rsi
          },
          lastPoint: {
            date: data[data.length-1].date,
            price: data[data.length-1].price || data[data.length-1].close,
            ma200: data[data.length-1].ma200,
            rsi: data[data.length-1].rsi
          }
        } : null
      }, null, 2));
      
      console.log(`Test results written to ${testFilePath}`);
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

fullIndicatorsTest();