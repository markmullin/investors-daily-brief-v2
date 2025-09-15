import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 900 }); // 15 minute cache

// Define premium financial news sources
const PREMIUM_SOURCES = [
  'cnbc.com',
  'bloomberg.com',
  'wsj.com',
  'reuters.com',
  'ft.com',
  'barrons.com',
  'marketwatch.com',
  'fool.com',
  'seekingalpha.com',
  'investopedia.com'
];

/**
 * Get key market insights from Brave Search API
 * Fixed route path - mounted at /api/insights so this should be just '/'
 */
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cachedData = cache.get('key_insights');
    if (cachedData) {
      console.log('Returning cached insights');
      return res.json(cachedData);
    }
    
    console.log('Fetching key insights from Brave API');
    
    const braveApiKey = process.env.BRAVE_API_KEY || 'BSAFHHikdsv2YXSYODQSPES2tTMILHI';
    const queries = [
      'stock market today news latest',
      'federal reserve news today',
      'breaking economic data news'
    ];
    
    const articles = [];
    
    // Use web search instead of news search endpoint
    for (const query of queries) {
      try {
        const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': braveApiKey
          },
          params: {
            q: query,
            count: 10,
            freshness: 'pd' // Past day
          }
        });
        
        if (response.data && response.data.web && response.data.web.results) {
          // Process web results that look like news
          response.data.web.results.forEach(result => {
            // Check if from premium source
            const isPremium = PREMIUM_SOURCES.some(source => 
              result.url?.toLowerCase().includes(source)
            );
            
            // Extract date from result
            const publishedTime = result.age || new Date().toISOString();
            
            articles.push({
              title: result.title,
              description: result.description || '',
              url: result.url,
              source: extractSourceName(result.url),
              publishedTime: publishedTime,
              thumbnail: result.thumbnail?.src || null,
              isPremium: isPremium
            });
          });
        }
      } catch (error) {
        console.error(`Error fetching insights for query "${query}":`, error.message);
      }
    }
    
    // Sort by premium sources first, then by most recent
    articles.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return new Date(b.publishedTime) - new Date(a.publishedTime);
    });
    
    // Take top 3 unique articles
    const seenTitles = new Set();
    const topInsights = [];
    
    for (const article of articles) {
      if (!seenTitles.has(article.title) && topInsights.length < 3) {
        seenTitles.add(article.title);
        topInsights.push({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source,
          publishedTime: article.publishedTime,
          thumbnail: article.thumbnail
        });
      }
    }
    
    // If we have less than 3 insights, add some defaults
    while (topInsights.length < 3) {
      topInsights.push({
        title: `Market Update ${topInsights.length + 1}`,
        description: 'Stay tuned for the latest market developments.',
        url: '#',
        source: 'Market News',
        publishedTime: new Date().toISOString(),
        thumbnail: null
      });
    }
    
    // Cache the results
    cache.set('key_insights', topInsights);
    
    console.log(`Returning ${topInsights.length} insights`);
    res.json(topInsights);
  } catch (error) {
    console.error('Error fetching key insights:', error);
    
    // Return default insights on error
    res.json([
      {
        title: 'Market Update 1',
        description: 'Stay tuned for the latest market developments.',
        url: '#',
        source: 'Market News',
        publishedTime: new Date().toISOString(),
        thumbnail: null
      },
      {
        title: 'Market Update 2',
        description: 'Stay tuned for the latest market developments.',
        url: '#',
        source: 'Market News',
        publishedTime: new Date().toISOString(),
        thumbnail: null
      },
      {
        title: 'Market Update 3',
        description: 'Stay tuned for the latest market developments.',
        url: '#',
        source: 'Market News',
        publishedTime: new Date().toISOString(),
        thumbnail: null
      }
    ]);
  }
});

/**
 * Extract clean source name from URL
 */
function extractSourceName(url) {
  try {
    const hostname = new URL(url).hostname;
    const cleanName = hostname
      .replace('www.', '')
      .replace('.com', '')
      .replace('.org', '')
      .split('.')[0];
    
    // Map to proper names
    const sourceMap = {
      'cnbc': 'CNBC',
      'bloomberg': 'Bloomberg',
      'wsj': 'Wall Street Journal',
      'reuters': 'Reuters',
      'ft': 'Financial Times',
      'barrons': 'Barron\'s',
      'marketwatch': 'MarketWatch',
      'fool': 'Motley Fool',
      'seekingalpha': 'Seeking Alpha',
      'investopedia': 'Investopedia'
    };
    
    return sourceMap[cleanName.toLowerCase()] || cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  } catch {
    return 'Market News';
  }
}

export default router;
