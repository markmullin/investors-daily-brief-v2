// Test script to verify GPT-OSS endpoint is working correctly
// Run this with: node test-gpt-oss.js

import axios from 'axios';

async function testGPTOSS() {
  console.log('Testing GPT-OSS endpoint...\n');
  
  try {
    const response = await axios.post('http://localhost:5000/api/gpt-oss/market-analysis', {
      sp500Price: 6481.41,
      sp500Change: 0.24,
      nasdaqPrice: 20000,
      nasdaqChange: 2.0,
      vix: 15,
      treasury10y: 4.0,
      marketPhase: 'BULL',
      analysisType: 'marketPhase'
    });
    
    console.log('✅ Response received:');
    console.log('Success:', response.data.success);
    console.log('Model:', response.data.data.model);
    console.log('GPU:', response.data.data.gpu);
    console.log('\n📝 Analysis Text:');
    console.log(response.data.data.analysis);
    
    // Check for any special tokens
    const analysis = response.data.data.analysis;
    if (analysis.includes('<|') || analysis.includes('|>')) {
      console.log('\n⚠️ WARNING: Special tokens detected in response!');
    } else {
      console.log('\n✅ No special tokens detected - response is clean!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testGPTOSS();
