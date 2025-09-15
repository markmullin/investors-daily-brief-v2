/**
 * Test the new fast-analysis endpoint
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000';

async function testFastAnalysis() {
  console.log('🧪 Testing Fast Analysis Endpoint...\n');
  
  const testCases = [
    {
      name: 'Market Index Analysis',
      data: {
        analysisType: 'marketIndex',
        marketPhase: 'NEUTRAL',
        marketData: {
          symbol: '^GSPC',
          price: 6481.41,
          change: 1.5,
          volume: 2840000000
        }
      }
    },
    {
      name: 'Sector Analysis',
      data: {
        analysisType: 'sectors',
        marketPhase: 'BULL',
        marketData: {
          topSector: { name: 'Technology', changePercent: 2.5 },
          worstSector: { name: 'Energy', changePercent: -1.2 },
          sectors: []
        }
      }
    },
    {
      name: 'Correlations Analysis',
      data: {
        analysisType: 'correlations',
        marketPhase: 'NEUTRAL',
        marketData: {
          pair: 'stocks-bonds',
          correlation: -0.35
        }
      }
    },
    {
      name: 'Macro Analysis',
      data: {
        analysisType: 'macro',
        marketPhase: 'BEAR',
        marketData: {}
      }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n📊 Testing: ${test.name}`);
    console.log('Request:', JSON.stringify(test.data, null, 2));
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${API_URL}/api/gpt-oss/fast-analysis`, test.data, {
        timeout: 20000
      });
      
      const elapsed = Date.now() - startTime;
      
      if (response.data.success) {
        console.log(`✅ Success in ${elapsed}ms`);
        console.log('Analysis:', response.data.data.analysis.substring(0, 200) + '...');
        console.log('Source:', response.data.data.source);
        console.log('Fallback Used:', response.data.data.fallbackUsed);
        
        if (response.data.data.reasoning && response.data.data.reasoning.length > 0) {
          console.log('Reasoning Steps:', response.data.data.reasoning.length);
          const thinkingStep = response.data.data.reasoning.find(s => s.status === 'thinking');
          if (thinkingStep) {
            console.log('🧠 Chain of Thought Found:', thinkingStep.message.substring(0, 100) + '...');
          }
        }
      } else {
        console.log('❌ Request failed:', response.data.message);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log('⏱️ Request timed out (>20s)');
      } else if (error.response) {
        console.log('❌ Error:', error.response.data.message || error.response.statusText);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
  }
  
  console.log('\n✅ All tests completed');
}

// Run the test
testFastAnalysis().catch(console.error);
