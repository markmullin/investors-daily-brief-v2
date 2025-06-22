/**
 * PREMIUM FMP NEWS SERVICE - LOWERED THRESHOLDS
 * More permissive filtering to get 5 articles from top 3 sources
 */
import 'dotenv/config';
import axios from 'axios';

class PremiumFmpNewsService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.baseUrl = 'https://financialmodelingprep.com/api';
    
    // TOP 3 PREMIUM SOURCES ONLY (in priority order)
    this.premiumSources = [
      'reuters.com',       // Highest priority
      'morningstar.com',   // Second priority  
      'marketwatch.com'    // Third priority
    ];
    
    console.log('✅ Premium FMP News Service (Lowered thresholds for more articles)');
  }

  /**
   * Get 5 premium articles with more permissive filtering
   */
  async getPremiumFinancialNews() {
    console.log('🚀 Getting TOP 5 premium articles (permissive filtering)...');
    
    const allArticles = [];
    
    // Get articles from multiple endpoints
    console.log('📰 Trying multiple FMP endpoints for better coverage...');
    
    // Endpoint 1: General news
    const generalNews = await this.getNewsFromEndpoint(`${this.baseUrl}/v4/general_news`, { page: 0, size: 100 });
    allArticles.push(...generalNews);
    console.log(`✅ General news: ${generalNews.length} articles`);
    
    // Endpoint 2: FMP articles
    const fmpArticles = await this.getNewsFromEndpoint(`${this.baseUrl}/v3/fmp/articles`, { page: 0, size: 100 });
    allArticles.push(...fmpArticles);
    console.log(`✅ FMP articles: ${fmpArticles.length} articles`);
    
    // Endpoint 3: Stock news
    const stockNews = await this.getNewsFromEndpoint(`${this.baseUrl}/v3/stock_news`, { limit: 100 });
    allArticles.push(...stockNews);
    console.log(`✅ Stock news: ${stockNews.length} articles`);
    
    console.log(`📊 Total articles collected: ${allArticles.length}`);
    
    // Process with very permissive filtering
    const processedArticles = this.getTop5ArticlesPermissive(allArticles);
    
    const result = {
      articles: processedArticles,
      source: 'permissive_top_3_premium',
      timestamp: new Date().toISOString(),
      qualityScore: this.calculatePremiumQuality(processedArticles),
      minimumQuality: 6, // Much lower threshold
      sourceTypes: [...new Set(processedArticles.map(a => a.sourceType))],
      premiumSources: this.premiumSources,
      permissiveMode: true,
      targetArticles: 5
    };
    
    console.log(`✅ Final result: ${processedArticles.length} articles (Quality: ${result.qualityScore}/10)`);
    
    // Show source breakdown
    const foundSources = [...new Set(processedArticles.map(a => a.source))];
    console.log(`🔍 Sources: ${foundSources.join(', ')}`);
    
    return result;
  }

  /**
   * Get news from any FMP endpoint
   */
  async getNewsFromEndpoint(url, params) {
    const articles = [];
    
    try {
      const response = await axios.get(url, {
        params: { ...params, apikey: this.fmpApiKey },
        timeout: 10000
      });
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log(`📊 Retrieved ${response.data.length} articles from ${url}`);
        
        // Filter for top 3 sources and recent articles
        const filteredArticles = response.data
          .filter(article => this.isTop3Source(article.site || article.source))
          .filter(article => this.isRecentEnough(article.publishedDate || article.date))
          .map(article => ({
            title: article.title || 'Premium Financial News',
            description: this.getFullContent(article),
            url: article.url || '#',
            source: this.getTop3SourceName(article.site || article.source),
            publishedAt: article.publishedDate || article.date || new Date().toISOString(),
            type: 'permissive_premium_news',
            sourceType: 'permissive_premium',
            qualityRating: this.getSourceRating(article.source || article.site)
          }));
        
        console.log(`✅ Found ${filteredArticles.length} top 3 source articles from this endpoint`);
        
        // Show what sources we found
        const sources = [...new Set(filteredArticles.map(a => a.source))];
        if (sources.length > 0) {
          console.log(`   Sources: ${sources.join(', ')}`);
        }
        
        articles.push(...filteredArticles);
      }
    } catch (error) {
      console.log(`⚠️ Endpoint ${url} failed: ${error.message}`);
    }
    
    return articles;
  }

  /**
   * More permissive top 5 selection
   */
  getTop5ArticlesPermissive(articles) {
    console.log(`\n🔍 Processing ${articles.length} articles with permissive filtering...`);
    
    // Remove duplicates
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );
    console.log(`📊 After deduplication: ${uniqueArticles.length} articles`);
    
    // Very permissive scoring and filtering
    const scoredArticles = uniqueArticles
      .map(article => ({
        ...article,
        qualityScore: this.calculatePermissiveQualityScore(article),
        contentLength: (article.description || '').length,
        hoursOld: this.getHoursOld(article.publishedAt),
        daysOld: Math.round(this.getHoursOld(article.publishedAt) / 24),
        hasMinimalContent: (article.description || '').length > 50 // Much lower threshold
      }))
      .filter(article => {
        // Very permissive filtering
        const passes = article.qualityScore >= 10 && article.hasMinimalContent;
        if (!passes) {
          console.log(`❌ Filtered out: ${article.title} - Quality: ${article.qualityScore}, Content: ${article.contentLength}`);
        }
        return passes;
      });
    
    console.log(`📊 After permissive quality filter: ${scoredArticles.length} articles`);
    
    // Sort by quality and take top 5
    const sortedArticles = scoredArticles.sort((a, b) => {
      // First sort by source priority, then by quality score
      const aPriority = this.getSourcePriority(a.source);
      const bPriority = this.getSourcePriority(b.source);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower number = higher priority
      }
      
      return b.qualityScore - a.qualityScore; // Higher score = better
    });
    
    // Take top 5, but ensure we get variety if possible
    const top5Articles = this.ensureSourceVariety(sortedArticles).slice(0, 5);
    
    console.log(`📊 Final selection:`);
    top5Articles.forEach((article, i) => {
      console.log(`${i + 1}. ${article.source} (${article.daysOld}d) - ${article.qualityScore} pts - ${article.title.substring(0, 60)}...`);
    });
    
    return top5Articles;
  }

  /**
   * Ensure we get variety in sources if possible
   */
  ensureSourceVariety(sortedArticles) {
    const result = [];
    const sourcesSeen = new Set();
    
    // First pass: take one from each source
    for (const article of sortedArticles) {
      if (!sourcesSeen.has(article.source) && result.length < 5) {
        result.push(article);
        sourcesSeen.add(article.source);
      }
    }
    
    // Second pass: fill remaining slots with best remaining articles
    for (const article of sortedArticles) {
      if (result.length >= 5) break;
      if (!result.includes(article)) {
        result.push(article);
      }
    }
    
    return result;
  }

  /**
   * More permissive quality scoring
   */
  calculatePermissiveQualityScore(article) {
    let score = 0;
    
    // Source priority (high base scores)
    const source = (article.source || '').toLowerCase();
    if (source.includes('reuters')) score += 15;
    if (source.includes('morningstar')) score += 14;
    if (source.includes('marketwatch')) score += 13;
    
    // Content length (lower requirements)
    const contentLength = (article.description || '').length;
    if (contentLength > 500) score += 5;
    else if (contentLength > 200) score += 3;
    else if (contentLength > 100) score += 2;
    else if (contentLength > 50) score += 1;
    
    // Recency (generous)
    const hoursOld = this.getHoursOld(article.publishedAt);
    if (hoursOld <= 24) score += 8;
    else if (hoursOld <= 48) score += 6;
    else if (hoursOld <= 72) score += 4;
    else if (hoursOld <= 168) score += 2; // Still give points for week-old
    
    return score;
  }

  /**
   * Check if article is recent enough (2 weeks)
   */
  isRecentEnough(publishedDate) {
    if (!publishedDate) return false;
    const articleDate = new Date(publishedDate);
    const now = new Date();
    const hoursOld = (now - articleDate) / (1000 * 60 * 60);
    return hoursOld <= 336; // 2 weeks (14 days)
  }

  // Helper methods (same as before)
  isTop3Source(source) {
    if (!source) return false;
    const sourceLower = source.toLowerCase();
    const isTop3 = this.premiumSources.some(premium => sourceLower.includes(premium));
    if (isTop3) {
      console.log(`✅ Top 3 source detected: ${source}`);
    }
    return isTop3;
  }

  getSourcePriority(source) {
    if (!source) return 999;
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('reuters')) return 1;
    if (sourceLower.includes('morningstar')) return 2;
    if (sourceLower.includes('marketwatch')) return 3;
    return 999;
  }

  getTop3SourceName(source) {
    if (!source) return 'Premium Financial';
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('reuters')) return 'Reuters';
    if (sourceLower.includes('morningstar')) return 'Morningstar';
    if (sourceLower.includes('marketwatch')) return 'MarketWatch';
    return source;
  }

  getSourceRating(source) {
    const sourceLower = (source || '').toLowerCase();
    if (sourceLower.includes('reuters')) return 10;
    if (sourceLower.includes('morningstar')) return 9;
    if (sourceLower.includes('marketwatch')) return 9;
    return 8;
  }

  getHoursOld(publishedDate) {
    if (!publishedDate) return 999;
    const articleDate = new Date(publishedDate);
    const now = new Date();
    return (now - articleDate) / (1000 * 60 * 60);
  }

  getFullContent(article) {
    const content = article.text || article.content || article.summary || article.description || '';
    if (!content) return '';
    return content.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim();
  }

  calculatePremiumQuality(articles) {
    if (articles.length === 0) return 0;
    const avgQuality = articles.reduce((sum, article) => sum + (article.qualityScore || 0), 0) / articles.length;
    return Math.min(10, avgQuality / 2);
  }
}

export default new PremiumFmpNewsService();