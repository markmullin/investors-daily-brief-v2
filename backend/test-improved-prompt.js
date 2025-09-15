/**
 * Test improved earnings analysis prompt
 */

import unifiedGptOssService from './src/services/unifiedGptOssService.js';

console.log('🧪 Testing Improved Earnings Prompt...');

async function testImprovedPrompt() {
  try {
    const improvedPrompt = `Analyze this earnings call excerpt and respond ONLY with valid JSON:

TRANSCRIPT:
"Q3 total revenue was a record $16 billion, up 22% year on year. Revenue growth was driven by AI semiconductors, which grew 63% year on year. We are very excited about our AI business prospects going forward."

Return only this JSON structure with no additional text or explanations:

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

    const result = await unifiedGptOssService.generate(
      'You are a financial analyst. Respond ONLY with valid JSON. No other text or explanations.',
      improvedPrompt,
      { 
        temperature: 0.3,  // Lower temperature for more consistent format
        maxTokens: 800     // More tokens for complete response
      }
    );
    
    console.log('📊 Full Response Length:', result.content?.length);
    console.log('📝 First 500 chars:', result.content?.substring(0, 500));
    console.log('📝 Last 500 chars:', result.content?.substring(result.content?.length - 500));
    
    // Try to find and parse JSON
    if (result.success && result.content) {
      try {
        // Remove <think> tags and other reasoning
        const cleaned = result.content
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/^.*?(?=\{)/s, '') // Remove everything before first {
          .replace(/\}.*$/s, '}');   // Remove everything after last }
        
        console.log('🧹 Cleaned Response:', cleaned.substring(0, 300));
        
        const parsed = JSON.parse(cleaned);
        console.log('✅ JSON Parsing Success!');
        console.log('📊 Parsed Result:', JSON.stringify(parsed, null, 2));
        
      } catch (parseError) {
        console.log('❌ JSON Parsing Failed:', parseError.message);
        
        // Try extracting JSON with regex
        const jsonMatch = result.content.match(/\{[\s\S]*?\}(?=\s*$|\s*[^}]*$)/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ Regex JSON Extraction Success!');
            console.log('📊 Extracted Result:', JSON.stringify(parsed, null, 2));
          } catch (regexError) {
            console.log('❌ Regex JSON Extraction Failed:', regexError.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImprovedPrompt();