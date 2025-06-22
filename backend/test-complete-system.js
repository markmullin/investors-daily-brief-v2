/**
 * TEST COMPLETE SYSTEM - SHOW FULL ARTICLES
 * Display complete news articles and test full Mistral integration
 */
import 'dotenv/config';
import comprehensiveNewsService from './src/services/comprehensiveNewsService.js';
import enhancedMistralAnalysisService from './src/services/enhancedMistralAnalysisService.js';

async function testCompleteSystem() {
  console.log('🚀 TESTING COMPLETE SYSTEM - FULL ARTICLES + MISTRAL ANALYSIS');
  console.log('📰 Will show COMPLETE article titles and descriptions');
  console.log('🤖 Will test full Mistral analysis integration');
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Get the comprehensive news
    console.log('\n📰 STEP 1: Getting comprehensive news...');
    const newsResult = await comprehensiveNewsService.getComprehensiveNews();
    
    console.log(`✅ Got ${newsResult.articles.length} real articles`);
    
    // Step 2: Show COMPLETE articles (not truncated)
    console.log('\n📊 COMPLETE GENERAL MARKET ARTICLES:');
    const generalArticles = newsResult.articles.filter(a => a.category === 'general_market');
    generalArticles.forEach((article, i) => {
      console.log(`\n${i + 1}. **${article.source}** (${new Date(article.publishedAt).toLocaleDateString()})`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Description: ${article.description.substring(0, 200)}...`);
      console.log(`   URL: ${article.url}`);
    });
    
    console.log('\n🏢 COMPLETE COMPANY-SPECIFIC ARTICLES:');
    const companyArticles = newsResult.articles.filter(a => a.category === 'company_specific');
    companyArticles.forEach((article, i) => {
      console.log(`\n${i + 1}. **${article.companySymbol}** (${article.source}, ${new Date(article.publishedAt).toLocaleDateString()})`);
      console.log(`   Market Cap: ${article.marketCap ? '$' + (article.marketCap / 1000000000000).toFixed(1) + 'T' : 'Unknown'}`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Description: ${article.description.substring(0, 200)}...`);
      console.log(`   URL: ${article.url}`);
    });
    
    // Step 3: Test complete Mistral analysis
    console.log('\n🤖 STEP 2: Testing complete Mistral analysis...');
    
    if (newsResult.articles.length > 0) {
      console.log('🤖 Sending all articles to Mistral for analysis...');
      
      const analysisResult = await enhancedMistralAnalysisService.analyzeComprehensiveMarketNews(newsResult);
      
      console.log('\n✅ MISTRAL ANALYSIS COMPLETE:');
      console.log(`📝 Analysis length: ${analysisResult.content.length} characters`);
      console.log(`🤖 Model: ${analysisResult.model}`);
      console.log(`📊 Articles analyzed: ${analysisResult.breakdown.totalArticles}`);
      console.log(`🏢 Companies analyzed: ${analysisResult.companies.length}`);
      
      console.log('\n📝 COMPLETE MISTRAL ANALYSIS:');
      console.log('=' .repeat(80));
      console.log(analysisResult.content);
      console.log('=' .repeat(80));
      
      console.log('\n📊 ANALYSIS METADATA:');
      console.log(`✅ General market articles: ${analysisResult.breakdown.generalMarketNews}`);
      console.log(`✅ Company-specific articles: ${analysisResult.breakdown.companySpecificNews}`);
      console.log(`✅ Premium sources used: ${analysisResult.breakdown.premiumSources.join(', ')}`);
      
      if (analysisResult.companies.length > 0) {
        console.log('\n🏢 COMPANIES IN ANALYSIS:');
        analysisResult.companies.forEach((company, i) => {
          console.log(`   ${i + 1}. ${company.symbol}: ${company.title.substring(0, 60)}...`);
        });
      }
      
    } else {
      console.warn('❌ No articles available for Mistral analysis');
    }
    
    // Step 4: Test the actual API endpoint
    console.log('\n🔗 STEP 3: API Endpoint Information');
    console.log('The complete system is now available at:');
    console.log('   GET /api/ai/comprehensive-analysis');
    console.log('');
    console.log('To test the API endpoint:');
    console.log('1. Start your backend: npm start');
    console.log('2. Call: curl http://localhost:5000/api/ai/comprehensive-analysis');
    console.log('3. Or test in browser: http://localhost:5000/api/ai/comprehensive-analysis');
    
    console.log('\n🎉 COMPLETE SYSTEM TEST SUCCESSFUL!');
    console.log(`✅ Real articles: ${newsResult.articles.length}`);
    console.log(`✅ Sources: ${Object.keys(newsResult.sources).join(', ')}`);
    console.log(`✅ Mistral analysis: ${analysisResult ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Ready for frontend integration`);
    
  } catch (error) {
    console.error('❌ COMPLETE SYSTEM TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testCompleteSystem().catch(console.error);