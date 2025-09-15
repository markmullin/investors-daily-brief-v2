/**
 * Quick test to see if intelligent analysis routes are loaded
 * Run: node test-backend-routes.js
 */

console.log('\n' + '='.repeat(60));
console.log('TESTING BACKEND ROUTES ONLY');
console.log('='.repeat(60) + '\n');

async function testRoutes() {
  try {
    // Test if backend is running
    console.log('Testing backend health...');
    const healthResponse = await fetch('http://localhost:5000/health');
    
    if (!healthResponse.ok) {
      console.log('❌ Backend is NOT running!');
      console.log('👉 Start it with: npm run dev');
      return;
    }
    
    console.log('✅ Backend is running\n');
    
    // Test if intelligent analysis routes are loaded
    console.log('Testing intelligent analysis routes...');
    const routeResponse = await fetch('http://localhost:5000/api/intelligent-analysis/health');
    
    if (!routeResponse.ok) {
      console.log('❌ Intelligent Analysis routes NOT loaded!');
      console.log('👉 Check server.js console for route loading errors');
      console.log('👉 The route file should be at:');
      console.log('   backend/src/routes/intelligentAnalysisRoutes.js');
      return;
    }
    
    const routeData = await routeResponse.json();
    console.log('✅ Routes are loaded!');
    console.log('   Status:', routeData.status || 'unknown');
    console.log('   Pipeline:', routeData.pipeline || 'unknown');
    
    if (routeData.services) {
      console.log('\nService connections:');
      console.log('   Python:', routeData.services.python || 'not checked');
      console.log('   GPT-OSS:', routeData.services.gptOss || 'not checked');
    }
    
    // Try to get a market phase analysis
    console.log('\nTesting market phase endpoint...');
    const analysisResponse = await fetch('http://localhost:5000/api/intelligent-analysis/market-phase');
    
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      if (analysisData.insight) {
        console.log('✅ Analysis endpoint working!');
        console.log('   Insight preview:', analysisData.insight.substring(0, 100) + '...');
      } else if (analysisData.fallback) {
        console.log('⚠️ Endpoint working but using fallback (services not connected)');
      } else {
        console.log('⚠️ Endpoint returned unexpected data');
      }
    } else {
      console.log('❌ Analysis endpoint failed:', analysisResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Error testing routes:', error.message);
    console.log('\nMake sure backend is running: npm run dev');
  }
}

testRoutes();

console.log('\n' + '='.repeat(60));
console.log('If routes are loaded but analysis fails, you need to start:');
console.log('1. Python: python analysis_service.py');
console.log('2. GPT-OSS: python -m uvicorn gpt_oss_server:app --port 8080');
console.log('='.repeat(60) + '\n');