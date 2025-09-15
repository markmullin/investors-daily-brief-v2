console.log('📊📊📊 EARNINGS ROUTES FILE IS BEING LOADED 📊📊📊');

/**
 * EARNINGS ANALYSIS ROUTES
 * 
 * Comprehensive earnings transcript analysis with AI-powered insights
 * Features:
 * - Past 12 quarterly transcripts
 * - AI sentiment analysis and theme extraction
 * - Management tone analysis
 * - Investment themes for stock discovery
 * - Next earnings dates and estimates
 */

import express from 'express';
import fmpService from '../services/fmpService.js';
import earningsAnalysisService from '../services/earningsAnalysisService.js';

const router = express.Router();

/**
 * Get earnings transcripts for a stock
 * GET /api/research/earnings/:symbol/transcripts
 * 
 * Returns past 12 quarterly earnings transcripts with metadata
 */
router.get('/:symbol/transcripts', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`🎤 [EARNINGS API] Getting transcripts for ${symbol}...`);
    
    // Get transcripts from FMP - using correct method name
    const transcripts = await fmpService.getEarningsCallTranscripts(symbol.toUpperCase(), 12);
    
    // Format response
    const response = {
      symbol: symbol.toUpperCase(),
      transcripts: transcripts,
      totalCount: transcripts.length,
      availableCount: transcripts.filter(t => t.content && t.content.length > 0).length,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`✅ [EARNINGS API] Returning ${transcripts.length} transcripts for ${symbol}`);
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [EARNINGS API] Error getting transcripts for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to retrieve earnings transcripts',
      message: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * Get comprehensive AI analysis of earnings transcripts
 * GET /api/research/earnings/:symbol/analysis
 * 
 * Returns AI-powered analysis including sentiment, themes, and insights
 */
