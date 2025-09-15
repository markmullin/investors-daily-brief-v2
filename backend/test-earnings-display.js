/**
 * Test script to debug earnings display issues
 * Run with: node test-earnings-display.js
 */

import 'dotenv/config';
import fmpService from './src/services/fmpService.js';
import earningsAnalysisService from './src/services/earningsAnalysisService.js';

async function testEarningsDisplay() {
  const symbol = 'AVGO';  // Testing with AVGO as shown in screenshot
  
  console.log('\n=== TESTING EARNINGS DATA FOR', symbol, '===\n');
  
  try {
    // 1. Test raw FMP transcripts
    console.log('📊 Step 1: Getting raw transcripts from FMP...');
    const transcripts = await fmpService.getEarningsTranscripts(symbol);
    
    if (transcripts && transcripts.length > 0) {
      console.log(`✅ Found ${transcripts.length} transcripts\n`);
      
      // Show first 3 transcripts to see the data structure
      console.log('First 3 transcripts data structure:');
      transcripts.slice(0, 3).forEach((t, i) => {
        console.log(`\nTranscript ${i + 1}:`);
        console.log(`  Date: ${t.date}`);
        console.log(`  Quarter: Q${t.quarter} ${t.year}`);
        console.log(`  Symbol: ${t.symbol}`);
        console.log(`  Content length: ${t.content?.length || 0} chars`);
      });
    } else {
      console.log('❌ No transcripts found');
    }
    
    // 2. Test the analysis service
    console.log('\n📊 Step 2: Testing earnings analysis service...');
    const analysis = await earningsAnalysisService.analyzeEarningsTranscripts(symbol);
    
    if (analysis && analysis.transcriptAnalyses) {
      console.log(`✅ Analysis complete with ${analysis.transcriptAnalyses.length} entries\n`);
      
      // Show the structure of each analysis
      console.log('Analysis entries:');
      analysis.transcriptAnalyses.forEach((a, i) => {
        console.log(`\nAnalysis ${i + 1}:`);
        console.log(`  Quarter: ${a.quarter}`);
        console.log(`  Date: ${a.date}`);
        console.log(`  Status: ${a.analysisStatus}`);
        if (a.managementSentiment) {
          console.log(`  Sentiment: ${a.managementSentiment.overall} (${a.managementSentiment.confidenceScore}/100)`);
        }
        if (a.keyThemes && a.keyThemes.length > 0) {
          console.log(`  Themes: ${a.keyThemes.slice(0, 3).join(', ')}`);
        }
      });
    } else {
      console.log('❌ No analysis data');
    }
    
    // 3. Test what the API endpoint returns
    console.log('\n📊 Step 3: Testing API endpoint response format...');
    const apiUrl = `http://localhost:5000/api/research/earnings/${symbol}/analysis`;
    
    try {
      const response = await fetch(apiUrl);
      const apiData = await response.json();
      
      if (apiData.transcriptAnalyses) {
        console.log(`✅ API returns ${apiData.transcriptAnalyses.length} transcript analyses`);
        
        // Check if quarters are different
        const quarters = apiData.transcriptAnalyses.map(t => t.quarter);
        console.log('\nQuarters in response:', quarters);
        
        const uniqueQuarters = [...new Set(quarters)];
        if (uniqueQuarters.length === 1 && apiData.transcriptAnalyses.length > 1) {
          console.log('⚠️ WARNING: All quarters are the same! This is the bug.');
          console.log('All showing as:', uniqueQuarters[0]);
        } else {
          console.log('✅ Quarters are different:', uniqueQuarters.join(', '));
        }
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

// Run the test
testEarningsDisplay();
