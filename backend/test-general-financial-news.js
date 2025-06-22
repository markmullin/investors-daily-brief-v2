/**
 * TEST GENERAL FINANCIAL NEWS - Premium Sources Only
 * Focus: MarketWatch, Seeking Alpha, Morningstar for general market news
 * NO company-specific press releases
 */
import 'dotenv/config';
import premiumFmpNewsService from './src/services/premiumFmpNewsService.js';

async function testGeneralFinancialNews() {
  console.log('🔍 TESTING GENERAL FINANCIAL NEWS (Premium Sources)');
  console.log('🎯 Focus: MarketWatch, Seeking Alpha, Morningstar');
  console.log('❌ NO company-specific press releases');
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  
  try {
    // Test the updated premium service
    console.log('\n📍 STEP 1: Testing General Premium Financial News Service');
    
    const newsResult = await premiumFmpNewsService.getPremiumFinancialNews();
    
    console.log(`✅ Premium articles: ${newsResult.articles.length}`);
    console.log(`✅ Quality Score: ${newsResult.qualityScore}/10`);
    console.log(`✅ Source types: ${newsResult.sourceTypes.join(', ')}`);
    
    // Debug: Show all found sources
    const allSources = newsResult.articles.map(a => a.source);
    const uniqueSources = [...new Set(allSources)];
    console.log(`🔍 All sources found: ${uniqueSources.join(', ')}`);
    
    console.log('\n📰 GENERAL FINANCIAL NEWS BREAKDOWN:');
    newsResult.articles.forEach((article, i) => {
      console.log(`${i + 1}. ${article.source} (${article.sourceType})`);
      console.log(`   ${article.title}`);
      console.log(`   Quality: ${article.qualityScore} | Rating: ${article.qualityRating}/10`);
      console.log(`   Content: ${article.description?.substring(0, 120)}...`);
      console.log('');
    });
    
    // VALIDATION CHECKS
    console.log('🔍 VALIDATION CHECKS:');
    
    // Check for premium sources
    const hasMarketWatch = newsResult.articles.some(a => a.source.includes('MarketWatch'));
    const hasSeekingAlpha = newsResult.articles.some(a => a.source.includes('Seeking Alpha'));
    const hasMorningstar = newsResult.articles.some(a => a.source.includes('Morningstar'));
    const hasPremiumSources = hasMarketWatch || hasSeekingAlpha || hasMorningstar;
    
    console.log(`✅ Has MarketWatch: ${hasMarketWatch ? 'YES' : 'NO'}`);
    console.log(`✅ Has Seeking Alpha: ${hasSeekingAlpha ? 'YES' : 'NO'}`);
    console.log(`✅ Has Morningstar: ${hasMorningstar ? 'YES' : 'NO'}`);
    console.log(`📊 Has Premium Sources: ${hasPremiumSources ? 'YES' : 'NO'}`);
    
    // Check for company-specific content (should be minimal)
    const companySpecific = newsResult.articles.filter(a => 
      a.source.includes('Official') || 
      a.title.toLowerCase().includes('announces') ||
      a.title.toLowerCase().includes('reports earnings')
    ).length;
    
    console.log(`📈 Company-specific articles: ${companySpecific} (should be minimal)`);
    
    // Check for general market content
    const generalMarket = newsResult.articles.filter(a => 
      a.title.toLowerCase().includes('market') ||
      a.title.toLowerCase().includes('stocks') ||
      a.title.toLowerCase().includes('economy') ||
      a.title.toLowerCase().includes('fed') ||
      a.description?.toLowerCase().includes('market') ||
      a.description?.toLowerCase().includes('economy')
    ).length;
    
    console.log(`🌍 General market articles: ${generalMarket} (should be majority)`);
    
    // Quality validation
    const allHighQuality = newsResult.articles.every(a => a.qualityScore >= 15);
    console.log(`⭐ All articles quality 8+: ${allHighQuality ? 'YES' : 'NO'}`);
    
    // CONCLUSION
    console.log('\n' + '=' .repeat(50));
    console.log('📊 GENERAL FINANCIAL NEWS ASSESSMENT');
    console.log('=' .repeat(50));
    
    const testScore = 
      (hasPremiumSources ? 40 : 0) +
      (generalMarket >= companySpecific ? 30 : 0) +
      (allHighQuality ? 20 : 0) +
      (newsResult.articles.length >= 3 ? 10 : 0);
    
    console.log(`🎯 Test Score: ${testScore}/100`);
    
    if (testScore >= 80) {
      console.log('🎉 EXCELLENT: General financial news working perfectly!');
      console.log('✅ Premium sources detected');
      console.log('✅ General market focus maintained');
      console.log('✅ High quality threshold met');
    } else if (testScore >= 60) {
      console.log('⚠️ PARTIAL: Some issues with source mix');
      if (!hasPremiumSources) console.log('🔧 Need to improve premium source filtering');
      if (companySpecific > generalMarket) console.log('🔧 Too much company-specific content');
    } else {
      console.log('❌ NEEDS WORK: Major issues with general news service');
      console.log('🔧 Review FMP endpoints and source filtering');
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\\n⏱️  Total time: ${totalTime}ms`);
    console.log(`📰 Articles retrieved: ${newsResult.articles.length}`);
    console.log(`🎯 Focus: General market news from premium sources`);
    
    // RECOMMENDATIONS
    console.log('\\n📋 RECOMMENDATIONS:');
    if (!hasPremiumSources) {
      console.log('🔧 Investigate FMP API endpoints for MarketWatch/Seeking Alpha content');
      console.log('🔧 Consider alternative news aggregation approaches');
    }
    
    if (companySpecific > generalMarket) {
      console.log('🔧 Improve filtering to reduce company-specific press releases');
      console.log('🔧 Focus on market-wide and economic news');
    }
    
    if (newsResult.articles.length < 5) {
      console.log('🔧 Increase article count for better variety');
      console.log('🔧 Try additional FMP endpoints');
    }
    
    console.log('\\n🏁 GENERAL FINANCIAL NEWS TEST COMPLETE');
    
    return hasPremiumSources && generalMarket >= companySpecific && allHighQuality;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔧 Check API keys and service configuration');
    return false;
  }
}

testGeneralFinancialNews()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\\n💥 Test execution failed:', error.message);
    process.exit(1);
  });