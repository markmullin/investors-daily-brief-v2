/**
 * OPTIMIZED FMP NEWS SERVICE
 * Uses ONLY the highest quality sources available from FMP
 * Focus: Best possible investor-relevant content
 */
import 'dotenv/config';
import axios from 'axios';

class OptimizedFmpNewsService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.baseUrl = 'https://financialmodelingprep.com/api';
    
    if (!this.fmpApiKey) {
      console.error('❌ FMP API key not configured');
    }
    
    console.log('✅ Optimized FMP News Service initialized');
  }

  /**
   * Get the highest quality financial news from FMP
   * Combines best endpoints for maximum investor relevance
   */
  async getBestFinancialNews() {
    console.log('🚀 Getting BEST quality financial news from FMP...');
    
    const allArticles = [];
    const errors = [];
    
    // Priority 1: FMP Professional Articles (highest quality)
    try {
      const fmpArticles = await this.getFmpProfessionalArticles();
      allArticles.push(...fmpArticles.map(a => ({ ...a, sourceType: 'professional', priority: 'high' })));
      console.log(`✅ FMP Articles: ${fmpArticles.length} professional articles`);
    } catch (error) {
      errors.push('FMP Articles failed');
      console.log('⚠️ FMP Articles failed:', error.message);
    }
    
    // Priority 2: Major Company News (focused on blue chips)
    try {
      const majorNews = await this.getMajorCompanyNews();
      allArticles.push(...majorNews.map(a => ({ ...a, sourceType: 'major_company', priority: 'high' })));
      console.log(`✅ Major Company News: ${majorNews.length} articles`);
    } catch (error) {
      errors.push('Major Company News failed');
      console.log('⚠️ Major Company News failed:', error.message);
    }
    
    // Priority 3: Official Press Releases (authoritative)
    try {
      const pressReleases = await this.getOfficialPressReleases();
      allArticles.push(...pressReleases.map(a => ({ ...a, sourceType: 'official', priority: 'medium' })));
      console.log(`✅ Press Releases: ${pressReleases.length} official announcements`);
    } catch (error) {
      errors.push('Press Releases failed');
      console.log('⚠️ Press Releases failed:', error.message);
    }
    
    // Priority 4: General Financial News (backup)
    if (allArticles.length < 3) {
      try {
        const generalNews = await this.getGeneralFinancialNews();
        allArticles.push(...generalNews.map(a => ({ ...a, sourceType: 'general', priority: 'medium' })));
        console.log(`✅ General News: ${generalNews.length} additional articles`);
      } catch (error) {
        errors.push('General News failed');
        console.log('⚠️ General News failed:', error.message);
      }
    }
    
    // Process and rank articles
    const processedArticles = this.processAndRankArticles(allArticles);
    
    const result = {
      articles: processedArticles,
      source: 'optimized_fmp_sources',
      timestamp: new Date().toISOString(),
      qualityScore: this.calculateOverallQuality(processedArticles),
      errors: errors
    };
    
    console.log(`✅ Final result: ${processedArticles.length} high-quality articles (Quality: ${result.qualityScore}/10)`);
    return result;
  }

  /**
   * Get FMP's own professional articles (highest quality)
   */
  async getFmpProfessionalArticles() {
    const response = await axios.get(`${this.baseUrl}/v4/articles`, {
      params: {
        page: 0,
        size: 10,
        apikey: this.fmpApiKey
      },
      timeout: 6000
    });
    
    if (Array.isArray(response.data)) {
      return response.data.map(article => ({
        title: article.title || 'FMP Analysis',
        description: article.content || article.text || '',
        url: article.url || '#',
        source: 'Financial Modeling Prep',
        publishedAt: article.date || new Date().toISOString(),
        symbol: article.tickers || null,
        type: 'fmp_professional'
      }));
    }
    
    return [];
  }

  /**
   * Get news focused on major companies
   */
  async getMajorCompanyNews() {
    const majorTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
    
    const response = await axios.get(`${this.baseUrl}/v3/stock_news`, {
      params: {
        tickers: majorTickers.join(','),
        limit: 20,
        apikey: this.fmpApiKey
      },
      timeout: 6000
    });
    
    if (Array.isArray(response.data)) {
      return response.data
        .filter(article => this.isQualitySource(article.site))
        .map(article => ({
          title: article.title || 'Market Update',
          description: article.text || article.summary || '',
          url: article.url || '#',
          source: this.cleanSourceName(article.site),
          publishedAt: article.publishedDate || new Date().toISOString(),
          symbol: article.symbol || null,
          type: 'major_company_news'
        }));
    }
    
    return [];
  }

  /**
   * Get official company press releases
   */
  async getOfficialPressReleases() {
    const articles = [];
    const companies = ['AAPL', 'MSFT', 'GOOGL'];
    
    for (const ticker of companies) {
      try {
        const response = await axios.get(`${this.baseUrl}/v3/press-releases/${ticker}`, {
          params: {
            limit: 3,
            apikey: this.fmpApiKey
          },
          timeout: 4000
        });
        
        if (Array.isArray(response.data)) {
          const pressReleases = response.data.map(article => ({
            title: article.title || `${ticker} Update`,
            description: article.text || article.content || '',
            url: article.url || '#',
            source: `${ticker} Official`,
            publishedAt: article.date || new Date().toISOString(),
            symbol: ticker,
            type: 'press_release'
          }));
          
          articles.push(...pressReleases);
        }
      } catch (error) {
        console.log(`⚠️ Press releases for ${ticker} failed`);
      }
    }
    
    return articles;
  }

  /**
   * Get general financial news as backup
   */
  async getGeneralFinancialNews() {
    const response = await axios.get(`${this.baseUrl}/v4/general_news`, {
      params: {
        page: 0,
        size: 15,
        apikey: this.fmpApiKey
      },
      timeout: 6000
    });
    
    if (Array.isArray(response.data)) {
      return response.data
        .filter(article => this.isQualitySource(article.site))
        .slice(0, 5)
        .map(article => ({
          title: article.title || 'Financial News',
          description: article.text || article.content || '',
          url: article.url || '#',
          source: this.cleanSourceName(article.site),
          publishedAt: article.publishedDate || article.date || new Date().toISOString(),
          type: 'general_financial'
        }));
    }
    
    return [];
  }

  /**
   * Check if source is investor-quality
   */
  isQualitySource(source) {
    if (!source) return false;
    
    const qualitySources = [
      'marketwatch.com',
      'finance.yahoo.com',
      'benzinga.com',
      'seekingalpha.com',
      'morningstar.com',
      'zacks.com',
      'thestreet.com',
      'fool.com',
      'financialnews.com',
      'investopedia.com'
    ];
    
    const lowQualitySources = [
      'youtube.com',
      'reddit.com',
      'twitter.com',
      'facebook.com'
    ];
    
    const sourceLower = source.toLowerCase();
    
    // Reject low quality sources
    if (lowQualitySources.some(bad => sourceLower.includes(bad))) {
      return false;
    }
    
    // Accept high quality sources
    if (qualitySources.some(good => sourceLower.includes(good))) {
      return true;
    }
    
    // Accept financial/business related sources
    if (sourceLower.includes('financial') || 
        sourceLower.includes('business') || 
        sourceLower.includes('market') ||
        sourceLower.includes('investor')) {
      return true;
    }
    
    // Accept press releases and newswires (but lower priority)
    if (sourceLower.includes('wire') || sourceLower.includes('release')) {
      return true;
    }
    
    return false;
  }

  /**
   * Clean and standardize source names
   */
  cleanSourceName(source) {
    if (!source) return 'Financial News';
    
    const cleanMappings = {
      'marketwatch.com': 'MarketWatch',
      'finance.yahoo.com': 'Yahoo Finance',
      'benzinga.com': 'Benzinga',
      'seekingalpha.com': 'Seeking Alpha',
      'morningstar.com': 'Morningstar',
      'zacks.com': 'Zacks',
      'thestreet.com': 'TheStreet',
      'fool.com': 'Motley Fool',
      'businesswire.com': 'Business Wire',
      'globenewswire.com': 'GlobeNewswire',
      'prnewswire.com': 'PR Newswire'
    };
    
    for (const [domain, name] of Object.entries(cleanMappings)) {
      if (source.toLowerCase().includes(domain)) {
        return name;
      }
    }
    
    return source.length > 25 ? source.substring(0, 25) + '...' : source;
  }

  /**
   * Process and rank articles by quality
   */
  processAndRankArticles(articles) {
    // Remove duplicates
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );
    
    // Score articles
    const scoredArticles = uniqueArticles.map(article => ({
      ...article,
      qualityScore: this.calculateArticleQuality(article),
      contentLength: (article.description || '').length,
      hasSubstantialContent: (article.description || '').length > 100
    }));
    
    // Sort by quality score
    const sortedArticles = scoredArticles.sort((a, b) => b.qualityScore - a.qualityScore);
    
    // Return top 6 articles
    return sortedArticles.slice(0, 6);
  }

  /**
   * Calculate article quality score
   */
  calculateArticleQuality(article) {
    let score = 0;
    
    // Source type bonus
    if (article.sourceType === 'professional') score += 10;
    if (article.sourceType === 'official') score += 8;
    if (article.sourceType === 'major_company') score += 6;
    
    // Source quality bonus
    const source = (article.source || '').toLowerCase();
    if (source.includes('marketwatch') || source.includes('morningstar')) score += 8;
    if (source.includes('yahoo finance') || source.includes('benzinga')) score += 6;
    if (source.includes('financial modeling prep')) score += 7;
    if (source.includes('official')) score += 9;
    
    // Content quality
    const contentLength = (article.description || '').length;
    if (contentLength > 200) score += 5;
    if (contentLength > 100) score += 3;
    
    // Recent news bonus
    const hoursOld = (Date.now() - new Date(article.publishedAt)) / (1000 * 60 * 60);
    if (hoursOld < 24) score += 3;
    if (hoursOld < 6) score += 2;
    
    return score;
  }

  /**
   * Calculate overall quality score for the news set
   */
  calculateOverallQuality(articles) {
    if (articles.length === 0) return 0;
    
    const avgQuality = articles.reduce((sum, article) => sum + article.qualityScore, 0) / articles.length;
    const professionalCount = articles.filter(a => a.sourceType === 'professional').length;
    const hasSubstantialContent = articles.filter(a => a.hasSubstantialContent).length;
    
    const qualityScore = Math.min(10, 
      (avgQuality / 10) * 4 +
      (professionalCount / articles.length) * 3 +
      (hasSubstantialContent / articles.length) * 3
    );
    
    return Math.round(qualityScore * 10) / 10;
  }
}

export default new OptimizedFmpNewsService();