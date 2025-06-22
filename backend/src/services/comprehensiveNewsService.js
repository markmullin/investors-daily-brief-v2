/**
 * COMPREHENSIVE NEWS SERVICE - OPTIMAL APPROACH
 * General Market: Reuters + MarketWatch + Barrons + Investors.com + Business Wire from /v4/general_news
 * Company-Specific: Direct /v3/stock_news?tickers=SYMBOL for each top company individually
 */
import 'dotenv/config';
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15 minutes cache
const marketCapCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache for market caps

class ComprehensiveNewsService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.baseUrl = 'https://financialmodelingprep.com/api';
    
    // APPROVED SOURCES for General Market News (from /v4/general_news)
    this.approvedGeneralSources = [
      'reuters.com',          // Priority 1
      'marketwatch.com',      // Priority 2  
      'barrons.com',          // Priority 3
      'investors.com',        // Priority 4 (IBD)
      'businesswire.com'      // Priority 5 (Corporate news/earnings)
    ];
    
    // TOP 20 COMPANIES BY MARKET CAP (for direct API calls)
    this.topCompanies = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
      'TSM', 'LLY', 'UNH', 'JPM', 'V', 'XOM', 'WMT', 'MA', 'PG', 'JNJ',
      'ORCL', 'HD'
    ];
    
    // BLACKLISTED sources (never allow)
    this.blacklistedSources = [
      'fool.com', 'motleyfool.com', 'seekingalpha.com', 'benzinga.com',
      'zacks.com', 'yahoo.com', 'youtube.com', 'reddit.com', 'twitter.com',
      '247wallst.com', 'investorplace.com', 'thestreet.com'
    ];
    
    // LEGAL/LITIGATION KEYWORDS to filter out
    this.legalKeywords = [
      'class action', 'lawsuit', 'litigation', 'settlement', 'court case',
      'legal action', 'sues', 'sued', 'plaintiff', 'defendant', 'trial',
      'verdict', 'judgment', 'damages', 'filing suit', 'law firm announces',
      'legal proceeding', 'court filing', 'judicial', 'attorney', 'lawyer'
    ];
    
    console.log('📰 Comprehensive News Service initialized (OPTIMAL APPROACH)');
    console.log(`📊 General Market sources: ${this.approvedGeneralSources.join(', ')}`);
    console.log(`🏢 Company-Specific: Direct API calls for top ${this.topCompanies.length} companies`);
    console.log(`❌ Blacklisted: ${this.blacklistedSources.slice(0, 5).join(', ')}...`);
    console.log(`⚖️ Legal content filtered out: ${this.legalKeywords.slice(0, 3).join(', ')}...`);
  }

  /**
   * MAIN METHOD: Get 20 comprehensive news articles
   */
  async getComprehensiveNews() {
    console.log('🚀 Getting comprehensive news with OPTIMAL APPROACH...');
    console.log('📊 General: /v4/general_news with approved sources');
    console.log('🏢 Company: Direct /v3/stock_news?tickers=SYMBOL calls');
    
    try {
      // Step 1: Get 10 general market news from approved sources
      console.log('\n📰 Step 1: Fetching 10 general market news from approved sources...');
      const generalNews = await this.getApprovedGeneralNews(10);
      
      // Step 2: Get 10 company-specific news using direct API calls
      console.log('\n🏢 Step 2: Fetching 10 company-specific news via direct API calls...');
      const companyNews = await this.getDirectCompanyNews(10);
      
      // Step 3: Combine and format
      const allArticles = [
        ...generalNews.map(article => ({ ...article, category: 'general_market' })),
        ...companyNews.map(article => ({ ...article, category: 'company_specific' }))
      ];
      
      console.log(`\n✅ Comprehensive news complete: ${allArticles.length} total articles`);
      console.log(`   📊 General market: ${generalNews.length} articles`);
      console.log(`   🏢 Company-specific: ${companyNews.length} articles`);
      
      // Validate final results
      this.validateFinalResults(allArticles);
      
      return {
        articles: allArticles,
        breakdown: {
          generalMarket: generalNews.length,
          companySpecific: companyNews.length,
          total: allArticles.length
        },
        sources: this.getSourceBreakdown(allArticles),
        generatedAt: new Date().toISOString(),
        cacheStatus: 'fresh',
        approach: 'optimal_direct_api'
      };
      
    } catch (error) {
      console.error('❌ Comprehensive news service error:', error.message);
      return this.getFallbackNews();
    }
  }

  /**
   * Get approved general market news from /v4/general_news
   */
  async getApprovedGeneralNews(targetCount = 10) {
    console.log(`📰 Fetching ${targetCount} general market news from /v4/general_news`);
    console.log(`✅ APPROVED sources: ${this.approvedGeneralSources.join(', ')}`);
    
    const articles = [];
    
    try {
      const response = await axios.get(`${this.baseUrl}/v4/general_news`, {
        params: { 
          page: 0, 
          size: 100, // Get more to filter from
          apikey: this.fmpApiKey 
        },
        timeout: 12000
      });
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log(`📊 Retrieved ${response.data.length} raw articles from /v4/general_news`);
        
        // Filter for approved sources only
        const approvedArticles = response.data
          .filter(article => this.isApprovedGeneralSource(article.site || article.source))
          .filter(article => !this.isBlacklistedSource(article.site || article.source))
          .filter(article => !this.isLegalContent(article)) // NEW: Filter out legal content
          .filter(article => this.isRecentEnough(article.publishedDate || article.date, 168)) // 7 days
          .filter(article => this.isGeneralMarketNews(article))
          .map(article => this.formatArticle(article, 'general_market'))
          .sort((a, b) => b.qualityScore - a.qualityScore);
        
        articles.push(...approvedArticles);
        
        console.log(`✅ Found ${approvedArticles.length} approved general market articles`);
        
        if (approvedArticles.length > 0) {
          const sources = [...new Set(approvedArticles.map(a => a.source))];
          console.log(`   📊 Sources found: ${sources.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ General news fetch failed: ${error.message}`);
    }
    
    // Remove duplicates and take top articles
    const uniqueArticles = this.removeDuplicates(articles);
    const finalArticles = uniqueArticles.slice(0, targetCount);
    
    console.log(`✅ Final general market articles: ${finalArticles.length}/${targetCount}`);
    
    return finalArticles;
  }

  /**
   * Get company news using direct /v3/stock_news?tickers=SYMBOL API calls
   */
  async getDirectCompanyNews(targetCount = 10) {
    console.log(`🏢 Fetching ${targetCount} company news via DIRECT API calls`);
    console.log(`🎯 Using /v3/stock_news?tickers=SYMBOL for each top company`);
    
    const articles = [];
    const companiesSeen = new Set();
    
    try {
      // Get market cap data for prioritization
      const marketCapData = await this.getMarketCapData();
      
      // Sort companies by market cap (largest first)
      const sortedCompanies = this.topCompanies
        .map(symbol => ({ symbol, marketCap: marketCapData[symbol] || 0 }))
        .sort((a, b) => b.marketCap - a.marketCap);
      
      console.log('📊 Top companies by market cap (direct API targets):');
      sortedCompanies.slice(0, 10).forEach((company, i) => {
        console.log(`   ${i + 1}. ${company.symbol}: ${this.formatMarketCap(company.marketCap)}`);
      });
      
      // Make direct API call for each top company
      for (const company of sortedCompanies) {
        if (articles.length >= targetCount) break;
        if (companiesSeen.has(company.symbol)) continue;
        
        try {
          console.log(`🔍 Direct API call: /v3/stock_news?tickers=${company.symbol}`);
          
          const response = await axios.get(`${this.baseUrl}/v3/stock_news`, {
            params: { 
              tickers: company.symbol,
              limit: 20, // Get more options per company
              apikey: this.fmpApiKey 
            },
            timeout: 8000
          });
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            console.log(`   📊 Got ${response.data.length} articles for ${company.symbol}`);
            
            // Filter and score articles for this company
            const companyArticles = response.data
              .filter(article => this.isRecentEnough(article.publishedDate || article.date, 72)) // 3 days for company news
              .filter(article => !this.isBlacklistedSource(article.site || article.source))
              .filter(article => !this.isLegalContent(article)) // NEW: Filter out legal content
              .filter(article => this.isValidCompanyNews(article, company.symbol))
              .map(article => this.formatArticle(article, 'company_specific', company.symbol, company.marketCap))
              .sort((a, b) => b.qualityScore - a.qualityScore);
            
            if (companyArticles.length > 0) {
              const bestArticle = companyArticles[0]; // Take the best article for this company
              articles.push(bestArticle);
              companiesSeen.add(company.symbol);
              console.log(`   ✅ Added ${company.symbol}: ${bestArticle.source} - ${bestArticle.title.substring(0, 50)}...`);
            } else {
              console.log(`   ❌ No valid articles for ${company.symbol} after filtering`);
            }
          } else {
            console.log(`   ❌ No articles returned for ${company.symbol}`);
          }
          
        } catch (companyError) {
          console.warn(`   ⚠️ API call failed for ${company.symbol}: ${companyError.message}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n✅ Direct API results: ${articles.length} company articles from ${companiesSeen.size} companies`);
      console.log(`   🏢 Companies covered: ${Array.from(companiesSeen).join(', ')}`);
      
    } catch (error) {
      console.warn(`⚠️ Direct company news fetch failed: ${error.message}`);
    }
    
    return articles.slice(0, targetCount);
  }

  /**
   * NEW: Check if article contains legal/litigation content
   */
  isLegalContent(article) {
    const text = (article.title + ' ' + (article.text || article.description || '')).toLowerCase();
    
    const isLegal = this.legalKeywords.some(keyword => text.includes(keyword));
    
    if (isLegal) {
      console.log(`⚖️ FILTERED OUT legal content: ${article.title}`);
      return true;
    }
    
    return false;
  }

  /**
   * Check if source is approved for general market news
   */
  isApprovedGeneralSource(source) {
    if (!source) return false;
    const sourceLower = source.toLowerCase();
    
    const isApproved = this.approvedGeneralSources.some(approved => 
      sourceLower.includes(approved)
    );
    
    if (isApproved) {
      console.log(`✅ APPROVED general source: ${source}`);
    }
    
    return isApproved;
  }

  /**
   * Check if source is blacklisted
   */
  isBlacklistedSource(source) {
    if (!source) return false;
    const sourceLower = source.toLowerCase();
    
    const isBlacklisted = this.blacklistedSources.some(blacklisted => 
      sourceLower.includes(blacklisted)
    );
    
    if (isBlacklisted) {
      console.log(`❌ BLACKLISTED source rejected: ${source}`);
      return true;
    }
    
    return false;
  }

  /**
   * Validate that article is valid company news
   */
  isValidCompanyNews(article, expectedSymbol) {
    const text = (article.title + ' ' + (article.text || article.description || '')).toLowerCase();
    const symbolLower = expectedSymbol.toLowerCase();
    
    // Must mention the company symbol or be clearly about the company
    const mentionsSymbol = text.includes(symbolLower);
    const isCompanyNews = this.isCompanySpecificNews(article);
    
    return mentionsSymbol && isCompanyNews;
  }

  /**
   * Format article with quality scoring
   */
  formatArticle(rawArticle, type, companySymbol = null, marketCap = 0) {
    const article = {
      title: rawArticle.title || 'Financial News',
      description: this.getFullContent(rawArticle),
      url: rawArticle.url || '#',
      source: this.getStandardizedSourceName(rawArticle.site || rawArticle.source || 'Unknown'),
      publishedAt: rawArticle.publishedDate || rawArticle.date || new Date().toISOString(),
      type: type,
      qualityScore: this.calculateQualityScore(rawArticle, type, marketCap),
      hasSubstantialContent: true,
      marketRelevant: true
    };
    
    if (type === 'company_specific' && companySymbol) {
      article.companySymbol = companySymbol;
      article.marketCap = marketCap;
      article.priority = marketCap > 1000000000000 ? 'high' : marketCap > 500000000000 ? 'medium' : 'low';
    } else {
      article.priority = this.getSourcePriority(article.source);
    }
    
    return article;
  }

  /**
   * Calculate quality score with approved source priority
   */
  calculateQualityScore(article, type, marketCap = 0) {
    let score = 0;
    
    if (type === 'general_market') {
      // Approved source bonus
      const source = (article.site || article.source || '').toLowerCase();
      if (source.includes('reuters')) score += 30;
      else if (source.includes('marketwatch')) score += 25;
      else if (source.includes('barrons')) score += 25;
      else if (source.includes('investors')) score += 20; // IBD
      else if (source.includes('businesswire')) score += 15;
      else score += 5; // Low for unknown sources
    } else if (type === 'company_specific') {
      // Market cap bonus (prioritize large companies)
      if (marketCap > 2000000000000) score += 35; // >$2T
      else if (marketCap > 1000000000000) score += 30; // >$1T 
      else if (marketCap > 500000000000) score += 25; // >$500B
      else if (marketCap > 100000000000) score += 20; // >$100B
      else score += 10;
      
      // Source bonus for company news (less strict than general)
      const source = (article.site || article.source || '').toLowerCase();
      if (source.includes('reuters') || source.includes('marketwatch') || source.includes('barrons')) score += 10;
      else if (source.includes('businesswire') || source.includes('globenewswire') || source.includes('prnewswire')) score += 8;
      else score += 3;
    }
    
    // Content quality
    const contentLength = this.getFullContent(article).length;
    if (contentLength > 1000) score += 10;
    else if (contentLength > 500) score += 6;
    else if (contentLength > 200) score += 3;
    
    // Recency bonus
    const hoursOld = this.getHoursOld(article.publishedDate || article.date);
    if (hoursOld <= 6) score += 15;
    else if (hoursOld <= 12) score += 12;
    else if (hoursOld <= 24) score += 8;
    else if (hoursOld <= 48) score += 5;
    
    return score;
  }

  /**
   * Get standardized source name
   */
  getStandardizedSourceName(source) {
    if (!source) return 'Financial News';
    const sourceLower = source.toLowerCase();
    
    if (sourceLower.includes('reuters')) return 'Reuters';
    if (sourceLower.includes('marketwatch')) return 'MarketWatch';
    if (sourceLower.includes('barrons')) return 'Barrons';
    if (sourceLower.includes('investors')) return 'Investors.com';
    if (sourceLower.includes('businesswire')) return 'Business Wire';
    if (sourceLower.includes('globenewswire')) return 'GlobeNewswire';
    if (sourceLower.includes('prnewswire')) return 'PR Newswire';
    
    return source;
  }

  /**
   * Validate final results meet our standards
   */
  validateFinalResults(articles) {
    console.log('\n🔍 VALIDATING FINAL RESULTS:');
    
    // Check general market sources
    const generalArticles = articles.filter(a => a.category === 'general_market');
    const generalSources = [...new Set(generalArticles.map(a => a.source))];
    const approvedFound = generalSources.filter(s => 
      ['Reuters', 'MarketWatch', 'Barrons', 'Investors.com', 'Business Wire'].includes(s)
    );
    
    console.log(`📊 General market articles: ${generalArticles.length}`);
    console.log(`✅ Approved sources found: ${approvedFound.join(', ') || 'None'}`);
    
    // Check company quality
    const companyArticles = articles.filter(a => a.category === 'company_specific');
    const companies = companyArticles.map(a => a.companySymbol);
    const topTierCompanies = companies.filter(c => this.topCompanies.includes(c));
    
    console.log(`🏢 Company articles: ${companyArticles.length}`);
    console.log(`✅ Top-tier companies: ${topTierCompanies.join(', ')}`);
    
    // Overall assessment
    const qualityScore = this.calculateOverallQuality(articles);
    console.log(`📊 Overall quality score: ${qualityScore}/100`);
    
    if (qualityScore >= 80) {
      console.log('🎉 QUALITY ASSESSMENT: EXCELLENT');
    } else if (qualityScore >= 60) {
      console.log('✅ QUALITY ASSESSMENT: GOOD');
    } else {
      console.log('⚠️ QUALITY ASSESSMENT: NEEDS IMPROVEMENT');
    }
  }

  calculateOverallQuality(articles) {
    let score = 0;
    
    // Article count (30 points)
    score += Math.min(30, (articles.length / 20) * 30);
    
    // Source quality (40 points)
    const generalArticles = articles.filter(a => a.category === 'general_market');
    const approvedSources = generalArticles.filter(a => 
      ['Reuters', 'MarketWatch', 'Barrons', 'Investors.com', 'Business Wire'].includes(a.source)
    );
    if (generalArticles.length > 0) {
      score += (approvedSources.length / generalArticles.length) * 40;
    }
    
    // Company quality (30 points)
    const companyArticles = articles.filter(a => a.category === 'company_specific');
    const topTierCompanies = companyArticles.filter(a => this.topCompanies.includes(a.companySymbol));
    if (companyArticles.length > 0) {
      score += (topTierCompanies.length / companyArticles.length) * 30;
    }
    
    return Math.round(score);
  }

  // Market cap and helper methods
  async getMarketCapData() {
    const cacheKey = 'market_cap_data';
    const cached = marketCapCache.get(cacheKey);
    if (cached) return cached;
    
    console.log('📊 Fetching market cap data for top companies...');
    
    // Updated market cap data (June 2025 estimates)
    const marketCapData = {
      'MSFT': 3500000000000, 'NVDA': 3500000000000, 'AAPL': 3000000000000,
      'AMZN': 2200000000000, 'GOOGL': 2000000000000, 'META': 1700000000000,
      'TSM': 1100000000000, 'TSLA': 1000000000000, 'BRK.B': 900000000000,
      'WMT': 767000000000, 'JPM': 764000000000, 'LLY': 700000000000,
      'UNH': 650000000000, 'V': 600000000000, 'XOM': 550000000000,
      'MA': 500000000000, 'PG': 450000000000, 'JNJ': 400000000000,
      'ORCL': 380000000000, 'HD': 350000000000
    };
    
    marketCapCache.set(cacheKey, marketCapData);
    return marketCapData;
  }

  formatMarketCap(marketCap) {
    if (!marketCap || marketCap === 0) return 'Unknown';
    
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    }
    return `$${(marketCap / 1000000).toFixed(1)}M`;
  }

  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  isRecentEnough(publishedDate, maxHours = 168) {
    if (!publishedDate) return false;
    return this.getHoursOld(publishedDate) <= maxHours;
  }

  getHoursOld(publishedDate) {
    if (!publishedDate) return 999;
    return (new Date() - new Date(publishedDate)) / (1000 * 60 * 60);
  }

  isGeneralMarketNews(article) {
    const text = (article.title + ' ' + (article.text || article.description || '')).toLowerCase();
    const generalTerms = ['market', 'economy', 'fed', 'inflation', 'gdp', 'employment', 'sector', 'index', 'economic', 'trade', 'policy'];
    return generalTerms.some(term => text.includes(term));
  }

  isCompanySpecificNews(article) {
    const text = (article.title + ' ' + (article.text || article.description || '')).toLowerCase();
    const companyTerms = ['earnings', 'revenue', 'ceo', 'acquisition', 'merger', 'partnership', 'product', 'quarter', 'stock', 'shares', 'announces', 'reports'];
    return companyTerms.some(term => text.includes(term));
  }

  getSourcePriority(source) {
    const sourceLower = (source || '').toLowerCase();
    if (sourceLower.includes('reuters') || sourceLower.includes('barrons')) return 'high';
    if (sourceLower.includes('marketwatch') || sourceLower.includes('investors')) return 'high';
    if (sourceLower.includes('businesswire')) return 'medium';
    return 'medium';
  }

  getFullContent(article) {
    const content = article.text || article.content || article.summary || article.description || '';
    return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  getSourceBreakdown(articles) {
    const breakdown = {};
    articles.forEach(article => {
      const source = article.source;
      breakdown[source] = (breakdown[source] || 0) + 1;
    });
    return breakdown;
  }

  getFallbackNews() {
    return {
      articles: [],
      breakdown: { generalMarket: 0, companySpecific: 0, total: 0 },
      sources: {},
      generatedAt: new Date().toISOString(),
      cacheStatus: 'fallback',
      error: 'Unable to fetch comprehensive news'
    };
  }
}

export default new ComprehensiveNewsService();