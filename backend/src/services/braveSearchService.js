/**
 * Brave Web Search Service
 * Provides web search functionality using Brave Search API
 */
import braveAPIManager from './braveAPIManager.js';

class BraveSearchService {
  constructor() {
    this.webSearchUrl = 'https://api.search.brave.com/res/v1/web/search';
    this.newsSearchUrl = 'https://api.search.brave.com/res/v1/news/search';
  }

  /**
   * Perform a web search using Brave API
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async search(query, options = {}) {
    try {
      const {
        count = 10,
        offset = 0,
        freshness = null, // pd (past day), pw (past week), pm (past month)
        language = 'en',
        country = 'US',
        safesearch = 'off',
        searchType = 'web' // 'web' or 'news'
      } = options;

      console.log(`🔍 Brave Search: "${query}" (${searchType} search)`);

      const url = searchType === 'news' ? this.newsSearchUrl : this.webSearchUrl;
      
      const params = {
        q: query,
        count: Math.min(count, 20), // Max 20 results per request
        offset: offset,
        search_lang: language,
        country: country.toLowerCase(),
        safesearch: safesearch,
        spellcheck: 1
      };

      // Add freshness parameter if specified
      if (freshness) {
        params.freshness = freshness;
      }

      // Make request through API manager with priority
      const response = await braveAPIManager.request({
        url: url,
        params: params
      }, 'normal');

      if (!response) {
        console.warn('Empty response from Brave API');
        return { web: { results: [] }, news: { results: [] } };
      }

      // For web search, ensure proper structure
      if (searchType === 'web' && response.web) {
        return {
          web: {
            results: response.web.results || []
          },
          query: response.query || {}
        };
      }
      
      // For news search, ensure proper structure
      if (searchType === 'news' && response.news) {
        return {
          news: {
            results: response.news.results || []
          },
          query: response.query || {}
        };
      }

      // If neither web nor news results, check if response has results directly
      if (response.results) {
        if (searchType === 'news') {
          return {
            news: {
              results: response.results
            },
            query: response.query || {}
          };
        } else {
          return {
            web: {
              results: response.results
            },
            query: response.query || {}
          };
        }
      }

      console.warn('Unexpected response structure from Brave API:', Object.keys(response));
      return { web: { results: [] }, news: { results: [] } };

    } catch (error) {
      console.error('Brave search error:', error.message);
      
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        console.warn('Brave API rate limited - returning empty results');
        return { web: { results: [] }, news: { results: [] } };
      }
      
      // Check if it's an auth error
      if (error.response?.status === 403) {
        console.error('Brave API authentication failed - check API key');
        return { web: { results: [] }, news: { results: [] } };
      }
      
      // Return empty results for other errors
      return { web: { results: [] }, news: { results: [] } };
    }
  }

  /**
   * Search for financial news from specific sources
   * @param {Array<string>} sources - Array of source domains
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of news articles
   */
  async searchFinancialNews(sources = [], options = {}) {
    try {
      const allResults = [];
      
      // Default financial news sources if none provided
      if (sources.length === 0) {
        sources = ['bloomberg.com', 'cnbc.com', 'wsj.com', 'reuters.com', 'marketwatch.com'];
      }

      // Search each source
      for (const source of sources) {
        try {
          // Use web search with site: operator for better results
          const query = `site:${source} stock market finance economy`;
          
          const results = await this.search(query, {
            ...options,
            count: 5,
            freshness: options.freshness || 'pd', // Default to past day
            searchType: 'web'
          });

          if (results.web && results.web.results) {
            const sourceResults = results.web.results.map(result => ({
              ...result,
              source: this.extractSourceName(source),
              sourceUrl: source
            }));
            
            allResults.push(...sourceResults);
          }

          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.warn(`Failed to search ${source}:`, error.message);
        }
      }

      return allResults;

    } catch (error) {
      console.error('Financial news search error:', error);
      return [];
    }
  }

  /**
   * Extract clean source name from domain
   * @param {string} domain - Domain name
   * @returns {string} Clean source name
   */
  extractSourceName(domain) {
    const sourceMap = {
      'bloomberg.com': 'Bloomberg',
      'cnbc.com': 'CNBC',
      'wsj.com': 'Wall Street Journal',
      'reuters.com': 'Reuters',
      'marketwatch.com': 'MarketWatch',
      'barrons.com': "Barron's",
      'ft.com': 'Financial Times',
      'finance.yahoo.com': 'Yahoo Finance'
    };

    return sourceMap[domain] || domain.replace('.com', '').replace('www.', '');
  }

  /**
   * Get API status from the manager
   * @returns {Object} API status
   */
  getStatus() {
    return braveAPIManager.getStatus();
  }
}

// Export singleton instance
export default new BraveSearchService();