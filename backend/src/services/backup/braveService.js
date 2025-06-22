import NodeCache from 'node-cache';
import braveAPIManager from './braveAPIManager.js';

/**
 * Brave Service - Updated Implementation
 * Provides market sentiment analysis using Brave API with enhanced
 * API management, caching, and fallback mechanisms
 */
class BraveService {
  constructor() {
    // Service-specific cache
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache by default
    
    // Register for API manager events
    braveAPIManager.on('rateLimited', this.handleRateLimitEvent.bind(this));
    
    console.log('Brave Service initialized with centralized API management');
  }
  
  /**
   * Handle rate limit events
   * @param {Object} event - Rate limit event data
   */
  handleRateLimitEvent(event) {
    console.log('Brave Service received rate limit event:', event);
    
    // Extend cache TTL for all sentiment entries
    const cacheKeys = this.cache.keys();
    if (cacheKeys.length > 0) {
      cacheKeys.forEach(key => {
        const value = this.cache.get(key);
        if (value) {
          // Extend TTL to 4 hours
          this.cache.set(key, value, 14400);
        }
      });
      console.log(`Extended TTL for ${cacheKeys.length} cached sentiment entries`);
    }
  }

  /**
   * Get market sentiment for a symbol
   * @param {String} symbol - Stock symbol
   * @returns {Promise<Object>} Sentiment data
   */
  async getMarketSentiment(symbol) {
    try {
      // Check cache first
      const cacheKey = `sentiment-${symbol}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`Using cached sentiment for ${symbol}`);
        return cached;
      }
      
      // Check API manager status
      const apiStatus = braveAPIManager.getStatus();
      
      // If circuit is open or rate limited, use default sentiment
      if (apiStatus.circuitOpen || apiStatus.isRateLimited) {
        console.log(`API ${apiStatus.circuitOpen ? 'circuit open' : 'rate limited'}, returning default sentiment for ${symbol}`);
        const defaultSentiment = { 
          sentiment: 0.5, 
          source: 'default',
          cached: false
        };
        
        // Cache the default sentiment, but only for 10 minutes
        this.cache.set(cacheKey, defaultSentiment, 600);
        
        return defaultSentiment;
      }
      
      console.log(`Fetching market sentiment for ${symbol}`);
      
      // Make request via API manager
      const response = await braveAPIManager.request({
        url: `${process.env.BRAVE_API_BASE_URL || 'https://api.search.brave.com/res/v1'}/stats/search`,
        params: {
          q: `${symbol} stock market sentiment`,
          count: 5
        }
      });
      
      // Extract articles
      const articles = response?.articles || [];
      console.log(`Received ${articles.length} articles for ${symbol} sentiment analysis`);
      
      // Calculate sentiment
      const sentimentScore = this.analyzeSentiment(articles);
      const normalizedSentiment = Math.max(0, Math.min(1, (sentimentScore + 5) / 10));
      
      // Create sentiment result
      const result = {
        sentiment: normalizedSentiment,
        source: 'brave-api',
        cached: false,
        articleCount: articles.length,
        rawScore: sentimentScore
      };
      
      // Cache the result
      this.cache.set(cacheKey, result, 3600);
      
      return result;
    } catch (error) {
      console.error(`Error fetching market sentiment for ${symbol}:`, error.message);
      
      // Return default sentiment on error
      return { 
        sentiment: 0.5, 
        source: 'default-error',
        error: error.message
      };
    }
  }

  /**
   * Analyze sentiment from articles
   * @param {Array} articles - Array of article objects
   * @returns {Number} Sentiment score
   */
  analyzeSentiment(articles) {
    // Enhanced sentiment analysis with more sophisticated word lists
    const positiveWords = [
      'surge', 'jump', 'rise', 'gain', 'positive', 'bullish', 'outperform',
      'upside', 'upgrade', 'optimistic', 'rally', 'strong', 'recover',
      'momentum', 'uptrend', 'growth', 'beat', 'exceed', 'improve'
    ];
    
    const negativeWords = [
      'drop', 'fall', 'decline', 'negative', 'bearish', 'underperform',
      'downside', 'downgrade', 'pessimistic', 'tumble', 'weak', 'slump',
      'pressure', 'downtrend', 'contraction', 'miss', 'disappointing', 'worsen'
    ];
    
    // Extra weight for strong sentiment words
    const strongPositive = ['soar', 'skyrocket', 'explode', 'tremendous', 'stellar'];
    const strongNegative = ['crash', 'plummet', 'collapse', 'disaster', 'catastrophic'];
    
    let sentimentScore = 0;
    
    // Process each article
    articles.forEach(article => {
      // Combine title and description for analysis
      const text = [
        article.title || '', 
        article.description || ''
      ].join(' ').toLowerCase();
      
      // Count positive words
      positiveWords.forEach(word => {
        if (text.includes(word)) sentimentScore += 1;
      });
      
      // Count negative words
      negativeWords.forEach(word => {
        if (text.includes(word)) sentimentScore -= 1;
      });
      
      // Apply extra weight for strong sentiment words
      strongPositive.forEach(word => {
        if (text.includes(word)) sentimentScore += 2;
      });
      
      strongNegative.forEach(word => {
        if (text.includes(word)) sentimentScore -= 2;
      });
    });
    
    return sentimentScore;
  }
  
  /**
   * Reset the service
   */
  resetService() {
    // Clear cache
    this.cache.flushAll();
    console.log('Brave Service cache cleared');
    
    return {
      status: 'reset_complete',
      message: 'Brave Service has been reset'
    };
  }
}

export default new BraveService();