import fmpService from './fmpService.js';
import unifiedGptOssService from './unifiedGptOssService.js';
import { redis as redisWrapper, db } from '../config/database.js';

/**
 * Earnings Theme Extraction Service - Fixed Version
 * Uses proper SQL queries instead of Knex syntax
 */
class EarningsThemeExtractionService {
  constructor() {
    this.cachePrefix = 'earnings_themes';
    this.themeCacheTTL = 86400; // 24 hours for theme data
    
    // Pre-defined theme categories for better classification
    this.themeCategories = {
      technology: [
        'artificial intelligence', 'AI', 'machine learning', 'ML', 'deep learning',
        'robotics', 'automation', 'robots', 'cobots', 'autonomous',
        'cloud computing', 'SaaS', 'edge computing', 'quantum computing',
        'cybersecurity', 'blockchain', 'crypto', 'web3', 'metaverse',
        '5G', '6G', 'IoT', 'internet of things', 'connected devices'
      ],
      healthcare: [
        'GLP-1', 'Ozempic', 'Wegovy', 'semaglutide', 'tirzepatide',
        'gene therapy', 'CRISPR', 'mRNA', 'biosimilars', 'biologics',
        'telehealth', 'digital health', 'remote monitoring', 'wearables',
        'precision medicine', 'personalized medicine', 'oncology', 'immunotherapy'
      ],
      sustainability: [
        'electric vehicles', 'EV', 'battery technology', 'charging infrastructure',
        'renewable energy', 'solar', 'wind power', 'hydrogen', 'green hydrogen',
        'carbon capture', 'net zero', 'ESG', 'sustainability', 'circular economy',
        'clean energy', 'energy storage', 'grid modernization'
      ],
      consumer: [
        'e-commerce', 'online retail', 'direct to consumer', 'DTC',
        'streaming', 'subscription economy', 'gig economy', 'creator economy',
        'plant-based', 'alternative protein', 'sustainable fashion',
        'gaming', 'esports', 'virtual reality', 'VR', 'AR', 'augmented reality'
      ],
      financial: [
        'fintech', 'digital payments', 'buy now pay later', 'BNPL',
        'cryptocurrency', 'DeFi', 'digital banking', 'neobank',
        'embedded finance', 'open banking', 'RegTech', 'InsurTech'
      ],
      industrials: [
        'supply chain', 'logistics', 'reshoring', 'nearshoring',
        'industrial automation', 'Industry 4.0', 'smart manufacturing',
        '3D printing', 'additive manufacturing', 'digital twin'
      ]
    };
    
    // Keywords that indicate forward-looking statements
    this.forwardIndicators = [
      'investing in', 'expanding into', 'launching', 'developing',
      'building', 'acquiring', 'partnering', 'strategic initiative',
      'growth driver', 'opportunity', 'pipeline', 'roadmap'
    ];
  }

  /**
   * Extract themes from a single earnings transcript
   */
  async extractThemesFromTranscript(symbol, transcript) {
    try {
      if (!transcript || !transcript.content) {
        console.log(`⚠️ [THEME EXTRACTION] No content for ${symbol}`);
        return { themes: [], keywords: [] };
      }

      // For now, return mock data to test the system
      // In production, this would call the AI service
      const mockThemes = [
        {
          theme: "AI Expansion",
          category: "technology",
          sentiment: "positive",
          importance: "high",
          context: "Investing heavily in AI capabilities...",
          forwardLooking: true,
          keywords: ["AI", "machine learning", "automation"]
        },
        {
          theme: "Cloud Growth",
          category: "technology",
          sentiment: "positive",
          importance: "medium",
          context: "Cloud revenue grew 35% YoY...",
          forwardLooking: false,
          keywords: ["cloud", "SaaS", "enterprise"]
        }
      ];

      return {
        themes: mockThemes.map(theme => ({
          ...theme,
          symbol,
          quarter: this.formatQuarter(transcript.date),
          date: transcript.date,
          discoveryTags: this.generateDiscoveryTags(theme)
        })),
        keywords: ["AI", "cloud", "automation", "enterprise"],
        summary: "Company focusing on AI and cloud expansion"
      };
    } catch (error) {
      console.error(`❌ [THEME EXTRACTION] Error for ${symbol}:`, error);
      return { themes: [], keywords: [] };
    }
  }

