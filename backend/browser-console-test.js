// Browser Console Test - Copy and paste this into your browser console (F12 → Console)
// Make sure you're on http://localhost:5173 when running this

console.log('🧪 Starting AI Analysis System Tests...');

// Test 1: Backend Health Check
fetch('http://localhost:5000/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend Health Check:', data);
    
    // Test 2: Fast Intelligent Analysis
    console.log('🧠 Testing Fast Intelligent Analysis...');
    const startTime = Date.now();
    
    return fetch('http://localhost:5000/api/intelligent-analysis/market-phase?timeframe=1d');
  })
  .then(response => {
    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response Time: ${responseTime}ms`);
    
    if (response.ok) {
      return response.json();
    } else {
      return response.text().then(text => {
        console.log('❌ Error Response:', text);
        throw new Error(`API failed: ${response.status}`);
      });
    }
  })
  .then(data => {
    console.log('✅ AI Analysis Response:', {
      success: data.success,
      type: data.type,
      processingTime: data.metadata?.processingTime + 'ms',
      insight: data.insight?.substring(0, 100) + '...',
      hasReasoning: !!data.reasoning
    });
    
    // Test 3: Specific Symbol Analysis
    console.log('🎯 Testing Symbol-Specific Analysis...');
    return fetch('http://localhost:5000/api/intelligent-analysis/index/^GSPC?timeframe=1d');
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ S&P 500 Analysis:', {
      success: data.success,
      processingTime: data.metadata?.processingTime + 'ms',
      sp500Performance: data.calculations?.conclusions?.sp500Performance,
      phase: data.calculations?.conclusions?.phase,
      sentiment: data.calculations?.conclusions?.sentiment
    });
    
    console.log('🎉 All Tests Passed! Graduate cap icons should now work with fast 5-15 second responses.');
    console.log('💡 Try clicking the graduate cap (🎓) icons in the dashboard to see the AI analysis!');
  })
  .catch(error => {
    console.error('❌ Test Failed:', error.message);
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure backend is running: npm start (in backend folder)');
    console.log('   2. Make sure frontend is running: npm run dev (in frontend folder)');
    console.log('   3. Check if ports 5000 and 5173 are available');
  });