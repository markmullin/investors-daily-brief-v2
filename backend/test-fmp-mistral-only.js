/**
 * SIMPLE FMP + MISTRAL TEST - ONLY FMP API FOR NEWS
 * Tests real Mistral AI integration with FMP news only
 */
import 'dotenv/config';
import axios from 'axios';

async function testFmpOnlyWithMistral() {
  console.log('🔍 SIMPLE FMP + MISTRAL TEST');
  console.log('Testing: FMP API ONLY for news + Real Mistral AI');
  console.log('=' .repeat(60));
  
  const fmpApiKey = process.env.FMP_API_KEY;
  const mistralApiKey = process.env.MISTRAL_API_KEY;
  
  console.log(`✅ FMP API Key: ${fmpApiKey ? 'Configured' : 'MISSING'}`);
  console.log(`✅ Mistral API Key: ${mistralApiKey ? 'Configured' : 'MISSING'}`);
  
  if (!fmpApiKey || !mistralApiKey) {
    console.error('❌ Missing API keys');
    return;
  }
  
  // Step 1: Test FMP News API
  console.log('\n📍 STEP 1: Testing FMP News API');
  let fmpArticles = [];
  
  try {
    const response = await axios.get('https://financialmodelingprep.com/api/v3/stock_news', {
      params: {
        limit: 10,
        apikey: fmpApiKey
      },
      timeout: 8000
    });
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      fmpArticles = response.data.slice(0, 5);
      console.log(`✅ FMP Articles Retrieved: ${fmpArticles.length}`);
      
      console.log('\n📰 FMP News Sources:');
      fmpArticles.forEach((article, i) => {
        console.log(`${i + 1}. Source: ${article.site || 'Unknown'}`);
        console.log(`   Title: ${article.title?.substring(0, 60)}...`);
        console.log(`   Has Content: ${article.text ? 'YES' : 'NO'}`);
        console.log('');
      });
    } else {
      console.log('❌ No articles returned from FMP API');
      return;
    }
    
  } catch (error) {
    console.error('❌ FMP API failed:', error.message);
    return;
  }
  
  // Step 2: Test Mistral AI Integration
  console.log('\n📍 STEP 2: Testing Mistral AI Integration');
  
  try {
    // Import Mistral SDK
    const mistralModule = await import('@mistralai/mistralai');
    console.log('✅ Mistral SDK imported');
    console.log('Available exports:', Object.keys(mistralModule));
    
    // Find the right client class
    let ClientClass = null;
    if (mistralModule.Mistral && typeof mistralModule.Mistral === 'function') {
      ClientClass = mistralModule.Mistral;
      console.log('✅ Using Mistral class');
    } else if (mistralModule.default && typeof mistralModule.default === 'function') {
      ClientClass = mistralModule.default;
      console.log('✅ Using default export');
    } else {
      throw new Error('No valid Mistral client class found');
    }
    
    // Create client
    const client = new ClientClass({ apiKey: mistralApiKey });
    console.log('✅ Mistral client created');
    
    // Test API call with FMP news
    const testPrompt = createSimplePrompt(fmpArticles);
    
    console.log('\n🤖 Testing Mistral AI with FMP news...');
    console.log('Prompt length:', testPrompt.length, 'characters');
    
    let mistralResponse = null;
    let mistralError = null;
    
    try {
      // Try the most common API pattern
      mistralResponse = await Promise.race([
        client.chat.complete({
          model: "mistral-small-latest",
          messages: [{ role: "user", content: testPrompt }],
          temperature: 0.3,
          max_tokens: 500
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Mistral timeout')), 15000))
      ]);
      
      console.log('✅ Mistral API call succeeded');
      
    } catch (error) {
      mistralError = error.message;
      console.log('❌ Mistral API call failed:', error.message);
    }
    
    // Step 3: Analyze Results
    console.log('\n📍 STEP 3: Results Analysis');
    
    if (mistralResponse && mistralResponse.choices?.[0]?.message?.content) {
      const aiContent = mistralResponse.choices[0].message.content;
      
      console.log('🎉 MISTRAL AI IS WORKING!');
      console.log('✅ Real AI-generated content received');
      console.log(`✅ Content length: ${aiContent.length} characters`);
      
      // Check for signs it's real AI vs template
      const hasSpecificCompanies = /Apple|Microsoft|Google|Amazon|Tesla|NVIDIA|META/i.test(aiContent);
      const hasSpecificNumbers = /\$[\d,]+|\d+%|\d+\.?\d*B|\d+\.?\d*M/i.test(aiContent);
      const hasVariedLanguage = aiContent.split(' ').length > 50;
      
      console.log(`✅ Contains specific companies: ${hasSpecificCompanies ? 'YES' : 'NO'}`);
      console.log(`✅ Contains specific numbers: ${hasSpecificNumbers ? 'YES' : 'NO'}`);
      console.log(`✅ Substantial content: ${hasVariedLanguage ? 'YES' : 'NO'}`);
      
      console.log('\n📋 SAMPLE AI CONTENT (first 200 chars):');
      console.log(`"${aiContent.substring(0, 200)}..."`);
      
      if (hasSpecificCompanies && hasSpecificNumbers && hasVariedLanguage) {
        console.log('\n🎯 CONCLUSION: REAL MISTRAL AI IS WORKING');
      } else {
        console.log('\n⚠️ CONCLUSION: Might still be using template/fallback');
      }
      
    } else {
      console.log('❌ MISTRAL AI NOT WORKING');
      console.log('Content would be fallback/template based');
      if (mistralError) {
        console.log('Error:', mistralError);
      }
    }
    
    // Step 4: Show what production should use
    console.log('\n📍 STEP 4: Production Recommendations');
    
    if (mistralResponse) {
      console.log('✅ FOR PRODUCTION USE:');
      console.log('- FMP API for news (working)');
      console.log('- Mistral AI for analysis (working)');
      console.log('- Remove any Brave API references');
      console.log('- Use client.chat.complete() API pattern');
    } else {
      console.log('❌ FIXES NEEDED:');
      console.log('- Check Mistral API key is correct');
      console.log('- Verify @mistralai/mistralai package installed');
      console.log('- Test network connectivity to Mistral API');
    }
    
  } catch (error) {
    console.error('❌ Mistral SDK error:', error.message);
    console.log('\n🔧 SDK TROUBLESHOOTING:');
    console.log('1. Install: npm install @mistralai/mistralai --save');
    console.log('2. Check package.json has correct version');
    console.log('3. Restart backend after installation');
  }
  
  console.log('\n🏁 SIMPLE FMP + MISTRAL TEST COMPLETE');
}

function createSimplePrompt(fmpArticles) {
  const newsText = fmpArticles.map(article => 
    `• ${article.site || 'Financial News'}: ${article.title}
      ${(article.text || '').substring(0, 200)}...`
  ).join('\n\n');
  
  return `You are a financial news analyst. Summarize these news stories in 2-3 paragraphs:

${newsText}

Provide a brief analysis of what these news stories mean for investors today. Focus on specific companies, sectors, or market trends mentioned in the news.`;
}

testFmpOnlyWithMistral().catch(console.error);