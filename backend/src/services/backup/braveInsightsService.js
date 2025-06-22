import NodeCache from 'node-cache';
import braveAPIManager from './braveAPIManager.js';

/**
 * Brave Insights Service - Updated Implementation
 * Fetches market insights using the Brave Search API with centralized
 * API management, enhanced caching, and robust fallbacks
 */
class BraveInsightsService {
  constructor() {
    // Use a service-specific cache instance
    this.cache = new NodeCache();
    
    // Default cache durations
    this.standardCacheTTL = 7200; // 2 hours standard cache
    this.extendedCacheTTL = 21600; // 6 hours during rate limiting
    
    // Custom search terms for market insights
    this.searchTerms = [
      'stock market impact',
      'market moving news',
      'financial markets significant',
      'investment themes today',
      'economic outlook current'
    ];
    
    // Register for API manager events
    braveAPIManager.on('rateLimited', this.handleRateLimitEvent.bind(this));
    braveAPIManager.on('circuitOpen', this.handleCircuitBreakEvent.bind(this));
    
    console.log('Brave Insights Service initialized with enhanced API management');
  }
  
  /**
   * Handle rate limit events
   * @param {Object} event - Rate limit event data
   */
  handleRateLimitEvent(event) {
    console.log('Brave Insights Service received rate limit event:', event);
    
    // Extend cache TTL for existing items
    const cacheKey = 'key_insights';
    const cachedInsights = this.cache.get(cacheKey);
    
    if (cachedInsights) {
      this.cache.set(cacheKey, cachedInsights, this.extendedCacheTTL);
      console.log(`Extended insights cache TTL to ${Math.round(this.extendedCacheTTL/3600)} hours due to rate limiting`);
    }
  }
  
  /**
   * Handle circuit breaker events
   * @param {Object} event - Circuit breaker event data
   */
  handleCircuitBreakEvent(event) {
    console.log('Brave Insights Service received circuit break event:', event);
    
    // Ensure we have fallback data available
    const fallbackInsights = this.generateFallbackInsights();
    this.cache.set('fallback_insights', fallbackInsights, 86400); // 24 hours
    console.log('Generated and cached fallback insights due to circuit breaker');
  }
  
  /**
   * Generate fallback insights based on current date
   * @returns {Array} Array of insight objects
   */
  generateFallbackInsights() {
    const now = new Date();
    
    return [
      {
        title: "Markets Analysis Dashboard",
        description: "Track real-time market movements, sector performance, and key economic indicators.",
        url: "#",
        source: "Market Dashboard",
        score: 100,
        publishedTime: now.toISOString()
      },
      {
        title: "Economic Data Overview",
        description: "Monitor macroeconomic trends through our comprehensive financial metrics.",
        url: "#",
        source: "Market Dashboard",
        score: 90,
        publishedTime: new Date(now.getTime() - 3600000).toISOString() // 1 hour ago
      },
      {
        title: "Market Themes & Trends",
        description: "Explore current market themes and track major sector movements.",
        url: "#",
        source: "Market Dashboard",
        score: 80,
        publishedTime: new Date(now.getTime() - 7200000).toISOString() // 2 hours ago
      }
    ];
  }

