// Complete diagnostic test for MA200 and RSI indicators
import axios from 'axios';

const testFullFlow = async () => {
  console.log('=== FULL FLOW DIAGNOSTIC TEST ===\n');
  
  try {
    // Test 1: Check backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health-check/check');
    console.log('Backend health:', healthResponse.data);
    
    // Test 2: Test history endpoint directly
    console.log('\n2. Testing history endpoint...');
    const historyResponse = await axios.get('http://localhost:5000/api/market/history/SPY.US?period=1y');
    const data = historyResponse.data;
    
    console.log(`Received ${data.length} data points`);
    
    // Test 3: Check for indicators
    console.log('\n3. Checking for indicators...');
    const ma200Points = data.filter(d => d.ma200 !== null && d.ma200 !== undefined);
    const rsiPoints = data.filter(d => d.rsi !== null && d.rsi !== undefined);
    
    console.log(`Points with MA200: ${ma200Points.length}`);
    console.log(`Points with RSI: ${rsiPoints.length}`);
    
    // Test 4: Show sample data
    console.log('\n4. Sample data points:');
    
    if (data.length > 0) {
      console.log('\nFirst point:', JSON.stringify(data[0], null, 2));
      console.log('\nMiddle point:', JSON.stringify(data[Math.floor(data.length/2)], null, 2));
      console.log('\nLast point:', JSON.stringify(data[data.length - 1], null, 2));
    }
    
    // Test 5: Find first indicator values
    console.log('\n5. First indicator values:');
    const firstWithMA200 = data.find(d => d.ma200 !== null);
    const firstWithRSI = data.find(d => d.rsi !== null);
    
    if (firstWithMA200) {
      console.log('\nFirst MA200:', {
        date: firstWithMA200.date,
        price: firstWithMA200.price,
        ma200: firstWithMA200.ma200
      });
    } else {
      console.log('\nNO MA200 VALUES FOUND!');
    }
    
    if (firstWithRSI) {
      console.log('\nFirst RSI:', {
        date: firstWithRSI.date,
        price: firstWithRSI.price,
        rsi: firstWithRSI.rsi
      });
    } else {
      console.log('\nNO RSI VALUES FOUND!');
    }
    
    // Test 6: Check data structure
    console.log('\n6. Data structure check:');
    if (data.length > 0) {
      console.log('Keys in data:', Object.keys(data[0]));
      console.log('Data types:', {
        date: typeof data[0].date,
        price: typeof data[0].price,
        ma200: typeof data[0].ma200,
        rsi: typeof data[0].rsi
      });
    }
    
  } catch (error) {
    console.error('\nTest failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
console.log('Starting diagnostic test...\n');
testFullFlow();
