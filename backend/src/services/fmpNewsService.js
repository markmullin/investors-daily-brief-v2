/**
 * FMP PREMIUM NEWS SERVICE - REAL DATA ONLY
 * Uses only FMP Premium API for real financial news content
 */
import axios from 'axios';
import NodeCache from 'node-cache';

// Aggressive caching for performance
const newsCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 }); // 15 minutes

class FmpNewsService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.baseUrl = 'https://financialmodelingprep.com/api';
    
    if (!this.fmpApiKey) {
      console.error('❌ FMP API key not configured - service will fail');
    } else {
      console.log('✅ FMP Premium News Service initialized - REAL DATA ONLY');
    }
  }

  /**
   * Get REAL premium financial news from FMP API ONLY
   */
  async getMarketNews() {
    const cacheKey = 'fmp_real_market_news';
    
    // Check cache first
    const cachedNews = newsCache.get(cacheKey);
    if (cachedNews && cachedNews.articles.length > 0) {
      console.log('✅ [CACHE] Returning cached real FMP news');
      return cachedNews;
    }
    
    console.log('🚀 [FMP REAL] Fetching REAL financial news from FMP API...');
    
    if (!this.fmpApiKey) {
      throw new Error('FMP API key not configured - cannot fetch real news');
    }
    
    const allArticles = [];
    
    // Fetch from multiple FMP news endpoints in parallel with timeout
    const newsPromises = [
      this.fetchFmpStockNews(),
      this.fetchFmpGeneralNews(), 
      this.fetchFmpArticles(),
      this.fetchFmpPressReleases()
    ];
    
    const results = await Promise.allSettled(newsPromises.map(promise => 
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('FMP API timeout')), 8000))
      ])
    ));
    
    // Collect all successful results - REAL DATA ONLY
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        const realArticles = result.value.filter(article => 
          article.title && 
          article.description && 
          !article.title.includes('Federal Reserve Policy Analysis') && // Remove any synthetic content
          !article.title.includes('Technology Sector Analysis') &&
          !article.title.includes('Market Risk Analysis')
        );
        
        allArticles.push(...realArticles);
        console.log(`✅ [FMP REAL] ${['Stock News', 'General News', 'Articles', 'Press Releases'][index]}: ${realArticles.length} real items`);
      } else {
        console.log(`⚠️ [FMP] ${['Stock News', 'General News', 'Articles', 'Press Releases'][index]} failed:`, result.reason?.message);
      }
    });
    
    if (allArticles.length === 0) {
      throw new Error('No real news articles retrieved from FMP API');
    }
    
    // Process and deduplicate REAL articles only
    const processedArticles = this.processRealArticlesFmp(allArticles);
    
    const result = {
      articles: processedArticles,
      source: 'fmp_real_api_only',
      timestamp: new Date().toISOString(),
      totalSources: `fmp_real_${allArticles.length}_sources`,
      realDataOnly: true
    };
    
    // Cache aggressively
    newsCache.set(cacheKey, result);
    
    console.log(`✅ [FMP REAL] ${processedArticles.length} REAL articles ready for AI (NO SYNTHETIC DATA)`);
    return result;
  }

  /**
   * Fetch FMP Stock News (market-focused financial news)
   */
  async fetchFmpStockNews() {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/stock_news`, {
        params: {
          limit: 30,
          apikey: this.fmpApiKey
        },
        timeout: 6000
      });
      
      if (Array.isArray(response.data)) {
        return response.data
          .filter(item => item.title && item.text && item.site) // Only real articles with content
          .map(item => ({
            title: item.title,
            description: item.text,
            url: item.url || '#',
            source: item.site,
            publishedAt: item.publishedDate || new Date().toISOString(),
            priority: 'high',
            type: 'fmp_stock_news',
            symbol: item.symbol || null,
            realSource: true
          }));
      }
      
      return [];
    } catch (error) {
      console.log('⚠️ [FMP] Stock news fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch FMP General News (broader financial market news)
   */
  async fetchFmpGeneralNews() {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/general_news`, {
        params: {
          page: 0,
          size: 25,
          apikey: this.fmpApiKey
        },
        timeout: 6000
      });
      
      if (Array.isArray(response.data)) {
        return response.data
          .filter(item => item.title && item.text) // Only real articles with content
          .map(item => ({
            title: item.title,
            description: item.text,
            url: item.url || '#',
            source: 'FMP Financial News',
            publishedAt: item.publishedDate || new Date().toISOString(),
            priority: 'medium',
            type: 'fmp_general_news',
            realSource: true
          }));
      }
      
      return [];
    } catch (error) {
      console.log('⚠️ [FMP] General news fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch FMP Articles (professional analysis)
   */
  async fetchFmpArticles() {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/articles`, {
        params: {
          page: 0,
          size: 15,
          apikey: this.fmpApiKey
        },
        timeout: 6000
      });
      
      if (Array.isArray(response.data)) {
        return response.data
          .filter(item => item.title && item.content) // Only real articles with content
          .map(item => ({
            title: item.title,
            description: item.content,
            url: item.url || '#',
            source: 'FMP Professional Analysis',
            publishedAt: item.date || new Date().toISOString(),
            priority: 'high',
            type: 'fmp_analysis',
            realSource: true
          }));
      }
      
      return [];
    } catch (error) {
      console.log('⚠️ [FMP] Articles fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch FMP Press Releases (from major companies)
   */
  async fetchFmpPressReleases() {
    try {
      // Get press releases from major market movers
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      const response = await axios.get(`${this.baseUrl}/v3/press-releases/${randomSymbol}`, {
        params: {
          limit: 10,
          apikey: this.fmpApiKey
        },
        timeout: 6000
      });
      
      if (Array.isArray(response.data)) {
        return response.data
          .filter(item => item.title && item.text) // Only real press releases with content
          .map(item => ({
            title: item.title,
            description: item.text,
            url: item.url || '#',
            source: `${randomSymbol} Official`,
            publishedAt: item.date || new Date().toISOString(),
            priority: 'medium',
            type: 'fmp_press_release',
            symbol: randomSymbol,
            realSource: true
          }));
      }
      
      return [];
    } catch (error) {
      console.log('⚠️ [FMP] Press releases fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Process REAL FMP articles with deduplication and quality enhancement
   */
  processRealArticlesFmp(articles) {
    // Remove duplicates by title
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );
    
    // Filter out any remaining synthetic content
    const realArticles = uniqueArticles.filter(article => 
      article.realSource === true &&
      article.description &&
      article.description.length > 100 && // Substantial content only
      !article.title.includes('Federal Reserve Policy Analysis') &&
      !article.title.includes('Technology Sector Analysis') &&
      !article.title.includes('Market Risk Analysis')
    );
    
    // Sort by priority and recency
    const sortedArticles = realArticles.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by date
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
    
    // Take top 10 real articles for AI processing
    const topArticles = sortedArticles.slice(0, 10);
    
    // Enhance with metadata
    return topArticles.map(article => ({
      ...article,
      contentLength: article.description?.length || 0,
      hasSubstantialContent: (article.description?.length || 0) > 100,
      sourceName: this.extractSourceName(article.source),
      marketRelevant: true,
      fmpSource: true,
      realData: true
    }));
  }

  /**
   * Extract clean source name
   */
  extractSourceName(source) {
    if (!source) return 'FMP Financial News';
    
    // Clean up source names but keep real ones
    const realSources = ['Reuters', 'Bloomberg', 'Barrons', 'MarketWatch', 'CNBC', 'Financial Times'];
    const foundRealSource = realSources.find(realSource => 
      source.toLowerCase().includes(realSource.toLowerCase())
    );
    
    if (foundRealSource) return foundRealSource;
    
    // Return as-is for real sources
    return source;
  }

  /**
   * Clear cache
   */
  clearCache() {
    newsCache.flushAll();
    console.log('✅ FMP news cache cleared');
  }
}

export default new FmpNewsService();
