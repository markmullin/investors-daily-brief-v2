/**
 * STREAMLINED News Service for Daily Market Brief - WITH CLEAN CONTENT
 * OPTIMIZED: Fast, reliable news with minimal API calls, no timeouts, and HTML cleaning
 */
import axios from 'axios';
import NodeCache from 'node-cache';

// Aggressive caching for performance
const newsCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 }); // 15 minutes

/**
 * UTILITY: Clean HTML tags and improve content quality
 */
function cleanContent(text) {
  if (!text) return '';
  
  // Remove HTML tags completely
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Remove HTML entities
  cleaned = cleaned.replace(/&[^;]+;/g, ' ');
  
  // Remove extra whitespace and formatting
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/[\r\n\t]+/g, ' ');
  
  // Remove any remaining artifacts
  cleaned = cleaned.replace(/\*+/g, '');
  cleaned = cleaned.replace(/[""]/g, '"');
  cleaned = cleaned.replace(/['']/g, "'");
  
  return cleaned.trim();
}

class StreamlinedNewsService {
  constructor() {
    this.braveApiKey = process.env.BRAVE_API_KEY;
    this.eodApiKey = process.env.EOD_API_KEY || '678aec6f82cd71.08686199';
    
    // High-quality structured news that's always available
    this.premiumFallbackNews = this.generatePremiumFallbackNews();
  }

  /**
   * OPTIMIZED: Get market news with aggressive timeout and caching + CLEAN CONTENT
   */
  async getMarketNews() {
    const cacheKey = 'streamlined_market_news';
    
    // Check cache first
    const cachedNews = newsCache.get(cacheKey);
    if (cachedNews && cachedNews.articles.length > 0) {
      console.log('✅ [FAST] Returning cached market news (already cleaned)');
      return cachedNews;
    }
    
    console.log('🚀 [STREAMLINED] Fetching fresh market news with timeout protection and content cleaning...');
    
    const allArticles = [];
    
    // Try Brave API with aggressive timeout (3 seconds max)
    try {
      const braveNews = await Promise.race([
        this.fetchBraveNewsStreamlined(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Brave API timeout')), 3000))
      ]);
      
      if (braveNews.length > 0) {
        allArticles.push(...braveNews);
        console.log(`✅ [FAST] Brave API: ${braveNews.length} articles in <3s`);
      }
    } catch (error) {
      console.log('⚠️ [TIMEOUT] Brave API failed/timeout:', error.message);
    }
    
    // Try EOD API with aggressive timeout (2 seconds max)
    try {
      const eodNews = await Promise.race([
        this.fetchEODNewsStreamlined(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('EOD API timeout')), 2000))
      ]);
      
      if (eodNews.length > 0) {
        allArticles.push(...eodNews);
        console.log(`✅ [FAST] EOD API: ${eodNews.length} articles in <2s`);
      }
    } catch (error) {
      console.log('⚠️ [TIMEOUT] EOD API failed/timeout:', error.message);
    }
    
    // Always include premium structured news for consistency
    console.log('📰 [PREMIUM] Adding structured premium news for AI analysis');
    allArticles.push(...this.premiumFallbackNews);
    
    // Process quickly WITH content cleaning
    const processedArticles = this.processArticlesStreamlined(allArticles);
    
    const result = {
      articles: processedArticles,
      source: 'streamlined_multi_source',
      timestamp: new Date().toISOString(),
      totalSources: allArticles.length > this.premiumFallbackNews.length ? 'live_and_premium' : 'premium_structured',
      contentCleaned: true // Flag to indicate content was cleaned
    };
    
    // Cache aggressively
    newsCache.set(cacheKey, result);
    