router.get('/:symbol/analysis', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { refresh } = req.query;
    
    console.log(`🧠 [EARNINGS API] Getting AI analysis for ${symbol}...`);
    
    // Clear cache if refresh requested
    if (refresh === 'true') {
      await earningsAnalysisService.clearCache(symbol.toUpperCase());
    }
    
    // Get comprehensive AI analysis
    const analysis = await earningsAnalysisService.analyzeEarningsTranscripts(symbol.toUpperCase());
    
    console.log(`✅ [EARNINGS API] AI analysis complete for ${symbol} - ${analysis.transcriptAnalyses.length} transcripts analyzed`);
    res.json(analysis);
    
  } catch (error) {
    console.error(`❌ [EARNINGS API] Error in AI analysis for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to analyze earnings transcripts',
      message: error.message,
      symbol: req.params.symbol,
      analysisStatus: 'failed'
    });
  }
});

/**
 * Get sentiment trends across quarters
 * GET /api/research/earnings/:symbol/sentiment-trends
 * 
 * Returns management sentiment trends over time
 */
router.get('/:symbol/sentiment-trends', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📈 [EARNINGS API] Getting sentiment trends for ${symbol}...`);
    
    // Get analysis data (cached if available)
    const analysis = await earningsAnalysisService.getCachedAnalysis(symbol.toUpperCase());
    
    if (!analysis) {
      // If no cached analysis, trigger fresh analysis
      const freshAnalysis = await earningsAnalysisService.analyzeEarningsTranscripts(symbol.toUpperCase());
      res.json({ sentimentTrend: freshAnalysis.sentimentTrend });
    } else {
      res.json({ sentimentTrend: analysis.sentimentTrend });
    }
    
  } catch (error) {
    console.error(`❌ [EARNINGS API] Error getting sentiment trends for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to retrieve sentiment trends',
      message: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * Get key themes for stock discovery
 * GET /api/research/earnings/:symbol/key-themes
 * 
 * Returns AI-extracted themes that can be used for investment discovery
 * This is the core feature for theme-based stock discovery!
 */
router.get('/:symbol/key-themes', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`🎯 [EARNINGS API] Extracting investment themes for ${symbol}...`);
    
    // Get or generate analysis
    let analysis = await earningsAnalysisService.getCachedAnalysis(symbol.toUpperCase());
    
    if (!analysis) {
      analysis = await earningsAnalysisService.analyzeEarningsTranscripts(symbol.toUpperCase());
    }
    
    // Extract themes from all transcript analyses
    const allThemes = [];
    
    if (analysis.transcriptAnalyses && analysis.transcriptAnalyses.length > 0) {
      analysis.transcriptAnalyses.forEach(transcript => {
        if (transcript.keyThemes) {
          transcript.keyThemes.forEach(theme => {
            allThemes.push({
              ...theme,
              quarter: transcript.quarter,
              date: transcript.date,
              source: 'earnings_transcript'
            });
          });
        }
      });
    }
    
    // Group and rank themes for discovery
    const themeMap = new Map();
    
    allThemes.forEach(theme => {
    const key = theme.theme.toLowerCase();
    if (themeMap.has(key)) {
    const existing = themeMap.get(key);
    existing.mentions += 1;
    existing.quarters.push(theme.quarter);
    existing.recentMention = Math.max(existing.recentMention, new Date(theme.date).getTime());
    } else {
    themeMap.set(key, {
    theme: theme.theme,
    explanation: theme.explanation,
    sentiment: theme.sentiment,
    importance: theme.importance,
    mentions: 1,
    quarters: [theme.quarter],
    recentMention: new Date(theme.date).getTime(),
    discoveryTags: extractDiscoveryTags(theme.theme, theme.explanation)
    });
    }
    });
    
    // Convert to array and sort by relevance for discovery
    const rankedThemes = Array.from(themeMap.values())
      .sort((a, b) => {
        // Sort by: importance, recency, mentions
        const importanceScore = { high: 3, medium: 2, low: 1 };
        const aScore = (importanceScore[a.importance] || 1) * 100 + a.mentions * 10 + (a.recentMention / 1000000000);
        const bScore = (importanceScore[b.importance] || 1) * 100 + b.mentions * 10 + (b.recentMention / 1000000000);
        return bScore - aScore;
      });
    
    const response = {
      symbol: symbol.toUpperCase(),
      keyThemes: {
        recent: rankedThemes.slice(0, 8), // Top 8 most relevant themes
        all: rankedThemes,
        totalThemes: rankedThemes.length,
        byCategory: categorizeThemes(rankedThemes),
        discoveryTags: extractAllDiscoveryTags(rankedThemes)
      },
      lastUpdated: analysis.lastUpdated
    };
    
    console.log(`✅ [EARNINGS API] Extracted ${rankedThemes.length} investment themes for ${symbol}`);
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [EARNINGS API] Error extracting themes for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to extract investment themes',
      message: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * Get next earnings date and estimates
 * GET /api/research/earnings/:symbol/next-earnings
 * 
 * Returns upcoming earnings date and analyst estimates
 */
router.get('/:symbol/next-earnings', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📅 [EARNINGS API] Getting next earnings for ${symbol}...`);
    
    // Get next earnings and estimates in parallel
    const [nextEarnings, analystEstimates] = await Promise.allSettled([
      fmpService.getNextEarningsDate(symbol.toUpperCase()),
      fmpService.getAnalystEstimates(symbol.toUpperCase())
    ]);
    
    const response = {
      symbol: symbol.toUpperCase(),
      nextEarnings: nextEarnings.status === 'fulfilled' ? nextEarnings.value : null,
      analystEstimates: analystEstimates.status === 'fulfilled' ? analystEstimates.value : null,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`✅ [EARNINGS API] Next earnings data for ${symbol}:`, response.nextEarnings?.date || 'Not scheduled');
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [EARNINGS API] Error getting next earnings for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to retrieve next earnings date',
      message: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * Clear cache and refresh earnings data
 * POST /api/research/earnings/:symbol/clear-cache
 * 
 * Clears cached earnings analysis and forces fresh data fetch
 */
router.post('/:symbol/clear-cache', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`🔄 [EARNINGS API] Clearing cache for ${symbol}...`);
    
    // Clear the analysis cache
    const success = await earningsAnalysisService.clearCache(symbol.toUpperCase());
    
    res.json({
      symbol: symbol.toUpperCase(),
      cacheCleared: success,
      message: success ? 'Cache cleared successfully' : 'Cache clear failed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [EARNINGS API] Error clearing cache for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message,
      symbol: req.params.symbol
    });
  }
});

