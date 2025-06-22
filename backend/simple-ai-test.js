// simple-ai-test.js - Simplified AI service test
console.log('🧪 Starting Simple AI Service Test...\n');

async function testAiService() {
  try {
    console.log('1. Testing Python Bridge...');
    const pythonBridge = await import('./src/utils/pythonBridge.js');
    console.log('✅ Python Bridge imported');
    
    console.log('\n2. Testing Market AI Analysis Service...');
    const marketAiAnalysisService = await import('./src/services/marketAiAnalysisService.js');
    console.log('✅ Market AI Analysis Service imported');
    
    console.log('\n3. Testing service initialization...');
    const initResult = await marketAiAnalysisService.default.initialize();
    console.log('✅ Service initialization result:', initResult);
    
    console.log('\n4. Testing service status...');
    const status = await marketAiAnalysisService.default.isReady();
    console.log('Service Status:', status);
    
    if (status.python_ready) {
      console.log('\n5. Testing market environment analysis...');
      const marketAnalysis = await marketAiAnalysisService.default.generateMarketEnvironmentAnalysis('basic');
      console.log('Market Analysis Result:');
      console.log('- Score:', marketAnalysis.score);
      console.log('- Phase:', marketAnalysis.market_phase);
      console.log('- Generated:', marketAnalysis.generated);
      console.log('- Source:', marketAnalysis.source);
      
      if (marketAnalysis.error) {
        console.log('- Error:', marketAnalysis.error);
      }
    } else {
      console.log('❌ Python service not ready');
      console.log('Python ready:', status.python_ready);
      console.log('Mistral ready:', status.mistral_ready);
      if (status.mistral_error) {
        console.log('Mistral error:', status.mistral_error);
      }
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAiService();
