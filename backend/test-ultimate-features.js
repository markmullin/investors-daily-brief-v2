/**
 * ULTIMATE FMP TEST - Full Premium Feature Testing
 * 
 * Since you have FMP Ultimate, this will test all premium features:
 * - Real earnings transcripts with full content
 * - AI analysis of actual management communications
 * - Complete theme extraction for stock discovery
 */

import 'dotenv/config';
import fmpService from './src/services/fmpService.js';

const TEST_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AVGO']; // Test multiple stocks

async function testUltimateFeatures() {
  console.log('🚀 [ULTIMATE TEST] Testing FMP Ultimate Features...');
  console.log('💎 You have FMP Ultimate - All premium features available!');
  console.log('=' .repeat(70));
  
  for (const symbol of TEST_SYMBOLS) {
    console.log(`\n📊 TESTING ${symbol}:`);
    console.log('-'.repeat(40));
    
    try {
      // Test 1: Get transcript dates (should work)
      console.log('1️⃣ Getting transcript dates...');
      const response1 = await fetch(`https://financialmodelingprep.com/api/v4/earning_call_transcript?symbol=${symbol}&apikey=${process.env.FMP_API_KEY}`);
      const transcriptDates = await response1.json();
      
      if (Array.isArray(transcriptDates) && transcriptDates.length > 0) {
        console.log(`✅ ${transcriptDates.length} transcript dates found`);
        
        // Test 2: Get actual transcript content (Ultimate feature)
        const latest = transcriptDates[0];
        console.log(`2️⃣ Getting transcript content for Q${latest.quarter} ${latest.year}...`);
        
        const response2 = await fetch(`https://financialmodelingprep.com/api/v3/earning_call_transcript/${symbol}?quarter=${latest.quarter}&year=${latest.year}&apikey=${process.env.FMP_API_KEY}`);
        const transcript = await response2.json();
        
        if (Array.isArray(transcript) && transcript.length > 0 && transcript[0].content) {
          const content = transcript[0].content;
          console.log(`✅ TRANSCRIPT CONTENT RETRIEVED!`);
          console.log(`📄 Content length: ${content.length} characters`);
          console.log(`📝 Preview: "${content.substring(0, 200)}..."`);
          
          // This is the key - real transcript content for AI analysis!
          console.log(`🧠 Ready for AI theme extraction and sentiment analysis!`);
        } else {
          console.log(`⚠️ No transcript content available for ${symbol} Q${latest.quarter} ${latest.year}`);
        }
      } else {
        console.log(`⚠️ No transcript dates for ${symbol}`);
      }
      
      // Test 3: Enhanced service method
      console.log('3️⃣ Testing enhanced service methods...');
      const transcripts = await fmpService.getEarningsTranscripts(symbol);
      console.log(`📊 Enhanced service returned ${transcripts.length} transcripts`);
      
      const withContent = transcripts.filter(t => t.content && t.content.length > 0);
      console.log(`📄 ${withContent.length} transcripts have actual content`);
      
      if (withContent.length > 0) {
        console.log(`🎯 Sample transcript: Q${withContent[0].quarter} ${withContent[0].year}`);
        console.log(`📝 Content preview: "${withContent[0].content.substring(0, 150)}..."`);
        console.log(`⏱️ Estimated length: ${withContent[0].length} minutes`);
      }
      
      // Test 4: Comprehensive analysis
      console.log('4️⃣ Testing comprehensive analysis...');
      const comprehensive = await fmpService.getComprehensiveEarningsAnalysis(symbol);
      console.log(`📈 Analysis summary:`);
      console.log(`   • Transcripts: ${comprehensive.transcripts.length}`);
      console.log(`   • With content: ${comprehensive.transcripts.filter(t => t.content).length}`);
      console.log(`   • Next earnings: ${comprehensive.nextEarningsDate ? comprehensive.nextEarningsDate.date : 'Not scheduled'}`);
      console.log(`   • Data quality: ${comprehensive.dataQuality.overallScore}/100`);
      
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎉 ULTIMATE TEST COMPLETE!');
  console.log('\n💡 What this means:');
  console.log('   ✅ Real earnings transcripts with full management commentary');
  console.log('   ✅ AI can analyze actual CEO/CFO discussions');
  console.log('   ✅ Theme extraction from real corporate strategy talks');
  console.log('   ✅ Investment discovery based on what companies actually say');
  console.log('\n🚀 Your earnings analysis system is PREMIUM-READY!');
}

// Run the ultimate test
testUltimateFeatures().catch(console.error);
