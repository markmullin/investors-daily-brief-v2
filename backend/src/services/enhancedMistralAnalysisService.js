/**
 * ENHANCED MISTRAL FINANCIAL ANALYSIS SERVICE
 * Handles comprehensive analysis of 20 articles (10 general + 10 company-specific)
 * UPDATED: More concise, current events focused (not investment advice)
 */
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15 minutes cache for AI analysis

class EnhancedMistralFinancialAnalysisService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY;
    this.baseUrl = 'https://api.mistral.ai/v1';
    this.model = 'mistral-large-latest';
    
    console.log('🤖 Enhanced Mistral Analysis Service initialized');
    console.log('🎯 Designed for concise current events summary (20-article analysis)');
  }

  /**
   * MAIN METHOD: Analyze comprehensive news (10 general + 10 company-specific)
   */
  async analyzeComprehensiveMarketNews(comprehensiveNewsData) {
    try {
      const { articles, breakdown } = comprehensiveNewsData;
      
      console.log('🤖 Generating concise current events analysis with Mistral AI...');
      console.log(`📊 Analyzing ${articles.length} articles: ${breakdown.generalMarket} general + ${breakdown.companySpecific} company-specific`);

      if (!articles || articles.length === 0) {
        return this.getFallbackAnalysis();
      }

      // Create cache key based on article content
      const cacheKey = `concise_mistral_${this.hashArticles(articles)}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('🔄 Returning cached concise Mistral analysis');
        return cached;
      }

      // Separate articles by category
      const generalArticles = articles.filter(a => a.category === 'general_market');
      const companyArticles = articles.filter(a => a.category === 'company_specific');

      // Build concise analysis prompt
      const prompt = this.buildConciseAnalysisPrompt(generalArticles, companyArticles);

      console.log(`📝 Generated concise prompt: ${prompt.length} characters`);

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getConciseSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800, // REDUCED from 1500 for more concise output
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 35000
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Mistral AI');
      }

      const analysis = {
        content: response.data.choices[0].message.content,
        sources: this.formatSourcesData(articles),
        breakdown: {
          generalMarketNews: generalArticles.length,
          companySpecificNews: companyArticles.length,
          totalArticles: articles.length,
          premiumSources: this.countPremiumSources(articles)
        },
        companies: this.extractCompaniesAnalyzed(companyArticles),
        generatedAt: new Date().toISOString(),
        model: this.model,
        analysisType: 'concise_current_events'
      };

      console.log('✅ Generated concise current events analysis:', {
        contentLength: analysis.content.length,
        sourcesCount: analysis.sources.length,
        companiesAnalyzed: analysis.companies.length,
        model: analysis.model
      });

      cache.set(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error('❌ Error generating concise Mistral analysis:', error.message);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * UPDATED: Concise system prompt for current events summary
   */
  getConciseSystemPrompt() {
    return `You are a financial news analyst who creates concise daily market summaries. Your job is to summarize current events and developments, NOT provide investment advice.

Key guidelines:
- Focus on WHAT HAPPENED in the news, not what investors should do
- Keep it concise - aim for 600-800 words maximum
- Summarize market developments and company news factually
- Reference specific companies, events, and sources mentioned
- Write in a neutral, informational tone
- Structure: Market Overview, Company Developments, Key Themes

Do NOT include:
- Investment recommendations or advice
- Portfolio positioning guidance
- "Investors should..." statements
- Risk assessments or investment implications sections

Write a clear, factual summary of today's financial news that informs readers about current events.`;
  }

  /**
   * UPDATED: Build concise analysis prompt focused on current events
   */
  buildConciseAnalysisPrompt(generalArticles, companyArticles) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Format general market news (shorter excerpts)
    const generalNewsSection = generalArticles.length > 0 
      ? generalArticles.map((article, index) => 
          `${index + 1}. **${article.source}**: ${article.title}
          ${article.description.substring(0, 200)}...`
        ).join('\n\n')
      : 'No general market news available.';

    // Format company-specific news (shorter excerpts)
    const companyNewsSection = companyArticles.length > 0
      ? companyArticles.map((article, index) => 
          `${index + 1}. **${article.companySymbol}** (${article.source}): ${article.title}
          ${article.description.substring(0, 150)}...`
        ).join('\n\n')
      : 'No company-specific news available.';

    return `Create a concise Daily Market Summary for ${currentDate}. Summarize the key developments from today's financial news.

**GENERAL MARKET NEWS (${generalArticles.length} articles):**
${generalNewsSection}

**COMPANY DEVELOPMENTS (${companyArticles.length} articles):**
${companyNewsSection}

**INSTRUCTIONS:**
Write a concise summary using this structure:

**Market Overview:**
Summarize the key general market developments from today's news. Focus on what happened - economic data, policy developments, market themes.

**Company Developments:**
Highlight the main company-specific news and developments. Reference specific companies and their announcements/results.

**Key Themes:**
Identify 3-4 main themes or trends emerging from today's news coverage.

Keep the entire summary to 600-800 words. Focus on factual reporting of events, not investment guidance. Reference specific companies and sources from the news above.`;
  }

  /**
   * Format sources data for response
   */
  formatSourcesData(articles) {
    return articles.map(article => ({
      title: article.title,
      source: article.source,
      url: article.url,
      category: article.category,
      company: article.companySymbol || null,
      priority: article.priority,
      publishedAt: article.publishedAt
    }));
  }

  /**
   * Extract companies analyzed for metadata
   */
  extractCompaniesAnalyzed(companyArticles) {
    return companyArticles.map(article => ({
      symbol: article.companySymbol,
      marketCap: article.marketCap,
      title: article.title,
      source: article.source
    }));
  }

  /**
   * Count premium sources in articles
   */
  countPremiumSources(articles) {
    const premiumSources = ['Reuters', 'MarketWatch', 'Barrons'];
    const found = new Set();
    
    articles.forEach(article => {
      if (premiumSources.includes(article.source)) {
        found.add(article.source);
      }
    });
    
    return Array.from(found);
  }

  /**
   * Helper: Hash articles for caching
   */
  hashArticles(articles) {
    const titles = articles.map(a => a.title).join('|');
    return Buffer.from(titles).toString('base64').substring(0, 20);
  }

  /**
   * Helper: Format market cap
   */
  formatMarketCap(marketCap) {
    if (!marketCap || marketCap === 0) return 'Private/Unknown';
    
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  }

  /**
   * Helper: Get time ago string
   */
  getTimeAgo(publishedAt) {
    const hoursAgo = (new Date() - new Date(publishedAt)) / (1000 * 60 * 60);
    
    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`;
    if (hoursAgo < 48) return 'Yesterday';
    return `${Math.round(hoursAgo / 24)}d ago`;
  }

  /**
   * UPDATED: Concise fallback analysis
   */
  getFallbackAnalysis() {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    return {
      content: `Daily Market Summary for ${currentDate}

**Market Overview:**
Financial markets continue to navigate evolving economic conditions with focus on monetary policy developments, corporate earnings season, and global economic indicators. Today's session reflects ongoing assessment of macroeconomic fundamentals and sector-specific dynamics across equity and fixed income markets.

**Company Developments:**
Major corporations are reporting quarterly results and strategic updates, with technology companies leading discussions around artificial intelligence investments and cloud services growth. Healthcare firms continue advancing drug development programs, while financial institutions adapt to changing interest rate environments.

**Key Themes:**
• Monetary policy expectations driving fixed income and equity positioning
• Technology sector innovation and AI infrastructure investment
• Healthcare advancement through pharmaceutical development
• Corporate earnings reflecting economic transition dynamics

*Comprehensive news analysis will resume shortly with real-time market developments.*`,
      sources: [],
      breakdown: {
        generalMarketNews: 0,
        companySpecificNews: 0,
        totalArticles: 0,
        premiumSources: []
      },
      companies: [],
      generatedAt: new Date().toISOString(),
      model: 'fallback-concise',
      analysisType: 'emergency_fallback'
    };
  }

  /**
   * Generate streaming analysis for typewriter effect
   */
  async generateStreamingComprehensiveAnalysis(comprehensiveNewsData) {
    try {
      console.log('🔄 Generating streaming concise analysis...');
      
      const { articles } = comprehensiveNewsData;
      const generalArticles = articles.filter(a => a.category === 'general_market');
      const companyArticles = articles.filter(a => a.category === 'company_specific');
      
      const prompt = this.buildConciseAnalysisPrompt(generalArticles, companyArticles);

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getConciseSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800, // Concise output
        stream: true
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 35000
      });

      return response.data;

    } catch (error) {
      console.error('❌ Error generating streaming concise analysis:', error.message);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return !!this.apiKey;
  }
}

export default new EnhancedMistralFinancialAnalysisService();