/**
 * MANUAL VERIFICATION TEST
 * Run this to test if streamlined optimizations are working
 */
import fetch from 'node-fetch';

async function testOptimizations() {
  console.log('🔍 TESTING STREAMLINED OPTIMIZATIONS');
  console.log('=' .repeat(50));
  
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    // Test 1: Backend Health
    console.log('\n📍 TEST 1: Backend Health Check');
    const healthResponse = await Promise.race([
      fetch(`${baseUrl}/verify/health-fast`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
    ]);
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Backend is healthy');
      console.log(`   Status: ${health.status}`);
      console.log(`   Optimizations: ${health.optimizations}`);
    } else {
      console.log('❌ Backend health check failed');
    }
    
    // Test 2: Optimization Verification
    console.log('\n📍 TEST 2: Streamlined Service Verification');
    const verifyResponse = await Promise.race([
      fetch(`${baseUrl}/verify/verify-optimizations`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Verification timeout')), 10000))
    ]);
    
    if (verifyResponse.ok) {
      const verification = await verifyResponse.json();
      console.log(`✅ Optimization Status: ${verification.status}`);
      
      if (verification.tests.streamlinedNews) {
        const newsTest = verification.tests.streamlinedNews;
        console.log(`   News Service: ${newsTest.status}`);
        console.log(`   Response Time: ${newsTest.responseTime}ms`);
        console.log(`   Articles: ${newsTest.articlesCount}`);
        console.log(`   Cache: ${newsTest.cached ? 'HIT' : 'MISS'}`);
      }
      
      if (verification.performance) {
        console.log(`   Performance: ${verification.performance.newsServiceSpeed}`);
      }
    } else {
      console.log('❌ Optimization verification failed');
    }
    
    // Test 3: AI Analysis Performance
    console.log('\n📍 TEST 3: AI Analysis Performance');
    console.log('Testing /ai/ai-analysis endpoint...');
    
    const startTime = Date.now();
    const aiResponse = await Promise.race([
      fetch(`${baseUrl}/ai/ai-analysis`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI analysis timeout')), 15000))
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      console.log('✅ AI Analysis completed successfully');
      console.log(`   Response Time: ${responseTime}ms (${(responseTime/1000).toFixed(1)}s)`);
      console.log(`   Status: ${aiData.status}`);
      console.log(`   Analysis Source: ${aiData.analysis?.analysisSource}`);
      console.log(`   News Articles: ${aiData.analysis?.newsArticlesUsed}`);
      console.log(`   Performance: ${responseTime < 10000 ? '🚀 EXCELLENT' : responseTime < 20000 ? '⚠️ ACCEPTABLE' : '❌ TOO SLOW'}`);
    } else {
      console.log('❌ AI Analysis failed');
      console.log(`   Response Time: ${responseTime}ms`);
      console.log(`   Status: ${aiResponse.status}`);
    }
    
    // Test 4: Performance Summary
    console.log('\n📊 PERFORMANCE SUMMARY');
    console.log('=' .repeat(30));
    
    const perfResponse = await fetch(`${baseUrl}/performance-status`);
    if (perfResponse.ok) {
      const perf = await perfResponse.json();
      console.log(`Backend Status: ${perf.status.toUpperCase()}`);
      console.log(`Expected AI Response: ${perf.expected_response_times.ai_analysis}`);
      console.log(`Timeout Protection: ${perf.features.timeout_protection}`);
      console.log(`Caching: ${perf.features.aggressive_caching}`);
    }
    
    console.log('\n🎉 VERIFICATION COMPLETE');
    console.log('\nIf all tests passed, your optimizations are working!');
    console.log('If tests failed, try:');
    console.log('1. Run restart-optimized-backend.bat');
    console.log('2. Check backend console for errors');
    console.log('3. Verify .env file has required API keys');
    
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.log('\nTROUBLESHOoting:');
    console.log('1. Is backend running? Try: npm start in backend folder');
    console.log('2. Is it on port 5000? Check backend console');
    console.log('3. Check firewall/antivirus blocking localhost');
    console.log('4. Run restart-optimized-backend.bat script');
  }
}

// Run the test
testOptimizations();
