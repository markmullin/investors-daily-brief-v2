/**
 * ENHANCED FMP NEWS SERVICE - COMPLETE NEWS ECOSYSTEM
 * Maximizes all FMP Ultimate API news endpoints for comprehensive market coverage
 * Includes social sentiment, specialized news types, and source analysis
 */
import axios from 'axios';
import NodeCache from 'node-cache';

const newsCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 }); // 15 minutes

class EnhancedFmpNewsService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.baseUrl = 'https://financialmodelingprep.com/api';
    
    // Track which sources are consistently available
    this.knownWorkingSources = ['Reuters', 'Barrons', 'MarketWatch', 'Financial Times'];
    this.problematicSources = ['Bloomberg', 'CNBC']; // User reported issues
    
    console.log('🚀 Enhanced FMP News Service - Complete News Ecosystem Initialized');
  }

  /**
   * ========================================
   * COMPREHENSIVE NEWS AGGREGATION METHODS
   * ========================================
   */

  /**
   * Get comprehensive market news from ALL FMP endpoints
   */
  async getCompleteMarketNews() {
    const cacheKey = 'complete_fmp_news';
    
    const cachedNews = newsCache.get(cacheKey);
    if (cachedNews) {
      console.log('📦 [CACHE] Returning cached complete news');
      return cachedNews;
    }
    
    console.log('🌟 [FMP COMPLETE] Fetching from ALL news endpoints...');
    
    // Fetch from ALL available FMP news endpoints
    const newsPromises = [
      this.fetchGeneralNews(),           // Macro/economic news
      this.fetchStockNews(),             // Company-specific news  
      this.fetchFmpArticles(),           // Professional analysis
      this.fetchPressReleases(),         // Official announcements
      this.fetchForexNews(),             // Currency/international
      this.fetchCryptoNews(),            // Digital assets
      this.fetchEarningsCalendarNews(),  // Earnings-related
      this.fetchAnalystNews(),           // Analyst actions
      this.fetchMarketMovingNews()       // Volume/momentum based
    ];
    
    const results = await Promise.allSettled(newsPromises);
    
    const newsData = {
      general: [],
      stocks: [],
      analysis: [],
      pressReleases: [],
      forex: [],
      crypto: [],
      earnings: [],
      analyst: [],
      marketMoving: []
    };
    
    // Collect results from each endpoint
    results.forEach((result, index) => {
      const categories = ['general', 'stocks', 'analysis', 'pressReleases', 'forex', 'crypto', 'earnings', 'analyst', 'marketMoving'];
      const category = categories[index];
      
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        newsData[category] = result.value;
        console.log(`✅ [${category.toUpperCase()}] ${result.value.length} articles`);
      } else {
        console.log(`⚠️ [${category.toUpperCase()}] Failed:`, result.reason?.message);
      }
    });
    
    // Analyze news sources
    const sourceAnalysis = this.analyzeNewsSources(newsData);
    
    const result = {
      ...newsData,
      sourceAnalysis,
      summary: {
        totalArticles: Object.values(newsData).reduce((sum, arr) => sum + arr.length, 0),
        sourceBreakdown: sourceAnalysis.sourceBreakdown,
        qualitySources: sourceAnalysis.qualitySources,
        timestamp: new Date().toISOString()
      }
    };
    
    newsCache.set(cacheKey, result);
    console.log(`🎯 [COMPLETE] ${result.summary.totalArticles} total articles from ${Object.keys(sourceAnalysis.sourceBreakdown).length} sources`);
    
    return result;
  }

  /**
   * ========================================
   * INDIVIDUAL NEWS ENDPOINT METHODS
   * ========================================
   */

  /**
   * 1. GENERAL MARKET NEWS - Macro/Economic
   */
  async fetchGeneralNews() {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/general_news`, {
        params: {
          page: 0,
          size: 30,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      return this.processNewsResponse(response.data, 'general', {
        priority: 'high',
        category: 'macro_economic'
      });
    } catch (error) {
      console.log('⚠️ General news failed:', error.message);
      return [];
    }
  }

  /**
   * 2. STOCK-SPECIFIC NEWS - Company focused
   */
  async fetchStockNews() {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/stock_news`, {
        params: {
          limit: 50,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      return this.processNewsResponse(response.data, 'stock', {
        priority: 'high',
        category: 'company_specific'
      });
    } catch (error) {
      console.log('⚠️ Stock news failed:', error.message);
      return [];
    }
  }

  /**
   * 3. FMP PROFESSIONAL ANALYSIS
   */
  async fetchFmpArticles() {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/articles`, {
        params: {
          page: 0,
          size: 20,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      return this.processNewsResponse(response.data, 'article', {
        priority: 'medium',
        category: 'professional_analysis',
        source: 'FMP Professional Analysis'
      });
    } catch (error) {
      console.log('⚠️ FMP articles failed:', error.message);
      return [];
    }
  }

  /**
   * 4. PRESS RELEASES - Official announcements
   */
  async fetchPressReleases() {
    try {
      // Get press releases from multiple major companies
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'BAC'];
      const selectedSymbols = symbols.slice(0, 3); // Get from 3 companies
      
      const promises = selectedSymbols.map(symbol => 
        axios.get(`${this.baseUrl}/v3/press-releases/${symbol}`, {
          params: { limit: 5, apikey: this.fmpApiKey },
          timeout: 6000
        }).catch(err => ({ data: [] }))
      );
      
      const responses = await Promise.all(promises);
      const allReleases = responses.flatMap(r => r.data || []);
      
      return this.processNewsResponse(allReleases, 'press', {
        priority: 'high',
        category: 'official_announcements'
      });
    } catch (error) {
      console.log('⚠️ Press releases failed:', error.message);
      return [];
    }
  }

  /**
   * 5. FOREX NEWS - Currency/International
   */
  async fetchForexNews() {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/forex_news`, {
        params: {
          page: 0,
          size: 15,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      return this.processNewsResponse(response.data, 'forex', {
        priority: 'medium',
        category: 'forex_international'
      });
    } catch (error) {
      console.log('⚠️ Forex news failed (may not be available on your plan):', error.message);
      return [];
    }
  }

  /**
   * 6. CRYPTO NEWS - Digital assets
   */
  async fetchCryptoNews() {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/crypto_news`, {
        params: {
          page: 0,
          size: 15,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      return this.processNewsResponse(response.data, 'crypto', {
        priority: 'low',
        category: 'cryptocurrency'
      });
    } catch (error) {
      console.log('⚠️ Crypto news failed (may not be available on your plan):', error.message);
      return [];
    }
  }

  /**
   * 7. EARNINGS CALENDAR NEWS - Earnings-focused
   */
  async fetchEarningsCalendarNews() {
    try {
      // Get upcoming earnings and fetch related news
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const earningsResponse = await axios.get(`${this.baseUrl}/v3/earning_calendar`, {
        params: {
          from: today,
          to: nextWeek,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      if (earningsResponse.data && earningsResponse.data.length > 0) {
        // Get news for companies with upcoming earnings
        const earningsSymbols = earningsResponse.data.slice(0, 10).map(e => e.symbol).join(',');
        
        const newsResponse = await axios.get(`${this.baseUrl}/v3/stock_news`, {
          params: {
            tickers: earningsSymbols,
            limit: 20,
            apikey: this.fmpApiKey
          },
          timeout: 8000
        });
        
        return this.processNewsResponse(newsResponse.data, 'earnings', {
          priority: 'high',
          category: 'earnings_related'
        });
      }
      
      return [];
    } catch (error) {
      console.log('⚠️ Earnings calendar news failed:', error.message);
      return [];
    }
  }

  /**
   * 8. ANALYST NEWS - Upgrades/Downgrades/Ratings
   */
  async fetchAnalystNews() {
    try {
      // Get recent analyst upgrades/downgrades
      const upgradesResponse = await axios.get(`${this.baseUrl}/v4/upgrades-downgrades-rss-feed`, {
        params: {
          page: 0,
          size: 20,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      return this.processNewsResponse(upgradesResponse.data, 'analyst', {
        priority: 'medium',
        category: 'analyst_actions'
      });
    } catch (error) {
      console.log('⚠️ Analyst news failed:', error.message);
      return [];
    }
  }

  /**
   * 9. MARKET MOVING NEWS - Volume/momentum based
   */
  async fetchMarketMovingNews() {
    try {
      // Get news about current market movers
      const gainersResponse = await axios.get(`${this.baseUrl}/v3/gainers`, {
        params: { apikey: this.fmpApiKey },
        timeout: 6000
      });
      
      if (gainersResponse.data && gainersResponse.data.length > 0) {
        const topMovers = gainersResponse.data.slice(0, 5).map(g => g.symbol).join(',');
        
        const newsResponse = await axios.get(`${this.baseUrl}/v3/stock_news`, {
          params: {
            tickers: topMovers,
            limit: 15,
            apikey: this.fmpApiKey
          },
          timeout: 8000
        });
        
        return this.processNewsResponse(newsResponse.data, 'market_moving', {
          priority: 'high',
          category: 'market_momentum'
        });
      }
      
      return [];
    } catch (error) {
      console.log('⚠️ Market moving news failed:', error.message);
      return [];
    }
  }

  /**
   * ========================================
   * SOCIAL SENTIMENT METHODS
   * ========================================
   */

  /**
   * Get social sentiment for individual stocks
   */
  async getSocialSentiment(symbol, limit = 100) {
    const cacheKey = `social_sentiment_${symbol}`;
    
    const cached = newsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      console.log(`📊 [SOCIAL] Getting sentiment for ${symbol}...`);
      
      const response = await axios.get(`${this.baseUrl}/v4/social-sentiment`, {
        params: {
          symbol: symbol,
          limit: limit,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      const sentimentData = {
        symbol: symbol,
        sentiment: response.data || [],
        summary: this.calculateSentimentSummary(response.data || []),
        timestamp: new Date().toISOString()
      };
      
      newsCache.set(cacheKey, sentimentData, 300); // 5 minute cache
      console.log(`✅ [SOCIAL] ${symbol} sentiment: ${sentimentData.summary.overallSentiment}`);
      
      return sentimentData;
      
    } catch (error) {
      console.log(`⚠️ Social sentiment failed for ${symbol}:`, error.message);
      return { 
        symbol, 
        sentiment: [], 
        summary: { overallSentiment: 'neutral', confidence: 0 },
        error: error.message 
      };
    }
  }

  /**
   * Get trending social sentiment
   */
  async getTrendingSocialSentiment() {
    try {
      console.log('📈 [SOCIAL] Getting trending sentiment...');
      
      const response = await axios.get(`${this.baseUrl}/v4/social-sentiment-trending`, {
        params: {
          limit: 50,
          apikey: this.fmpApiKey
        },
        timeout: 8000
      });
      
      return {
        trending: response.data || [],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.log('⚠️ Trending sentiment failed:', error.message);
      return { trending: [], error: error.message };
    }
  }

  /**
   * ========================================
   * NEWS PROCESSING & ANALYSIS METHODS
   * ========================================
   */

  /**
   * Process news response into standardized format
   */
  processNewsResponse(data, type, options = {}) {
    if (!Array.isArray(data)) return [];
    
    return data
      .filter(item => item.title && (item.text || item.content || item.description))
      .map(item => ({
        title: item.title,
        description: item.text || item.content || item.description || '',
        url: item.url || '#',
        source: options.source || item.site || item.source || 'FMP',
        publishedAt: item.publishedDate || item.date || new Date().toISOString(),
        symbol: item.symbol || null,
        type: type,
        category: options.category || 'general',
        priority: options.priority || 'medium',
        contentLength: (item.text || item.content || item.description || '').length,
        isSubstantial: (item.text || item.content || item.description || '').length > 100
      }))
      .filter(article => article.isSubstantial)
      .slice(0, options.limit || 20);
  }

  /**
   * Analyze news sources across all articles
   */
  analyzeNewsSources(newsData) {
    const allArticles = Object.values(newsData).flat();
    const sourceBreakdown = {};
    const qualitySources = [];
    
    allArticles.forEach(article => {
      const source = article.source || 'Unknown';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
      
      // Check if this is a known quality source
      if (this.knownWorkingSources.some(qs => source.toLowerCase().includes(qs.toLowerCase()))) {
        qualitySources.push({
          source: source,
          title: article.title,
          category: article.category
        });
      }
    });
    
    // Sort sources by frequency
    const sortedSources = Object.entries(sourceBreakdown)
      .sort(([,a], [,b]) => b - a)
      .map(([source, count]) => ({
        source,
        count,
        percentage: ((count / allArticles.length) * 100).toFixed(1),
        isKnownQuality: this.knownWorkingSources.some(qs => source.toLowerCase().includes(qs.toLowerCase())),
        isProblematic: this.problematicSources.some(ps => source.toLowerCase().includes(ps.toLowerCase()))
      }));
    
    return {
      sourceBreakdown,
      sortedSources,
      qualitySources,
      totalSources: Object.keys(sourceBreakdown).length,
      qualitySourceCount: qualitySources.length,
      sourcesFound: sortedSources.map(s => s.source)
    };
  }

  /**
   * Calculate sentiment summary
   */
  calculateSentimentSummary(sentimentData) {
    if (!Array.isArray(sentimentData) || sentimentData.length === 0) {
      return { overallSentiment: 'neutral', confidence: 0, dataPoints: 0 };
    }
    
    const validSentiments = sentimentData.filter(s => s.sentiment !== undefined);
    if (validSentiments.length === 0) {
      return { overallSentiment: 'neutral', confidence: 0, dataPoints: 0 };
    }
    
    const avgSentiment = validSentiments.reduce((sum, s) => sum + (s.sentiment || 0), 0) / validSentiments.length;
    
    let overallSentiment = 'neutral';
    if (avgSentiment > 0.3) overallSentiment = 'positive';
    else if (avgSentiment < -0.3) overallSentiment = 'negative';
    
    return {
      overallSentiment,
      confidence: Math.abs(avgSentiment),
      dataPoints: validSentiments.length,
      averageScore: avgSentiment.toFixed(3)
    };
  }

  /**
   * ========================================
   * UTILITY METHODS
   * ========================================
   */

  /**
   * Get optimized news mix for AI Market Brief
   */
  async getOptimizedNewsForAI() {
    const completeNews = await this.getCompleteMarketNews();
    
    // Select best articles from each category for AI analysis
    const optimizedMix = {
      macroEconomic: completeNews.general.slice(0, 3),
      companyNews: completeNews.stocks.slice(0, 4),
      marketMoving: completeNews.marketMoving.slice(0, 2),
      professionalAnalysis: completeNews.analysis.slice(0, 2),
      earningsRelated: completeNews.earnings.slice(0, 2),
      analystActions: completeNews.analyst.slice(0, 1)
    };
    
    const allSelected = Object.values(optimizedMix).flat();
    
    return {
      articles: allSelected,
      sourceAnalysis: completeNews.sourceAnalysis,
      mix: optimizedMix,
      totalSelected: allSelected.length,
      recommendation: this.generateSourceRecommendations(completeNews.sourceAnalysis)
    };
  }

  /**
   * Generate source quality recommendations
   */
  generateSourceRecommendations(sourceAnalysis) {
    const recommendations = {
      highQuality: [],
      reliable: [],
      avoid: [],
      focus: []
    };
    
    sourceAnalysis.sortedSources.forEach(source => {
      if (source.isKnownQuality && source.count >= 3) {
        recommendations.highQuality.push(`${source.source} (${source.count} articles, ${source.percentage}%)`);
      } else if (source.count >= 5 && !source.isProblematic) {
        recommendations.reliable.push(`${source.source} (${source.count} articles)`);
      } else if (source.isProblematic) {
        recommendations.avoid.push(`${source.source} (known access issues)`);
      }
    });
    
    // Focus recommendations
    if (recommendations.highQuality.length > 0) {
      recommendations.focus.push('Prioritize Reuters, Barrons, Financial Times for premium content');
    }
    if (sourceAnalysis.qualitySourceCount > 10) {
      recommendations.focus.push('Strong source diversity - good for comprehensive analysis');
    }
    if (recommendations.avoid.length > 0) {
      recommendations.focus.push('Filter out problematic sources in AI processing');
    }
    
    return recommendations;
  }

  /**
   * Clear all caches
   */
  clearCache() {
    newsCache.flushAll();
    console.log('✅ Enhanced FMP news cache cleared');
  }

  /**
   * Test all endpoints
   */
  async testAllEndpoints() {
    console.log('🧪 [TEST] Testing all FMP news endpoints...');
    
    const endpoints = [
      { name: 'General News', method: () => this.fetchGeneralNews() },
      { name: 'Stock News', method: () => this.fetchStockNews() },
      { name: 'FMP Articles', method: () => this.fetchFmpArticles() },
      { name: 'Press Releases', method: () => this.fetchPressReleases() },
      { name: 'Social Sentiment', method: () => this.getSocialSentiment('AAPL') },
      { name: 'Forex News', method: () => this.fetchForexNews() },
      { name: 'Crypto News', method: () => this.fetchCryptoNews() }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const data = await endpoint.method();
        const duration = Date.now() - startTime;
        
        results.push({
          endpoint: endpoint.name,
          status: 'SUCCESS',
          count: Array.isArray(data) ? data.length : (data.sentiment?.length || 0),
          duration: `${duration}ms`
        });
        
        console.log(`✅ [TEST] ${endpoint.name}: ${results[results.length-1].count} items (${duration}ms)`);
        
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: 'FAILED',
          error: error.message
        });
        
        console.log(`❌ [TEST] ${endpoint.name}: FAILED - ${error.message}`);
      }
    }
    
    return {
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'SUCCESS').length,
        failed: results.filter(r => r.status === 'FAILED').length
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default new EnhancedFmpNewsService();
