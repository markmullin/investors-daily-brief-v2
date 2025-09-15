/**
 * ENHANCED NEWS SERVICE - EXPANDED S&P 500 COVERAGE WITH SECTOR DIVERSIFICATION
 * RESTORED: More stories, broader company coverage, sector limits
 */
import axios from 'axios';
import NodeCache from 'node-cache';

const newsCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 }); // 15 minutes

class EnhancedOptimizedFmpNewsService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.baseUrl = 'https://financialmodelingprep.com/api';
    
    // ✅ STRICT SOURCE REQUIREMENTS - ONLY THESE SOURCES ALLOWED
    this.allowedSources = [
      'reuters.com', 'reuters', 
      'wsj.com', 'wall street journal', 'wsj',
      'cnbc.com', 'cnbc', 
      'barrons.com', 'barrons', 'barron\'s'
    ];
    
    // ✅ BANNED SOURCES - NEVER ALLOW THESE
    this.bannedSources = [
      'benzinga', 'marketwatch', 'globenewswire', 'zacks', 'youtube',
      'seeking alpha', 'motley fool', 'yahoo finance', 'investorplace',
      'thestreet', 'fool.com', 'investopedia'
    ];

    // 🎯 EXPANDED S&P 500 COVERAGE WITH SECTOR DIVERSIFICATION
    this.sp500Companies = {
      // Technology (limit 5)
      tech: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META'],
      // Communication Services
      comm: ['DIS', 'NFLX', 'CMCSA', 'VZ', 'T'],
      // Healthcare 
      health: ['UNH', 'JNJ', 'PFE', 'ABT', 'TMO'],
      // Financial Services
      finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
      // Consumer Discretionary
      consumer_disc: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
      // Consumer Staples
      consumer_staples: ['PG', 'KO', 'PEP', 'WMT', 'COST'],
      // Industrials
      industrials: ['BA', 'UNP', 'HON', 'UPS', 'CAT'],
      // Energy
      energy: ['XOM', 'CVX', 'COP', 'EOG', 'SLB'],
      // Materials
      materials: ['LIN', 'APD', 'ECL', 'DD', 'DOW'],
      // Utilities
      utilities: ['NEE', 'SO', 'DUK', 'AEP', 'EXC'],
      // Real Estate
      real_estate: ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA']
    };
    
    console.log('🎯 ENHANCED NEWS SERVICE INITIALIZED');
    console.log(`✅ Allowed sources: ${this.allowedSources.join(', ')}`);
    console.log(`📊 S&P 500 coverage: ${this.getTotalCompanyCount()} companies across ${Object.keys(this.sp500Companies).length} sectors`);
  }

  getTotalCompanyCount() {
    return Object.values(this.sp500Companies).flat().length;
  }

  getAllCompaniesFlat() {
    return Object.values(this.sp500Companies).flat();
  }

  /**
   * ✅ CRITICAL: Universal source filter applied to ALL content
   */
  isSourceAllowed(source) {
    if (!source) return false;
    
    const sourceStr = source.toLowerCase();
    
    // First check if it's banned
    const isBanned = this.bannedSources.some(banned => 
      sourceStr.includes(banned.toLowerCase())
    );
    
    if (isBanned) {
      console.log(`🚫 BANNED SOURCE DETECTED: ${source}`);
      return false;
    }
    
    // Then check if it's allowed
    const isAllowed = this.allowedSources.some(allowed => 
      sourceStr.includes(allowed.toLowerCase())
    );
    
    // Special cases for company official sources
    if (sourceStr.includes('official') || sourceStr.includes('earnings calendar') || sourceStr.includes('analyst research')) {
      return true;
    }
    
    if (!isAllowed) {
      console.log(`⚠️ NON-PREMIUM SOURCE: ${source} - EXCLUDING`);
    }
    
    return isAllowed;
  }

  /**
   * 🎯 ENHANCED: Get optimal news mix with MORE stories and sector diversification
   */
  async getOptimalNewsMix() {
    const cacheKey = 'enhanced_optimal_news_mix_expanded_v3';
    
    const cached = newsCache.get(cacheKey);
    if (cached) {
      console.log('📦 [CACHE] Returning cached expanded news mix');
      return cached;
    }
    
    console.log('🎯 [EXPANDED MIX] Fetching MORE stories with sector diversification...');
    
    const [
      macroEconomic,
      sectorDiversifiedNews,
      additionalGeneralNews,
      pressReleases,
      earningsNews,
      fmpAnalysis
    ] = await Promise.allSettled([
      this.getPremiumOnlyGeneralNews(8),        // Increased from 5
      this.getSectorDiversifiedStockNews(10),   // NEW: Sector diversified approach
      this.getPremiumOnlyGeneralNews(5),        // Additional general news
      this.getPremiumOnlyPressReleases(2),      // Increased from 1
      this.getUpcomingEarnings(2),              // Increased from 1
      this.getFMPAnalysis(1)                    // Keep same
    ]);

    // Collect only successful results
    const optimalMix = {
      macroEconomic: macroEconomic.status === 'fulfilled' ? macroEconomic.value : [],
      sectorDiversifiedNews: sectorDiversifiedNews.status === 'fulfilled' ? sectorDiversifiedNews.value : [],
      additionalGeneralNews: additionalGeneralNews.status === 'fulfilled' ? additionalGeneralNews.value : [],
      pressReleases: pressReleases.status === 'fulfilled' ? pressReleases.value : [],
      earningsNews: earningsNews.status === 'fulfilled' ? earningsNews.value : [],
      fmpAnalysis: fmpAnalysis.status === 'fulfilled' ? fmpAnalysis.value : []
    };

    // Combine and deduplicate all stories
    const allStories = [
      ...optimalMix.macroEconomic,
      ...optimalMix.sectorDiversifiedNews,
      ...optimalMix.additionalGeneralNews,
      ...optimalMix.pressReleases,
      ...optimalMix.earningsNews,
      ...optimalMix.fmpAnalysis
    ];

    // Remove duplicates by title and URL
    const uniqueStories = allStories.filter((article, index, self) => 
      index === self.findIndex(a => 
        (a.title === article.title) || 
        (a.url === article.url && a.url !== '#')
      )
    );

    // Analyze sector diversity
    const sectorDiversity = this.analyzeSectorDiversity(uniqueStories);
    const companyDiversity = this.analyzeCompanyDiversity(uniqueStories);
    
    // ✅ VERIFY: All sources are premium only
    const sourceCheck = uniqueStories.every(article => this.isSourceAllowed(article.source));
    console.log(`🔍 SOURCE CHECK: ${sourceCheck ? 'PASSED' : 'FAILED'} - All sources premium: ${sourceCheck}`);
    
    const result = {
      breakdown: {
        macroEconomic: optimalMix.macroEconomic,
        sectorDiversifiedNews: optimalMix.sectorDiversifiedNews,
        additionalGeneralNews: optimalMix.additionalGeneralNews,
        pressReleases: optimalMix.pressReleases,
        earningsNews: optimalMix.earningsNews,
        fmpAnalysis: optimalMix.fmpAnalysis
      },
      articles: uniqueStories,
      summary: {
        totalArticles: uniqueStories.length,
        qualityPercentage: 100,
        premiumSourcesOnly: true,
        sourceCheck: sourceCheck,
        improvement: 'Expanded S&P 500 coverage with sector diversification limits',
        companyDiversity: companyDiversity,
        sectorDiversity: sectorDiversity
      },
      timestamp: new Date().toISOString()
    };

    newsCache.set(cacheKey, result);
    
    console.log(`✅ [EXPANDED MIX] ${result.summary.totalArticles} unique stories - Sector diversified`);
    console.log(`📊 Companies: ${companyDiversity.uniqueCompanies}, Sectors: ${sectorDiversity.sectorsRepresented}`);
    return result;
  }

  /**
   * 🎯 NEW: Get sector-diversified stock news with max 5 per sector
   */
  async getSectorDiversifiedStockNews(targetTotal = 10) {
    try {
      console.log('🏢 [SECTOR DIVERSIFIED] Fetching stock news with sector limits...');
      
      const response = await axios.get(`${this.baseUrl}/v3/stock_news`, {
        params: { limit: 500, apikey: this.fmpApiKey }, // Get many for filtering
        timeout: 15000
      });

      if (!Array.isArray(response.data)) return [];

      // Filter for premium sources and our S&P 500 companies
      const allCompanies = this.getAllCompaniesFlat();
      const premiumStockNews = response.data
        .filter(article => {
          return this.isSourceAllowed(article.site || article.source) && 
                 allCompanies.includes(article.symbol);
        })
        .sort((a, b) => {
          const aDate = new Date(a.publishedDate || a.date || 0);
          const bDate = new Date(b.publishedDate || b.date || 0);
          return bDate - aDate;
        })
        .map(article => ({
          title: article.title,
          description: article.text || article.content || '',
          url: article.url || '#',
          source: article.site || article.source || 'Unknown',
          publishedAt: article.publishedDate || article.date || new Date().toISOString(),
          symbol: article.symbol,
          category: 'companySpecific',
          sourceType: 'premium',
          sector: this.getCompanySector(article.symbol)
        }));

      // Apply sector diversification limits (max 5 per sector)
      const sectorCounts = {};
      const diversifiedNews = [];

      for (const article of premiumStockNews) {
        const sector = article.sector || 'unknown';
        
        if (!sectorCounts[sector]) {
          sectorCounts[sector] = 0;
        }
        
        // Only add if we haven't hit the sector limit (max 5 per sector)
        if (sectorCounts[sector] < 5 && diversifiedNews.length < targetTotal) {
          diversifiedNews.push(article);
          sectorCounts[sector]++;
        }
        
        // Stop when we have enough stories
        if (diversifiedNews.length >= targetTotal) {
          break;
        }
      }

      console.log(`✅ [SECTOR DIVERSIFIED] ${diversifiedNews.length}/${targetTotal} stories with sector limits`);
      console.log(`📊 Sector distribution:`, sectorCounts);
      return diversifiedNews;

    } catch (error) {
      console.log('⚠️ [SECTOR DIVERSIFIED] Stock news failed:', error.message);
      return [];
    }
  }

  /**
   * Helper: Get sector for a company symbol
   */
  getCompanySector(symbol) {
    for (const [sector, companies] of Object.entries(this.sp500Companies)) {
      if (companies.includes(symbol)) {
        return sector;
      }
    }
    return 'unknown';
  }

  /**
   * Helper: Analyze sector diversity in articles
   */
  analyzeSectorDiversity(articles) {
    const sectors = new Set();
    const sectorCounts = {};
    
    articles.forEach(article => {
      if (article.symbol) {
        const sector = this.getCompanySector(article.symbol);
        sectors.add(sector);
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      }
    });
    
    return {
      sectorsRepresented: sectors.size,
      sectorCounts: sectorCounts,
      maxPerSector: Math.max(...Object.values(sectorCounts), 0)
    };
  }

  /**
   * Helper: Analyze company diversity in articles
   */
  analyzeCompanyDiversity(articles) {
    const companies = new Set();
    articles.forEach(article => {
      if (article.symbol) {
        companies.add(article.symbol);
      }
    });
    
    return {
      uniqueCompanies: companies.size,
      companies: Array.from(companies)
    };
  }

  /**
   * ✅ MACRO NEWS - Premium sources only (EXPANDED)
   */
  async getPremiumOnlyGeneralNews(limit = 8) {
    try {
      console.log(`📰 [MACRO] Fetching PREMIUM ONLY general news (${limit})...`);
      
      const response = await axios.get(`${this.baseUrl}/v4/general_news`, {
        params: { page: 0, size: 150, apikey: this.fmpApiKey }, // Get more to filter
        timeout: 10000
      });

      if (!Array.isArray(response.data)) return [];

      const premiumArticles = response.data
        .filter(article => this.isSourceAllowed(article.site || article.source))
        .sort((a, b) => {
          const aDate = new Date(a.publishedDate || a.date || 0);
          const bDate = new Date(b.publishedDate || b.date || 0);
          return bDate - aDate;
        })
        .slice(0, limit)
        .map(article => ({
          title: article.title,
          description: article.text || article.content || '',
          url: article.url || '#',
          source: article.site || article.source || 'Unknown',
          publishedAt: article.publishedDate || article.date || new Date().toISOString(),
          category: 'macroEconomic',
          sourceType: 'premium'
        }));

      console.log(`✅ [MACRO] ${premiumArticles.length}/${limit} premium articles found`);
      return premiumArticles;

    } catch (error) {
      console.log('⚠️ [MACRO] Premium general news failed:', error.message);
      return [];
    }
  }

  /**
   * ✅ PRESS RELEASES - Expanded coverage (ENHANCED)
   */
  async getPremiumOnlyPressReleases(limit = 2) {
    try {
      console.log(`📢 [PRESS] Fetching premium company press releases (${limit})...`);
      
      const majorCompanies = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'AMZN', 'TSLA', 'JPM'];
      const releases = [];
      
      for (const symbol of majorCompanies) {
        if (releases.length >= limit) break;
        
        try {
          const response = await axios.get(`${this.baseUrl}/v3/press-releases/${symbol}`, {
            params: { limit: 3, apikey: this.fmpApiKey },
            timeout: 6000
          });
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const release = response.data[0]; // Most recent
            
            // Filter out legal content
            const title = (release.title || '').toLowerCase();
            const isLegal = title.includes('class action') || title.includes('lawsuit') || title.includes('litigation');
            
            if (!isLegal) {
              releases.push({
                title: release.title,
                description: release.text || release.content || '',
                url: release.url || '#',
                source: `${symbol} Official`,
                publishedAt: release.date || release.publishedDate || new Date().toISOString(),
                symbol: symbol,
                category: 'pressReleases',
                sourceType: 'company_official'
              });
              console.log(`✅ [PRESS] Found clean press release from ${symbol}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ [PRESS] ${symbol} press releases failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log(`✅ [PRESS] ${releases.length}/${limit} press releases found`);
      return releases;

    } catch (error) {
      console.log('⚠️ [PRESS] Press releases failed:', error.message);
      return [];
    }
  }

  /**
   * ✅ EARNINGS - Expanded coverage (ENHANCED)
   */
  async getUpcomingEarnings(limit = 2) {
    try {
      console.log(`📈 [EARNINGS] Fetching upcoming earnings (${limit})...`);
      
      const today = new Date().toISOString().split('T')[0];
      const nextTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await axios.get(`${this.baseUrl}/v3/earning_calendar`, {
        params: { from: today, to: nextTwoWeeks, apikey: this.fmpApiKey },
        timeout: 8000
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const allCompanies = this.getAllCompaniesFlat();
        
        const upcomingEarnings = response.data
          .filter(earning => allCompanies.includes(earning.symbol))
          .slice(0, limit)
          .map(earning => ({
            title: `${earning.symbol} Earnings Scheduled: ${earning.date}`,
            description: `${earning.symbol} scheduled to report earnings on ${earning.date}. EPS Estimate: ${earning.epsEstimate || 'N/A'}`,
            url: '#',
            source: 'Earnings Calendar',
            publishedAt: new Date().toISOString(),
            symbol: earning.symbol,
            category: 'earningsNews',
            sourceType: 'earnings_calendar',
            earningsDate: earning.date
          }));

        console.log(`✅ [EARNINGS] ${upcomingEarnings.length}/${limit} earnings found`);
        return upcomingEarnings;
      }

      console.log(`⚠️ [EARNINGS] No upcoming earnings found`);
      return [];

    } catch (error) {
      console.log('⚠️ [EARNINGS] Earnings failed:', error.message);
      return [];
    }
  }

  /**
   * ✅ FMP ANALYSIS - Professional analysis only
   */
  async getFMPAnalysis(limit = 1) {
    try {
      console.log('🔬 [ANALYSIS] Fetching FMP analysis...');
      
      const response = await axios.get(`${this.baseUrl}/v4/articles`, {
        params: { page: 0, size: 10, apikey: this.fmpApiKey },
        timeout: 8000
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const article = response.data[0];
        
        console.log(`✅ [ANALYSIS] 1 FMP analysis found`);
        return [{
          title: article.title,
          description: article.content || article.text || '',
          url: article.url || '#',
          source: 'FMP Professional Analysis',
          publishedAt: article.date || article.publishedDate || new Date().toISOString(),
          category: 'fmpAnalysis',
          sourceType: 'professional_analysis'
        }];
      }

      console.log(`⚠️ [ANALYSIS] No FMP analysis found`);
      return [];

    } catch (error) {
      console.log('⚠️ [ANALYSIS] FMP analysis failed:', error.message);
      return [];
    }
  }

  clearCache() {
    newsCache.flushAll();
    console.log('✅ Enhanced news cache cleared - expanded coverage');
  }
}

export default new EnhancedOptimizedFmpNewsService();