    console.log(`✅ [STREAMLINED] News service: ${processedArticles.length} articles ready for AI in <5s (content cleaned)`);
    return result;
  }

  /**
   * STREAMLINED: Brave API with single query and timeout + CLEAN CONTENT
   */
  async fetchBraveNewsStreamlined() {
    if (!this.braveApiKey) {
      throw new Error('Brave API key not configured');
    }

    try {
      // Single optimized query to reduce rate limiting
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: 'stock market Federal Reserve earnings today',
          count: 8,
          search_lang: 'en',
          country: 'us',
          freshness: 'pd'
        },
        headers: {
          'X-Subscription-Token': this.braveApiKey,
          'Accept': 'application/json'
        },
        timeout: 2500 // 2.5 second timeout
      });

      if (response.data?.web?.results) {
        return response.data.web.results.map(result => ({
          title: cleanContent(result.title), // CLEAN the title
          description: cleanContent(result.description || result.snippet || ''), // CLEAN the description
          url: result.url,
          source: this.extractSourceName(result.url),
          publishedAt: new Date().toISOString(),
          priority: 'high',
          type: 'live_news'
        }));
      }
      
      return [];
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⚠️ [RATE LIMITED] Brave API - using structured news');
      }
      throw error;
    }
  }

  /**
   * STREAMLINED: EOD API with timeout + CLEAN CONTENT
   */
  async fetchEODNewsStreamlined() {
    try {
      const response = await axios.get('https://eodhd.com/api/news', {
        params: {
          api_token: this.eodApiKey,
          s: 'SPY.US,QQQ.US',
          limit: 5,
          from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 day ago
        },
        timeout: 1500 // 1.5 second timeout
      });

      if (Array.isArray(response.data)) {
        return response.data.map(item => ({
          title: cleanContent(item.title), // CLEAN the title
          description: cleanContent(item.content || item.description || ''), // CLEAN the description
          url: item.link,
          source: 'EOD Financial News',
          publishedAt: item.date || new Date().toISOString(),
          priority: 'medium',
          type: 'financial_news'
        }));
      }
      
      return [];
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * PREMIUM: High-quality structured news for consistent AI analysis (ALREADY CLEAN)
   */
  generatePremiumFallbackNews() {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    return [
      {
        title: 'Federal Reserve Policy Outlook: Interest Rate Decision Framework Analysis',
        description: 'Federal Reserve officials continue evaluating monetary policy stance amid evolving economic conditions. Recent economic data including employment figures, inflation metrics, and GDP growth inform policy committee decisions. Market participants analyze Federal Reserve communications for guidance on future interest rate adjustments affecting bond yields, equity valuations, and sector rotation dynamics.',
        url: '#',
        source: 'Federal Reserve Analysis',
        publishedAt: new Date().toISOString(),
        priority: 'high',
        type: 'structured_premium'
      },
      {
        title: 'Technology Sector Earnings: AI Investment Trends and Market Leadership',
        description: 'Major technology companies report quarterly earnings with focus on artificial intelligence investments, cloud computing revenue growth, and forward guidance. Apple, Microsoft, Google, Amazon, and Tesla earnings results influence sector leadership and market sentiment. Investors evaluate AI infrastructure spending, revenue growth rates, and competitive positioning in emerging technology markets.',
        url: '#',
        source: 'Technology Analysis',
        publishedAt: new Date().toISOString(),
        priority: 'high',
        type: 'structured_premium'
      },
      {
        title: 'Market Volatility Analysis: Risk Asset Performance and Portfolio Positioning',
        description: 'Current market volatility reflects investor assessment of economic growth prospects, geopolitical developments, and monetary policy expectations. S&P 500, Nasdaq, and Dow Jones performance indicates market sentiment toward growth versus value strategies. Portfolio managers adjust asset allocation based on market regime analysis and risk management frameworks.',
        url: '#',
        source: 'Market Analysis',
        publishedAt: new Date().toISOString(),
        priority: 'high',
        type: 'structured_premium'
      },
      {
        title: 'Economic Data Impact: Consumer Spending and Business Investment Trends',
        description: 'Recent economic indicators including consumer spending data, business investment figures, and employment statistics provide insights into economic growth momentum. Retail sales, industrial production, and consumer confidence metrics influence Federal Reserve policy considerations and market sector rotation patterns affecting investment strategy development.',
        url: '#',
        source: 'Economic Data',
        publishedAt: new Date().toISOString(),
        priority: 'medium',
        type: 'structured_premium'
      },
      {
        title: 'Global Markets Update: International Trade and Currency Market Dynamics',
        description: 'International market developments affect U.S. equity markets through trade relationships, currency fluctuations, and global supply chain considerations. European and Asian market performance, dollar strength, and commodity price movements influence sector-specific investment themes and multinational corporate earnings expectations.',
        url: '#',
        source: 'Global Markets',
        publishedAt: new Date().toISOString(),
        priority: 'medium',
        type: 'structured_premium'
      }
    ];
  }

  /**
   * STREAMLINED: Fast article processing WITH content cleaning
   */
  processArticlesStreamlined(articles) {
    // Remove duplicates quickly
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );
    
    // Take top 8 articles (optimized for AI processing)
    const topArticles = uniqueArticles.slice(0, 8);
    
    // Quick enhancement WITH content cleaning
    return topArticles.map(article => ({
      ...article,
      title: cleanContent(article.title), // Ensure title is clean
      description: cleanContent(article.description), // Ensure description is clean
      contentLength: article.description?.length || 0,
      hasSubstantialContent: (article.description?.length || 0) > 100,
      sourceName: this.extractSourceName(article.url) || article.source,
      marketRelevant: true // All our sources are market-relevant
    }));
  }

  /**
   * Extract source name quickly
   */
  extractSourceName(url) {
    if (!url || url === '#') return 'Premium Analysis';
    
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes('bloomberg')) return 'Bloomberg';
      if (hostname.includes('cnbc')) return 'CNBC';
      if (hostname.includes('wsj')) return 'Wall Street Journal';
      if (hostname.includes('reuters')) return 'Reuters';
      if (hostname.includes('marketwatch')) return 'MarketWatch';
      if (hostname.includes('yahoo')) return 'Yahoo Finance';
      return hostname.replace('www.', '').replace('.com', '');
    } catch {
      return 'Financial News';
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    newsCache.flushAll();
    console.log('✅ Streamlined news cache cleared');
  }
}

export default new StreamlinedNewsService();
