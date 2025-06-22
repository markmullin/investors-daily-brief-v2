// Enhanced Current Events AI Routes with REAL news summaries and market impact analysis
// Modified to avoid route conflicts with premium AI analysis
import express from 'express';
import mistralService from '../services/mistralService.js';
import braveSearchService from '../services/braveSearchService.js';
import newsContentExtractor from '../services/newsContentExtractor.js';

const router = express.Router();

/**
 * GET /api/ai/current-events
 * Enhanced AI-powered current events analysis with REAL news summaries and market impact
 * (Changed from /ai-analysis to avoid conflict with premium routes)
 */
router.get('/current-events', async (req, res) => {
  try {
    console.log('🤖 Generating comprehensive Daily Market Brief with real news summaries...');
    
    // Get the daily market brief with full news summaries
    const marketBrief = await newsContentExtractor.getDailyMarketBrief();
    
    if (marketBrief.error) {
      console.error('❌ Failed to generate market brief');
      return res.json({
        status: 'error',
        error: 'Unable to fetch current market news',
        analysis: {
          content: 'Unable to fetch current market news. Please check API configuration.',
          generatedAt: new Date().toISOString(),
          dataSource: 'error'
        },
        sources: [],
        marketData: {
          environmentScore: 0,
          marketPhase: 'Error'
        }
      });
    }
    
    // Format the comprehensive analysis with actual news summaries
    const analysisContent = formatComprehensiveAnalysis(marketBrief);
    
    // Try to enhance with AI if available
    let finalAnalysis = analysisContent;
    let analysisSource = 'comprehensive-extraction';
    
    if (mistralService.isReady() && marketBrief.topStories.length > 0) {
      try {
        console.log('🤖 Enhancing analysis with Mistral AI...');
        
        const aiPrompt = `Based on these current market developments, provide additional strategic insights for investors:

${marketBrief.topStories.slice(0, 3).map((story, i) => 
  `${i + 1}. ${story.title}\nSummary: ${story.summary}\nMarket Impact: ${story.marketImpact}`
).join('\n\n')}

Provide 2-3 paragraphs of additional strategic analysis focusing on:
1. How these events connect and their combined market implications
2. Specific trading strategies or positioning recommendations
3. Key risks and opportunities for the rest of the trading day/week`;

        const aiEnhancement = await mistralService.generateText(aiPrompt, {
          temperature: 0.3,
          maxTokens: 800
        });
        
        // Append AI insights to the analysis
        finalAnalysis = analysisContent + '\n\n**Strategic Investment Insights:**\n' + aiEnhancement;
        analysisSource = 'ai-enhanced';
        
      } catch (aiError) {
        console.warn('AI enhancement failed, using comprehensive extraction only');
      }
    }
    
    // Format the response
    const response = {
      status: 'success',
      analysis: {
        content: finalAnalysis,
        generatedAt: marketBrief.timestamp,
        dataSource: 'real_news_extraction',
        analysisSource: analysisSource
      },
      sources: marketBrief.topStories.map(story => ({
        source: story.source,
        title: story.title,
        url: story.url,
        publishedDate: story.timestamp
      })),
      marketData: {
        eventsAnalyzed: marketBrief.topStories.length,
        qualitySources: marketBrief.sources.length,
        analysisMethod: analysisSource,
        sectorsInFocus: marketBrief.sectorsToWatch.map(s => s.sector)
      }
    };
    
    console.log('✅ Comprehensive Daily Market Brief generated successfully');
    return res.json(response);
    
  } catch (error) {
    console.error('❌ Daily Market Brief generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate daily market brief',
      details: error.message
    });
  }
});

/**
 * Format comprehensive analysis from market brief data
 */
