/**
 * Test script to debug earnings AI analysis
 */

import unifiedGptOssService from './src/services/unifiedGptOssService.js';

console.log('🧪 Testing Earnings AI Analysis...');

async function testEarningsAI() {
  try {
    console.log('1. Testing basic AI connection...');
    
    const testResult = await unifiedGptOssService.generate(
      'You are a helpful assistant.',
      'Say hello and confirm you can analyze financial data.',
      { temperature: 0.7, maxTokens: 100 }
    );
    
    console.log('✅ Basic AI Test Result:', {
      success: testResult.success,
      content: testResult.content?.substring(0, 200),
      source: testResult.source,
      error: testResult.error
    });
    
    if (!testResult.success) {
      console.log('❌ Basic AI test failed. Cannot proceed with earnings analysis.');
      return;
    }
    
    console.log('\n2. Testing earnings analysis prompt...');
    
    const earningsPrompt = `
You are a professional financial analyst. Analyze this sample earnings call and provide insights.

TRANSCRIPT EXCERPT:
"Q3 total revenue was a record $16 billion, up 22% year on year. Revenue growth was driven by AI semiconductors, which grew 63% year on year. We are very excited about our AI business prospects going forward."

Please provide analysis in the following JSON format:
{
  "managementSentiment": {
    "confidenceScore": 85,
    "overall": "bullish",
    "reasoning": "Management expressed excitement about AI growth"
  },
  "keyThemes": [
    {
      "theme": "AI Growth",
      "sentiment": "positive",
      "explanation": "AI semiconductors growing 63% year over year",
      "importance": "high"
    }
  ]
}`;

    const earningsResult = await unifiedGptOssService.generate(
      'You are a helpful assistant.',
      earningsPrompt,
      { temperature: 0.7, maxTokens: 500 }
    );
    
    console.log('✅ Earnings Analysis Test Result:', {
      success: earningsResult.success,
      content: earningsResult.content?.substring(0, 500),
      source: earningsResult.source,
      error: earningsResult.error
    });
    
    // Try to parse JSON
    if (earningsResult.success && earningsResult.content) {
      try {
        const jsonMatch = earningsResult.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON Parsing Success:', parsed);
        } else {
          console.log('⚠️ No JSON found in response');
        }
      } catch (parseError) {
        console.log('❌ JSON Parsing Failed:', parseError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEarningsAI();