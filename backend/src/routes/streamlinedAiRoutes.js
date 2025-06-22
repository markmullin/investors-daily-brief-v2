/**
 * PREMIUM AI ROUTES - FIXED MISTRAL INITIALIZATION
 * Ensures Mistral AI is properly initialized for production use
 */
import express from 'express';
import mistralService from '../services/mistralService.js';
import premiumFmpNewsService from '../services/premiumFmpNewsService.js';

const router = express.Router();

// Initialize Mistral on module load
console.log('🤖 [INIT] Initializing Mistral AI service for premium routes...');
mistralService.initialize().then(success => {
  if (success) {
    console.log('✅ [INIT] Mistral AI initialized successfully for premium routes');
  } else {
    console.log('❌ [INIT] Mistral AI initialization failed for premium routes');
  }
}).catch(error => {
  console.error('❌ [INIT] Mistral AI initialization error:', error.message);
});

/**
 * PREMIUM: Daily Market Brief - Natural AI Synthesis with Fixed Initialization
 */
router.get('/ai-analysis', async (req, res) => {
  console.log('🚀 [PREMIUM] Starting natural AI synthesis from premium sources...');
  
  const startTime = Date.now();
  
  try {
    // STEP 1: Get premium financial news with FULL content
    console.log('📰 [PREMIUM] Getting premium financial news with full content...');
    const newsResult = await Promise.race([
      premiumFmpNewsService.getPremiumFinancialNews(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Premium news service timeout')), 12000)
      )
    ]);
    
    const newsTime = Date.now() - startTime;
    console.log(`✅ [PREMIUM] News retrieved in ${newsTime}ms: ${newsResult.articles.length} articles`);
    console.log(`📊 [QUALITY] Score: ${newsResult.qualityScore}/10`);
    
    // STEP 2: Ensure Mistral is ready and synthesize content
    console.log('🤖 [MISTRAL AI] Checking Mistral service status...');
    
    let briefContent = null;
    let analysisSource = 'premium-synthesis-failed';
    
    // Force Mistral initialization if not ready
    if (!mistralService.isReady()) {
      console.log('🔄 [MISTRAL] Service not ready, forcing initialization...');
      const initSuccess = await mistralService.initialize(true); // Force reinitialize
      
      if (!initSuccess) {
        console.error('❌ [MISTRAL] Failed to initialize even after force attempt');
        const status = mistralService.getStatus();
        console.error('📊 [MISTRAL] Status:', JSON.stringify(status, null, 2));
      }
    }
    
    // Try Mistral synthesis with better error handling
    if (mistralService.isReady()) {
      try {
        console.log('✅ [MISTRAL] Service ready, creating synthesis prompt...');
        const prompt = createNaturalSynthesisPrompt(newsResult.articles);
        console.log(`📝 [PROMPT] Created synthesis prompt: ${prompt.length} characters`);
        
        console.log('🤖 [MISTRAL] Generating natural synthesis...');
        briefContent = await Promise.race([
          mistralService.generateText(prompt, {
            temperature: 0.3,
            maxTokens: 1200
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Mistral AI generation timeout')), 25000) // Longer timeout
          )
        ]);
        
        if (briefContent && briefContent.length > 100) {
          analysisSource = 'mistral-ai-synthesis';
          console.log(`✅ [MISTRAL AI] Natural synthesis completed: ${briefContent.length} characters`);
        } else {
          throw new Error('Invalid or empty Mistral response');
        }
        
      } catch (aiError) {
        console.error('❌ [MISTRAL AI] Synthesis failed:', aiError.message);
        console.error('📊 [MISTRAL] Service status:', JSON.stringify(mistralService.getStatus(), null, 2));
        briefContent = generateMinimalFallback(newsResult.articles);
        analysisSource = 'mistral-error-fallback';
      }
    } else {
      console.error('❌ [MISTRAL] Service not ready after initialization attempts');
      const status = mistralService.getStatus();
      console.error('📊 [MISTRAL] Final status:', JSON.stringify(status, null, 2));
      briefContent = generateMinimalFallback(newsResult.articles);
      analysisSource = 'mistral-not-ready';
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ [COMPLETE] Analysis completed in ${totalTime}ms with source: ${analysisSource}`);
    
    // STEP 3: Return response with detailed debugging info
    const response = {
      status: 'success',
      analysis: {
        content: briefContent,
        generatedAt: new Date().toISOString(),
        briefType: 'premium_natural_synthesis',
        newsArticlesUsed: newsResult.articles.length,
        qualityScore: newsResult.qualityScore,
        minimumQuality: newsResult.minimumQuality,
        analysisSource: analysisSource,
        processingTime: totalTime,
        aiModel: analysisSource.includes('mistral') ? 'Mistral AI' : 'Fallback',
        newsProvider: 'Premium FMP Sources (Natural Synthesis)',
        synthesisType: 'natural_paragraphs',
        // Debug info
        mistralStatus: mistralService.getStatus(),
        mistralReady: mistralService.isReady()
      },
      sources: newsResult.articles.map(article => ({
        source: article.source,
        title: article.title,
        sourceType: article.sourceType,
        qualityRating: article.qualityRating,
        qualityScore: article.qualityScore,
        url: article.url,
        publishedDate: article.publishedAt,
        contentLength: (article.description || '').length
      })),
      premiumMetadata: {
        focus: 'natural_synthesis_premium_sources',
        qualityThreshold: 8,
        sourceTypes: newsResult.sourceTypes,
        newsQuality: newsResult.qualityScore,
        synthesisMethod: analysisSource,
        fullContentUsed: true
      }
    };
    
    console.log(`✅ [SUCCESS] Premium Brief completed in ${totalTime}ms`);
    return res.json(response);
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ [ERROR] Premium synthesis failed after ${errorTime}ms:`, error.message);
    console.error('📊 [ERROR] Stack:', error.stack);
    
    // Emergency response with debugging info
    const emergencyResponse = {
      status: 'error',
      analysis: {
        content: generateEmergencyContent(),
        generatedAt: new Date().toISOString(),
        briefType: 'emergency_response',
        analysisSource: 'emergency-fallback',
        processingTime: errorTime,
        aiModel: 'Emergency',
        newsProvider: 'Emergency Service',
        error: error.message,
        mistralStatus: mistralService.getStatus()
      },
      sources: [],
      premiumMetadata: {
        focus: 'emergency_response',
        qualityThreshold: 0,
        emergency: true,
        reason: error.message
      }
    };
    
    return res.json(emergencyResponse);
  }
});

/**
 * Create natural synthesis prompt for Mistral AI
 */
function createNaturalSynthesisPrompt(articles) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  
  // Prepare FULL article content for Mistral
  const fullNewsContent = articles.map((article, i) => 
    `SOURCE ${i + 1}: ${article.source}
HEADLINE: ${article.title}
FULL CONTENT: ${article.description}

---`
  ).join('\n\n');
  
  return `You are a senior financial analyst writing a Daily Market Brief for ${currentDate}.

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
}

/**
 * Generate minimal fallback when Mistral fails
 */
function generateMinimalFallback(articles) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  
  const sources = [...new Set(articles.map(a => a.source))];
  
  // Extract actual content themes from articles
  const articleContent = articles.map(a => a.description.toLowerCase()).join(' ');
  const titleContent = articles.map(a => a.title.toLowerCase()).join(' ');
  
  let marketTheme = 'mixed conditions';
  if (titleContent.includes('market') && titleContent.includes('week')) {
    marketTheme = 'weekly market developments';
  }
  if (articleContent.includes('earnings') || titleContent.includes('eps')) {
    marketTheme = 'corporate earnings developments';
  }
  if (articleContent.includes('fed') || articleContent.includes('rate')) {
    marketTheme = 'monetary policy considerations';
  }
  if (titleContent.includes('crypto') || titleContent.includes('bitcoin')) {
    marketTheme = 'cryptocurrency market developments';
  }
  
  return `Financial markets for ${currentDate} reflect ongoing developments across ${marketTheme} as institutional investors evaluate current conditions. Analysis from premium sources including ${sources.join(', ')} indicates market participants are navigating evolving economic conditions with continued focus on fundamental analysis and risk management strategies.

Today's market environment shows investors maintaining disciplined approaches while monitoring key developments in corporate performance, monetary policy direction, and economic indicators. Professional analysis from leading financial sources emphasizes the importance of quality company fundamentals and appropriate portfolio positioning in the current market environment.

Looking ahead, market participants continue to focus on economic data releases, corporate earnings trends, and policy developments that may influence investment conditions. Investors are advised to maintain diversified positioning while monitoring key market indicators and maintaining appropriate risk management protocols during the current period.

This analysis is based on premium financial sources but represents structured insights due to AI service configuration. For enhanced market analysis, please verify that all AI services are properly configured and operational.`;
}

/**
 * Generate emergency content when everything fails
 */
function generateEmergencyContent() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  
  return `Daily Market Brief for ${currentDate}

Market analysis services are currently experiencing technical difficulties. The premium news sources are functioning properly, but AI synthesis capabilities require attention.

To receive current market analysis, please:
1. Verify Mistral AI service configuration
2. Check API key settings
3. Restart backend services if needed

For immediate market insights, please visit premium financial sources directly such as MarketWatch, Seeking Alpha, or other professional financial news providers.

Technical Status: Premium news aggregation operational, AI synthesis service requires configuration review.`;
}

export default router;