/**
 * News Content Extractor Service
 * Extracts full article content and generates comprehensive summaries with market impact analysis
 */

import axios from 'axios';
import braveSearchService from './braveSearchService.js';
import mistralService from './mistralService.js';
import puppeteer from 'puppeteer';
import NodeCache from 'node-cache';

// Cache for news summaries (30 minutes)
const summaryCache = new NodeCache({ stdTTL: 1800 });

class NewsContentExtractor {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
    this.braveApiKey = process.env.BRAVE_API_KEY || 'BSAFHHikdsv2YXSYODQSPES2tTMILHI';
  }

  /**
   * Initialize Puppeteer for content extraction
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('🚀 Initializing News Content Extractor...');
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      this.isInitialized = true;
      console.log('✅ News Content Extractor initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize News Content Extractor:', error);
      return false;
    }
  }

  /**
   * Get comprehensive daily market brief with actual news summaries
   */
  async getDailyMarketBrief() {
    const cacheKey = 'daily-market-brief';
    const cached = summaryCache.get(cacheKey);
    if (cached) {
      console.log('📰 Returning cached daily market brief');
      return cached;
    }

    try {
      console.log('📰 Generating comprehensive daily market brief...');
      
      // 1. Fetch current news from quality sources
      const newsArticles = await this.fetchQualityNews();
      
      if (!newsArticles || newsArticles.length === 0) {
        throw new Error('No news articles found');
      }

      // 2. Extract full content for top articles
      const topArticles = newsArticles.slice(0, 8);
      const enrichedArticles = await this.enrichArticlesWithContent(topArticles);
      
      // 3. Generate comprehensive summaries with market impact
      const summaries = await this.generateNewsSummaries(enrichedArticles);
      
      // 4. Create the daily market brief
      const brief = this.formatDailyBrief(summaries);
      
      summaryCache.set(cacheKey, brief);
      return brief;
      
    } catch (error) {
      console.error('❌ Error generating daily market brief:', error);
      return this.generateFallbackBrief();
    }
  }

  /**
   * Fetch quality news from premium sources
   */
  async fetchQualityNews() {
    try {
      console.log('🔍 Fetching quality financial news...');
      
      const queries = [
        'stock market today breaking news analysis',
        'Federal Reserve interest rates inflation latest',
        'S&P 500 Nasdaq Dow Jones market update',
        'earnings reports technology financial sector today',
        'economic data GDP unemployment inflation news',
        'market volatility trading analysis today'
      ];
      
      const allArticles = [];
      
      for (const query of queries) {
        try {
          const results = await braveSearchService.search(query, {
            count: 15,
            freshness: 'pd', // Past day
            searchType: 'web'
          });
          
          if (results?.web?.results) {
            const articles = results.web.results
              .filter(r => this.isQualitySource(r.url))
              .map(r => ({
                title: r.title,
                url: r.url,
                snippet: r.description,
                source: this.extractSourceName(r.url),
                age: r.age || 'Today',
                thumbnail: r.thumbnail?.src
              }));
            
            allArticles.push(...articles);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.warn(`Failed to fetch news for query: ${query}`);
        }
      }
      
      // Deduplicate and sort by relevance
      const uniqueArticles = this.deduplicateArticles(allArticles);
      console.log(`✅ Found ${uniqueArticles.length} quality news articles`);
      
      return uniqueArticles;
      
    } catch (error) {
      console.error('❌ Error fetching quality news:', error);
      return [];
    }
  }

  /**
   * Check if URL is from a quality financial source
   */
  isQualitySource(url) {
    if (!url) return false;
    
    const qualitySources = [
      'bloomberg.com',
      'wsj.com',
      'ft.com',
      'reuters.com',
      'cnbc.com',
      'barrons.com',
      'marketwatch.com',
      'finance.yahoo.com',
      'forbes.com',
      'businessinsider.com',
      'seekingalpha.com',
      'investing.com',
      'morningstar.com',
      'fool.com'
    ];
    
    const lowerUrl = url.toLowerCase();
    return qualitySources.some(source => lowerUrl.includes(source));
  }

  /**
   * Extract clean source name from URL
   */
  extractSourceName(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      const sourceMap = {
        'bloomberg.com': 'Bloomberg',
        'cnbc.com': 'CNBC',
        'barrons.com': "Barron's",
        'wsj.com': 'Wall Street Journal',
        'reuters.com': 'Reuters',
        'marketwatch.com': 'MarketWatch',
        'finance.yahoo.com': 'Yahoo Finance',
        'ft.com': 'Financial Times',
        'forbes.com': 'Forbes',
        'businessinsider.com': 'Business Insider',
        'seekingalpha.com': 'Seeking Alpha',
        'investing.com': 'Investing.com',
        'morningstar.com': 'Morningstar',
        'fool.com': 'The Motley Fool'
      };
      
      for (const [domain, name] of Object.entries(sourceMap)) {
        if (hostname.includes(domain)) {
          return name;
        }
      }
      
      return hostname.replace('www.', '').split('.')[0];
      
    } catch (error) {
      return 'Financial News';
    }
  }

  /**
   * Deduplicate articles by title similarity
   */
  deduplicateArticles(articles) {
    const seen = new Set();
    const unique = [];
    
    for (const article of articles) {
      // Create a normalized key from the first 50 chars of title
      const key = article.title.toLowerCase().substring(0, 50).replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(article);
      }
    }
    
    return unique;
  }

  /**
   * Enrich articles with full content using multiple methods
   */
  async enrichArticlesWithContent(articles) {
    const enriched = [];
    
    for (const article of articles) {
      try {
        console.log(`📄 Extracting content from ${article.source}...`);
        
        // Try multiple methods to get content
        let content = article.snippet;
        
        // Method 1: Try to extract using Puppeteer for accessible sources
        if (this.isAccessibleSource(article.url)) {
          const extractedContent = await this.extractWithPuppeteer(article.url);
          if (extractedContent) {
            content = extractedContent;
          }
        }
        
        // Method 2: Try to get more info via Brave search with specific URL
        if (content === article.snippet) {
          const moreInfo = await this.getMoreInfoViaSearch(article.url);
          if (moreInfo) {
            content = moreInfo;
          }
        }
        
        enriched.push({
          ...article,
          content: content,
          hasFullContent: content !== article.snippet
        });
        
      } catch (error) {
        console.warn(`Failed to enrich article from ${article.source}`);
        enriched.push({
          ...article,
          content: article.snippet,
          hasFullContent: false
        });
      }
    }
    
    return enriched;
  }

  /**
   * Check if source is accessible without paywall
   */
  isAccessibleSource(url) {
    const accessibleSources = [
      'reuters.com',
      'cnbc.com',
      'marketwatch.com',
      'finance.yahoo.com',
      'forbes.com',
      'businessinsider.com',
      'investing.com',
      'fool.com'
    ];
    
    const lowerUrl = url.toLowerCase();
    return accessibleSources.some(source => lowerUrl.includes(source));
  }

  /**
   * Extract content using Puppeteer
   */
  async extractWithPuppeteer(url) {
    if (!this.browser) {
      await this.initialize();
    }
    
    if (!this.browser) return null;
    
    let page = null;
    
    try {
      page = await this.browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate with timeout
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Wait a bit for content to load
      await page.waitForTimeout(2000);
      
      // Extract article content with multiple selectors
      const content = await page.evaluate(() => {
        const selectors = [
          // Article body selectors
          'article p',
          '.article-body p',
          '.story-body p',
          '.content p',
          'main p',
          '.entry-content p',
          '[data-module="article-body"] p',
          '.InlineVideo-container ~ p',
          '.ArticleBody-articleBody p',
          
          // Specific site selectors
          '.story-body__inner p', // Reuters
          '.InlineVideo-container ~ p', // CNBC
          '.article__content p', // MarketWatch
          '.caas-body p', // Yahoo Finance
        ];
        
        let paragraphs = [];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach(el => {
              const text = el.textContent?.trim();
              if (text && text.length > 50) {
                paragraphs.push(text);
              }
            });
            
            if (paragraphs.length >= 3) break;
          }
        }
        
        // Get first 5 meaningful paragraphs
        return paragraphs.slice(0, 5).join('\n\n');
      });
      
      await page.close();
      
      return content || null;
      
    } catch (error) {
      console.warn(`Puppeteer extraction failed for ${url}: ${error.message}`);
      if (page) await page.close();
      return null;
    }
  }

  /**
   * Get more info about an article via targeted search
   */
  async getMoreInfoViaSearch(url) {
    try {
      // Search for the specific URL to get more context
      const results = await braveSearchService.search(`"${url}"`, {
        count: 5,
        searchType: 'web'
      });
      
      if (results?.web?.results) {
        // Combine descriptions from results
        const descriptions = results.web.results
          .filter(r => r.url === url || r.description?.length > 100)
          .map(r => r.description)
          .filter(d => d && d.length > 50);
        
        if (descriptions.length > 0) {
          return descriptions.join(' ');
        }
      }
      
      return null;
      
    } catch (error) {
      console.warn('Failed to get more info via search');
      return null;
    }
  }

  /**
   * Generate comprehensive summaries with market impact analysis
   */
  async generateNewsSummaries(articles) {
    const summaries = [];
    
    // Process top 5 articles
    const topArticles = articles.slice(0, 5);
    
    for (const article of topArticles) {
      try {
        console.log(`📝 Generating summary for: ${article.title}`);
        
        const summary = await this.generateSingleSummary(article);
        summaries.push(summary);
        
      } catch (error) {
        console.warn(`Failed to generate summary for article: ${article.title}`);
        
        // Fallback summary
        summaries.push({
          title: article.title,
          source: article.source,
          url: article.url,
          summary: article.snippet,
          marketImpact: 'Market impact analysis unavailable.',
          sectors: ['General Market'],
          timestamp: article.age
        });
      }
    }
    
    return summaries;
  }

  /**
   * Generate a single article summary with market impact
   */
  async generateSingleSummary(article) {
    // Try AI-powered summary first if Mistral is available
    if (mistralService.isReady()) {
      try {
        const prompt = `Analyze this financial news article and provide:
1. A concise 2-3 sentence summary of the key facts
2. The specific market impact and implications for investors
3. Which sectors/assets are most affected

Article Title: ${article.title}
Source: ${article.source}
Content: ${article.content}

Format your response as:
SUMMARY: [2-3 sentence factual summary]
MARKET IMPACT: [Specific implications for markets and investors]
AFFECTED SECTORS: [List of affected sectors/assets]`;

        const aiResponse = await mistralService.generateText(prompt, {
          temperature: 0.3,
          maxTokens: 500
        });
        
        // Parse AI response
        const summaryMatch = aiResponse.match(/SUMMARY:\s*(.+?)(?=MARKET IMPACT:|$)/s);
        const impactMatch = aiResponse.match(/MARKET IMPACT:\s*(.+?)(?=AFFECTED SECTORS:|$)/s);
        const sectorsMatch = aiResponse.match(/AFFECTED SECTORS:\s*(.+?)$/s);
        
        return {
          title: article.title,
          source: article.source,
          url: article.url,
          summary: summaryMatch ? summaryMatch[1].trim() : article.content.substring(0, 200),
          marketImpact: impactMatch ? impactMatch[1].trim() : 'Market impact analysis pending.',
          sectors: sectorsMatch ? sectorsMatch[1].trim().split(',').map(s => s.trim()) : ['General Market'],
          timestamp: article.age,
          hasAiAnalysis: true
        };
        
      } catch (error) {
        console.warn('AI summary generation failed, using algorithmic summary');
      }
    }
    
    // Fallback to algorithmic summary
    return this.generateAlgorithmicSummary(article);
  }

  /**
   * Generate algorithmic summary when AI is not available
   */
  generateAlgorithmicSummary(article) {
    const content = article.content || article.snippet;
    
    // Extract key information
    const summary = content.length > 200 
      ? content.substring(0, 200).trim() + '...'
      : content;
    
    // Analyze for market impact keywords
    const lowerContent = content.toLowerCase();
    const impacts = [];
    const sectors = new Set();
    
    // Check for Fed/monetary policy
    if (lowerContent.includes('federal reserve') || lowerContent.includes('interest rate')) {
      impacts.push('Interest rate expectations may shift, affecting bond yields and rate-sensitive sectors');
      sectors.add('Financials');
      sectors.add('Real Estate');
    }
    
    // Check for earnings
    if (lowerContent.includes('earnings') || lowerContent.includes('revenue')) {
      impacts.push('Corporate earnings data could drive sector rotation and individual stock movements');
      sectors.add('Technology');
      sectors.add('Consumer Discretionary');
    }
    
    // Check for economic data
    if (lowerContent.includes('gdp') || lowerContent.includes('inflation') || lowerContent.includes('unemployment')) {
      impacts.push('Economic indicators may influence Fed policy expectations and market sentiment');
      sectors.add('Broad Market');
    }
    
    // Check for specific sectors
    if (lowerContent.includes('tech') || lowerContent.includes('technology')) {
      sectors.add('Technology');
    }
    if (lowerContent.includes('bank') || lowerContent.includes('financial')) {
      sectors.add('Financials');
    }
    if (lowerContent.includes('energy') || lowerContent.includes('oil')) {
      sectors.add('Energy');
    }
    if (lowerContent.includes('retail') || lowerContent.includes('consumer')) {
      sectors.add('Consumer');
    }
    
    // Default impact if none found
    if (impacts.length === 0) {
      impacts.push('This development may influence market sentiment and trading activity');
    }
    
    // Default sector if none found
    if (sectors.size === 0) {
      sectors.add('General Market');
    }
    
    return {
      title: article.title,
      source: article.source,
      url: article.url,
      summary: summary,
      marketImpact: impacts.join('. '),
      sectors: Array.from(sectors),
      timestamp: article.age,
      hasAiAnalysis: false
    };
  }

  /**
   * Format the daily brief with summaries
   */
  formatDailyBrief(summaries) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Group sources
    const sources = [...new Set(summaries.map(s => s.source))];
    
    // Build the brief
    let brief = {
      date: currentDate,
      timestamp: new Date().toISOString(),
      topStories: summaries,
      sources: sources,
      marketOverview: this.generateMarketOverview(summaries),
      sectorsToWatch: this.identifySectorsToWatch(summaries)
    };
    
    return brief;
  }

  /**
   * Generate market overview from summaries
   */
  generateMarketOverview(summaries) {
    const allSectors = new Set();
    const keyThemes = new Set();
    
    summaries.forEach(summary => {
      summary.sectors.forEach(sector => allSectors.add(sector));
      
      // Extract themes from market impact
      const impact = summary.marketImpact.toLowerCase();
      if (impact.includes('interest rate') || impact.includes('fed')) {
        keyThemes.add('Monetary Policy');
      }
      if (impact.includes('earnings')) {
        keyThemes.add('Corporate Earnings');
      }
      if (impact.includes('inflation')) {
        keyThemes.add('Inflation Concerns');
      }
      if (impact.includes('volatility')) {
        keyThemes.add('Market Volatility');
      }
    });
    
    let overview = `Today's market is being shaped by ${summaries.length} major developments`;
    
    if (keyThemes.size > 0) {
      overview += ` with key themes including ${Array.from(keyThemes).join(', ')}`;
    }
    
    overview += `. The news flow suggests ${allSectors.size > 3 ? 'broad market' : 'sector-specific'} implications`;
    
    if (allSectors.has('Financials') && allSectors.has('Technology')) {
      overview += ` with both growth and value sectors in focus`;
    }
    
    overview += `. Investors should monitor these developments closely for potential trading opportunities and risk management.`;
    
    return overview;
  }

  /**
   * Identify sectors to watch based on news
   */
  identifySectorsToWatch(summaries) {
    const sectorCounts = {};
    
    summaries.forEach(summary => {
      summary.sectors.forEach(sector => {
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      });
    });
    
    // Sort by frequency
    const sorted = Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([sector, count]) => ({
        sector,
        newsCount: count,
        importance: count >= 2 ? 'High' : 'Medium'
      }));
    
    return sorted;
  }

  /**
   * Generate fallback brief when news fetching fails
   */
  generateFallbackBrief() {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return {
      date: currentDate,
      timestamp: new Date().toISOString(),
      topStories: [],
      sources: [],
      marketOverview: 'Unable to fetch current market news. Please check your internet connection and API configuration.',
      sectorsToWatch: [],
      error: true
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.isInitialized = false;
        console.log('🧹 News Content Extractor cleaned up');
      } catch (error) {
        console.error('Error cleaning up browser:', error);
      }
    }
  }
}

export default new NewsContentExtractor();
