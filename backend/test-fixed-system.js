/**
 * TEST FIXED COMPREHENSIVE NEWS SYSTEM
 * Validates: STRICT premium sources only, TOP companies only
 */
import 'dotenv/config';
import comprehensiveNewsService from './src/services/comprehensiveNewsService.js';

async function testFixedSystem() {
  console.log('🚀 TESTING FIXED COMPREHENSIVE NEWS SYSTEM');
  console.log('🔒 STRICT FILTERING: Only Reuters, Morningstar, MarketWatch');
  console.log('🏢 TOP COMPANIES ONLY: AAPL, MSFT, GOOGL, AMZN, NVDA, etc.');
  console.log('=' .repeat(80));
  
  try {
    const startTime = Date.now();
    const result = await comprehensiveNewsService.getComprehensiveNews();
    const totalTime = Date.now() - startTime;
    
    console.log('\n✅ FIXED SYSTEM RESULTS:');
    console.log(`⏱️ Fetch time: ${totalTime}ms`);
    console.log(`📊 Total articles: ${result.articles.length}/20 target`);
    console.log(`   📰 General market: ${result.breakdown.generalMarket}/10 target`);
    console.log(`   🏢 Company-specific: ${result.breakdown.companySpecific}/10 target`);
    
    // Test premium sources only
    const allSources = [...new Set(result.articles.map(a => a.source))];
    const premiumSources = allSources.filter(s => ['Reuters', 'Morningstar', 'MarketWatch'].includes(s));
    const unwantedSources = allSources.filter(s => !['Reuters', 'Morningstar', 'MarketWatch'].includes(s));
    
    console.log('\n📰 SOURCE QUALITY CHECK:');
    console.log(`✅ All sources: ${allSources.join(', ')}`);
    console.log(`✅ Premium sources: ${premiumSources.join(', ')} (${premiumSources.length}/${allSources.length})`);
    
    if (unwantedSources.length > 0) {
      console.log(`❌ UNWANTED sources detected: ${unwantedSources.join(', ')}`);
    } else {
      console.log(`✅ SOURCE QUALITY: PERFECT - Only premium sources`);
    }
    
    // Test company quality
    const companies = result.articles
      .filter(a => a.category === 'company_specific')
      .map(a => a.companySymbol)
      .filter(Boolean);
    
    const topTierCompanies = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'TSM', 'LLY', 'UNH', 'JPM', 'V', 'XOM', 'WMT', 'MA', 'PG', 'JNJ', 'ORCL', 'HD'];
    const validCompanies = companies.filter(c => topTierCompanies.includes(c));
    const invalidCompanies = companies.filter(c => !topTierCompanies.includes(c));
    
    console.log('\n🏢 COMPANY QUALITY CHECK:');
    console.log(`✅ Companies found: ${companies.join(', ')}`);
    console.log(`✅ Top-tier companies: ${validCompanies.join(', ')} (${validCompanies.length}/${companies.length})`);
    
    if (invalidCompanies.length > 0) {
      console.log(`❌ LOW-QUALITY companies detected: ${invalidCompanies.join(', ')}`);
    } else {
      console.log(`✅ COMPANY QUALITY: PERFECT - Only top-tier companies`);
    }
    
    // Show sample articles
    console.log('\n📝 SAMPLE GENERAL MARKET ARTICLES:');
    result.articles.filter(a => a.category === 'general_market').slice(0, 3).forEach((article, i) => {
      console.log(`  ${i + 1}. ${article.source}: ${article.title.substring(0, 70)}...`);
    });
    
    console.log('\n🏢 SAMPLE COMPANY ARTICLES:');
    result.articles.filter(a => a.category === 'company_specific').slice(0, 5).forEach((article, i) => {
      const marketCap = article.marketCap ? `($${(article.marketCap / 1000000000000).toFixed(1)}T)` : '';
      console.log(`  ${i + 1}. ${article.companySymbol} ${marketCap}: ${article.title.substring(0, 60)}...`);
    });
    
    // Overall assessment
    const qualityScore = calculateQualityScore(result, allSources, companies, topTierCompanies);
    
    console.log('\n🎯 QUALITY ASSESSMENT:');
    console.log(`📊 Overall quality score: ${qualityScore}/100`);
    console.log(`⏱️ Performance: ${totalTime < 20000 ? 'GOOD' : 'NEEDS OPTIMIZATION'} (${Math.round(totalTime/1000)}s)`);
    console.log(`📰 Source quality: ${unwantedSources.length === 0 ? 'PERFECT' : 'NEEDS WORK'}`);
    console.log(`🏢 Company quality: ${invalidCompanies.length === 0 ? 'PERFECT' : 'NEEDS WORK'}`);
    
    if (qualityScore >= 80) {
      console.log('\n🎉 FIXED SYSTEM: READY FOR PRODUCTION');
    } else {
      console.log('\n⚠️ FIXED SYSTEM: NEEDS MORE WORK');
    }
    
  } catch (error) {
    console.error('❌ FIXED SYSTEM TEST FAILED:', error.message);
  }
}

function calculateQualityScore(result, allSources, companies, topTierCompanies) {
  let score = 0;
  
  // Article count (30 points)
  score += Math.min(30, (result.articles.length / 20) * 30);
  
  // Source quality (40 points)
  const premiumSources = allSources.filter(s => ['Reuters', 'Morningstar', 'MarketWatch'].includes(s));
  score += (premiumSources.length / allSources.length) * 40;
  
  // Company quality (30 points)  
  if (companies.length > 0) {
    const validCompanies = companies.filter(c => topTierCompanies.includes(c));
    score += (validCompanies.length / companies.length) * 30;
  }
  
  return Math.round(score);
}

testFixedSystem().catch(console.error);