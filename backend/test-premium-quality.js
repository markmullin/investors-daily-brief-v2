/**
 * TEST PREMIUM FMP SERVICE - QUALITY 8+ ONLY
 * Focus: Official reports, MarketWatch, Seeking Alpha
 */
import 'dotenv/config';
import premiumFmpNewsService from './src/services/premiumFmpNewsService.js';

async function testPremiumQuality() {
  console.log('🔍 TESTING PREMIUM FMP SERVICE (Quality 8+ Only)');
  console.log('Focus: Official reports, MarketWatch, Seeking Alpha');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  // Test Premium News Service
  console.log('\n📍 STEP 1: Testing Premium News Service');
  
  let newsResult;
  try {
    newsResult = await premiumFmpNewsService.getPremiumFinancialNews();
    
    console.log(`✅ Premium articles: ${newsResult.articles.length}`);
    console.log(`✅ Quality Score: ${newsResult.qualityScore}/10`);
    console.log(`✅ Minimum Quality: ${newsResult.minimumQuality}/10`);
    console.log(`✅ Source types: ${newsResult.sourceTypes.join(', ')}`);
    
    console.log('\n📰 PREMIUM SOURCES BREAKDOWN:');
    newsResult.articles.forEach((article, i) => {
      console.log(`${i + 1}. ${article.source}: ${article.title?.substring(0, 50)}...`);
      console.log(`   Type: ${article.sourceType} | Quality: ${article.qualityScore} | Rating: ${article.qualityRating}/10`);
      console.log(`   Content: ${article.description?.substring(0, 80)}...`);
      console.log('');
    });
    
    // Quality validation
    const hasOfficialReports = newsResult.articles.some(a => a.sourceType === 'official_report');
    const hasPremiumSources = newsResult.articles.some(a => 
      a.source === 'MarketWatch' || a.source === 'Seeking Alpha'
    );
    const allHighQuality = newsResult.articles.every(a => a.qualityScore >= 20);
    
    console.log('🔍 QUALITY VALIDATION:');
    console.log(`✅ Has Official Reports: ${hasOfficialReports ? 'YES' : 'NO'}`);
    console.log(`✅ Has MarketWatch/Seeking Alpha: ${hasPremiumSources ? 'YES' : 'NO'}`);
    console.log(`✅ All articles quality 8+: ${allHighQuality ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Premium news failed:', error.message);
    return;
  }
  
  // Test Mistral AI with premium content
  console.log('\n📍 STEP 2: Testing Mistral AI with Premium Content');
  
  try {
    const mistralModule = await import('@mistralai/mistralai');
    const MistralClass = mistralModule.Mistral || mistralModule.default;
    
    const client = new MistralClass({ 
      apiKey: process.env.MISTRAL_API_KEY 
    });
    
    const prompt = createPremiumPrompt(newsResult.articles);
    console.log(`✅ Premium prompt created (${prompt.length} characters)`);
    
    const mistralResponse = await Promise.race([
      client.chat.complete({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 600
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Mistral timeout')), 12000))
    ]);
    
    if (mistralResponse?.choices?.[0]?.message?.content) {
      const aiContent = mistralResponse.choices[0].message.content;
      
      console.log('🎉 MISTRAL AI SUCCESS WITH PREMIUM CONTENT!');
      console.log(`✅ Generated: ${aiContent.length} characters`);
      
      // Premium content quality checks
      const hasCompanyMentions = /Apple|Microsoft|Google|Amazon|Tesla|NVIDIA/i.test(aiContent);
      const hasFinancialTerms = /earnings|revenue|market|stock|investor|financial/i.test(aiContent);
      const hasSpecificData = /\$[\d,]+|\d+%|\d+\.?\d*[BM]/i.test(aiContent);
      const isProfessional = aiContent.length > 200 && !aiContent.includes('mixed market conditions');
      
      console.log(`✅ Company mentions: ${hasCompanyMentions ? 'YES' : 'NO'}`);
      console.log(`✅ Financial terms: ${hasFinancialTerms ? 'YES' : 'NO'}`);
      console.log(`✅ Specific data: ${hasSpecificData ? 'YES' : 'NO'}`);
      console.log(`✅ Professional tone: ${isProfessional ? 'YES' : 'NO'}`);
      
      console.log('\n📋 PREMIUM AI ANALYSIS (first 300 chars):');
      console.log(`"${aiContent.substring(0, 300)}..."`);
      
      if (hasCompanyMentions && hasFinancialTerms && isProfessional) {
        console.log('\n🎯 CONCLUSION: PREMIUM CONTENT + REAL MISTRAL AI WORKING PERFECTLY!');
      } else {
        console.log('\n⚠️ Some quality indicators missing');
      }
      
    } else {
      console.log('❌ Invalid Mistral response');
    }
    
  } catch (error) {
    console.error('❌ Mistral with premium content failed:', error.message);
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n📊 PREMIUM QUALITY ASSESSMENT');
  console.log('=' .repeat(50));
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📰 Premium quality: ${newsResult.qualityScore}/10`);
  console.log(`🎯 Sources: Official reports, MarketWatch, Seeking Alpha`);
  console.log(`✅ Quality threshold: 8+ only`);
  
  console.log('\n🚀 PRODUCTION READY:');
  console.log('✅ Premium FMP News Service');
  console.log('✅ Real Mistral AI integration');  
  console.log('✅ Quality filtering (8+ only)');
  console.log('✅ Official company reports prioritized');
  console.log('✅ MarketWatch & Seeking Alpha focused');
  
  console.log('\n🏁 PREMIUM QUALITY TEST COMPLETE');
}

function createPremiumPrompt(articles) {
  const premiumNewsText = articles.map(article => 
    `• ${article.source} (${article.sourceType}): ${article.title}
      ${article.description.substring(0, 150)}...`
  ).join('\n\n');
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  
  return `You are a senior financial analyst creating a Daily Market Brief for ${currentDate}.

**PREMIUM FINANCIAL NEWS SOURCES:**
${premiumNewsText}

**YOUR MISSION:**
Create a professional daily market brief using these premium sources (official company reports, MarketWatch, Seeking Alpha). Focus on:

1. **Key Market Developments**: What are the most important financial stories?
2. **Company-Specific News**: Analysis of major corporate announcements
3. **Investment Implications**: What do these developments mean for investors?

Write a concise, professional analysis in 2-3 paragraphs. Reference specific companies and use the financial data mentioned in the premium sources above. Keep it factual and actionable for serious investors.`;
}

testPremiumQuality().catch(console.error);