function formatComprehensiveAnalysis(marketBrief) {
  const { date, topStories, sources, marketOverview, sectorsToWatch } = marketBrief;
  
  let analysis = `**Daily Market Brief for ${date}**\n\n`;
  
  // Market Overview
  analysis += `**Market Environment Update:** ${marketOverview}\n\n`;
  
  // Top News Stories with Summaries
  analysis += `**Today's Top Market-Moving Stories:**\n\n`;
  
  topStories.forEach((story, index) => {
    analysis += `**${index + 1}. ${story.title}**\n`;
    analysis += `*Source: ${story.source} | ${story.timestamp}*\n\n`;
    analysis += `**Summary:** ${story.summary}\n\n`;
    analysis += `**Market Impact:** ${story.marketImpact}\n\n`;
    analysis += `**Affected Sectors:** ${story.sectors.join(', ')}\n\n`;
    analysis += `---\n\n`;
  });
  
  // Sector Analysis
  if (sectorsToWatch.length > 0) {
    analysis += `**Sectors to Watch:**\n`;
    sectorsToWatch.forEach(sector => {
      analysis += `- **${sector.sector}** (${sector.importance} importance): Featured in ${sector.newsCount} major stories\n`;
    });
    analysis += `\n`;
  }
  
  // Risk Assessment
  analysis += `**Risk Assessment and Investment Strategy:**\n`;
  analysis += `Today's news flow from ${sources.join(', ')} indicates `;
  
  // Analyze sentiment from market impacts
  const impacts = topStories.map(s => s.marketImpact.toLowerCase()).join(' ');
  let sentiment = 'mixed';
  
  if (impacts.includes('positive') || impacts.includes('bullish') || impacts.includes('growth')) {
    sentiment = 'cautiously optimistic';
  } else if (impacts.includes('negative') || impacts.includes('bearish') || impacts.includes('decline')) {
    sentiment = 'defensive';
  } else if (impacts.includes('volatility') || impacts.includes('uncertainty')) {
    sentiment = 'heightened caution';
  }
  
  analysis += `${sentiment} market sentiment. `;
  
  // Provide actionable insights
  analysis += `Key considerations for investors today include:\n\n`;
  
  // Fed/Rate considerations
  if (impacts.includes('fed') || impacts.includes('rate')) {
    analysis += `• **Monetary Policy Impact**: Federal Reserve developments suggest potential shifts in interest rate expectations. Consider adjusting duration exposure and reviewing positions in rate-sensitive sectors.\n`;
  }
  
  // Earnings considerations
  if (impacts.includes('earnings')) {
    analysis += `• **Earnings Season Dynamics**: Corporate earnings reports are driving individual stock movements. Focus on companies with strong fundamentals and positive guidance.\n`;
  }
  
  // Volatility considerations
  if (impacts.includes('volatility')) {
    analysis += `• **Volatility Management**: Increased market volatility suggests using appropriate position sizing and considering hedging strategies for portfolio protection.\n`;
  }
  
  // Sector rotation
  if (sectorsToWatch.length > 2) {
    analysis += `• **Sector Rotation Opportunities**: Multiple sectors showing significant news flow. Consider tactical allocation adjustments based on sector-specific developments.\n`;
  }
  
  analysis += `\n**Bottom Line:** `;
  analysis += `Today's market narrative is dominated by ${topStories.length > 3 ? 'multiple significant developments' : 'key developments'} `;
  analysis += `that require active monitoring. Investors should ${sentiment === 'defensive' ? 'maintain defensive positioning' : sentiment === 'cautiously optimistic' ? 'look for selective opportunities' : 'stay nimble'} `;
  analysis += `while keeping a close eye on ${sectorsToWatch[0]?.sector || 'broad market'} developments.`;
  
  return analysis;
}

/**
 * GET /api/ai/news-summary
 * Get just the news summaries without full analysis
 */
router.get('/news-summary', async (req, res) => {
  try {
    console.log('📰 Fetching news summaries...');
    
    const marketBrief = await newsContentExtractor.getDailyMarketBrief();
    
    if (marketBrief.error) {
      return res.status(500).json({
        error: 'Failed to fetch news summaries',
        details: 'Unable to retrieve current market news'
      });
    }
    
    // Return just the news summaries
    return res.json({
      status: 'success',
      date: marketBrief.date,
      timestamp: marketBrief.timestamp,
      stories: marketBrief.topStories,
      sources: marketBrief.sources,
      sectorsInFocus: marketBrief.sectorsToWatch
    });
    
  } catch (error) {
    console.error('❌ News summary error:', error);
    return res.status(500).json({
      error: 'Failed to fetch news summaries',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/analyze-article
 * Analyze a specific article URL
 */
router.post('/analyze-article', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required'
      });
    }
    
    console.log(`📰 Analyzing article: ${url}`);
    
    // Search for the article
    const searchResults = await braveSearchService.search(`"${url}"`, {
      count: 5,
      searchType: 'web'
    });
    
    if (!searchResults?.web?.results || searchResults.web.results.length === 0) {
      return res.status(404).json({
        error: 'Article not found'
      });
    }
    
    // Find the matching result
    const article = searchResults.web.results.find(r => r.url === url) || searchResults.web.results[0];
    
    // Enrich and analyze
    const enriched = await newsContentExtractor.enrichArticlesWithContent([{
      title: article.title,
      url: article.url,
      snippet: article.description,
      source: newsContentExtractor.extractSourceName(article.url),
      age: article.age || 'Today'
    }]);
    
    const summaries = await newsContentExtractor.generateNewsSummaries(enriched);
    
    return res.json({
      status: 'success',
      analysis: summaries[0] || null
    });
    
  } catch (error) {
    console.error('❌ Article analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze article',
      details: error.message
    });
  }
});

export default router;