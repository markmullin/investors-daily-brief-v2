/**
 * OPTIMIZED FMP NEWS SERVICE - FINAL ENHANCED VERSION
 * Fixed: Social sentiment data structure + Company/sector diversification
 */
import axios from 'axios';
import NodeCache from 'node-cache';

const newsCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 }); // 15 minutes

class OptimizedFmpNewsService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.baseUrl = 'https://financialmodelingprep.com/api';
    
    // USER'S EXACT SOURCE REQUIREMENTS
    this.premiumSources = ['reuters.com', 'reuters', 'wsj.com', 'wall street journal'];
    this.financialMediaSources = ['cnbc.com', 'cnbc', 'barrons.com', 'barrons'];
    this.allowedGeneralSources = [...this.premiumSources, ...this.financialMediaSources];
    
    // ENHANCED: S&P 500 companies organized by sector for diversification
    this.sp500BySector = {
      'Technology': ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'AVGO', 'ADBE', 'CRM', 'AMD', 'TXN'],
      'Healthcare': ['UNH', 'JNJ', 'LLY', 'ABBV', 'TMO', 'ABT', 'BMY', 'MRK', 'DHR', 'AMGN'],
      'Financial': ['JPM', 'V', 'MA', 'WFC', 'MS', 'AXP', 'BAC', 'GS', 'BLK', 'SPGI'],
      'Consumer Discretionary': ['AMZN', 'TSLA', 'HD', 'NKE', 'LOW', 'MCD', 'SBUX', 'TJX', 'BKNG', 'DIS'],
      'Communication': ['GOOGL', 'META', 'NFLX', 'DIS', 'VZ', 'T', 'TMUS', 'CHTR', 'CMCSA'],
      'Industrials': ['UNH', 'RTX', 'UPS', 'HON', 'BA', 'CAT', 'DE', 'LMT', 'MMM', 'GE'],
      'Energy': ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'PSX', 'VLO', 'MPC', 'OXY', 'KMI'],
      'Consumer Staples': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'PM', 'MO', 'CL', 'KMB', 'GIS'],
      'Utilities': ['NEE', 'DUK', 'SO', 'AEP', 'EXC', 'XEL', 'ES', 'AWK', 'PEG', 'SRE'],
      'Real Estate': ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'WELL', 'DLR', 'O', 'SPG', 'SBAC'],
      'Materials': ['LIN', 'APD', 'SHW', 'FCX', 'NEM', 'DOW', 'DD', 'PPG', 'ECL', 'MLM']
    };
    
    // Market cap priority within each sector (largest first)
    this.sectorPriority = [
      'Technology', 'Healthcare', 'Financial', 'Consumer Discretionary',
      'Communication', 'Industrials', 'Energy', 'Consumer Staples', 
      'Utilities', 'Real Estate', 'Materials'
    ];
    
    // ENHANCED: Legal/lawsuit content filtering
    this.legalFilterKeywords = [
      'class action', 'lawsuit', 'litigation', 'legal action', 'securities fraud',
      'pomerantz', 'rosen law', 'schall law', 'bronstein', 'legal investigation',
      'shareholder lawsuit', 'investor lawsuit', 'law firm announces',
      'securities litigation', 'fraud allegations', 'legal notice',
      'class action suit', 'derivative lawsuit', 'securities violations'
    ];
    
    console.log('🎯 Optimized FMP News Service - Final Enhanced Version');
    console.log(`✅ Sector diversification: ${this.sectorPriority.length} sectors`);
    console.log(`🚫 Legal filtering: ${this.legalFilterKeywords.length} patterns`);
  }

  /**
   * GET OPTIMAL 16-ARTICLE NEWS MIX
   * Enhanced with sector diversification and fixed social sentiment
   */
  async getOptimalNewsMix() {
    const cacheKey = 'optimal_news_mix_16_final';
    
    const cached = newsCache.get(cacheKey);
    if (cached) {
      console.log('📦 [CACHE] Returning cached optimal news mix');
      return cached;
    }
    
    console.log('🎯 [OPTIMAL MIX] Fetching 16-article premium news mix...');
    
    // Fetch all content types in parallel
    const [
      macroEconomic,      // 6 articles - 40%
      companySpecific,    // 4 articles - 25% - ENHANCED: Sector diversified
      pressReleases,      // 1 article  - 25%
      analystActions,     // 2 articles - 20%
      earningsNews,       // 1 article  - 20%
      fmpAnalysis,        // 1 article  - 15%
      socialSentiment     // 1 article  - 15% - FIXED: Better data handling
    ] = await Promise.allSettled([
      this.getPremiumGeneralNews(6),                    // 40% - Quality + Recent
      this.getDiversifiedSP500StockNews(4),             // 25% - ENHANCED: Sector diversified
      this.getFilteredSP500PressReleases(1),            // 25% - S&P 500 + Recent + NO LAWSUITS
      this.getSP500AnalystActions(2),                   // 20% - S&P 500 + Recent
      this.getSP500EarningsNews(1),                     // 20% - S&P 500 + Recent
      this.getFMPProfessionalAnalysis(1),               // 15% - Recent
      this.getFixedSP500SocialSentiment(1)              // 15% - FIXED: Better data structure handling
    ]);

    // Collect successful results
    const optimalMix = {
      macroEconomic: macroEconomic.status === 'fulfilled' ? macroEconomic.value : [],
      companySpecific: companySpecific.status === 'fulfilled' ? companySpecific.value : [],
      pressReleases: pressReleases.status === 'fulfilled' ? pressReleases.value : [],
      analystActions: analystActions.status === 'fulfilled' ? analystActions.value : [],
      earningsNews: earningsNews.status === 'fulfilled' ? earningsNews.value : [],
      fmpAnalysis: fmpAnalysis.status === 'fulfilled' ? fmpAnalysis.value : [],
      socialSentiment: socialSentiment.status === 'fulfilled' ? socialSentiment.value : []
    };

    // Flatten and validate total count
    const allArticles = Object.values(optimalMix).flat();
    
    const result = {
      mix: optimalMix,
      articles: allArticles,
      summary: {
        totalArticles: allArticles.length,
        targetArticles: 16,
        breakdown: {
          macroEconomic: optimalMix.macroEconomic.length,
          companySpecific: optimalMix.companySpecific.length,
          pressReleases: optimalMix.pressReleases.length,
          analystActions: optimalMix.analystActions.length,
          earningsNews: optimalMix.earningsNews.length,
          fmpAnalysis: optimalMix.fmpAnalysis.length,
          socialSentiment: optimalMix.socialSentiment.length
        },
        sectorDiversity: this.analyzeSectorDiversity(optimalMix.companySpecific)
      },
      sourceQuality: this.analyzeSourceQuality(allArticles),
      timestamp: new Date().toISOString()
    };

    // Cache for 15 minutes
    newsCache.set(cacheKey, result);
    
    console.log(`✅ [OPTIMAL MIX] ${result.summary.totalArticles}/16 articles collected`);
    console.log(`📊 Sector diversity: ${result.summary.sectorDiversity.sectorsRepresented} sectors`);
    
    return result;
  }

  /**
   * 40% - MACRO ECONOMIC (6 articles) - UNCHANGED
   * Premium sources only: Reuters, WSJ, CNBC, Barron's
   */
  async getPremiumGeneralNews(limit = 6) {
    try {
      console.log('📰 [MACRO] Fetching premium general news...');
      
      const response = await axios.get(`${this.baseUrl}/v4/general_news`, {
        params: { page: 0, size: 50, apikey: this.fmpApiKey },
        timeout: 8000
      });

      if (!Array.isArray(response.data)) return [];

      const premiumArticles = response.data.filter(article => {
        const source = (article.site || article.source || '').toLowerCase();
        return this.allowedGeneralSources.some(allowedSource => 
          source.includes(allowedSource.toLowerCase())
        );
      });

      const qualitySorted = premiumArticles.sort((a, b) => {
        const aSource = (a.site || a.source || '').toLowerCase();
        const bSource = (b.site || b.source || '').toLowerCase();
        
        const aIsPremium = this.premiumSources.some(ps => aSource.includes(ps.toLowerCase()));
        const bIsPremium = this.premiumSources.some(ps => bSource.includes(ps.toLowerCase()));
        
        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;
        
        const aDate = new Date(a.publishedDate || a.date || 0);
        const bDate = new Date(b.publishedDate || b.date || 0);
        return bDate - aDate;
      });

      const selectedArticles = qualitySorted.slice(0, limit).map(article => ({
        title: article.title,
        description: article.text || article.content || '',
        url: article.url || '#',
        source: article.site || article.source || 'Unknown',
        publishedAt: article.publishedDate || article.date || new Date().toISOString(),
        category: 'macro_economic',
        priority: 'high',
        type: 'general_news',
        sourceQuality: this.getSourceQuality(article.site || article.source)
      }));

      console.log(`✅ [MACRO] ${selectedArticles.length}/${limit} premium articles found`);
      return selectedArticles;

    } catch (error) {
      console.log('⚠️ [MACRO] Premium general news failed:', error.message);
      return [];
    }
  }

  /**
   * 25% - COMPANY-SPECIFIC (4 articles) - ENHANCED
   * Sector diversified + 1 company per article + market cap priority
   */
  async getDiversifiedSP500StockNews(limit = 4) {
    try {
      console.log('🏢 [COMPANY] Fetching diversified S&P 500 stock news...');
      console.log('    🎯 ENHANCED: 1 company per article + sector diversification');
      
      const response = await axios.get(`${this.baseUrl}/v3/stock_news`, {
        params: { limit: 200, apikey: this.fmpApiKey }, // Get many more for filtering
        timeout: 8000
      });

      if (!Array.isArray(response.data)) return [];

      // Group articles by company and sector
      const articlesByCompany = {};
      const companySectors = {};
      
      // Map each S&P 500 company to its sector
      Object.entries(this.sp500BySector).forEach(([sector, companies]) => {
        companies.forEach(company => {
          companySectors[company] = sector;
        });
      });

      // Group articles by company
      response.data.forEach(article => {
        const symbol = article.symbol?.trim();
        if (symbol && companySectors[symbol]) {
          if (!articlesByCompany[symbol]) {
            articlesByCompany[symbol] = [];
          }
          articlesByCompany[symbol].push({
            ...article,
            sector: companySectors[symbol]
          });
        }
      });

      console.log(`    📊 Found news for ${Object.keys(articlesByCompany).length} S&P 500 companies`);

      // Select best article per company, prioritized by sector and market cap
      const selectedArticles = [];
      const usedSectors = new Set();
      
      // Sort sectors by priority, then companies within sectors by market cap (first in array = largest)
      for (const sector of this.sectorPriority) {
        if (selectedArticles.length >= limit) break;
        
        const sectorCompanies = this.sp500BySector[sector] || [];
        
        for (const company of sectorCompanies) {
          if (selectedArticles.length >= limit) break;
          
          if (articlesByCompany[company] && articlesByCompany[company].length > 0) {
            // Skip if we already have this sector and want diversity
            if (usedSectors.has(sector) && usedSectors.size < this.sectorPriority.length && selectedArticles.length < limit) {
              continue; // Try other sectors first for diversity
            }
            
            // Get most recent article for this company
            const bestArticle = articlesByCompany[company]
              .sort((a, b) => {
                const aDate = new Date(a.publishedDate || a.date || 0);
                const bDate = new Date(b.publishedDate || b.date || 0);
                return bDate - aDate;
              })[0];

            selectedArticles.push({
              title: bestArticle.title,
              description: bestArticle.text || bestArticle.content || '',
              url: bestArticle.url || '#',
              source: bestArticle.site || bestArticle.source || 'Unknown',
              publishedAt: bestArticle.publishedDate || bestArticle.date || new Date().toISOString(),
              symbol: company,
              sector: sector,
              category: 'company_specific',
              priority: 'high',
              type: 'stock_news'
            });

            usedSectors.add(sector);
            console.log(`    ✅ Selected: ${company} (${sector}) - ${bestArticle.site || bestArticle.source}`);
            break; // Move to next sector for diversity
          }
        }
      }

      // If we still need more articles and have fewer sectors than limit, fill remaining with any available
      if (selectedArticles.length < limit) {
        for (const sector of this.sectorPriority) {
          if (selectedArticles.length >= limit) break;
          
          const sectorCompanies = this.sp500BySector[sector] || [];
          
          for (const company of sectorCompanies) {
            if (selectedArticles.length >= limit) break;
            
            // Skip if already selected
            if (selectedArticles.some(a => a.symbol === company)) continue;
            
            if (articlesByCompany[company] && articlesByCompany[company].length > 0) {
              const bestArticle = articlesByCompany[company][0];
              
              selectedArticles.push({
                title: bestArticle.title,
                description: bestArticle.text || bestArticle.content || '',
                url: bestArticle.url || '#',
                source: bestArticle.site || bestArticle.source || 'Unknown',
                publishedAt: bestArticle.publishedDate || bestArticle.date || new Date().toISOString(),
                symbol: company,
                sector: sector,
                category: 'company_specific',
                priority: 'high',
                type: 'stock_news'
              });

              console.log(`    ✅ Added: ${company} (${sector}) - ${bestArticle.site || bestArticle.source}`);
            }
          }
        }
      }

      console.log(`✅ [COMPANY] ${selectedArticles.length}/${limit} diversified articles found`);
      console.log(`    📊 Sectors represented: ${Array.from(usedSectors).join(', ')}`);
      
      return selectedArticles;

    } catch (error) {
      console.log('⚠️ [COMPANY] Diversified S&P 500 stock news failed:', error.message);
      return [];
    }
  }

  /**
   * 25% - PRESS RELEASES (1 article) - UNCHANGED
   * S&P 500 companies + most recent + NO class action lawsuits
   */
  async getFilteredSP500PressReleases(limit = 1) {
    try {
      console.log('📢 [PRESS] Fetching filtered S&P 500 press releases...');
      
      // Get all S&P 500 companies (flattened)
      const allSP500 = Object.values(this.sp500BySector).flat();
      const topCompanies = allSP500.slice(0, 15);
      
      const promises = topCompanies.map(symbol => 
        axios.get(`${this.baseUrl}/v3/press-releases/${symbol}`, {
          params: { limit: 10, apikey: this.fmpApiKey },
          timeout: 6000
        }).catch(() => ({ data: [] }))
      );

      const responses = await Promise.all(promises);
      const allReleases = responses.flatMap(r => r.data || []);

      // Filter out legal content
      const filteredReleases = allReleases.filter(release => {
        const title = (release.title || '').toLowerCase();
        const text = (release.text || '').toLowerCase();
        
        const isLegalContent = this.legalFilterKeywords.some(keyword => 
          title.includes(keyword.toLowerCase()) || text.includes(keyword.toLowerCase())
        );
        
        return !isLegalContent;
      });

      console.log(`🚫 [PRESS] Filtered out ${allReleases.length - filteredReleases.length} legal releases`);

      const recentReleases = filteredReleases
        .sort((a, b) => {
          const aDate = new Date(a.date || a.publishedDate || 0);
          const bDate = new Date(b.date || b.publishedDate || 0);
          return bDate - aDate;
        })
        .slice(0, limit)
        .map(release => ({
          title: release.title,
          description: release.text || release.content || '',
          url: release.url || '#',
          source: `${release.symbol || 'Company'} Official`,
          publishedAt: release.date || release.publishedDate || new Date().toISOString(),
          symbol: release.symbol,
          category: 'press_release',
          priority: 'high',
          type: 'press_release',
          filtered: true
        }));

      console.log(`✅ [PRESS] ${recentReleases.length}/${limit} filtered press releases found`);
      return recentReleases;

    } catch (error) {
      console.log('⚠️ [PRESS] Filtered press releases failed:', error.message);
      return [];
    }
  }

  /**
   * 20% - ANALYST ACTIONS (2 articles) - UNCHANGED
   */
  async getSP500AnalystActions(limit = 2) {
    try {
      console.log('📊 [ANALYST] Fetching S&P 500 analyst actions...');
      
      const response = await axios.get(`${this.baseUrl}/v4/upgrades-downgrades-rss-feed`, {
        params: { page: 0, size: 50, apikey: this.fmpApiKey },
        timeout: 8000
      });

      if (!Array.isArray(response.data)) return [];

      const allSP500 = Object.values(this.sp500BySector).flat();
      
      const sp500Actions = response.data
        .filter(action => allSP500.includes(action.symbol))
        .sort((a, b) => {
          const aPriority = allSP500.indexOf(a.symbol);
          const bPriority = allSP500.indexOf(b.symbol);
          if (aPriority !== bPriority) return aPriority - bPriority;
          
          const aDate = new Date(a.publishedDate || a.date || 0);
          const bDate = new Date(b.publishedDate || b.date || 0);
          return bDate - aDate;
        })
        .slice(0, limit)
        .map(action => ({
          title: action.title || `${action.symbol} Analyst Action`,
          description: action.text || `Analyst action for ${action.symbol}`,
          url: action.url || '#',
          source: 'Analyst Research',
          publishedAt: action.publishedDate || action.date || new Date().toISOString(),
          symbol: action.symbol,
          category: 'analyst_action',
          priority: 'medium',
          type: 'analyst_action'
        }));

      console.log(`✅ [ANALYST] ${sp500Actions.length}/${limit} analyst actions found`);
      return sp500Actions;

    } catch (error) {
      console.log('⚠️ [ANALYST] Analyst actions failed:', error.message);
      return [];
    }
  }

  /**
   * 20% - EARNINGS NEWS (1 article) - UNCHANGED
   */
  async getSP500EarningsNews(limit = 1) {
    try {
      console.log('📈 [EARNINGS] Fetching S&P 500 earnings news...');
      
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const earningsResponse = await axios.get(`${this.baseUrl}/v3/earning_calendar`, {
        params: { from: today, to: nextWeek, apikey: this.fmpApiKey },
        timeout: 8000
      });

      if (!earningsResponse.data || earningsResponse.data.length === 0) return [];

      const allSP500 = Object.values(this.sp500BySector).flat();
      
      const sp500Earnings = earningsResponse.data
        .filter(earning => allSP500.includes(earning.symbol))
        .sort((a, b) => {
          const aPriority = allSP500.indexOf(a.symbol);
          const bPriority = allSP500.indexOf(b.symbol);
          return aPriority - bPriority;
        })
        .slice(0, limit)
        .map(earning => ({
          title: `${earning.symbol} Earnings: ${earning.date}`,
          description: `${earning.symbol} scheduled to report earnings. EPS Estimate: ${earning.epsEstimate || 'N/A'}`,
          url: '#',
          source: 'Earnings Calendar',
          publishedAt: new Date().toISOString(),
          symbol: earning.symbol,
          category: 'earnings_news',
          priority: 'medium',
          type: 'earnings_calendar',
          earningsDate: earning.date,
          epsEstimate: earning.epsEstimate
        }));

      console.log(`✅ [EARNINGS] ${sp500Earnings.length}/${limit} earnings found`);
      return sp500Earnings;

    } catch (error) {
      console.log('⚠️ [EARNINGS] Earnings news failed:', error.message);
      return [];
    }
  }

  /**
   * 15% - FMP ANALYSIS (1 article) - UNCHANGED
   */
  async getFMPProfessionalAnalysis(limit = 1) {
    try {
      console.log('🔬 [ANALYSIS] Fetching FMP professional analysis...');
      
      const response = await axios.get(`${this.baseUrl}/v4/articles`, {
        params: { page: 0, size: 10, apikey: this.fmpApiKey },
        timeout: 8000
      });

      if (!Array.isArray(response.data)) return [];

      const analysisArticles = response.data
        .sort((a, b) => {
          const aDate = new Date(a.date || a.publishedDate || 0);
          const bDate = new Date(b.date || b.publishedDate || 0);
          return bDate - aDate;
        })
        .slice(0, limit)
        .map(article => ({
          title: article.title,
          description: article.content || article.text || '',
          url: article.url || '#',
          source: 'FMP Professional Analysis',
          publishedAt: article.date || article.publishedDate || new Date().toISOString(),
          category: 'professional_analysis',
          priority: 'medium',
          type: 'fmp_analysis'
        }));

      console.log(`✅ [ANALYSIS] ${analysisArticles.length}/${limit} analysis found`);
      return analysisArticles;

    } catch (error) {
      console.log('⚠️ [ANALYSIS] FMP analysis failed:', error.message);
      return [];
    }
  }

  /**
   * 15% - SOCIAL SENTIMENT (1 article) - FIXED
   * Enhanced data structure handling + fallback to trending sentiment
   */
  async getFixedSP500SocialSentiment(limit = 1) {
    try {
      console.log('📱 [SENTIMENT] Fetching FIXED S&P 500 social sentiment...');
      console.log('    🔧 ENHANCED: Better data structure handling + trending fallback');
      
      const allSP500 = Object.values(this.sp500BySector).flat();
      const testSymbols = allSP500.slice(0, 12); // Test top 12 companies
      const sentimentResults = [];
      
      // Try individual stock sentiment first
      for (const symbol of testSymbols) {
        try {
          const response = await axios.get(`${this.baseUrl}/v4/social-sentiment`, {
            params: { symbol, limit: 50, apikey: this.fmpApiKey },
            timeout: 6000
          });
          
          console.log(`    🔍 ${symbol}: API response structure:`, {
            isArray: Array.isArray(response.data),
            length: response.data?.length || 0,
            firstItem: response.data?.[0] ? Object.keys(response.data[0]) : 'No items'
          });
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            // Analyze the actual data structure returned
            let validSentiments = [];
            
            // Try different possible field names for sentiment scores
            const possibleSentimentFields = ['sentiment', 'sentimentScore', 'score', 'polarity', 'compound'];
            
            response.data.forEach(item => {
              for (const field of possibleSentimentFields) {
                if (item[field] !== undefined && item[field] !== null && !isNaN(item[field])) {
                  validSentiments.push(parseFloat(item[field]));
                  break;
                }
              }
            });
            
            console.log(`    📊 ${symbol}: Found ${validSentiments.length} valid sentiment scores from ${response.data.length} items`);
            
            if (validSentiments.length >= 3) {
              const avgSentiment = validSentiments.reduce((sum, s) => sum + s, 0) / validSentiments.length;
              const overallSentiment = avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral';
              const qualityScore = validSentiments.length + Math.abs(avgSentiment) * 10;
              
              sentimentResults.push({
                symbol,
                avgSentiment,
                overallSentiment,
                dataPoints: validSentiments.length,
                qualityScore,
                rawDataCount: response.data.length
              });
              
              console.log(`    ✅ ${symbol}: ${overallSentiment} (score: ${avgSentiment.toFixed(3)}, ${validSentiments.length} valid points)`);
            } else {
              console.log(`    ⚠️ ${symbol}: Raw data found but no valid sentiment scores extracted`);
            }
          } else {
            console.log(`    ❌ ${symbol}: No sentiment data returned`);
          }
        } catch (error) {
          console.log(`    ❌ ${symbol}: Request failed - ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 250)); // Delay between requests
      }
      
      // If individual sentiment failed, try trending sentiment as fallback
      if (sentimentResults.length === 0) {
        console.log('    🔄 Trying trending sentiment as fallback...');
        
        try {
          const trendingResponse = await axios.get(`${this.baseUrl}/v4/social-sentiment-trending`, {
            params: { limit: 20, apikey: this.fmpApiKey },
            timeout: 8000
          });
          
          console.log('    🔍 Trending sentiment response:', {
            isArray: Array.isArray(trendingResponse.data),
            length: trendingResponse.data?.length || 0
          });
          
          if (trendingResponse.data && Array.isArray(trendingResponse.data) && trendingResponse.data.length > 0) {
            // Find trending S&P 500 companies
            const trendingSP500 = trendingResponse.data.filter(item => 
              item.symbol && allSP500.includes(item.symbol)
            );
            
            if (trendingSP500.length > 0) {
              const bestTrending = trendingSP500[0];
              
              return [{
                title: `${bestTrending.symbol} Social Sentiment: TRENDING`,
                description: `${bestTrending.symbol} is trending on social media with significant sentiment activity.`,
                url: '#',
                source: 'Social Sentiment Trending',
                publishedAt: new Date().toISOString(),
                symbol: bestTrending.symbol,
                category: 'social_sentiment',
                priority: 'low',
                type: 'social_sentiment_trending',
                sentimentLabel: 'trending',
                dataSource: 'trending_fallback'
              }];
            }
          }
        } catch (error) {
          console.log('    ❌ Trending sentiment fallback also failed:', error.message);
        }
      }
      
      // Use best individual sentiment result if available
      if (sentimentResults.length > 0) {
        const bestSentiment = sentimentResults.sort((a, b) => b.qualityScore - a.qualityScore)[0];
        
        const sentimentArticle = {
          title: `${bestSentiment.symbol} Social Sentiment: ${bestSentiment.overallSentiment.toUpperCase()}`,
          description: `Social sentiment analysis for ${bestSentiment.symbol} shows ${bestSentiment.overallSentiment} sentiment with ${bestSentiment.dataPoints} data points from ${bestSentiment.rawDataCount} social mentions. Average score: ${bestSentiment.avgSentiment.toFixed(3)}`,
          url: '#',
          source: 'Social Sentiment Analysis',
          publishedAt: new Date().toISOString(),
          symbol: bestSentiment.symbol,
          category: 'social_sentiment',
          priority: 'low',
          type: 'social_sentiment',
          sentimentScore: bestSentiment.avgSentiment,
          sentimentLabel: bestSentiment.overallSentiment,
          dataPoints: bestSentiment.dataPoints,
          qualityScore: bestSentiment.qualityScore
        };

        console.log(`✅ [SENTIMENT] Selected ${bestSentiment.symbol}: ${bestSentiment.overallSentiment} (Quality: ${bestSentiment.qualityScore.toFixed(1)})`);
        return [sentimentArticle];
      }

      console.log('⚠️ [SENTIMENT] No valid sentiment data found for any S&P 500 companies');
      return [];

    } catch (error) {
      console.log('⚠️ [SENTIMENT] Fixed social sentiment failed:', error.message);
      return [];
    }
  }

  /**
   * UTILITY METHODS
   */

  getSourceQuality(source) {
    if (!source) return 'unknown';
    
    const sourceStr = source.toLowerCase();
    
    if (this.premiumSources.some(ps => sourceStr.includes(ps.toLowerCase()))) {
      return 'premium';
    }
    if (this.financialMediaSources.some(fm => sourceStr.includes(fm.toLowerCase()))) {
      return 'financial_media';
    }
    return 'other';
  }

  analyzeSourceQuality(articles) {
    const qualityCounts = { premium: 0, financial_media: 0, other: 0 };
    
    articles.forEach(article => {
      const quality = this.getSourceQuality(article.source);
      qualityCounts[quality]++;
    });

    return {
      breakdown: qualityCounts,
      premiumPercentage: ((qualityCounts.premium / articles.length) * 100).toFixed(1),
      qualityPercentage: (((qualityCounts.premium + qualityCounts.financial_media) / articles.length) * 100).toFixed(1)
    };
  }

  // NEW: Analyze sector diversity
  analyzeSectorDiversity(companyArticles) {
    const sectors = new Set();
    const companies = new Set();
    
    companyArticles.forEach(article => {
      if (article.sector) sectors.add(article.sector);
      if (article.symbol) companies.add(article.symbol);
    });
    
    return {
      sectorsRepresented: sectors.size,
      companiesRepresented: companies.size,
      sectors: Array.from(sectors),
      companies: Array.from(companies),
      diversityScore: (sectors.size / Math.max(companyArticles.length, 1) * 100).toFixed(1)
    };
  }

  // Test if content contains legal keywords
  isLegalContent(title, text) {
    const content = `${title} ${text}`.toLowerCase();
    return this.legalFilterKeywords.some(keyword => 
      content.includes(keyword.toLowerCase())
    );
  }

  // Clear cache
  clearCache() {
    newsCache.flushAll();
    console.log('✅ Final enhanced news cache cleared');
  }
}

export default new OptimizedFmpNewsService();
