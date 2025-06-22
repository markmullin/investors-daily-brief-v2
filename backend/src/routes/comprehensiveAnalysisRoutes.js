/**
 * COMPREHENSIVE ANALYSIS ROUTES
 * Handles 20-article comprehensive analysis (10 general + 10 company-specific)
 * Integrates premium news sources with enhanced Mistral analysis
 */
import express from 'express';
import comprehensiveNewsService from '../services/comprehensiveNewsService.js';
import enhancedMistralAnalysisService from '../services/enhancedMistralAnalysisService.js';

const router = express.Router();

/**
 * MAIN ENDPOINT: Get comprehensive 20-article analysis
 * 10 general market news + 10 company-specific news (max 1 per company)
 * Analyzed by Mistral AI with enhanced prompts
 */
router.get('/comprehensive-analysis', async (req, res) => {
  try {
    console.log('🚀 [COMPREHENSIVE] Starting 20-article comprehensive analysis...');
    console.log('🎯 Target: 10 general + 10 company-specific from premium sources');
    
    // **STEP 1**: Get comprehensive news (20 articles total)
    console.log('📰 Step 1: Fetching comprehensive news...');
    const comprehensiveNewsData = await comprehensiveNewsService.getComprehensiveNews();
    
    const { articles, breakdown } = comprehensiveNewsData;
    
    console.log(`✅ News fetch complete: ${articles.length} total articles`);
    console.log(`   📊 General market: ${breakdown.generalMarket} articles`);
    console.log(`   🏢 Company-specific: ${breakdown.companySpecific} articles`);
    console.log(`   📰 Sources: ${Object.keys(comprehensiveNewsData.sources).join(', ')}`);
    
    // **STEP 2**: Validate we have substantial content
    if (articles.length === 0) {
      console.warn('⚠️ No articles found, returning fallback response');
      return res.json(generateFallbackResponse());
    }
    
    // **STEP 3**: Generate comprehensive analysis with Mistral
    console.log('🤖 Step 2: Generating comprehensive Mistral analysis...');
    let analysisResult = null;
    
    if (enhancedMistralAnalysisService.isReady()) {
      try {
        analysisResult = await enhancedMistralAnalysisService.analyzeComprehensiveMarketNews(comprehensiveNewsData);
        console.log(`✅ Mistral analysis complete: ${analysisResult.content.length} characters`);
        console.log(`   🏢 Companies analyzed: ${analysisResult.companies.length}`);
        console.log(`   📊 Premium sources: ${analysisResult.breakdown.premiumSources.join(', ')}`);
      } catch (mistralError) {
        console.error('❌ Mistral analysis failed:', mistralError.message);
        analysisResult = generateFallbackAnalysisWithNews(articles, breakdown);
      }
    } else {
      console.warn('⚠️ Mistral not available, using enhanced fallback');
      analysisResult = generateFallbackAnalysisWithNews(articles, breakdown);
    }
    
    // **STEP 4**: Format comprehensive response
    const comprehensiveAnalysis = {
      status: 'success',
      analysis: {
        content: analysisResult.content,
        generatedAt: analysisResult.generatedAt,
        model: analysisResult.model,
        analysisType: analysisResult.analysisType,
        dataSource: 'comprehensive_20_article'
      },
      newsBreakdown: {
        totalArticles: articles.length,
        generalMarket: breakdown.generalMarket,
        companySpecific: breakdown.companySpecific,
        targetAchieved: articles.length >= 15 // Success if we get at least 15 articles
      },
      sources: analysisResult.sources || formatSourcesForResponse(articles),
      companies: analysisResult.companies || [],
      premiumSources: analysisResult.breakdown?.premiumSources || [],
      metadata: {
        newsSource: 'comprehensive_fmp_premium',
        sourceBreakdown: comprehensiveNewsData.sources,
        cacheStatus: comprehensiveNewsData.cacheStatus,
        processingTime: Date.now(),
        qualityScore: calculateQualityScore(articles, breakdown)
      }
    };
    
    console.log('✅ [COMPREHENSIVE] Analysis complete!');
    console.log(`📊 Final result: ${articles.length} articles, ${analysisResult.content.length} chars analysis`);
    console.log(`🏢 Companies: ${(analysisResult.companies || []).map(c => c.symbol).join(', ')}`);
    
    return res.json(comprehensiveAnalysis);
    
  } catch (error) {
    console.error('❌ [CRITICAL] Comprehensive analysis failed:', error);
    
    return res.status(500).json({
      status: 'error',
      error: 'Comprehensive analysis temporarily unavailable',
      details: error.message,
      fallback: generateFallbackResponse()
    });
  }
});

/**
 * ENDPOINT: Get just the comprehensive news (without analysis)
 * Useful for testing and debugging the news fetching
 */
router.get('/comprehensive-news', async (req, res) => {
  try {
    console.log('📰 [NEWS ONLY] Fetching comprehensive news for testing...');
    
    const comprehensiveNewsData = await comprehensiveNewsService.getComprehensiveNews();
    
    console.log(`✅ News fetch test complete: ${comprehensiveNewsData.articles.length} articles`);
    
    return res.json({
      status: 'success',
      ...comprehensiveNewsData,
      testMode: true
    });
    
  } catch (error) {
    console.error('❌ News fetch test failed:', error);
    return res.status(500).json({
      status: 'error',
      error: 'News fetch failed',
      details: error.message
    });
  }
});

/**
 * Helper: Generate fallback response when everything fails
 */
function generateFallbackResponse() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  return {
    status: 'fallback',
    analysis: {
      content: `Daily Market Brief for ${currentDate}

**Market Overview:**
Financial markets continue to navigate evolving economic conditions with investors monitoring corporate earnings, monetary policy developments, and global economic indicators. Today's session reflects ongoing assessment of market fundamentals and sector-specific dynamics.

**Investment Implications:**
Current market environment emphasizes diversified portfolio positioning with focus on quality companies demonstrating strong fundamentals. Key investment themes include technology innovation, healthcare advancement, and sustainable growth sectors.

**Key Takeaways:**
• Maintain balanced approach across growth and value opportunities
• Monitor Federal Reserve communications for policy guidance
• Focus on companies with competitive advantages and strong balance sheets  
• Consider sector rotation based on economic cycle positioning
• Implement appropriate risk management strategies

**Risk Assessment:**
Primary considerations include monetary policy uncertainty, geopolitical developments, and evolving economic data. Opportunities exist in quality investments with long-term growth potential and defensive characteristics.

*Comprehensive news analysis temporarily unavailable - premium service will resume shortly.*`,
      generatedAt: new Date().toISOString(),
      model: 'fallback-system',
      analysisType: 'emergency_fallback'
    },
    newsBreakdown: {
      totalArticles: 0,
      generalMarket: 0,
      companySpecific: 0,
      targetAchieved: false
    },
    sources: [],
    companies: [],
    premiumSources: []
  };
}

/**
 * Helper: Generate fallback analysis using actual news data
 */
function generateFallbackAnalysisWithNews(articles, breakdown) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const generalArticles = articles.filter(a => a.category === 'general_market');
  const companyArticles = articles.filter(a => a.category === 'company_specific');
  
  const topGeneralHeadlines = generalArticles.slice(0, 3).map(a => a.title).join('; ');
  const topCompanies = companyArticles.slice(0, 5).map(a => a.companySymbol).join(', ');
  
  return {
    content: `Daily Market Brief for ${currentDate}

**Market Overview:**
Today's market environment reflects ${breakdown.generalMarket} key market developments including: ${topGeneralHeadlines}. These developments are shaping investor sentiment and influencing sector positioning across equity and fixed income markets.

**Investment Implications:**
Analysis of ${breakdown.companySpecific} company-specific developments reveals important themes affecting individual stocks and broader sector trends. Companies in focus include ${topCompanies}, representing diverse market capitalizations and business models driving current investment narratives.

**Key Takeaways:**
• Current news flow emphasizes ${breakdown.generalMarket > 5 ? 'broad market themes' : 'selective stock opportunities'}
• Company developments in ${topCompanies.split(', ').slice(0, 3).join(', ')} highlight sector rotation dynamics
• Premium news sources provide comprehensive coverage of market-moving events
• Balanced approach recommended given ${articles.length} total news developments analyzed
• Focus on quality companies with strong fundamentals and competitive positioning

**Risk Assessment:**
Key risks and opportunities emerge from today's comprehensive news analysis covering ${breakdown.total} total developments. Market participants should monitor ongoing developments in both general market conditions and individual company performance for portfolio positioning guidance.

*Analysis generated using ${breakdown.total} premium news sources. Enhanced AI analysis temporarily unavailable.*`,
    generatedAt: new Date().toISOString(),
    model: 'enhanced-fallback-with-news',
    analysisType: 'fallback_with_real_data',
    breakdown: {
      generalMarketNews: breakdown.generalMarket,
      companySpecificNews: breakdown.companySpecific,
      totalArticles: breakdown.total,
      premiumSources: [...new Set(articles.map(a => a.source))]
    },
    companies: companyArticles.map(a => ({
      symbol: a.companySymbol,
      title: a.title,
      source: a.source
    }))
  };
}

/**
 * Helper: Format sources for response
 */
function formatSourcesForResponse(articles) {
  return articles.map(article => ({
    title: article.title,
    source: article.source,
    url: article.url,
    category: article.category,
    company: article.companySymbol || null,
    priority: article.priority,
    publishedAt: article.publishedAt
  }));
}

/**
 * Helper: Calculate quality score
 */
function calculateQualityScore(articles, breakdown) {
  if (articles.length === 0) return 0;
  
  const targetArticles = 20;
  const actualArticles = articles.length;
  const targetScore = (actualArticles / targetArticles) * 100;
  
  const premiumSources = articles.filter(a => 
    ['Reuters', 'Morningstar', 'MarketWatch'].includes(a.source)
  ).length;
  const premiumScore = (premiumSources / actualArticles) * 100;
  
  const balanceScore = Math.min(breakdown.generalMarket, breakdown.companySpecific) * 10;
  
  return Math.round((targetScore + premiumScore + balanceScore) / 3);
}

export default router;