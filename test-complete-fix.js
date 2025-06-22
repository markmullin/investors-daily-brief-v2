/**
 * COMPREHENSIVE FIX VERIFICATION TEST
 * Tests both performance AND content quality improvements
 */

async function testStreamlinedFixComplete() {
  console.log('🔍 COMPREHENSIVE FIX VERIFICATION TEST');
  console.log('Testing: Performance + Content Quality + HTML Cleaning');
  console.log('=' .repeat(70));
  
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    // Test 1: Verify Backend is Using Streamlined Routes
    console.log('\n📍 TEST 1: Backend Route Verification');
    const healthResponse = await fetch(`${baseUrl}/../health`);
    const health = await healthResponse.json();
    
    console.log(`✅ Backend Version: ${health.version}`);
    console.log(`✅ Streamlined AI: ${health.optimizations?.streamlined_ai || 'Unknown'}`);
    console.log(`✅ Timeout Protection: ${health.optimizations?.timeout_protection || 'Unknown'}`);
    
    if (health.version?.includes('streamlined')) {
      console.log('🎉 BACKEND IS USING STREAMLINED ROUTES!');
    } else {
      console.log('⚠️ Backend may not be using streamlined routes');
    }
    
    // Test 2: Performance Test - AI Analysis Speed
    console.log('\n📍 TEST 2: AI Analysis Performance Test');
    console.log('Expected: <10 seconds, clean content without HTML tags');
    
    const startTime = Date.now();
    const aiResponse = await Promise.race([
      fetch(`${baseUrl}/ai/ai-analysis`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI analysis timeout')), 15000))
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      console.log(`✅ AI Analysis Response Time: ${responseTime}ms (${(responseTime/1000).toFixed(1)}s)`);
      console.log(`✅ Analysis Source: ${aiData.analysis?.analysisSource}`);
      console.log(`✅ News Articles Used: ${aiData.analysis?.newsArticlesUsed}`);
      console.log(`✅ Content Cleaned: ${aiData.analysis?.contentCleaned || aiData.metadata?.contentCleaned}`);
      
      // Test 3: Content Quality Check - Critical for fixing HTML tags issue
      console.log('\n📍 TEST 3: Content Quality Check (HTML Tag Detection)');
      
      const analysisContent = aiData.analysis?.content || '';
      const hasHtmlTags = /<[^>]*>/.test(analysisContent);
      const hasStrongTags = analysisContent.includes('<strong>') || analysisContent.includes('</strong>');
      const hasHtmlEntities = /&[^;]+;/.test(analysisContent);
      
      console.log(`Content Length: ${analysisContent.length} characters`);
      console.log(`HTML Tags Found: ${hasHtmlTags ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
      console.log(`<strong> Tags Found: ${hasStrongTags ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
      console.log(`HTML Entities Found: ${hasHtmlEntities ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
      
      // Show sample content
      console.log('\nSample Content (first 200 chars):');
      console.log(`"${analysisContent.substring(0, 200)}..."`);
      
      // Test 4: Source Quality Check
      console.log('\n📍 TEST 4: News Source Quality Check');
      const sources = aiData.sources || [];
      console.log(`News Sources Count: ${sources.length}`);
      
      sources.slice(0, 3).forEach((source, i) => {
        const titleHasHtml = /<[^>]*>/.test(source.title || '');
        console.log(`${i + 1}. [${source.source}] "${source.title}"`);
        console.log(`   HTML in title: ${titleHasHtml ? '❌ YES' : '✅ NO'}`);
      });
      
      // Test 5: Performance Assessment
      console.log('\n📍 TEST 5: Performance Assessment');
      const performanceGrade = responseTime < 10000 ? '🚀 EXCELLENT' : 
                              responseTime < 20000 ? '⚠️ ACCEPTABLE' : '❌ TOO SLOW';
      
      const contentGrade = !hasHtmlTags && !hasStrongTags ? '🧹 CLEAN' : '❌ NEEDS CLEANING';
      
      console.log(`Response Time: ${performanceGrade} (${(responseTime/1000).toFixed(1)}s)`);
      console.log(`Content Quality: ${contentGrade}`);
      
      // Test 6: Overall Assessment
      console.log('\n📊 OVERALL FIX ASSESSMENT');
      console.log('=' .repeat(40));
      
      const speedFixed = responseTime < 15000;
      const contentFixed = !hasHtmlTags && !hasStrongTags;
      
      console.log(`✅ Speed Issue Fixed: ${speedFixed ? 'YES' : 'NO'}`);
      console.log(`✅ HTML Tags Issue Fixed: ${contentFixed ? 'YES' : 'NO'}`);
      console.log(`✅ Content Readable: ${contentFixed ? 'YES' : 'NO'}`);
      
      if (speedFixed && contentFixed) {
        console.log('\n🎉 SUCCESS: BOTH ISSUES FIXED!');
        console.log('✅ AI Analysis is fast (<15s)');
        console.log('✅ Content is clean (no HTML tags)');
        console.log('✅ Daily Market Brief should now be readable');
      } else {
        console.log('\n⚠️ PARTIAL FIX:');
        if (!speedFixed) console.log('❌ Speed still needs improvement');
        if (!contentFixed) console.log('❌ Content still has HTML tags');
      }
      
    } else {
      console.log(`❌ AI Analysis Failed: ${aiResponse.status}`);
    }
    
    // Test 7: Cache and Service Status
    console.log('\n📍 TEST 7: Streamlined Service Status');
    try {
      const verifyResponse = await fetch(`${baseUrl}/verify/verify-optimizations`);
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log(`Streamlined News Service: ${verifyData.tests?.streamlinedNews?.status || 'Unknown'}`);
        console.log(`Cache Status: ${verifyData.performance?.cacheStatus || 'Unknown'}`);
      } else {
        console.log('⚠️ Verification endpoint not available');
      }
    } catch (e) {
      console.log('⚠️ Verification test skipped');
    }
    
    console.log('\n🏁 COMPREHENSIVE TEST COMPLETE');
    console.log('\nIf you see "SUCCESS: BOTH ISSUES FIXED!" above,');
    console.log('then your Daily Market Brief should now be:');
    console.log('• Fast (loads in <15 seconds)');
    console.log('• Readable (no HTML tags like <strong>)');
    console.log('• High quality content');
    
  } catch (error) {
    console.error('\n❌ COMPREHENSIVE TEST FAILED:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Is backend running? Check npm start in backend folder');
    console.log('2. Are streamlined routes loaded? Look for "STREAMLINED" in backend logs');
    console.log('3. Try restarting backend: run restart-streamlined-now.bat');
  }
}

// Run the comprehensive test
testStreamlinedFixComplete();
