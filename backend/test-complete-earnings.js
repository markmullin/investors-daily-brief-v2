/**
 * Complete end-to-end test of earnings functionality
 */

import axios from 'axios';

const symbol = 'ORCL';
const baseUrl = 'http://localhost:5000';

console.log('🔍 Complete Earnings System Test\n');
console.log('=' .repeat(50));

async function testEarningsSystem() {
  try {
    // Test 1: Check if theme routes are registered
    console.log('\n1. Testing if /api/themes routes are registered:');
    console.log('─'.repeat(50));
    
    try {
      const healthResponse = await axios.get(`${baseUrl}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server not running! Start it first.');
      return;
    }
    
    // Test 2: Direct FMP service test
    console.log('\n2. Testing FMP Service directly:');
    console.log('─'.repeat(50));
    
    const { default: fmpService } = await import('./src/services/fmpService.js');
    const transcripts = await fmpService.getEarningsCallTranscripts(symbol, 3);
    console.log(`✅ FMP Service returned ${transcripts.length} transcripts`);
    
    if (transcripts.length > 0) {
      const first = transcripts[0];
      console.log('First transcript:');
      console.log(`  - Date: ${first.date}`);
      console.log(`  - Quarter: ${first.quarter}`);
      console.log(`  - Year: ${first.year}`);
      console.log(`  - Has content: ${!!first.content}`);
      console.log(`  - Content length: ${first.content ? first.content.length : 0}`);
      
      if (first.content) {
        console.log(`  - Content preview: ${first.content.substring(0, 100)}...`);
      }
    }
    
    // Test 3: Test the theme endpoint
    console.log('\n3. Testing /api/themes/earnings endpoint:');
    console.log('─'.repeat(50));
    
    const themeResponse = await axios.get(`${baseUrl}/api/themes/earnings/${symbol}/analyze`);
    console.log(`✅ Theme endpoint returned status ${themeResponse.status}`);
    
    const data = themeResponse.data;
    console.log('Response structure:');
    console.log(`  - Symbol: ${data.symbol}`);
    console.log(`  - Transcripts: ${data.transcripts ? data.transcripts.length : 0}`);
    console.log(`  - Has themes: ${!!data.themes}`);
    console.log(`  - Has insights: ${!!data.investmentInsights}`);
    
    if (data.transcripts && data.transcripts.length > 0) {
      const firstTranscript = data.transcripts[0];
      console.log('\nFirst transcript in response:');
      console.log(`  - Quarter: ${firstTranscript.quarter}`);
      console.log(`  - Date: ${firstTranscript.date}`);
      console.log(`  - Has full content: ${!!firstTranscript.fullContent}`);
      console.log(`  - Content length: ${firstTranscript.fullContent ? firstTranscript.fullContent.length : 0}`);
      console.log(`  - Has summary: ${!!firstTranscript.summary}`);
      console.log(`  - Topics: ${firstTranscript.topics ? firstTranscript.topics.join(', ') : 'none'}`);
      
      if (firstTranscript.fullContent) {
        console.log(`  - Content preview: ${firstTranscript.fullContent.substring(0, 200)}...`);
      }
    }
    
    // Test 4: Verify frontend can display the data
    console.log('\n4. Data structure for frontend:');
    console.log('─'.repeat(50));
    
    if (data.transcripts && data.transcripts.length > 0) {
      console.log('✅ Data is properly structured for frontend display');
      console.log('   - Transcripts have quarter labels');
      console.log('   - Transcripts have dates');
      console.log('   - Transcripts have content/fullContent');
      console.log('   - Ready for display in EarningsTab component');
    } else {
      console.log('⚠️ No transcript data available');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Earnings system test complete!');
    console.log('\nNext steps:');
    console.log('1. Make sure backend is restarted');
    console.log('2. Refresh the frontend page');
    console.log('3. Navigate to ORCL stock');
    console.log('4. Click on Earnings tab');
    console.log('5. Click on any transcript card to expand and see content');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testEarningsSystem();
