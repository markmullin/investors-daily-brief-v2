// Direct test with specific logging to diagnose indicator issues
import axios from 'axios';

async function directIndicatorTest() {
  try {
    console.log('DIRECT INDICATOR TEST - ISOLATED TEST');
    
    const symbol = 'SPY.US';
    console.log(`Testing ${symbol}...`);
    
    // Make request to get data
    const response = await axios.get(`http://localhost:5000/api/market/history/${symbol}?period=1y`);
    const data = response.data;
    
    console.log(`Received ${data.length} data points`);
    
    // Create small test array with our own indicators to verify the code works
    const testData = [
      { date: '2024-01-01', price: 100, ma200: 95, rsi: 60 },
      { date: '2024-01-02', price: 101, ma200: 96, rsi: 62 },
      { date: '2024-01-03', price: 102, ma200: 97, rsi: 65 },
    ];
    
    console.log('\nTest data with indicators:');
    testData.forEach(item => {
      console.log(`Date: ${item.date}, Price: ${item.price}, MA200: ${item.ma200}, RSI: ${item.rsi}`);
    });
    
    // Access the indicators in our test data as a sanity check
    console.log('\nAccessing test indicators:');
    console.log(`First item MA200: ${testData[0].ma200}`);
    console.log(`First item RSI: ${testData[0].rsi}`);
    
    // Now let's check the actual data
    console.log('\nChecking actual data structure:');
    
    // First log all properties of the first item
    if (data.length > 0) {
      console.log('All properties of first item:');
      for (const key in data[0]) {
        console.log(`${key}: ${data[0][key]}`);
      }
      
      // Now try to access the indicators
      console.log('\nTrying to access indicators:');
      
      // Check for multiple possible property names
      const props = ['ma200', 'MA200', 'movingAverage200', 'rsi', 'RSI', 'relativeStrengthIndex'];
      
      for (const prop of props) {
        console.log(`Checking for property "${prop}": ${prop in data[0]}`);
        if (prop in data[0]) {
          console.log(`Value: ${data[0][prop]}`);
        }
      }
      
      // Check the data at index 200 (which should definitely have indicators)
      if (data.length > 200) {
        console.log('\nChecking data at index 200:');
        for (const key in data[200]) {
          console.log(`${key}: ${data[200][key]}`);
        }
      }
      
      // Look for any item with non-null indicator values
      const withMA200 = data.find(item => item.ma200 !== null && item.ma200 !== undefined);
      const withRSI = data.find(item => item.rsi !== null && item.rsi !== undefined);
      
      console.log('\nAny items with indicators:');
      console.log(`Found item with MA200: ${withMA200 ? 'Yes' : 'No'}`);
      console.log(`Found item with RSI: ${withRSI ? 'Yes' : 'No'}`);
      
      if (withMA200) {
        console.log('Item with MA200:');
        console.log(withMA200);
      }
      
      if (withRSI) {
        console.log('Item with RSI:');
        console.log(withRSI);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

directIndicatorTest();