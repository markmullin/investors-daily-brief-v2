// debugAiRoutes.js - Simple debug routes to identify AI issues
import express from 'express';

const router = express.Router();

/**
 * Simple test endpoint to verify route loading
 */
router.get('/test', (req, res) => {
  console.log('✅ AI test endpoint hit!');
  res.json({
    status: 'success',
    message: 'AI routes are loading correctly!',
    timestamp: new Date().toISOString()
  });
});

/**
 * Debug endpoint to check service status
 */
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 AI debug endpoint hit');
    
    const debug = {
      status: 'success',
      environment: {
        mistralApiKey: Boolean(process.env.MISTRAL_API_KEY),
        braveApiKey: Boolean(process.env.BRAVE_API_KEY),
        useMistralApi: process.env.USE_MISTRAL_API,
        nodeEnv: process.env.NODE_ENV
      },
      services: {
        mistralAttempt: 'not tested',
        newsAttempt: 'not tested'
      },
      timestamp: new Date().toISOString()
    };

    // Test Mistral service import
    try {
      const mistralService = await import('../services/mistralService.js');
      debug.services.mistralImport = 'success';
      debug.services.mistralStatus = mistralService.default.getStatus();
    } catch (error) {
      debug.services.mistralImport = `failed: ${error.message}`;
    }

    // Test news service import  
    try {
      const newsService = await import('../services/premiumNewsService.js');
      debug.services.newsImport = 'success';
      debug.services.newsStatus = newsService.default.getStatus();
    } catch (error) {
      debug.services.newsImport = `failed: ${error.message}`;
    }

    res.json(debug);
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Simple AI analysis without complex services
 */
router.get('/simple-analysis', async (req, res) => {
  try {
    console.log('🤖 Simple AI analysis requested');
    
    // Return a working analysis to test frontend
    const simpleAnalysis = {
      status: 'success',
      type: 'simple-ai-test',
      analysis: {
        content: `**Market Environment Assessment:**
Current market conditions reflect a balanced environment with investors weighing multiple factors including monetary policy developments, corporate earnings trends, and economic data releases.

**Investment Positioning:**
• **Equity Markets**: Favor quality companies with strong balance sheets and consistent cash flow generation
• **Fixed Income**: Monitor yield curve dynamics and duration risk in current rate environment  
• **Diversification**: Maintain balanced exposure across asset classes and geographic regions
• **Risk Management**: Implement systematic position sizing and maintain adequate liquidity reserves

**Key Considerations:**
Market volatility continues to present both challenges and opportunities for disciplined investors. Focus on companies with sustainable competitive advantages and pricing power.

**Strategic Recommendations:**
1. Emphasize quality over growth at any price in current environment
2. Consider dollar-cost averaging for systematic investment approaches
3. Monitor Federal Reserve communications for policy direction signals
4. Maintain 3-6 month expense reserves for financial flexibility

*This analysis represents general market commentary and should not be considered personalized investment advice.*`,
        generatedAt: new Date().toISOString(),
        model: 'simple-test-analysis'
      },
      sources: [
        {
          title: 'Market Environment Analysis',
          source: 'Financial Advisory Framework',
          url: '#',
          publishedTime: new Date().toISOString(),
          priority: 'high'
        },
        {
          title: 'Investment Strategy Guidelines',
          source: 'Advisory Standards',
          url: '#',
          publishedTime: new Date().toISOString(),
          priority: 'medium'
        }
      ],
      metadata: {
        processingTime: 150,
        newsGathered: 2,
        aiProvider: 'simple-test',
        newsProvider: 'test-framework',
        isRealData: false,
        testMode: true
      }
    };

    res.json(simpleAnalysis);
    
  } catch (error) {
    console.error('❌ Simple analysis error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

export default router;
