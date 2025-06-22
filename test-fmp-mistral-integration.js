/**
 * FMP + MISTRAL AI VERIFICATION TEST
 * Confirms we're using FMP Premium API + Mistral AI for Daily Market Brief
 */

async function testFmpMistralIntegration() {
  console.log('🔍 FMP PREMIUM + MISTRAL AI VERIFICATION TEST');
  console.log('Testing: FMP News API + Mistral AI Analysis Integration');
  console.log('=' .repeat(70));
  
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    // Test 1: Backend Configuration Check
    console.log('\n📍 TEST 1: Backend Service Configuration');
    const healthResponse = await fetch(`${baseUrl}/../health`);
    const health = await healthResponse.json();
    
    console.log(`✅ Backend Version: ${health.version}`);
    console.log(`✅ FMP API Available: ${health.apis?.fmp ? 'YES' : 'NO'}`);
    console.log(`✅ Mistral API Available: ${health.apis?.mistral ? 'YES' : 'NO'}`);
    
    // Test 2: FMP + Mistral AI Analysis Test
    console.log('\n📍 TEST 2: FMP Premium News + Mistral AI Analysis');
    console.log('Expected: Professional financial news + AI-generated analysis');
    
    const startTime = Date.now();
    const aiResponse = await Promise.race([
      fetch(`${baseUrl}/ai/ai-analysis`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 20000))
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      console.log(`✅ Response Time: ${responseTime}ms (${(responseTime/1000).toFixed(1)}s)`);
      
      // Verify FMP Integration
      console.log('\n📍 TEST 3: FMP News Integration Verification');
      const newsProvider = aiData.analysis?.newsProvider;
      const dataSource = aiData.analysis?.dataSource;
      const aiModel = aiData.analysis?.aiModel;
      const analysisSource = aiData.analysis?.analysisSource;
      
      console.log(`News Provider: ${newsProvider}`);
      console.log(`Data Source: ${dataSource}`);
      console.log(`AI Model: ${aiModel}`);
      console.log(`Analysis Source: ${analysisSource}`);
      
      const usingFmp = newsProvider?.includes('FMP') || dataSource?.includes('fmp');
      const usingMistral = aiModel?.includes('Mistral') || analysisSource?.includes('mistral');
      
      console.log(`✅ Using FMP Premium: ${usingFmp ? 'YES' : 'NO'}`);
      console.log(`✅ Using Mistral AI: ${usingMistral ? 'YES' : 'NO'}`);
      
      // Verify News Source Quality
      console.log('\n📍 TEST 4: News Source Quality Check');
      const sources = aiData.sources || [];
      console.log(`News Sources Count: ${sources.length}`);
      
      let fmpSourceCount = 0;
      sources.slice(0, 5).forEach((source, i) => {
        console.log(`${i + 1}. [${source.source}] "${source.title?.substring(0, 60)}..."`);
        if (source.fmpSource || source.source?.includes('FMP') || source.type?.includes('fmp')) {
          fmpSourceCount++;
        }
      });
      
      console.log(`FMP Sources: ${fmpSourceCount}/${sources.length}`);
      
      // Verify Content Quality
      console.log('\n📍 TEST 5: Content Quality Assessment');
      const analysisContent = aiData.analysis?.content || '';
      const hasHtmlTags = /<[^>]*>/.test(analysisContent);
      const hasSpecificCompanies = /Apple|Microsoft|Google|Amazon|Tesla|Fed|Federal Reserve|earnings|revenue/.test(analysisContent);
      const hasActionableContent = /investment|position|strategy|opportunity|risk/.test(analysisContent.toLowerCase());
      
      console.log(`Content Length: ${analysisContent.length} characters`);
      console.log(`HTML Tags: ${hasHtmlTags ? '❌ Found' : '✅ Clean'}`);
      console.log(`Specific Content: ${hasSpecificCompanies ? '✅ Yes' : '❌ Generic'}`);
      console.log(`Actionable Insights: ${hasActionableContent ? '✅ Yes' : '❌ No'}`);
      
      // Test 6: Integration Success Assessment
      console.log('\n📊 FMP + MISTRAL AI INTEGRATION ASSESSMENT');
      console.log('=' .repeat(50));
      
      const fmpWorking = usingFmp && fmpSourceCount > 0;
      const mistralWorking = usingMistral;
      const qualityGood = !hasHtmlTags && hasSpecificCompanies && hasActionableContent;
      const speedGood = responseTime < 15000;
      
      console.log(`✅ FMP Premium Integration: ${fmpWorking ? 'SUCCESS' : 'NEEDS WORK'}`);
      console.log(`✅ Mistral AI Integration: ${mistralWorking ? 'SUCCESS' : 'USING FALLBACK'}`);
      console.log(`✅ Content Quality: ${qualityGood ? 'HIGH' : 'NEEDS IMPROVEMENT'}`);
      console.log(`✅ Performance: ${speedGood ? 'GOOD' : 'SLOW'}`);
      
      // Overall Assessment
      if (fmpWorking && qualityGood && speedGood) {
        console.log('\n🎉 SUCCESS: FMP + MISTRAL AI INTEGRATION WORKING!');
        console.log('✅ Using FMP Premium API for professional financial news');
        console.log(`✅ ${mistralWorking ? 'Using Mistral AI' : 'Using algorithmic fallback'} for analysis`);
        console.log('✅ High-quality, actionable market analysis');
        console.log('✅ Fast response times');
        console.log('\nYour Daily Market Brief should now show:');
        console.log('• Professional financial news from FMP');
        console.log('• Clean, readable content without HTML tags');
        console.log('• Specific company and market references');
        console.log('• Actionable investment insights');
      } else {
        console.log('\n⚠️ PARTIAL SUCCESS - Some Issues Detected:');
        if (!fmpWorking) console.log('❌ FMP integration needs verification');
        if (!qualityGood) console.log('❌ Content quality needs improvement');
        if (!speedGood) console.log('❌ Performance optimization needed');
      }
      
      // Show sample content
      console.log('\nSample Analysis Content (first 300 chars):');
      console.log(`"${analysisContent.substring(0, 300)}..."`);
      
    } else {
      console.log(`❌ AI Analysis Request Failed: ${aiResponse.status}`);
    }
    
    console.log('\n🏁 FMP + MISTRAL AI TEST COMPLETE');
    
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure backend is running with FMP API key configured');
    console.log('2. Check .env file has FMP_API_KEY and MISTRAL_API_KEY');
    console.log('3. Restart backend to load FMP news service');
    console.log('4. Verify FMP API key has premium access');
  }
}

// Run the FMP + Mistral AI integration test
testFmpMistralIntegration();
