/**
 * DEBUG EARNINGS API ENDPOINTS
 * 
 * This will test each step of the earnings pipeline to find where it's failing
 */

// Test the exact API endpoints the frontend is calling

async function debugEarningsEndpoints() {
  console.log('🔍 DEBUGGING EARNINGS API ENDPOINTS');
  console.log('=' .repeat(50));
  
  const symbol = 'AVGO';
  const baseUrl = 'http://localhost:5000';
  
  // Test 1: Check if backend is responding
  console.log('\\n1️⃣ Testing backend health...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const health = await healthResponse.json();
    console.log('✅ Backend health:', health);
  } catch (error) {
    console.log('❌ Backend not responding:', error.message);
    console.log('💡 Make sure to run: node server.js');
    return;
  }
  
  // Test 2: Test earnings transcripts endpoint
  console.log('\\n2️⃣ Testing transcripts endpoint...');
  try {
    const transcriptsResponse = await fetch(`${baseUrl}/api/research/earnings/${symbol}/transcripts`);
    console.log('📡 Response status:', transcriptsResponse.status);
    
    if (transcriptsResponse.ok) {\n      const transcriptsData = await transcriptsResponse.json();
      console.log('✅ Transcripts endpoint working');
      console.log('📊 Response:', {
        symbol: transcriptsData.symbol,\n        totalCount: transcriptsData.totalCount,
        availableCount: transcriptsData.availableCount,
        transcriptsLength: transcriptsData.transcripts?.length
      });
      
      if (transcriptsData.transcripts && transcriptsData.transcripts.length > 0) {
        console.log('📄 Sample transcript:', {
          quarter: transcriptsData.transcripts[0].quarter,
          year: transcriptsData.transcripts[0].year,
          status: transcriptsData.transcripts[0].status,
          hasContent: !!transcriptsData.transcripts[0].content,
          contentLength: transcriptsData.transcripts[0].content?.length || 0
        });
      }
    } else {
      const errorData = await transcriptsResponse.text();
      console.log('❌ Transcripts endpoint failed');
      console.log('📄 Error response:', errorData);
    }
  } catch (error) {
    console.log('❌ Transcripts request failed:', error.message);
  }
  
  // Test 3: Test next earnings endpoint
  console.log('\\n3️⃣ Testing next earnings endpoint...');
  try {
    const nextResponse = await fetch(`${baseUrl}/api/research/earnings/${symbol}/next-earnings`);
    if (nextResponse.ok) {
      const nextData = await nextResponse.json();
      console.log('✅ Next earnings endpoint working');
      console.log('📅 Next earnings:', nextData.nextEarnings?.date || 'Not scheduled');
    } else {
      console.log('❌ Next earnings endpoint failed:', nextResponse.status);
    }
  } catch (error) {\n    console.log('❌ Next earnings request failed:', error.message);
  }
  
  // Test 4: Test analysis endpoint  
  console.log('\\n4️⃣ Testing analysis endpoint...');
  try {
    const analysisResponse = await fetch(`${baseUrl}/api/research/earnings/${symbol}/analysis`);
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log('✅ Analysis endpoint working');
      console.log('🧠 Analysis:', {
        transcriptAnalyses: analysisData.transcriptAnalyses?.length || 0,
        dataQuality: analysisData.dataQuality?.overallScore
      });
    } else {
      console.log('❌ Analysis endpoint failed:', analysisResponse.status);
      const errorText = await analysisResponse.text();
      console.log('📄 Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Analysis request failed:', error.message);
  }
  
  // Test 5: Direct FMP API test\n  console.log('\\n5️⃣ Testing direct FMP API...');
  try {
    const apiKey = '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
    const fmpResponse = await fetch(`https://financialmodelingprep.com/api/v4/earning_call_transcript?symbol=${symbol}&apikey=${apiKey}`);
    
    if (fmpResponse.ok) {
      const fmpData = await fmpResponse.json();
      console.log('✅ Direct FMP API working');
      console.log('📊 FMP response:', Array.isArray(fmpData) ? `${fmpData.length} transcript dates` : 'Unexpected format');
      
      if (Array.isArray(fmpData) && fmpData.length > 0) {
        console.log('📅 Sample date:', {
          quarter: fmpData[0].quarter,
          year: fmpData[0].year,
          date: fmpData[0].date
        });
      }
    } else {
      const fmpError = await fmpResponse.text();
      console.log('❌ Direct FMP API failed:', fmpResponse.status);
      console.log('📄 FMP error:', fmpError);
    }
  } catch (error) {
    console.log('❌ Direct FMP request failed:', error.message);
  }
  
  console.log('\\n' + '='.repeat(50));
  console.log('🔍 DEBUG COMPLETE!');
  console.log('\\n💡 Next steps based on results:');
  console.log('   • If backend not responding: Start with node server.js');
  console.log('   • If endpoints failing: Check server logs for errors');
  console.log('   • If FMP failing: Check API key and symbol');
  console.log('   • If no content: Some stocks may not have transcripts');
}

// Run the debug
debugEarningsEndpoints().catch(console.error);
