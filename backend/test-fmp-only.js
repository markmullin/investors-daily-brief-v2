/**
 * TEST: FMP API Data Fetching Only
 * Tests if FMP is getting real historical price data
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testFMPData() {
  try {
    console.log('🔍 STEP 1: Testing FMP API Data Fetching...');
    
    // Import FMP service  
    const { default: fmpService } = await import('./src/services/fmpService.js');
    console.log('✅ FMP Service imported successfully');
    
    // Get SPY historical data
    console.log('📊 Fetching SPY historical data (1 year)...');
    const spyHistory = await fmpService.getHistoricalPrices('SPY', '1y');
    
    if (!spyHistory || spyHistory.length === 0) {
      console.error('❌ FMP returned no data for SPY');
      return false;
    }
    
    console.log(`✅ FMP returned ${spyHistory.length} price points for SPY`);
    
    // Check data structure
    const latestPoint = spyHistory[0];
    console.log('📊 Latest data point:', {
      date: latestPoint.date,
      close: latestPoint.close,
      volume: latestPoint.volume,
      high: latestPoint.high,
      low: latestPoint.low
    });
    
    // Prepare data for Python (simulate education route processing)
    const marketData = {
      symbol: 'SPY',
      prices: spyHistory.map(item => parseFloat(item.close)),
      timestamps: spyHistory.map(item => item.date),
      volume: spyHistory.map(item => parseInt(item.volume))
    };
    
    console.log('📊 Formatted market data:');
    console.log(`   - Symbol: ${marketData.symbol}`);
    console.log(`   - Price count: ${marketData.prices.length}`);
    console.log(`   - Latest price: $${marketData.prices[0]}`);
    console.log(`   - Price range: $${Math.min(...marketData.prices)} - $${Math.max(...marketData.prices)}`);
    
    // Save test data
    fs.writeFileSync('./test-fmp-data.json', JSON.stringify(marketData, null, 2));
    console.log('💾 Test data saved to test-fmp-data.json');
    
    return marketData;
    
  } catch (error) {
    console.error('❌ FMP TEST FAILED:', error.message);
    console.error('❌ Stack:', error.stack);
    return false;
  }
}

// Run the test
console.log('🚀 Starting FMP API test...');
testFMPData()
  .then(result => {
    if (result) {
      console.log('✅ FMP TEST PASSED - Data pipeline step 1 working');
    } else {
      console.log('❌ FMP TEST FAILED - Data pipeline broken at step 1');
    }
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });