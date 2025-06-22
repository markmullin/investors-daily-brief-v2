// realAiInsightsRoutes.js - Real AI insights with premium news + Mistral AI
import express from 'express';
import realAiAnalysisService from '../services/realAiAnalysisService.js';
import premiumNewsService from '../services/premiumNewsService.js';

const router = express.Router();

/**
 * Get comprehensive AI market analysis (REAL - no fallbacks)
 * Returns real Mistral AI analysis of premium news sources
 */
router.get('/ai-analysis', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 AI Analysis endpoint hit - generating REAL analysis...');

    // Initialize services if needed
    await realAiAnalysisService.initialize();

    // Generate real AI analysis
    const analysisResult = await realAiAnalysisService.generateMarketAnalysis();

    const response = {
      status: 'success',
      type: 'real-ai-analysis',
      analysis: {
        content: analysisResult.analysis,
        generatedAt: analysisResult.metadata.generatedAt,
        model: analysisResult.metadata.model,
        articlesAnalyzed: analysisResult.metadata.articlesAnalyzed,
        premiumSources: analysisResult.metadata.premiumSources
      },
      sources: analysisResult.sources,
      metadata: {
        processingTime: Date.now() - startTime,
        newsGathered: analysisResult.sources.length,
        aiProvider: 'mistral-ai',
        newsProvider: 'brave-api-puppeteer',
        isRealData: true,
        noFallbacks: true
      }
    };

    console.log(`✅ Real AI analysis generated in ${Date.now() - startTime}ms`);
    res.json(response);

  } catch (error) {
    console.error('❌ Real AI analysis failed:', error);
    
    // NO FALLBACKS - return error as requested by user
    res.status(500).json({
      status: 'error',
      error: 'Real AI analysis failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      note: 'No fallback data provided as requested - fix required'
    });
  }
});

/**
 * Get AI market insights for specific topics (REAL)
 */
router.get('/topic-insights/:topic', async (req, res) => {
  const startTime = Date.now();
  const { topic } = req.params;
  
  try {
    console.log(`🎯 Topic insights requested for: ${topic}`);

    const insights = await realAiAnalysisService.generateTopicInsights(topic);

    res.json({
      status: 'success',
      type: 'topic-insights',
      topic: insights.topic,
      content: insights.insights,
      sources: insights.sources,
      generatedAt: insights.generatedAt,
      metadata: {
        processingTime: Date.now() - startTime,
        sourcesUsed: insights.sources.length,
        isRealData: true
      }
    });

  } catch (error) {
    console.error(`❌ Topic insights failed for ${topic}:`, error);
    
    res.status(500).json({
      status: 'error',
      error: 'Topic insights failed',
      topic,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get premium news sources (used by AI analysis)
 */
router.get('/premium-news', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📰 Premium news requested...');

    const { topics } = req.query;
    const searchTopics = topics ? topics.split(',') : ['stock market', 'federal reserve', 'economic data'];

    const premiumArticles = await premiumNewsService.gatherPremiumNews(searchTopics);

    res.json({
      status: 'success',
      type: 'premium-news',
      articles: premiumArticles,
      metadata: {
        articlesFound: premiumArticles.length,
        searchTopics,
        premiumSources: [...new Set(premiumArticles.map(a => a.source))],
        processingTime: Date.now() - startTime,
        gatheredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Premium news gathering failed:', error);
    
    res.status(500).json({
      status: 'error',
      error: 'Premium news gathering failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Service status endpoint
 */
router.get('/status', async (req, res) => {
  try {
    const status = realAiAnalysisService.getStatus();
    
    res.json({
      status: 'success',
      services: {
        aiAnalysis: status.initialized,
        mistralAI: status.mistralStatus,
        premiumNews: status.newsServiceStatus
      },
      environment: {
        mistralApiKey: Boolean(process.env.MISTRAL_API_KEY),
        braveApiKey: Boolean(process.env.BRAVE_API_KEY),
        useMistralApi: process.env.USE_MISTRAL_API === 'true'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Status check failed',
      message: error.message
    });
  }
});

/**
 * Health check for AI services
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      aiAnalysis: false,
      mistralAI: false,
      premiumNews: false
    };

    // Check AI analysis service
    try {
      const status = realAiAnalysisService.getStatus();
      health.aiAnalysis = status.initialized;
      health.mistralAI = status.mistralStatus.initialized;
      health.premiumNews = status.newsServiceStatus.initialized;
    } catch (e) {
      console.error('Health check error:', e);
    }

    const overallHealth = Object.values(health).every(h => h);

    res.status(overallHealth ? 200 : 503).json({
      status: overallHealth ? 'healthy' : 'degraded',
      services: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Health check failed',
      message: error.message
    });
  }
});

export default router;