/**
 * Helper: Extract discovery tags from theme text
 * @param {string} theme - Theme name
 * @param {string} explanation - Theme explanation  
 * @returns {Array} Discovery tags
 */
function extractDiscoveryTags(theme, explanation) {
  const text = `${theme} ${explanation}`.toLowerCase();
  const tags = [];
  
  // Technology themes
  if (text.includes('ai') || text.includes('artificial intelligence')) tags.push('artificial-intelligence');
  if (text.includes('cloud') || text.includes('saas')) tags.push('cloud-computing');
  if (text.includes('robot') || text.includes('automation')) tags.push('robotics');
  if (text.includes('ev') || text.includes('electric vehicle')) tags.push('electric-vehicles');
  if (text.includes('5g') || text.includes('telecom')) tags.push('5g-technology');
  if (text.includes('blockchain') || text.includes('crypto')) tags.push('blockchain');
  if (text.includes('semiconductor') || text.includes('chip')) tags.push('semiconductors');
  
  // Business themes
  if (text.includes('subscription') || text.includes('recurring revenue')) tags.push('subscription-model');
  if (text.includes('international') || text.includes('global expansion')) tags.push('international-expansion');
  if (text.includes('margin') || text.includes('efficiency')) tags.push('operational-efficiency');
  if (text.includes('acquisition') || text.includes('merger')) tags.push('mergers-acquisitions');
  
  // Industry themes
  if (text.includes('healthcare') || text.includes('biotech')) tags.push('healthcare');
  if (text.includes('energy') || text.includes('renewable')) tags.push('renewable-energy');
  if (text.includes('real estate') || text.includes('property')) tags.push('real-estate');
  if (text.includes('finance') || text.includes('fintech')) tags.push('fintech');
  
  return tags;
}

/**
 * Helper: Categorize themes for better organization
 * @param {Array} themes - Array of themes
 * @returns {Object} Categorized themes
 */
function categorizeThemes(themes) {
  const categories = {
    technology: [],
    business: [],
    financial: [],
    market: [],
    other: []
  };
  
  themes.forEach(theme => {
    const text = theme.theme.toLowerCase();
    
    if (text.includes('ai') || text.includes('cloud') || text.includes('robot') || 
        text.includes('technology') || text.includes('software') || text.includes('digital')) {
      categories.technology.push(theme);
    } else if (text.includes('revenue') || text.includes('growth') || text.includes('expansion') ||
               text.includes('strategy') || text.includes('acquisition')) {
      categories.business.push(theme);
    } else if (text.includes('margin') || text.includes('cost') || text.includes('cash') ||
               text.includes('profit') || text.includes('debt')) {
      categories.financial.push(theme);
    } else if (text.includes('market') || text.includes('competition') || text.includes('industry') ||
               text.includes('customer') || text.includes('demand')) {
      categories.market.push(theme);
    } else {
      categories.other.push(theme);
    }
  });
  
  return categories;
}

/**
 * Helper: Extract all unique discovery tags from themes
 * @param {Array} themes - Array of themes
 * @returns {Array} Unique discovery tags
 */
function extractAllDiscoveryTags(themes) {
  const allTags = new Set();
  
  themes.forEach(theme => {
    if (theme.discoveryTags) {
      theme.discoveryTags.forEach(tag => allTags.add(tag));
    }
  });
  
  return Array.from(allTags).sort();
}

export default router;
