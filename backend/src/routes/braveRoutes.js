// Brave API routes for sentiment analysis
import express from 'express';
import braveService from '../services/braveService.js';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600 }); // 10 minute cache

// Market sentiment analysis endpoint
router.get('/market-sentiment', async (req, res) => {
  try {
    console.log('🧠 Fetching market sentiment from Brave API...');
    
    // Check cache first
    const cacheKey = 'market_sentiment';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('✅ Returning cached sentiment data');
      return res.json(cachedData);
    }

    // Search for market sentiment and financial news
    const sentimentQueries = [
      'stock market sentiment today',
      'market outlook 2025',
      'S&P 500 investor confidence',
      'financial market volatility news',
      'Fed policy market reaction'
    ];

    let overallSentiment = 0;
    let totalArticles = 0;
    let sentimentScores = [];

    // Analyze sentiment from multiple search queries
    for (const query of sentimentQueries) {
      try {
        const searchResults = await braveService.searchNews(query, 5);
        
        if (searchResults && searchResults.length > 0) {
          // Simple sentiment analysis based on keywords
          for (const article of searchResults) {
            const sentiment = analyzeSentiment(article.title + ' ' + (article.description || ''));
            sentimentScores.push(sentiment);
            totalArticles++;
          }
        }
      } catch (error) {
        console.error(`Error searching for "${query}":`, error.message);
      }
    }

    // Calculate overall sentiment
    if (sentimentScores.length > 0) {
      overallSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    }

    const sentimentData = {
      overall: {
        sentiment: overallSentiment,
        confidence: Math.min(sentimentScores.length / 20, 1), // Confidence based on sample size
        newsVolume: totalArticles,
        lastUpdated: new Date().toISOString()
      },
      breakdown: {
        positive: sentimentScores.filter(s => s > 0.2).length,
        neutral: sentimentScores.filter(s => s >= -0.2 && s <= 0.2).length,
        negative: sentimentScores.filter(s => s < -0.2).length
      },
      sources: ['Brave Search', 'Financial News'],
      disclaimer: 'Sentiment analysis based on news headlines and descriptions'
    };

    // Cache for 10 minutes
    cache.set(cacheKey, sentimentData, 600);

    console.log(`✅ Market sentiment analysis complete: ${overallSentiment.toFixed(2)} (${totalArticles} articles)`);
    res.json(sentimentData);

  } catch (error) {
    console.error('❌ Market sentiment error:', error);
    
    // Return fallback sentiment data
    res.json({
      overall: {
        sentiment: 0,
        confidence: 0.3,
        newsVolume: 0,
        lastUpdated: new Date().toISOString()
      },
      breakdown: {
        positive: 0,
        neutral: 1,
        negative: 0
      },
      sources: ['Fallback'],
      error: 'Unable to fetch sentiment data',
      disclaimer: 'Fallback neutral sentiment due to API issues'
    });
  }
});

// Simple sentiment analysis function
function analyzeSentiment(text) {
  if (!text) return 0;
  
  const lowercaseText = text.toLowerCase();
  
  // Positive indicators
  const positiveWords = [
    'bullish', 'rally', 'surge', 'soar', 'climb', 'gain', 'rise', 'optimistic',
    'confident', 'strong', 'robust', 'growth', 'positive', 'upward', 'momentum',
    'breakthrough', 'success', 'beat', 'exceed', 'outperform', 'upgrade'
  ];
  
  // Negative indicators
  const negativeWords = [
    'bearish', 'crash', 'plunge', 'fall', 'drop', 'decline', 'pessimistic',
    'weak', 'concern', 'worry', 'fear', 'volatility', 'uncertainty', 'risk',
    'downgrade', 'miss', 'disappoint', 'struggle', 'pressure', 'sell-off'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowercaseText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowercaseText.includes(word)) negativeCount++;
  });
  
  // Normalize to -1 to 1 range
  const totalWords = positiveCount + negativeCount;
  if (totalWords === 0) return 0;
  
  return (positiveCount - negativeCount) / Math.max(totalWords, 5);
}

// Financial news search endpoint
router.get('/financial-news', async (req, res) => {
  try {
    const { query = 'financial markets', limit = 10 } = req.query;
    
    console.log(`🔍 Searching financial news for: "${query}"`);
    
    const news = await braveService.searchNews(query, parseInt(limit));
    
    res.json({
      query,
      count: news.length,
      articles: news,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Financial news search error:', error);
    res.status(500).json({
      error: 'Failed to fetch financial news',
      query: req.query.query || 'financial markets',
      count: 0,
      articles: []
    });
  }
});

// Market volatility sentiment endpoint
router.get('/volatility-sentiment', async (req, res) => {
  try {
    console.log('📊 Analyzing volatility sentiment...');
    
    const volatilityQueries = [
      'VIX volatility index today',
      'market volatility fear index',
      'stock market uncertainty 2025'
    ];

    let volatilitySentiment = [];

    for (const query of volatilityQueries) {
      try {
        const results = await braveService.searchNews(query, 3);
        results.forEach(article => {
          const sentiment = analyzeVolatilitySentiment(article.title + ' ' + (article.description || ''));
          volatilitySentiment.push(sentiment);
        });
      } catch (error) {
        console.error(`Error analyzing volatility for "${query}":`, error.message);
      }
    }

    const avgVolatilitySentiment = volatilitySentiment.length > 0 
      ? volatilitySentiment.reduce((sum, s) => sum + s, 0) / volatilitySentiment.length 
      : 0;

    res.json({
      volatilitySentiment: avgVolatilitySentiment,
      interpretation: getVolatilityInterpretation(avgVolatilitySentiment),
      sampleSize: volatilitySentiment.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Volatility sentiment error:', error);
    res.status(500).json({
      error: 'Failed to analyze volatility sentiment',
      volatilitySentiment: 0,
      interpretation: 'neutral'
    });
  }
});

function analyzeVolatilitySentiment(text) {
  if (!text) return 0;
  
  const lowercaseText = text.toLowerCase();
  
  // High volatility/fear indicators
  const fearWords = ['fear', 'panic', 'crash', 'plunge', 'volatility', 'uncertainty', 'selloff'];
  // Low volatility/complacency indicators  
  const complacencyWords = ['calm', 'stable', 'confidence', 'rally', 'optimism', 'gains'];
  
  let fearCount = 0;
  let complacencyCount = 0;
  
  fearWords.forEach(word => {
    if (lowercaseText.includes(word)) fearCount++;
  });
  
  complacencyWords.forEach(word => {
    if (lowercaseText.includes(word)) complacencyCount++;
  });
  
  // Return fear index (-1 = high fear, 1 = complacency)
  const totalWords = fearCount + complacencyCount;
  if (totalWords === 0) return 0;
  
  return (complacencyCount - fearCount) / totalWords;
}

function getVolatilityInterpretation(sentiment) {
  if (sentiment < -0.3) return 'high_fear';
  if (sentiment < -0.1) return 'elevated_concern';
  if (sentiment < 0.1) return 'neutral';
  if (sentiment < 0.3) return 'confident';
  return 'complacent';
}

export default router;