  /**
   * Extract themes from all recent transcripts for a company
   */
  async extractCompanyThemes(symbol, limit = 12) {
    try {
      const cacheKey = `${this.cachePrefix}:${symbol}:all_themes`;
      
      if (redisWrapper && redisWrapper.isConnected()) {
        const cached = await redisWrapper.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Get earnings transcripts from FMP
      const transcripts = await fmpService.getEarningsCallTranscripts(symbol, limit);
      
      if (!transcripts || transcripts.length === 0) {
        console.log(`⚠️ [THEME EXTRACTION] No transcripts for ${symbol}`);
        return { symbol, themes: [], keywords: [], transcriptCount: 0 };
      }

      console.log(`🔍 [THEME EXTRACTION] Processing ${transcripts.length} transcripts for ${symbol}`);
      
      // Extract themes from each transcript
      const allThemes = [];
      const allKeywords = new Set();
      const themeFrequency = new Map();
      
      for (const transcript of transcripts.slice(0, 3)) { // Process first 3 for performance
        const extracted = await this.extractThemesFromTranscript(symbol, transcript);
        
        if (extracted.themes) {
          allThemes.push(...extracted.themes);
          
          // Track theme frequency across quarters
          extracted.themes.forEach(theme => {
            const key = theme.theme.toLowerCase();
            if (!themeFrequency.has(key)) {
              themeFrequency.set(key, {
                theme: theme.theme,
                category: theme.category,
                mentions: 0,
                quarters: [],
                sentiments: []
              });
            }
            const freq = themeFrequency.get(key);
            freq.mentions++;
            freq.quarters.push(this.formatQuarter(transcript.date));
            freq.sentiments.push(theme.sentiment);
          });
        }
        
        if (extracted.keywords) {
          extracted.keywords.forEach(kw => allKeywords.add(kw.toLowerCase()));
        }
      }
      
      // Identify recurring themes
      const recurringThemes = Array.from(themeFrequency.values())
        .filter(t => t.mentions >= 2)
        .sort((a, b) => b.mentions - a.mentions);
      
      // Identify emerging themes
      const recentQuarters = transcripts.slice(0, 3).map(t => this.formatQuarter(t.date));
      const emergingThemes = allThemes.filter(theme => 
        recentQuarters.includes(theme.quarter) && 
        theme.forwardLooking && 
        theme.importance === 'high'
      );
      
      const result = {
        symbol,
        themes: allThemes,
        recurringThemes,
        emergingThemes,
        keywords: Array.from(allKeywords),
        transcriptCount: transcripts.length,
        lastUpdated: new Date().toISOString(),
        themeCategories: this.categorizeThemes(allThemes)
      };
      
      // Cache the results if Redis is available
      if (redisWrapper && redisWrapper.isConnected()) {
        await redisWrapper.setex(cacheKey, this.themeCacheTTL, JSON.stringify(result));
      }
      
      // Store in database for cross-stock discovery
      await this.storeThemesInDatabase(symbol, result);
      
      return result;
    } catch (error) {
      console.error(`❌ [THEME EXTRACTION] Failed for ${symbol}:`, error);
      return { symbol, themes: [], keywords: [], transcriptCount: 0 };
    }
  }

  /**
   * Store themes in database for discovery
   */
  async storeThemesInDatabase(symbol, themeData) {
    try {
      // Use proper SQL queries instead of Knex syntax
      const upsertCompanyThemesQuery = `
        INSERT INTO company_themes (
          symbol, themes, recurring_themes, emerging_themes, 
          keywords, theme_categories, transcript_count, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (symbol) 
        DO UPDATE SET 
          themes = $2,
          recurring_themes = $3,
          emerging_themes = $4,
          keywords = $5,
          theme_categories = $6,
          transcript_count = $7,
          updated_at = $8
      `;
      
      await db.query(upsertCompanyThemesQuery, [
        symbol,
        JSON.stringify(themeData.themes),
        JSON.stringify(themeData.recurringThemes),
        JSON.stringify(themeData.emergingThemes),
        JSON.stringify(themeData.keywords),
        JSON.stringify(themeData.themeCategories),
        themeData.transcriptCount,
        new Date()
      ]);
      
      // Store individual theme mappings
      for (const theme of themeData.themes) {
        const upsertThemeMappingQuery = `
          INSERT INTO theme_mappings (
            theme, category, symbol, sentiment, 
            importance, quarter, context, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (theme, symbol, quarter) 
          DO UPDATE SET 
            category = $2,
            sentiment = $4,
            importance = $5,
            context = $7,
            created_at = $8
        `;
        
        await db.query(upsertThemeMappingQuery, [
          theme.theme.toLowerCase(),
          theme.category,
          symbol,
          theme.sentiment,
          theme.importance,
          theme.quarter,
          theme.context,
          new Date()
        ]);
      }
      
      console.log(`✅ [THEME EXTRACTION] Stored themes for ${symbol} in database`);
    } catch (error) {
      console.error(`❌ [THEME EXTRACTION] Database storage failed:`, error);
    }
  }

  /**
   * Discover stocks by theme
   */
  async discoverStocksByTheme(theme, options = {}) {
    try {
      const {
        category = null,
        sentiment = null,
        importance = null,
        limit = 20
      } = options;
      
      let query = `
        SELECT symbol, sentiment, importance, quarter, context
        FROM theme_mappings
        WHERE theme LIKE $1
      `;
      const params = [`%${theme.toLowerCase()}%`];
      let paramIndex = 2;
      
      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }
      if (sentiment) {
        query += ` AND sentiment = $${paramIndex}`;
        params.push(sentiment);
        paramIndex++;
      }
      if (importance) {
        query += ` AND importance = $${paramIndex}`;
        params.push(importance);
        paramIndex++;
      }
      
      query += ` ORDER BY importance DESC, created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);
      
      const result = await db.query(query, params);
      
      // Group by symbol and aggregate data
      const stockMap = new Map();
      result.rows.forEach(row => {
        if (!stockMap.has(row.symbol)) {
          stockMap.set(row.symbol, {
            symbol: row.symbol,
            mentions: 0,
            quarters: [],
            sentiments: [],
            contexts: []
          });
        }
        const stock = stockMap.get(row.symbol);
        stock.mentions++;
        stock.quarters.push(row.quarter);
        stock.sentiments.push(row.sentiment);
        stock.contexts.push(row.context);
      });
      
      return Array.from(stockMap.values())
        .sort((a, b) => b.mentions - a.mentions);
    } catch (error) {
      console.error(`❌ [THEME DISCOVERY] Failed for theme "${theme}":`, error);
      return [];
    }
  }

  /**
   * Get trending themes across all stocks
   */
  async getTrendingThemes(options = {}) {
    try {
      const { days = 90, limit = 20 } = options;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const query = `
        SELECT 
          theme, 
          category,
          COUNT(*) as mention_count,
          COUNT(DISTINCT symbol) as stock_count
        FROM theme_mappings
        WHERE created_at >= $1
        GROUP BY theme, category
        ORDER BY mention_count DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [cutoffDate, limit]);
      
      return result.rows.map(row => ({
        theme: row.theme,
        category: row.category,
        mentions: parseInt(row.mention_count),
        stocks: parseInt(row.stock_count),
        trending: parseInt(row.mention_count) > 10
      }));
    } catch (error) {
      console.error('❌ [TRENDING THEMES] Failed:', error);
      return [];
    }
  }

  /**
   * Helper: Format quarter from date
   */
  formatQuarter(date) {
    const d = new Date(date);
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    const year = d.getFullYear();
    return `Q${quarter} ${year}`;
  }

  /**
   * Helper: Generate discovery tags for a theme
   */
  generateDiscoveryTags(theme) {
    const tags = [];
    
    // Add category tag
    if (theme.category) tags.push(theme.category);
    
    // Add sentiment tag if strong
    if (theme.sentiment === 'positive' && theme.importance === 'high') {
      tags.push('bullish');
    } else if (theme.sentiment === 'negative' && theme.importance === 'high') {
      tags.push('bearish');
    }
    
    // Add forward-looking tag
    if (theme.forwardLooking) tags.push('growth');
    
    // Extract key terms from theme name
    const words = theme.theme.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 3 && !['the', 'and', 'for', 'with'].includes(word)) {
        tags.push(word);
      }
    });
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Helper: Categorize themes
   */
  categorizeThemes(themes) {
    const categories = {};
    
    themes.forEach(theme => {
      const cat = theme.category || 'other';
      if (!categories[cat]) {
        categories[cat] = {
          count: 0,
          themes: [],
          topThemes: []
        };
      }
      categories[cat].count++;
      categories[cat].themes.push(theme.theme);
    });
    
    // Get top themes per category
    Object.keys(categories).forEach(cat => {
      const categoryThemes = themes.filter(t => (t.category || 'other') === cat);
      categories[cat].topThemes = categoryThemes
        .filter(t => t.importance === 'high')
        .slice(0, 3)
        .map(t => t.theme);
    });
    
    return categories;
  }
}

export default new EarningsThemeExtractionService();
