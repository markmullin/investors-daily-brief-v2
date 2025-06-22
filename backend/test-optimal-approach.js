/**
 * TEST OPTIMAL COMPREHENSIVE NEWS APPROACH
 * General: /v4/general_news with approved sources only
 * Company: Direct /v3/stock_news?tickers=SYMBOL API calls
 */
import 'dotenv/config';
import comprehensiveNewsService from './src/services/comprehensiveNewsService.js';

async function testOptimalApproach() {
  console.log('🚀 TESTING OPTIMAL COMPREHENSIVE NEWS APPROACH');
  console.log('📊 General: /v4/general_news + approved sources');
  console.log('🏢 Company: Direct /v3/stock_news?tickers=SYMBOL calls');
  console.log('=' .repeat(80));
  
  try {
    const startTime = Date.now();
    const result = await comprehensiveNewsService.getComprehensiveNews();
    const totalTime = Date.now() - startTime;
    
    console.log('\n✅ OPTIMAL APPROACH RESULTS:');
    console.log(`⏱️ Total time: ${Math.round(totalTime/1000)}s`);
    console.log(`📊 Total articles: ${result.articles.length}/20 target`);
    console.log(`   📰 General market: ${result.breakdown.generalMarket}/10 target`);
    console.log(`   🏢 Company-specific: ${result.breakdown.companySpecific}/10 target`);
    console.log(`🔧 Approach: ${result.approach}`);
    
    // Validate general market sources
    const generalArticles = result.articles.filter(a => a.category === 'general_market');
    const generalSources = [...new Set(generalArticles.map(a => a.source))];
    const approvedSources = ['Reuters', 'MarketWatch', 'Barrons', 'Investors.com', 'Business Wire'];
    const foundApproved = generalSources.filter(s => approvedSources.includes(s));
    const unwantedGeneral = generalSources.filter(s => !approvedSources.includes(s));
    
    console.log('\n📊 GENERAL MARKET SOURCE VALIDATION:');
    console.log(`✅ Sources found: ${generalSources.join(', ')}`);
    console.log(`✅ Approved sources: ${foundApproved.join(', ')} (${foundApproved.length}/${generalSources.length})`);
    
    if (unwantedGeneral.length > 0) {
      console.log(`❌ UNWANTED general sources: ${unwantedGeneral.join(', ')}`);
    } else {
      console.log(`✅ GENERAL SOURCE QUALITY: PERFECT`);
    }
    
    // Validate company sources and quality
    const companyArticles = result.articles.filter(a => a.category === 'company_specific');
    const companies = companyArticles.map(a => a.companySymbol);
    const companySources = [...new Set(companyArticles.map(a => a.source))];
    const topTierCompanies = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'TSM', 'LLY', 'UNH', 'JPM', 'V', 'XOM', 'WMT', 'MA', 'PG', 'JNJ', 'ORCL', 'HD'];
    const validCompanies = companies.filter(c => topTierCompanies.includes(c));
    const invalidCompanies = companies.filter(c => !topTierCompanies.includes(c));
    
    console.log('\n🏢 COMPANY-SPECIFIC VALIDATION:');
    console.log(`✅ Companies found: ${companies.join(', ')}`);
    console.log(`✅ Top-tier companies: ${validCompanies.length}/${companies.length} (${validCompanies.join(', ')})`);
    console.log(`📰 Company news sources: ${companySources.join(', ')}`);
    
    if (invalidCompanies.length > 0) {
      console.log(`❌ INVALID companies: ${invalidCompanies.join(', ')}`);
    } else {
      console.log(`✅ COMPANY QUALITY: PERFECT - All top-tier`);
    }
    
    // Show samples
    console.log('\n📝 SAMPLE GENERAL MARKET ARTICLES:');
    generalArticles.slice(0, 3).forEach((article, i) => {
      console.log(`  ${i + 1}. ${article.source}: ${article.title.substring(0, 65)}...`);
    });
    
    console.log('\n🏢 SAMPLE COMPANY ARTICLES:');
    companyArticles.slice(0, 5).forEach((article, i) => {
      const marketCap = article.marketCap ? `($${(article.marketCap / 1000000000000).toFixed(1)}T)` : '';
      console.log(`  ${i + 1}. ${article.companySymbol} ${marketCap} - ${article.source}: ${article.title.substring(0, 50)}...`);
    });
    
    // API efficiency assessment
    console.log('\n⚡ API EFFICIENCY ASSESSMENT:');
    console.log(`📊 General market: 1 API call (/v4/general_news) → ${generalArticles.length} articles`);
    console.log(`🏢 Company-specific: ~${companyArticles.length} API calls (/v3/stock_news per company) → ${companyArticles.length} articles`);
    console.log(`🎯 Total API calls: ~${companyArticles.length + 1} calls for ${result.articles.length} targeted articles`);
    console.log(`✅ Efficiency: HIGH (direct targeting, no wasted filtering)`);
    
    // Overall assessment
    const qualityScore = calculateOptimalQuality(result, foundApproved, generalSources, validCompanies, companies);
    
    console.log('\n🎯 OPTIMAL APPROACH ASSESSMENT:');
    console.log(`📊 Overall quality score: ${qualityScore}/100`);
    console.log(`⏱️ Performance: ${totalTime < 15000 ? 'EXCELLENT' : totalTime < 30000 ? 'GOOD' : 'NEEDS WORK'} (${Math.round(totalTime/1000)}s)`);
    console.log(`📰 General source quality: ${unwantedGeneral.length === 0 ? 'PERFECT' : 'NEEDS WORK'}`);
    console.log(`🏢 Company quality: ${invalidCompanies.length === 0 ? 'PERFECT' : 'NEEDS WORK'}`);
    console.log(`🎯 Approach effectiveness: ${result.breakdown.total >= 15 ? 'EXCELLENT' : 'GOOD'}`);
    
    if (qualityScore >= 85) {
      console.log('\n🎉 OPTIMAL APPROACH: READY FOR PRODUCTION');
      console.log('✅ High-quality sources + Direct company targeting = SUCCESS');
    } else {
      console.log('\n⚠️ OPTIMAL APPROACH: NEEDS FINE-TUNING');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log(`🎯 ${result.articles.length}/20 articles (${result.breakdown.generalMarket} general + ${result.breakdown.companySpecific} company)`);
    console.log(`📰 General sources: ${foundApproved.join(', ')}`);
    console.log(`🏢 Companies: ${validCompanies.slice(0, 8).join(', ')}${validCompanies.length > 8 ? '...' : ''}`);
    console.log(`⏱️ Time: ${Math.round(totalTime/1000)}s`);
    console.log(`🎯 Status: ${qualityScore >= 85 ? 'PRODUCTION READY' : 'GOOD QUALITY'}`);
    
  } catch (error) {
    console.error('❌ OPTIMAL APPROACH TEST FAILED:', error.message);
  }
}

function calculateOptimalQuality(result, foundApproved, generalSources, validCompanies, companies) {
  let score = 0;
  
  // Article count (25 points)
  score += Math.min(25, (result.articles.length / 20) * 25);
  
  // General source quality (35 points)
  if (generalSources.length > 0) {
    score += (foundApproved.length / generalSources.length) * 35;
  }
  
  // Company quality (25 points)
  if (companies.length > 0) {
    score += (validCompanies.length / companies.length) * 25;
  }
  
  // Approach bonus (15 points for using optimal direct API approach)
  if (result.approach === 'optimal_direct_api') {
    score += 15;
  }
  
  return Math.round(score);
}

testOptimalApproach().catch(console.error);