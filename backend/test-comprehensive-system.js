/**
 * TEST COMPREHENSIVE 20-ARTICLE NEWS SYSTEM
 * Tests: 10 general + 10 company-specific news with Mistral analysis
 * Validates: Premium sources, company deduplication, Mistral integration
 */
import 'dotenv/config';
import comprehensiveNewsService from './src/services/comprehensiveNewsService.js';
import enhancedMistralAnalysisService from './src/services/enhancedMistralAnalysisService.js';

async function testComprehensiveSystem() {
  console.log('🚀 TESTING COMPREHENSIVE 20-ARTICLE NEWS SYSTEM');
  console.log('🎯 Target: 10 general + 10 company-specific from premium sources');
  console.log('=' .repeat(80));
  
  try {
    // **TEST 1**: Comprehensive News Service
    console.log('\n📰 TEST 1: Comprehensive News Service');
    console.log('Testing 10 general + 10 company-specific news fetch...');
    
    const startTime = Date.now();
    const comprehensiveNewsData = await comprehensiveNewsService.getComprehensiveNews();
    const fetchTime = Date.now() - startTime;
    
    console.log('\n✅ COMPREHENSIVE NEWS RESULTS:');
    console.log(`⏱️ Fetch time: ${fetchTime}ms`);
    console.log(`📊 Total articles: ${comprehensiveNewsData.articles.length}/20 target`);
    console.log(`   📰 General market: ${comprehensiveNewsData.breakdown.generalMarket}/10 target`);
    console.log(`   🏢 Company-specific: ${comprehensiveNewsData.breakdown.companySpecific}/10 target`);
    
    // Test article categories
    const generalArticles = comprehensiveNewsData.articles.filter(a => a.category === 'general_market');
    const companyArticles = comprehensiveNewsData.articles.filter(a => a.category === 'company_specific');
    
    console.log('\n📊 CATEGORY BREAKDOWN:');
    console.log(`General Market Articles: ${generalArticles.length}`);
    generalArticles.slice(0, 3).forEach((article, i) => {
      console.log(`  ${i + 1}. ${article.source}: ${article.title.substring(0, 60)}...`);
    });
    
    console.log(`\nCompany-Specific Articles: ${companyArticles.length}`);
    companyArticles.slice(0, 5).forEach((article, i) => {
      console.log(`  ${i + 1}. ${article.companySymbol} (${article.source}): ${article.title.substring(0, 50)}...`);
    });
    
    // Test premium sources
    const sources = [...new Set(comprehensiveNewsData.articles.map(a => a.source))];
    const premiumSources = sources.filter(s => ['Reuters', 'Morningstar', 'MarketWatch'].includes(s));
    
    console.log('\n📰 SOURCE VALIDATION:');
    console.log(`✅ All sources found: ${sources.join(', ')}`);
    console.log(`✅ Premium sources: ${premiumSources.join(', ')}`);
    console.log(`✅ Premium coverage: ${premiumSources.length}/3 target sources`);
    
    // Test company deduplication
    const companies = companyArticles.map(a => a.companySymbol);
    const uniqueCompanies = [...new Set(companies)];
    
    console.log('\n🏢 COMPANY DEDUPLICATION TEST:');
    console.log(`✅ Total company articles: ${companies.length}`);
    console.log(`✅ Unique companies: ${uniqueCompanies.length}`);
    console.log(`✅ Deduplication working: ${companies.length === uniqueCompanies.length ? 'YES' : 'NO'}`);
    if (uniqueCompanies.length > 0) {
      console.log(`✅ Companies found: ${uniqueCompanies.join(', ')}`);
    }
    
    // **TEST 2**: Enhanced Mistral Analysis
    console.log('\n🤖 TEST 2: Enhanced Mistral Analysis Service');
    console.log('Testing comprehensive 20-article analysis...');
    
    if (comprehensiveNewsData.articles.length > 0) {
      const analysisStartTime = Date.now();
      const analysisResult = await enhancedMistralAnalysisService.analyzeComprehensiveMarketNews(comprehensiveNewsData);
      const analysisTime = Date.now() - analysisStartTime;
      
      console.log('\n✅ MISTRAL ANALYSIS RESULTS:');
      console.log(`⏱️ Analysis time: ${analysisTime}ms`);
      console.log(`📝 Content length: ${analysisResult.content.length} characters`);
      console.log(`🤖 Model used: ${analysisResult.model}`);
      console.log(`📊 Analysis type: ${analysisResult.analysisType}`);
      
      console.log('\n📊 ANALYSIS BREAKDOWN:');
      console.log(`✅ General market news analyzed: ${analysisResult.breakdown.generalMarketNews}`);
      console.log(`✅ Company-specific news analyzed: ${analysisResult.breakdown.companySpecificNews}`);
      console.log(`✅ Total articles analyzed: ${analysisResult.breakdown.totalArticles}`);
      console.log(`✅ Premium sources used: ${analysisResult.breakdown.premiumSources.join(', ')}`);
      
      if (analysisResult.companies.length > 0) {
        console.log('\n🏢 COMPANIES ANALYZED:');
        analysisResult.companies.slice(0, 5).forEach((company, i) => {
          console.log(`  ${i + 1}. ${company.symbol}: ${company.title.substring(0, 50)}...`);
        });
      }
      
      // Test analysis content quality
      const content = analysisResult.content.toLowerCase();
      const hasMarketOverview = content.includes('market overview');
      const hasInvestmentImplications = content.includes('investment implications');
      const hasKeyTakeaways = content.includes('key takeaways');
      const hasRiskAssessment = content.includes('risk assessment');
      
      console.log('\n📝 ANALYSIS STRUCTURE VALIDATION:');
      console.log(`✅ Market Overview section: ${hasMarketOverview ? 'FOUND' : 'MISSING'}`);
      console.log(`✅ Investment Implications section: ${hasInvestmentImplications ? 'FOUND' : 'MISSING'}`);
      console.log(`✅ Key Takeaways section: ${hasKeyTakeaways ? 'FOUND' : 'MISSING'}`);
      console.log(`✅ Risk Assessment section: ${hasRiskAssessment ? 'FOUND' : 'MISSING'}`);
      
      const structureScore = [hasMarketOverview, hasInvestmentImplications, hasKeyTakeaways, hasRiskAssessment].filter(Boolean).length;
      console.log(`✅ Structure completeness: ${structureScore}/4 required sections`);
      
      // Show a sample of the analysis
      console.log('\n📝 ANALYSIS SAMPLE (first 500 characters):');
      console.log(analysisResult.content.substring(0, 500) + '...');
      
    } else {
      console.warn('⚠️ No articles available for Mistral analysis test');
    }
    
    // **TEST 3**: Overall System Assessment
    console.log('\n🎯 TEST 3: Overall System Assessment');
    
    const totalTime = Date.now() - startTime;
    const successCriteria = {
      hasArticles: comprehensiveNewsData.articles.length > 0,
      hasGeneralNews: comprehensiveNewsData.breakdown.generalMarket > 0,
      hasCompanyNews: comprehensiveNewsData.breakdown.companySpecific > 0,
      hasPremiumSources: premiumSources.length > 0,
      hasValidDeduplication: companies.length === uniqueCompanies.length,
      meetsMinimumTarget: comprehensiveNewsData.articles.length >= 10,
      fastEnough: totalTime < 30000 // Under 30 seconds
    };
    
    const passedTests = Object.values(successCriteria).filter(Boolean).length;
    const totalTests = Object.keys(successCriteria).length;
    
    console.log('\n✅ SYSTEM PERFORMANCE ASSESSMENT:');
    console.log(`⏱️ Total processing time: ${totalTime}ms`);
    console.log(`📊 Tests passed: ${passedTests}/${totalTests}`);
    console.log(`🎯 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    console.log('\n📋 SUCCESS CRITERIA CHECKLIST:');
    Object.entries(successCriteria).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });
    
    if (passedTests === totalTests) {
      console.log('\n🎉 COMPREHENSIVE SYSTEM TEST: PASSED');
      console.log('✅ Ready for production use with 20-article comprehensive analysis');
    } else {
      console.log('\n⚠️ COMPREHENSIVE SYSTEM TEST: NEEDS ATTENTION');
      console.log('🔧 Some tests failed - review implementation before production use');
    }
    
    // **FINAL SUMMARY**
    console.log('\n' + '=' .repeat(80));
    console.log('📊 FINAL COMPREHENSIVE SYSTEM SUMMARY');
    console.log('=' .repeat(80));
    console.log(`🎯 Articles fetched: ${comprehensiveNewsData.articles.length}/20 target`);
    console.log(`📰 General market: ${comprehensiveNewsData.breakdown.generalMarket}/10`);
    console.log(`🏢 Company-specific: ${comprehensiveNewsData.breakdown.companySpecific}/10`);
    console.log(`📰 Premium sources: ${premiumSources.join(', ')}`);
    console.log(`🏢 Companies covered: ${uniqueCompanies.join(', ')}`);
    console.log(`⏱️ Total time: ${Math.round(totalTime / 1000)}s`);
    console.log(`🎯 System status: ${passedTests === totalTests ? 'READY' : 'NEEDS WORK'}`);
    
  } catch (error) {
    console.error('❌ COMPREHENSIVE SYSTEM TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testComprehensiveSystem().catch(console.error);