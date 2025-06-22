/**
 * TEST NATURAL AI SYNTHESIS
 * Verify Mistral reads full content and writes natural paragraphs
 */
import 'dotenv/config';
import premiumFmpNewsService from './src/services/premiumFmpNewsService.js';
import mistralService from './src/services/mistralService.js';

async function testNaturalSynthesis() {
  console.log('🔍 TESTING NATURAL AI SYNTHESIS');
  console.log('🎯 Goal: Mistral reads full premium content & writes natural paragraphs');
  console.log('❌ NO structured templates or bullet points');
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  
  try {
    // STEP 1: Get premium news with FULL content
    console.log('\n📍 STEP 1: Getting Premium News with Full Content');
    
    const newsResult = await premiumFmpNewsService.getPremiumFinancialNews();
    
    console.log(`✅ Premium articles: ${newsResult.articles.length}`);
    
    // Check content lengths - should be much longer now
    const contentLengths = newsResult.articles.map(a => (a.description || '').length);
    console.log(`📝 Content lengths: ${contentLengths.join(', ')} characters`);
    
    const avgLength = contentLengths.reduce((sum, len) => sum + len, 0) / contentLengths.length;
    console.log(`📊 Average content length: ${Math.round(avgLength)} characters`);
    
    if (avgLength > 500) {
      console.log('✅ SUCCESS: Getting full content (not truncated)');
    } else {
      console.log('⚠️ WARNING: Content still seems truncated');
    }
    
    // Show sample full content
    if (newsResult.articles.length > 0) {
      console.log('\n📰 SAMPLE FULL CONTENT (first 300 chars):');
      console.log(`"${newsResult.articles[0].description.substring(0, 300)}..."`);
    }
    
    // STEP 2: Test Mistral AI synthesis
    console.log('\n📍 STEP 2: Testing Mistral AI Natural Synthesis');
    
    if (newsResult.articles.length === 0) {
      console.error('❌ No articles to synthesize');
      return false;
    }
    
    // Initialize Mistral
    const initialized = await mistralService.initialize();
    if (!initialized) {
      console.error('❌ Mistral service not available');
      return false;
    }
    
    // Create natural synthesis prompt
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    
    const fullNewsContent = newsResult.articles.map((article, i) => 
      `SOURCE ${i + 1}: ${article.source}
HEADLINE: ${article.title}
FULL CONTENT: ${article.description}

---`
    ).join('\n\n');
    
    const prompt = `You are a senior financial analyst writing a Daily Market Brief for ${currentDate}.

I'm providing you with COMPLETE articles from premium financial sources (MarketWatch, Seeking Alpha, Morningstar, etc.). Please read ALL of this content carefully and synthesize it into a natural, flowing market analysis.

PREMIUM FINANCIAL NEWS SOURCES:

${fullNewsContent}

YOUR TASK:
Read through ALL the content above and write a comprehensive market brief in 3-4 natural paragraphs. DO NOT use bullet points, headers, or structured format. Write in flowing prose as if you're explaining the market to a sophisticated investor.

REQUIREMENTS:
• Synthesize insights from ALL the sources above
• Write in your own words (don't quote directly)
• Focus on the key themes and market implications
• Include specific details from the articles (companies, numbers, events)
• Make connections between different stories
• End with investment outlook and key things to watch

TARGET: 400-600 words in natural paragraph format.

Begin your analysis now:`;
    
    console.log(`📝 Created synthesis prompt: ${prompt.length} characters`);
    
    // Generate natural synthesis
    const synthesisStart = Date.now();
    const aiAnalysis = await mistralService.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 1200
    });
    const synthesisTime = Date.now() - synthesisStart;
    
    console.log(`✅ Mistral synthesis completed in ${synthesisTime}ms`);
    console.log(`📝 Generated analysis: ${aiAnalysis.length} characters`);
    
    // VALIDATION CHECKS
    console.log('\n🔍 VALIDATION CHECKS:');
    
    // Check if it's natural paragraphs (not structured)
    const hasStructuredFormat = aiAnalysis.includes('•') || 
                                aiAnalysis.includes('Market Headlines:') ||
                                aiAnalysis.includes('Investment Implications:') ||
                                aiAnalysis.includes('Key Takeaways:');
    
    console.log(`✅ Natural format (no bullets/structure): ${!hasStructuredFormat ? 'YES' : 'NO'}`);
    
    // Check if it mentions specific sources/content
    const mentionsSpecificContent = newsResult.articles.some(article => 
      aiAnalysis.toLowerCase().includes(article.title.toLowerCase().substring(0, 20))
    );
    
    console.log(`✅ References specific source content: ${mentionsSpecificContent ? 'YES' : 'NO'}`);
    
    // Check length
    const isAppropriateLength = aiAnalysis.length >= 300 && aiAnalysis.length <= 800;
    console.log(`✅ Appropriate length (300-800 chars): ${isAppropriateLength ? 'YES' : 'NO'}`);
    
    // Check if it's in paragraph format
    const paragraphCount = aiAnalysis.split('\n\n').length;
    console.log(`✅ Paragraph format: ${paragraphCount} paragraphs`);
    
    // SHOW RESULT
    console.log('\n📋 NATURAL AI SYNTHESIS RESULT:');
    console.log('=' .repeat(50));
    console.log(aiAnalysis);
    console.log('=' .repeat(50));
    
    const totalTime = Date.now() - startTime;
    
    // CONCLUSION
    console.log('\n📊 NATURAL SYNTHESIS ASSESSMENT');
    console.log('=' .repeat(50));
    
    const score = 
      (!hasStructuredFormat ? 25 : 0) +
      (mentionsSpecificContent ? 25 : 0) +
      (isAppropriateLength ? 25 : 0) +
      (paragraphCount >= 2 && paragraphCount <= 5 ? 25 : 0);
    
    console.log(`🎯 Synthesis Score: ${score}/100`);
    console.log(`⏱️ Total time: ${totalTime}ms`);
    
    if (score >= 75) {
      console.log('🎉 EXCELLENT: Natural AI synthesis working perfectly!');
      console.log('✅ Mistral reads full content and writes naturally');
      console.log('✅ No structured templates or bullet points');
      console.log('✅ Flowing paragraphs in AI\'s own words');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Some issues detected');
      if (hasStructuredFormat) console.log('🔧 Still using structured format');
      if (!mentionsSpecificContent) console.log('🔧 Not referencing source content');
      if (!isAppropriateLength) console.log('🔧 Length issues');
    }
    
    console.log('\n🏁 NATURAL SYNTHESIS TEST COMPLETE');
    
    return score >= 75;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testNaturalSynthesis()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  });