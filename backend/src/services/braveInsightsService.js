import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache

class BraveInsightsService {
  constructor() {
    this.apiKey = process.env.BRAVE_API_KEY || 'BSAFHHikdsv2YXSYODQSPES2tTMILHI';
    this.baseUrl = 'https://api.search.brave.com/res/v1';
    
    // Premium financial news sources
    this.premiumSources = [
      'bloomberg.com',
      'reuters.com',
      'wsj.com',
      'cnbc.com',
      'ft.com', // Financial Times
      'marketwatch.com',
      'finance.yahoo.com',
      'barrons.com',
      'thestreet.com',
      'fool.com' // Motley Fool
    ];
  }

  async getMarketInsights() {
    try {
      // Check cache first
      const cacheKey = 'market_insights';
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('Returning cached market insights');
        return cached;
      }

      // Search for recent market news from premium sources
      const query = 'stock market today news economy investing';
      const sourcesQuery = this.premiumSources.map(s => `site:${s}`).join(' OR ');
      
      console.log('Fetching market insights from Brave API...');
      const response = await axios.get(`${this.baseUrl}/news/search`, {
        params: {
          q: `${query} (${sourcesQuery})`,
          count: 20, // Get more results to filter
          freshness: 'pd' // Changed from 'today' to 'pd' (past day)
        },
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey
        }
      });

      console.log('Brave API response status:', response.status);
      
      if (!response.data || !response.data.results) {
        console.log('Invalid response from Brave API, falling back to general news search');
        // Fallback to general news search without source restrictions
        const fallbackResponse = await axios.get(`${this.baseUrl}/news/search`, {
          params: {
            q: query,
            count: 10,
            freshness: 'pd'
          },
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': this.apiKey
          }
        });
        
        if (fallbackResponse.data && fallbackResponse.data.results) {
          const insights = this.formatInsights(fallbackResponse.data.results);
          cache.set(cacheKey, insights);
          return insights;
        }
      }

      // Process news items
      const insights = this.formatInsights(response.data.results);
      
      if (insights.length > 0) {
        cache.set(cacheKey, insights);
        return insights;
      } else {
        // Return fallback insights if no results
        return this.getFallbackInsights();
      }
    } catch (error) {
      console.error('Error fetching market insights:', error.message);
      // Return fallback insights on error
      return this.getFallbackInsights();
    }
  }

  formatInsights(results) {
    if (!results || !Array.isArray(results)) return [];
    
    const insights = results
      .filter(article => article.title && article.url) // Basic validation
      .slice(0, 5) // Take top 5
      .map((article, index) => ({
        title: article.title,
        description: article.description || article.snippet || 'No description available',
        url: article.url,
        source: article.source || this.extractSource(article.url),
        publishedTime: article.age || article.publishedDate || new Date().toISOString(),
        thumbnail: article.thumbnail?.src || null,
        type: 'news',
        priority: this.calculatePriority(article)
      }));

    // Ensure we have at least 3 insights
    while (insights.length < 3) {
      insights.push({
        title: `Market Update ${insights.length + 1}`,
        description: 'Stay tuned for the latest market developments.',
        url: '#',
        source: 'Market News',
        publishedTime: new Date().toISOString(),
        type: 'update',
        priority: 'medium'
      });
    }

    return insights;
  }

  getFallbackInsights() {
    return [
      {
        title: 'Market Update',
        description: 'Markets are responding to recent economic data.',
        url: '#',
        source: 'Market Analysis',
        publishedTime: new Date().toISOString(),
        type: 'update',
        priority: 'medium'
      },
      {
        title: 'Economic Outlook',
        description: 'Investors watching Federal Reserve policy decisions.',
        url: '#',
        source: 'Economic News',
        publishedTime: new Date().toISOString(),
        type: 'update',
        priority: 'medium'
      },
      {
        title: 'Sector Performance',
        description: 'Technology and financials leading market movements.',
        url: '#',
        source: 'Sector Analysis',
        publishedTime: new Date().toISOString(),
        type: 'update',
        priority: 'medium'
      }
    ];
  }

  extractSource(url) {
    try {
      const hostname = new URL(url).hostname;
      const sourceMap = {
        'bloomberg.com': 'Bloomberg',
        'reuters.com': 'Reuters',
        'wsj.com': 'Wall Street Journal',
        'cnbc.com': 'CNBC',
        'ft.com': 'Financial Times',
        'marketwatch.com': 'MarketWatch',
        'finance.yahoo.com': 'Yahoo Finance',
        'barrons.com': "Barron's",
        'thestreet.com': 'TheStreet',
        'fool.com': 'Motley Fool'
      };
      
      for (const [domain, name] of Object.entries(sourceMap)) {
        if (hostname.includes(domain)) {
          return name;
        }
      }
      
      return hostname.replace('www.', '').split('.')[0];
    } catch (error) {
      return 'Unknown';
    }
  }

  calculatePriority(article) {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const combined = title + ' ' + description;
    
    // High priority keywords
    if (combined.includes('breaking') || 
        combined.includes('alert') || 
        combined.includes('surge') || 
        combined.includes('crash') ||
        combined.includes('federal reserve') ||
        combined.includes('fed')) {
      return 'high';
    }
    
    // Low priority keywords
    if (combined.includes('opinion') || 
        combined.includes('analysis') || 
        combined.includes('outlook')) {
      return 'low';
    }
    
    return 'medium';
  }

  // Add alias method for compatibility
  async getKeyInsights() {
    return this.getMarketInsights();
  }
}

export default new BraveInsightsService();
