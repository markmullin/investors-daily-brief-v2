/**
 * ENHANCED OPTIMIZED NEWS ROUTES
 * Tests and serves the enhanced 16-article optimized news mix
 * Fixed: Social sentiment data + Company diversification
 */
import express from 'express';
import enhancedOptimizedFmpNewsService from '../services/enhancedOptimizedFmpNewsService.js';

const router = express.Router();

/**
 * MAIN ENDPOINT: Get Enhanced Optimized 16-Article News Mix
 * Includes fixes for social sentiment and company diversification
 */
router.get('/enhanced-optimal-mix', async (req, res) => {
  try {
    console.log('🎯 [ENHANCED NEWS] Fetching enhanced optimal 16-article news mix...');
    
    const result = await enhancedOptimizedFmpNewsService.getOptimalNewsMix();
    
    console.log(`✅ [ENHANCED NEWS] Enhanced optimal mix complete: ${result.summary.totalArticles}/16 articles`);
    console.log(`📊 Company diversity: ${result.summary.companyDiversity.uniqueCompanies} unique companies`);
    console.log(`📊 Sector diversity: ${result.summary.sectorDiversity.sectorsRepresented} sectors`);
    
    res.json({
      status: 'success',
      newsType: 'enhanced_optimal_16_article_mix',
      ...result,
      enhanced: true,
      fixes: {
        socialSentiment: 'Multi-endpoint strategy with fallbacks',
        companyDiversification: '1 company per article + sector diversity',
        legalFiltering: 'Enhanced keyword patterns'
      }
    });
    
  } catch (error) {
    console.error('❌ [ENHANCED NEWS] Enhanced optimal mix failed:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Enhanced optimal mix failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * TEST ENDPOINT: Test Just Company Diversification
 */
router.get('/test-company-diversification', async (req, res) => {
  try {
    console.log('🏢 [TEST] Testing company diversification fix...');
    
    const companyNews = await enhancedOptimizedFmpNewsService.getFixedDiversifiedStockNews(4);
    
    const diversityAnalysis = {
      totalArticles: companyNews.length,
      companies: companyNews.map(article => ({
        symbol: article.symbol,
        sector: article.sector,
        title: article.title
      })),
      uniqueCompanies: [...new Set(companyNews.map(a => a.symbol))],
      uniqueSectors: [...new Set(companyNews.map(a => a.sector))],
      hasDuplicateCompanies: companyNews.length !== [...new Set(companyNews.map(a => a.symbol))].length
    };
    
    console.log(`✅ [TEST] Company diversification test complete`);
    console.log(`📊 ${diversityAnalysis.uniqueCompanies.length} unique companies across ${diversityAnalysis.uniqueSectors.length} sectors`);
    
    res.json({
      status: 'success',
      testType: 'company_diversification',
      articles: companyNews,
      analysis: diversityAnalysis,
      fixed: !diversityAnalysis.hasDuplicateCompanies
    });
    
  } catch (error) {
    console.error('❌ [TEST] Company diversification test failed:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Company diversification test failed',
      details: error.message
    });
  }
});

/**
 * TEST ENDPOINT: Test Just Social Sentiment Fix
 */
router.get('/test-social-sentiment', async (req, res) => {
  try {
    console.log('📱 [TEST] Testing social sentiment fix...');
    
    const sentimentResult = await enhancedOptimizedFmpNewsService.getFixedSocialSentiment(1);
    
    const sentimentAnalysis = {
      found: sentimentResult.length > 0,
      article: sentimentResult[0] || null,
      dataPoints: sentimentResult[0]?.dataPoints || 0,
      method: sentimentResult[0]?.method || 'none',
      sentimentScore: sentimentResult[0]?.sentimentScore || null,
      qualityScore: sentimentResult[0]?.qualityScore || 0
    };
    
    console.log(`✅ [TEST] Social sentiment test complete`);
    console.log(`📊 Found: ${sentimentAnalysis.found}, Method: ${sentimentAnalysis.method}, Data points: ${sentimentAnalysis.dataPoints}`);
    
    res.json({
      status: 'success',
      testType: 'social_sentiment',
      result: sentimentResult,
      analysis: sentimentAnalysis,
      fixed: sentimentAnalysis.found && sentimentAnalysis.dataPoints > 0
    });
    
  } catch (error) {
    console.error('❌ [TEST] Social sentiment test failed:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Social sentiment test failed',
      details: error.message
    });
  }
});

/**
 * TEST ENDPOINT: Test Legal Filtering Enhancement
 */
router.get('/test-legal-filtering', async (req, res) => {
  try {
    console.log('🚫 [TEST] Testing enhanced legal filtering...');
    
    const pressReleases = await enhancedOptimizedFmpNewsService.getFilteredSP500PressReleases(5);
    
    const filteringAnalysis = {
      cleanReleases: pressReleases.length,
      allFiltered: pressReleases.every(release => release.filtered === true),
      releases: pressReleases.map(release => ({
        symbol: release.symbol,
        title: release.title.substring(0, 80) + '...',
        source: release.source
      }))
    };
    
    console.log(`✅ [TEST] Legal filtering test complete`);
    console.log(`📊 ${filteringAnalysis.cleanReleases} clean press releases found`);
    
    res.json({
      status: 'success',
      testType: 'legal_filtering',
      releases: pressReleases,
      analysis: filteringAnalysis,
      enhanced: true
    });
    
  } catch (error) {
    console.error('❌ [TEST] Legal filtering test failed:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Legal filtering test failed',
      details: error.message
    });
  }
});

/**
 * UTILITY ENDPOINT: Clear Enhanced News Cache
 */
router.post('/clear-cache', async (req, res) => {
  try {
    console.log('🧹 [CACHE] Clearing enhanced news cache...');
    
    enhancedOptimizedFmpNewsService.clearCache();
    
    console.log('✅ [CACHE] Enhanced news cache cleared');
    
    res.json({
      status: 'success',
      message: 'Enhanced news cache cleared',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [CACHE] Clear cache failed:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Clear cache failed',
      details: error.message
    });
  }
});

/**
 * COMPARISON ENDPOINT: Compare Original vs Enhanced
 */
router.get('/compare-versions', async (req, res) => {
  try {
    console.log('⚖️ [COMPARE] Comparing original vs enhanced versions...');
    
    // Import original service
    const originalOptimizedFmpNewsService = await import('../services/optimizedFmpNewsService.js');
    
    const [enhancedResult, originalResult] = await Promise.allSettled([
      enhancedOptimizedFmpNewsService.getOptimalNewsMix(),
      originalOptimizedFmpNewsService.default.getOptimalNewsMix()
    ]);
    
    const comparison = {
      enhanced: {
        status: enhancedResult.status,
        articles: enhancedResult.value?.summary?.totalArticles || 0,
        companyDiversity: enhancedResult.value?.summary?.companyDiversity?.uniqueCompanies || 0,
        sectorDiversity: enhancedResult.value?.summary?.sectorDiversity?.sectorsRepresented || 0,
        socialSentiment: enhancedResult.value?.summary?.breakdown?.socialSentiment || 0
      },
      original: {
        status: originalResult.status,
        articles: originalResult.value?.summary?.totalArticles || 0,
        companyDiversity: originalResult.value?.summary?.companyDiversity?.uniqueCompanies || 0,
        sectorDiversity: originalResult.value?.summary?.sectorDiversity?.sectorsRepresented || 0,
        socialSentiment: originalResult.value?.summary?.breakdown?.socialSentiment || 0
      }
    };
    
    console.log(`✅ [COMPARE] Comparison complete`);
    console.log(`📊 Enhanced: ${comparison.enhanced.articles} articles, ${comparison.enhanced.companyDiversity} companies`);
    console.log(`📊 Original: ${comparison.original.articles} articles, ${comparison.original.companyDiversity} companies`);
    
    res.json({
      status: 'success',
      comparison,
      improvements: {
        companyDiversification: comparison.enhanced.companyDiversity > comparison.original.companyDiversity,
        sectorDiversification: comparison.enhanced.sectorDiversity > comparison.original.sectorDiversity,
        socialSentimentWorking: comparison.enhanced.socialSentiment > comparison.original.socialSentiment
      }
    });
    
  } catch (error) {
    console.error('❌ [COMPARE] Comparison failed:', error.message);
    res.status(500).json({
      status: 'error',
      error: 'Comparison failed',
      details: error.message
    });
  }
});

export default router;
