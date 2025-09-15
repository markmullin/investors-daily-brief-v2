/**
 * Test the REAL Python → GPT-OSS Pipeline
 * Run this to verify all services are connected
 */

console.log('=' + '='.repeat(60));
console.log('TESTING INTELLIGENT ANALYSIS PIPELINE');
console.log('=' + '='.repeat(60));
console.log('');

// Test each service independently
async function testPipeline() {
  // 1. Test Python Service
  console.log('1️⃣ Testing Python Analysis Service (Port 8000)...');
  try {
    const pythonResponse = await fetch('http://localhost:8000/health');
    if (pythonResponse.ok) {
      const data = await pythonResponse.json();
      console.log('   ✅ Python service is running:', data.service);
      
      // Test actual analysis
      const analysisResponse = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'marketPhase',
          data: {}
        })
      });
      
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        console.log('   ✅ Python analysis working:', analysisData.phase, `(${analysisData.phaseScore}/100)`);
      } else {
        console.log('   ❌ Python analysis failed:', analysisResponse.status);
      }
    } else {
      console.log('   ❌ Python service not responding');
    }
  } catch (error) {
    console.log('   ❌ Python service is NOT running!');
    console.log('   👉 Start it with: python analysis_service.py');
  }
  console.log('');
  
  // 2. Test GPT-OSS Service
  console.log('2️⃣ Testing GPT-OSS Service (Port 8080)...');
  try {
    const gptResponse = await fetch('http://localhost:8080/health');
    if (gptResponse.ok) {
      console.log('   ✅ GPT-OSS is running');
      
      // Test actual completion
      const completionResponse = await fetch('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-oss-20b',
          messages: [
            { role: 'system', content: 'You are a financial analyst. Respond in 1 sentence.' },
            { role: 'user', content: 'Is the market bullish or bearish?' }
          ],
          max_tokens: 50
        })
      });
      
      if (completionResponse.ok) {
        const completionData = await completionResponse.json();
        const content = completionData.choices[0].message.content;
        console.log('   ✅ GPT-OSS completion working');
        console.log('   Response:', content.substring(0, 100));
      } else {
        console.log('   ❌ GPT-OSS completion failed:', completionResponse.status);
      }
    } else {
      console.log('   ❌ GPT-OSS not responding');
    }
  } catch (error) {
    console.log('   ❌ GPT-OSS is NOT running!');
    console.log('   👉 Start it with: start-gpt-oss.bat');
  }
  console.log('');
  
  // 3. Test Backend Routes
  console.log('3️⃣ Testing Backend Intelligent Analysis Routes (Port 5000)...');
  try {
    const healthResponse = await fetch('http://localhost:5000/api/intelligent-analysis/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Intelligent Analysis routes are loaded');
      console.log('   Pipeline status:', healthData.pipeline || 'unknown');
      console.log('   Services:', JSON.stringify(healthData.services));
    } else {
      console.log('   ❌ Routes not responding:', healthResponse.status);
    }
  } catch (error) {
    console.log('   ❌ Backend routes NOT working!');
    console.log('   👉 Check server.js console for errors');
  }
  console.log('');
  
  // 4. Test Full Pipeline
  console.log('4️⃣ Testing FULL Pipeline (Market Phase Analysis)...');
  try {
    const startTime = Date.now();
    const fullResponse = await fetch('http://localhost:5000/api/intelligent-analysis/market-phase');
    
    if (fullResponse.ok) {
      const fullData = await fullResponse.json();
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      
      if (fullData.insight) {
        console.log('   ✅ FULL PIPELINE WORKING!');
        console.log('   Time taken:', duration, 'seconds');
        console.log('   Insight:', fullData.insight.substring(0, 150) + '...');
        console.log('   From Python:', fullData.calculations ? '✓' : '✗');
        console.log('   From GPT-OSS:', fullData.metadata?.gptModel ? '✓' : '✗');
      } else if (fullData.fallback) {
        console.log('   ⚠️ Pipeline returned fallback (services not connected)');
        console.log('   Response:', fullData.insight?.substring(0, 100));
      } else {
        console.log('   ❌ No insight generated');
        console.log('   Response:', JSON.stringify(fullData).substring(0, 200));
      }
    } else {
      const errorText = await fullResponse.text();
      console.log('   ❌ Pipeline request failed:', fullResponse.status);
      console.log('   Error:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('   ❌ Pipeline test failed:', error.message);
  }
  console.log('');
  
  // Summary
  console.log('=' + '='.repeat(60));
  console.log('📋 CHECKLIST TO FIX:');
  console.log('=' + '='.repeat(60));
  console.log('');
  console.log('1. Start Python Analysis Service:');
  console.log('   cd backend');
  console.log('   python analysis_service.py');
  console.log('');
  console.log('2. Start GPT-OSS:');
  console.log('   cd backend');
  console.log('   start-gpt-oss.bat');
  console.log('');
  console.log('3. Restart Backend (to reload routes):');
  console.log('   cd backend');
  console.log('   npm run dev');
  console.log('');
  console.log('4. Test in browser:');
  console.log('   http://localhost:5000/api/intelligent-analysis/market-phase');
  console.log('');
  console.log('All 3 services MUST be running for the pipeline to work!');
}

// Run the tests
testPipeline();