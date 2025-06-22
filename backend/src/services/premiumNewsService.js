// premiumNewsService.js - UPDATED for breaking current events news gathering
import axios from 'axios';
import puppeteer from 'puppeteer';

// Premium financial news sources - high-quality only
const PREMIUM_SOURCES = [
  'bloomberg.com',
  'wsj.com', 
  'ft.com',
  'reuters.com',
  'cnbc.com',
  'barrons.com',
  'marketwatch.com',
  'seekingalpha.com'
];

class PremiumNewsService {
  constructor() {
    this.braveApiKey = process.env.BRAVE_API_KEY || 'BSAFHHikdsv2YXSYODQSPES2tTMILHI';
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Puppeteer browser for premium content extraction
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('🚀 Initializing premium news service with Puppeteer...');
      
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
      console.log('✅ Premium news service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize premium news service:', error);
      return false;
    }
  }

  /**
   * Gather TODAY'S breaking financial news using Brave API + Puppeteer
   */
  async gatherPremiumNews(topics = ['breaking financial news today', 'stock market today', 'Federal Reserve']) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📰 Gathering TODAY\'S breaking financial news...');
      const allArticles = [];

      // Search for each topic using Brave API with today's date filter
      for (const topic of topics) {
        try {
          // Enhanced search with time filters and premium sources
          const searchQuery = `${topic} today ${new Date().toLocaleDateString()} site:bloomberg.com OR site:wsj.com OR site:ft.com OR site:reuters.com OR site:cnbc.com OR site:barrons.com`;
          
          console.log(`🔍 Searching breaking news: ${topic}`);
          
          const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': this.braveApiKey
            },
            params: {
              q: searchQuery,
              count: 8,
              freshness: 'pd', // Past day only
              safesearch: 'off',
              country: 'US',
              search_lang: 'en'
            },
            timeout: 15000
          });

          if (response.data?.web?.results) {
            for (const result of response.data.web.results) {
              // Verify it's from a premium source and recent
              const isPremium = PREMIUM_SOURCES.some(source => 
                result.url?.toLowerCase().includes(source)
              );

              // Check if it's breaking/recent news
              const isBreaking = this.isBreakingNews(result.title, result.description);

              if (isPremium && result.title && result.description && isBreaking) {
                // Extract more content using Puppeteer if needed
                const enhancedArticle = await this.enhanceArticleContent(result);
                allArticles.push(enhancedArticle);
              }
            }
          }
        } catch (searchError) {
          console.error(`Error searching for ${topic}:`, searchError.message);
        }
      }

      // Remove duplicates and sort by source quality and recency
      const uniqueArticles = this.deduplicateAndRank(allArticles);
      
      console.log(`✅ Gathered ${uniqueArticles.length} breaking news articles`);
      return uniqueArticles.slice(0, 12); // Return top 12 articles

    } catch (error) {
      console.error('❌ Error gathering breaking news:', error);
      throw new Error(`Failed to gather breaking news: ${error.message}`);
    }
  }

  /**
   * Check if news is breaking/current events
   */
  isBreakingNews(title, description) {
    const breakingKeywords = [
      'breaking', 'urgent', 'developing', 'live', 'update', 'alert',
      'today', 'now', 'current', 'latest', 'just in', 'minutes ago',
      'federal reserve', 'fed decision', 'interest rate', 'inflation',
      'iran', 'israel', 'conflict', 'war', 'geopolitical',
      'earnings', 'economic data', 'gdp', 'unemployment',
      'crypto', 'bitcoin', 'oil prices', 'market crash', 'rally'
    ];

    const text = `${title} ${description}`.toLowerCase();
    return breakingKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Enhance article content using Puppeteer (for accessible content)
   */
  async enhanceArticleContent(basicArticle) {
    try {
      // Create enhanced article object
      const enhancedArticle = {
        title: basicArticle.title,
        description: basicArticle.description,
        url: basicArticle.url,
        source: this.extractSourceName(basicArticle.url),
        publishedTime: basicArticle.age || new Date().toISOString(),
        thumbnail: basicArticle.thumbnail?.src || null,
        isPremium: true,
        content: basicArticle.description, // Start with description
        priority: this.calculatePriority(basicArticle.url, basicArticle.title, basicArticle.description)
      };

      // Try to get more content for non-paywall sources
      const freeAccessSources = ['reuters.com', 'cnbc.com', 'marketwatch.com'];
      const isFreeAccess = freeAccessSources.some(source => 
        basicArticle.url?.toLowerCase().includes(source)
      );

      if (isFreeAccess && this.browser) {
        try {
          const page = await this.browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          
          // Set short timeout for content extraction
          await page.goto(basicArticle.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 8000 
          });

          // Extract first paragraph or summary
          const content = await page.evaluate(() => {
            const selectors = [
              'p.InlineVideo-container ~ p',
              '.ArticleBody-articleBody p',
              '.story-body p',
              'article p',
              '.content p',
              '.summary',
              '.lead',
              'p'
            ];

            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              for (const element of elements) {
                const text = element.textContent?.trim();
                if (text && text.length > 150 && text.length < 800) {
                  return text;
                }
              }
            }
            return null;
          });

          if (content) {
            enhancedArticle.content = content;
          }

          await page.close();
        } catch (pageError) {
          console.log(`Could not enhance content for ${basicArticle.url}: ${pageError.message}`);
        }
      }

      return enhancedArticle;

    } catch (error) {
      console.error('Error enhancing article:', error);
      // Return basic article if enhancement fails
      return {
        title: basicArticle.title,
        description: basicArticle.description,
        url: basicArticle.url,
        source: this.extractSourceName(basicArticle.url),
        publishedTime: basicArticle.age || new Date().toISOString(),
        isPremium: true,
        priority: 'medium'
      };
    }
  }

  /**
   * Remove duplicates and rank articles by source quality and breaking news priority
   */
  deduplicateAndRank(articles) {
    const sourceRanking = {
      'bloomberg.com': 10,
      'wsj.com': 9,
      'ft.com': 8,
      'reuters.com': 7,
      'barrons.com': 6,
      'cnbc.com': 5,
      'marketwatch.com': 4,
      'seekingalpha.com': 3
    };

    // Remove duplicates by title similarity
    const uniqueArticles = [];
    const seenTitles = new Set();

    for (const article of articles) {
      const titleKey = article.title.toLowerCase().substring(0, 50);
      if (!seenTitles.has(titleKey)) {
        seenTitles.add(titleKey);
        
        // Add ranking score
        article.score = 0;
        for (const [domain, score] of Object.entries(sourceRanking)) {
          if (article.url?.includes(domain)) {
            article.score = score;
            break;
          }
        }

        // Boost score for breaking news keywords
        if (this.isBreakingNews(article.title, article.description)) {
          article.score += 5;
        }
        
        uniqueArticles.push(article);
      }
    }

    // Sort by score (highest first), then by recency
    return uniqueArticles.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return new Date(b.publishedTime) - new Date(a.publishedTime);
    });
  }

  /**
   * Calculate article priority based on source and breaking news content
   */
  calculatePriority(url, title, description) {
    const highPrioritySources = ['bloomberg.com', 'wsj.com', 'ft.com'];
    const highPriorityKeywords = ['fed', 'federal reserve', 'rate', 'inflation', 'earnings', 'breaking', 'iran', 'israel', 'war', 'conflict'];

    const isHighPrioritySource = highPrioritySources.some(source => url?.includes(source));
    const hasHighPriorityKeywords = highPriorityKeywords.some(keyword => 
      `${title} ${description}`.toLowerCase().includes(keyword)
    );

    if (isHighPrioritySource && hasHighPriorityKeywords) return 'high';
    if (isHighPrioritySource || hasHighPriorityKeywords) return 'medium';
    return 'low';
  }

  /**
   * Extract clean source name from URL
   */
  extractSourceName(url) {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      
      const sourceMap = {
        'bloomberg.com': 'Bloomberg',
        'wsj.com': 'Wall Street Journal',
        'ft.com': 'Financial Times',
        'reuters.com': 'Reuters',
        'cnbc.com': 'CNBC',
        'barrons.com': "Barron's",
        'marketwatch.com': 'MarketWatch',
        'seekingalpha.com': 'Seeking Alpha'
      };
      
      return sourceMap[hostname] || hostname;
    } catch {
      return 'Financial News';
    }
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
        console.log('🧹 Premium news service cleaned up');
      } catch (error) {
        console.error('Error cleaning up browser:', error);
      }
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      browserReady: Boolean(this.browser),
      apiKeyConfigured: Boolean(this.braveApiKey),
      focusArea: 'breaking-current-events'
    };
  }
}

export default new PremiumNewsService();
