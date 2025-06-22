import express from 'express';
import puppeteerNewsService from '../services/puppeteerNewsService.js';
import errorTracker from '../utils/errorTracker.js';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

/**
 * Get status of the Puppeteer service
 */
router.get('/status', (req, res) => {
  try {
    const status = puppeteerNewsService.getStatus();
    res.json(status);
  } catch (error) {
    errorTracker.track(error, 'Puppeteer Status');
    res.status(500).json({ error: 'Failed to get Puppeteer service status' });
  }
});

/**
 * Get market news using Puppeteer
 */
router.get('/news', async (req, res) => {
  try {
    const cacheKey = 'puppeteer-market-news';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    try {
      const newsItems = await puppeteerNewsService.getMarketNews();
      
      // Format response
      const response = {
        source: 'puppeteer',
        articles: newsItems
      };
      
      // Cache for 10 minutes
      cache.set(cacheKey, response, 600);
      
      res.json(response);
    } catch (serviceError) {
      console.error('Puppeteer news error:', serviceError.message);
      
      // Return a warning with fallback data
      res.status(207).json({
        warning: 'Could not fetch news using Puppeteer. Using fallback data.',
        source: 'fallback',
        articles: [
          { 
            id: 'fallback-1',
            title: 'Markets Update: Current trends and analysis',
            source: 'Financial News',
            url: '#',
            published: new Date().toISOString(),
            synthetic: true
          },
          { 
            id: 'fallback-2',
            title: 'Investors watch key economic indicators',
            source: 'Market Watch',
            url: '#',
            published: new Date().toISOString(),
            synthetic: true
          }
        ]
      });
    }
  } catch (routeError) {
    errorTracker.track(routeError, 'Puppeteer News');
    res.status(500).json({ error: 'Failed to fetch market news using Puppeteer' });
  }
});

/**
 * Get stock-specific news using Puppeteer
 */
router.get('/stock-news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `puppeteer-stock-news-${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    try {
      const newsItems = await puppeteerNewsService.getStockNews(symbol);
      
      // Format response
      const response = {
        symbol,
        source: 'puppeteer',
        articles: newsItems
      };
      
      // Cache for 10 minutes
      cache.set(cacheKey, response, 600);
      
      res.json(response);
    } catch (serviceError) {
      console.error(`Puppeteer stock news error for ${symbol}:`, serviceError.message);
      
      // Return a warning with fallback data
      res.status(207).json({
        warning: `Could not fetch news for ${symbol} using Puppeteer. Using fallback data.`,
        symbol,
        source: 'fallback',
        articles: [
          { 
            id: `fallback-${symbol}-1`,
            title: `${symbol} Stock Analysis: Recent performance and outlook`,
            source: 'Financial News',
            url: '#',
            published: new Date().toISOString(),
            synthetic: true
          },
          { 
            id: `fallback-${symbol}-2`,
            title: `Investors watch ${symbol} amid market volatility`,
            source: 'Market Watch',
            url: '#',
            published: new Date().toISOString(),
            synthetic: true
          }
        ]
      });
    }
  } catch (routeError) {
    errorTracker.track(routeError, 'Puppeteer Stock News');
    res.status(500).json({ error: 'Failed to fetch stock news using Puppeteer' });
  }
});

/**
 * Analyze stock sentiment using Puppeteer
 */
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `puppeteer-sentiment-${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    try {
      const sentiment = await puppeteerNewsService.analyzeStockSentiment(symbol);
      
      // Format response
      const response = {
        symbol,
        sentiment: sentiment.sentiment,
        source: sentiment.source,
        articleCount: sentiment.articleCount || 0,
        interpretation: sentiment.interpretation || (sentiment.sentiment > 0.7 ? 'Bullish' : 
                      sentiment.sentiment > 0.5 ? 'Somewhat Bullish' :
                      sentiment.sentiment > 0.3 ? 'Somewhat Bearish' : 'Bearish'),
        context: `Current sentiment for ${symbol} is ${(sentiment.sentiment * 100).toFixed(1)}% positive based on ${sentiment.articleCount || 0} recent news articles.`
      };
      
      // Cache for 1 hour
      cache.set(cacheKey, response, 3600);
      
      res.json(response);
    } catch (serviceError) {
      console.error(`Puppeteer sentiment error for ${symbol}:`, serviceError.message);
      
      // Return a warning with fallback data
      res.status(207).json({
        warning: `Could not analyze sentiment for ${symbol} using Puppeteer. Using fallback data.`,
        symbol,
        sentiment: 0.5,
        source: 'fallback',
        interpretation: 'Neutral',
        context: `No sentiment data available for ${symbol}`
      });
    }
  } catch (routeError) {
    errorTracker.track(routeError, 'Puppeteer Sentiment');
    res.status(500).json({ error: 'Failed to analyze sentiment using Puppeteer' });
  }
});

/**
 * Reset the Puppeteer service
 */
router.post('/reset', (req, res) => {
  try {
    const result = puppeteerNewsService.resetService();
    res.json(result);
  } catch (error) {
    errorTracker.track(error, 'Puppeteer Reset');
    res.status(500).json({ error: 'Failed to reset Puppeteer service' });
  }
});

export default router;