  /**
   * Get key market insights
   * @returns {Promise<Array>} Market insights
   */
  async getKeyInsights() {
    // Create cache key
    const cacheKey = 'key_insights';
    
    // Check cache first
    const cachedInsights = this.cache.get(cacheKey);
    if (cachedInsights) {
      console.log('Using cached market insights');
      return cachedInsights;
    }
    
    // Check API manager status
    const apiStatus = braveAPIManager.getStatus();
    
    // If circuit is open, use fallback data
    if (apiStatus.circuitOpen) {
      console.log('Brave API circuit is open. Using fallback insights.');
      return this.cache.get('fallback_insights') || this.generateFallbackInsights();
    }
    
    // If rate limited, use fallback with high probability
    if (apiStatus.isRateLimited && Math.random() < 0.8) {
      console.log('Brave API is rate limited. Using fallback insights to reduce API load.');
      return this.cache.get('fallback_insights') || this.generateFallbackInsights();
    }
    
    try {
      // Pre-generate fallback insights for emergency use
      const fallbackInsights = this.generateFallbackInsights();
      
      console.log('Fetching market insights');
      
      // Make requests sequentially 
      const articles = [];
      
      for (const term of this.searchTerms) {
        try {
          console.log(`Querying for term: "${term}"`);
          
          // Make request via API manager
          const response = await braveAPIManager.request({
            url: `${process.env.BRAVE_API_BASE_URL || 'https://api.search.brave.com/res/v1'}/news/search`,
            params: {
              q: term,
              count: 5,
              freshness: 'pd',
              textDecorations: true,
              safeSearch: 'strict'
            }
          });
          
          // Extract articles
          const results = response?.results || [];
          console.log(`Received ${results.length} results for "${term}"`);
          
          // Add to collection
          articles.push(...results);
          
          // If we have enough articles, stop making requests
          if (articles.length >= 15) {
            console.log('Collected enough articles, stopping additional requests');
            break;
          }
        } catch (error) {
          console.error(`Error fetching term "${term}":`, error.message);
          // Continue with other terms if one fails
        }
      }
      
      // If we didn't get any articles, use fallback
      if (articles.length === 0) {
        console.log('No articles found, using fallback insights');
        this.cache.set(cacheKey, fallbackInsights, 300); // Cache for 5 minutes
        return fallbackInsights;
      }
      
      // Score and rank articles
      const scoredArticles = articles.map(article => ({
        ...article,
        score: this.calculateArticleScore(article)
      }));
      
      // Sort by score and take top 3
      const topInsights = scoredArticles
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source,
          score: article.score,
          publishedTime: article.publishedTime,
          thumbnail: article.meta?.thumbnail || null
        }));
      
      // Cache results
      this.cache.set(cacheKey, topInsights, this.standardCacheTTL);
      console.log(`Cached ${topInsights.length} insights for ${Math.round(this.standardCacheTTL/3600)} hours`);
      
      return topInsights;
    } catch (error) {
      console.error('Error fetching insights:', error.message);
      
      // Use fallback insights on error
      const fallbackInsights = this.cache.get('fallback_insights') || this.generateFallbackInsights();
      this.cache.set(cacheKey, fallbackInsights, 300); // Cache for 5 minutes
      
      return fallbackInsights;
    }
  }

  /**
   * Calculate relevance score for an article
   * @param {Object} article - Article object
   * @returns {Number} Relevance score
   */
  calculateArticleScore(article) {
    let score = 0;
    
    // Score based on source reputation
    const reputableSources = [
      'bloomberg', 'reuters', 'wsj', 'ft.com', 
      'cnbc', 'marketwatch', 'barrons', 'yahoo finance'
    ];
    if (reputableSources.some(source => 
      article.source?.toLowerCase().includes(source))) {
      score += 30;
    }

    // Score based on keyword presence in title
    const impactKeywords = [
      'market', 'stock', 'fed', 'economy', 'rates',
      'inflation', 'gdp', 'earnings', 'forecast'
    ];
    const title = article.title?.toLowerCase() || '';
    impactKeywords.forEach(keyword => {
      if (title.includes(keyword)) score += 10;
    });

    // Freshness score (newer is better)
    if (article.publishedTime) {
      const ageInHours = (Date.now() - new Date(article.publishedTime).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 24 - ageInHours);
    }

    return score;
  }
  
  /**
   * Reset the service
   */
  resetService() {
    // Clear cache
    this.cache.flushAll();
    console.log('Brave Insights Service cache cleared');
    
    return {
      status: 'reset_complete',
      message: 'Brave Insights Service has been reset'
    };
  }
}

export default new BraveInsightsService();