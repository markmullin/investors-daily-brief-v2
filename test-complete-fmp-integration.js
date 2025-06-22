/**
 * ENHANCED FMP + MISTRAL AI INTEGRATION TEST
 * Tests the complete FMP Premium + Mistral AI pipeline
 */

async function testCompleteIntegration() {
  console.log('🔍 COMPLETE FMP + MISTRAL AI INTEGRATION TEST');
  console.log('Testing: Fixed Mistral AI + FMP Premium News Integration');
  console.log('=' .repeat(70));
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test 1: Backend Health and API Configuration
    console.log('\n📍 TEST 1: Backend Health Check');
    const healthResponse = await fetch(`${baseUrl}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Backend not responding: ${healthResponse.status}`);
    }
    
    const health = await healthResponse.json();
    
    console.log(`✅ Backend Version: ${health.version}`);
    console.log(`✅ FMP API Key: ${health.apis?.fmp ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`✅ Mistral API Key: ${health.apis?.mistral ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`✅ Brave API Key: ${health.apis?.brave ? 'CONFIGURED' : 'MISSING'}`);
    
    if (!health.apis?.fmp) {
      throw new Error('FMP API key not configured in backend');
    }
    
    if (!health.apis?.mistral) {
      throw new Error('Mistral API key not configured in backend');
    }
    
    // Test 2: Mistral Service Status
    console.log('\n📍 TEST 2: Mistral AI Service Test');
    try {
      const mistralTestResponse = await fetch(`${baseUrl}/api/verify/mistral-status`);
      if (mistralTestResponse.ok) {
        const mistralStatus = await mistralTestResponse.json();
        console.log('✅ Mistral Service Status:', mistralStatus);
      } else {
        console.log('⚠️ Mistral status endpoint not available - testing via AI analysis');
      }
    } catch (error) {
      console.log('⚠️ Mistral status check skipped:', error.message);
    }
    
    // Test 3: FMP News Service Test
    console.log('\n📍 TEST 3: FMP Premium News Service');
    const newsStartTime = Date.now();
    
    try {
      const newsResponse = await Promise.race([
        fetch(`${baseUrl}/api/market/news`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('News timeout')), 10000))
      ]);
      
      const newsTime = Date.now() - newsStartTime;
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        console.log(`✅ FMP News Response Time: ${newsTime}ms`);
        console.log(`✅ News Articles Count: ${newsData.articles?.length || 0}`);
        console.log(`✅ News Source: ${newsData.source || 'unknown'}`);
        
        if (newsData.articles && newsData.articles.length > 0) {
          console.log('✅ Sample Article:', newsData.articles[0].title?.substring(0, 60) + '...');
        }
      } else {
        console.log(`⚠️ News endpoint returned: ${newsResponse.status}`);
      }
    } catch (error) {
      console.log('⚠️ News service test failed:', error.message);
    }
    
    // Test 4: Complete AI Analysis Pipeline
    console.log('\n📍 TEST 4: FMP + Mistral AI Analysis Pipeline');
    console.log('Expected: FMP Premium News + Real Mistral AI (not fallback)');
    
    const analysisStartTime = Date.now();
    
    const aiResponse = await Promise.race([
      fetch(`${baseUrl}/api/ai/ai-analysis`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 25000))
    ]);
    
    const analysisTime = Date.now() - analysisStartTime;
    
    if (!aiResponse.ok) {
      throw new Error(`AI Analysis failed: ${aiResponse.status} ${aiResponse.statusText}`);
    }
    
    const aiData = await aiResponse.json();
    
    console.log(`✅ Analysis Response Time: ${analysisTime}ms (${(analysisTime/1000).toFixed(1)}s)`);
    
    // Test 5: Integration Quality Assessment
    console.log('\n📍 TEST 5: Integration Quality Assessment');
    
    const newsProvider = aiData.analysis?.newsProvider;
    const dataSource = aiData.analysis?.dataSource;
    const aiModel = aiData.analysis?.aiModel;
    const analysisSource = aiData.analysis?.analysisSource;
    
    console.log(`News Provider: ${newsProvider}`);
    console.log(`Data Source: ${dataSource}`);
    console.log(`AI Model: ${aiModel}`);
    console.log(`Analysis Source: ${analysisSource}`);
    
    const usingFmp = newsProvider?.includes('FMP') || dataSource?.includes('fmp');
    const usingRealMistral = aiModel?.includes('Mistral') && !analysisSource?.includes('fallback') && !analysisSource?.includes('algorithmic');
    
    console.log(`✅ Using FMP Premium: ${usingFmp ? 'YES' : 'NO'}`);
    console.log(`✅ Using Real Mistral AI: ${usingRealMistral ? 'YES' : 'NO (FALLBACK)'}`);
    
    // Test 6: Content Quality Check
    console.log('\n📍 TEST 6: AI Content Quality Check');
    
    const analysisContent = aiData.analysis?.content || '';
    const hasHtmlTags = /<[^>]*>/.test(analysisContent);
    const hasSpecificContent = /Apple|Microsoft|Google|Amazon|Tesla|Fed|Federal Reserve|earnings|revenue|inflation|market|sector/i.test(analysisContent);
    const hasActionableContent = /investment|position|strategy|opportunity|risk|recommend|suggest|outlook/i.test(analysisContent);
    const isSubstantial = analysisContent.length > 500;
    
    console.log(`Content Length: ${analysisContent.length} characters`);
    console.log(`HTML Tags: ${hasHtmlTags ? '❌ Found' : '✅ Clean'}`);
    console.log(`Specific Content: ${hasSpecificContent ? '✅ Yes' : '❌ Generic'}`);
    console.log(`Actionable Insights: ${hasActionableContent ? '✅ Yes' : '❌ No'}`);
    console.log(`Substantial Content: ${isSubstantial ? '✅ Yes' : '❌ Too Short'}`);
    
    // Test 7: News Sources Quality
    console.log('\n📍 TEST 7: News Sources Quality');
    
    const sources = aiData.sources || [];
    let fmpSourceCount = 0;
    
    console.log(`Total News Sources: ${sources.length}`);
    
    sources.slice(0, 5).forEach((source, i) => {
      console.log(`${i + 1}. [${source.source || 'Unknown'}] "${(source.title || '').substring(0, 50)}..."`);
      if (source.fmpSource || source.source?.includes('FMP') || source.type?.includes('fmp')) {
        fmpSourceCount++;
      }
    });
    
    console.log(`FMP Sources: ${fmpSourceCount}/${sources.length}`);
    
    // Test 8: Overall Assessment
    console.log('\n📊 OVERALL INTEGRATION ASSESSMENT');
    console.log('=' .repeat(50));
    
    const fmpWorking = usingFmp && fmpSourceCount > 0;
    const mistralWorking = usingRealMistral;
    const qualityGood = !hasHtmlTags && hasSpecificContent && hasActionableContent && isSubstantial;
    const speedGood = analysisTime < 20000;
    
    console.log(`✅ FMP Premium Integration: ${fmpWorking ? 'SUCCESS' : 'NEEDS WORK'}`);
    console.log(`✅ Mistral AI Integration: ${mistralWorking ? 'SUCCESS' : 'USING FALLBACK'}`);
    console.log(`✅ Content Quality: ${qualityGood ? 'HIGH' : 'NEEDS IMPROVEMENT'}`);
    console.log(`✅ Performance: ${speedGood ? 'GOOD' : 'SLOW'}`);
    
    // Final Result
    if (fmpWorking && mistralWorking && qualityGood) {
      console.log('\n🎉 COMPLETE SUCCESS: FMP + MISTRAL AI FULLY INTEGRATED!');
      console.log('✅ Using FMP Premium API for professional financial news');
      console.log('✅ Using real Mistral AI for intelligent analysis');
      console.log('✅ High-quality, actionable market analysis');
      console.log('✅ Production-ready performance');
      
      console.log('\n🎯 YOUR DAILY MARKET BRIEF IS READY:');
      console.log('• Professional financial news from FMP Premium');
      console.log('• AI-powered analysis from Mistral AI');
      console.log('• Clean, readable content without HTML');
      console.log('• Specific company and market references');
      console.log('• Actionable investment insights');
      
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS - Issues Found:');
      if (!fmpWorking) console.log('❌ FMP integration needs verification');
      if (!mistralWorking) console.log('❌ Mistral AI still using fallback - check API key and SDK');
      if (!qualityGood) console.log('❌ Content quality needs improvement');
      if (!speedGood) console.log('❌ Performance optimization needed');
      
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('1. Verify FMP API key in .env file');
      console.log('2. Verify Mistral API key in .env file');
      console.log('3. Check @mistralai/mistralai package is installed');
      console.log('4. Restart backend server after fixes');
      console.log('5. Run: npm install @mistralai/mistralai --save');
    }
    
    // Show sample content
    console.log('\n📋 SAMPLE ANALYSIS CONTENT (first 300 chars):');
    console.log(`"${analysisContent.substring(0, 300)}..."`);
    
    console.log('\n🏁 INTEGRATION TEST COMPLETE');
    
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    console.log('\n🔧 QUICK FIXES:');
    console.log('1. Ensure backend is running: npm start');
    console.log('2. Check .env file has all API keys');
    console.log('3. Install Mistral SDK: npm install @mistralai/mistralai');
    console.log('4. Restart backend after changes');
    console.log('5. Check Windows Defender/firewall settings');
  }
}

// Run the complete integration test
testCompleteIntegration();