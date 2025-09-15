/**
 * Test what data is actually being returned
 */

import axios from 'axios';

const symbol = 'ORCL';

console.log('🔍 Testing what earnings endpoint actually returns...\n');

async function testEarningsEndpoint() {
  try {
    // Test the actual endpoint the frontend is calling
    const response = await axios.get(`http://localhost:5000/api/themes/earnings/${symbol}/analyze`);
    
    console.log('✅ Response received');
    console.log('Status:', response.status);
    console.log('\nData structure:');
    console.log('- symbol:', response.data.symbol);
    console.log('- lastUpdated:', response.data.lastUpdated);
    console.log('- transcripts:', Array.isArray(response.data.transcripts) ? `Array with ${response.data.transcripts.length} items` : typeof response.data.transcripts);
    
    if (response.data.transcripts && response.data.transcripts.length > 0) {
      console.log('\nFirst transcript:');
      const first = response.data.transcripts[0];
      console.log('  - quarter:', first.quarter);
      console.log('  - date:', first.date);
      console.log('  - year:', first.year);
      console.log('  - period:', first.period);
      console.log('  - hasTranscript:', first.hasTranscript);
      console.log('  - fullContent exists:', !!first.fullContent);
      console.log('  - summary exists:', !!first.summary);
      console.log('  - topics:', first.topics);
    }
    
    console.log('\nFull response (first 2000 chars):');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 2000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testEarningsEndpoint();
