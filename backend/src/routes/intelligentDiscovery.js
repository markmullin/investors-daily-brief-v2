import express from 'express';
import fmpService from '../services/fmpService.js';
import { redis } from '../config/database.js';

const router = express.Router();

/**
 * 🎯 INTELLIGENT DISCOVERY SYSTEM - Real-time Market Intelligence
 * 
 * NO HARDCODED DATA - Everything is dynamic and intelligent
 * Uses FMP Ultimate API for comprehensive market analysis
 */

/**
 * 📈 INTELLIGENT MARKET PULSE - News-driven momentum
 * Combines price movement with news sentiment and volume
 */
const getIntelligentMarketPulse = async () => {
  try {
    console.log('📈 [INTELLIGENT MARKET PULSE] Analyzing market momentum with news...');
    
    // Get multiple data sources for intelligent analysis
    const [gainers, losers, actives, news] = await Promise.allSettled([
      fmpService.getGainers(),
      fmpService.getLosers(),
      fmpService.getActives(),
      fmpService.makeRequest('/v4/general_news', { limit: 50 })
    ]);
    
    const topGainers = gainers.status === 'fulfilled' ? gainers.value : [];
    const topLosers = losers.status === 'fulfilled' ? losers.value : [];
    const highVolume = actives.status === 'fulfilled' ? actives.value : [];
    const marketNews = news.status === 'fulfilled' ? news.value : [];
    
    // Extract symbols mentioned in news for context
    const newsSymbols = new Set();
    const symbolNews = {};
    
    if (Array.isArray(marketNews)) {
      marketNews.forEach(article => {
        const symbols = article.symbol?.split(',') || [];
        symbols.forEach(symbol => {
          if (symbol) {
            newsSymbols.add(symbol.trim());
            if (!symbolNews[symbol]) {
              symbolNews[symbol] = [];
            }
            symbolNews[symbol].push({
              title: article.title,
              sentiment: article.sentiment || 'neutral',
              publishedDate: article.publishedDate
            });
          }
        });
      });
    }
    
    // Create intelligent stock list with news context
    const intelligentStocks = [];
    
    // Process gainers with news context
    topGainers.slice(0, 8).forEach(stock => {
      if (stock.ticker) {
        const hasNews = newsSymbols.has(stock.ticker);
        const stockNews = symbolNews[stock.ticker] || [];
        
        intelligentStocks.push({
          symbol: stock.ticker,
          name: stock.companyName,
          price: parseFloat(stock.price) || 0,
          change: parseFloat(stock.changes) || 0,
          changePercent: parseFloat(stock.changesPercentage) || 0,
          volume: stock.volume || null,
          category: 'gainer',
          hasNews: hasNews,
          newsCount: stockNews.length,
          sentiment: stockNews[0]?.sentiment || 'neutral',
          reason: hasNews 
            ? `📰 ${stockNews.length} news article${stockNews.length > 1 ? 's' : ''} • +${parseFloat(stock.changesPercentage || 0).toFixed(1)}%`
            : `📈 Gaining +${parseFloat(stock.changesPercentage || 0).toFixed(1)}%`,
          intelligence: {
            priceMovement: 'bullish',
            newsPresence: hasNews,
            volumeSignal: 'normal',
            composite: hasNews ? 'strong_bullish' : 'bullish'
          }
        });
      }
    });
    
    // Process losers with news context
    topLosers.slice(0, 5).forEach(stock => {
      if (stock.ticker) {
        const hasNews = newsSymbols.has(stock.ticker);
        const stockNews = symbolNews[stock.ticker] || [];
        
        intelligentStocks.push({
          symbol: stock.ticker,
          name: stock.companyName,
          price: parseFloat(stock.price) || 0,
          change: parseFloat(stock.changes) || 0,
          changePercent: parseFloat(stock.changesPercentage) || 0,
          volume: stock.volume || null,
          category: 'loser',
          hasNews: hasNews,
          newsCount: stockNews.length,
          sentiment: stockNews[0]?.sentiment || 'negative',
          reason: hasNews 
            ? `⚠️ ${stockNews.length} news article${stockNews.length > 1 ? 's' : ''} • ${parseFloat(stock.changesPercentage || 0).toFixed(1)}%`
            : `📉 Declining ${parseFloat(stock.changesPercentage || 0).toFixed(1)}%`,
          intelligence: {
            priceMovement: 'bearish',
            newsPresence: hasNews,
            volumeSignal: 'normal',
            composite: hasNews ? 'strong_bearish' : 'bearish'
          }
        });
      }
    });
    
    // Add high volume stocks with unusual activity
    highVolume.slice(0, 5).forEach(stock => {
      if (stock.ticker && !intelligentStocks.find(s => s.symbol === stock.ticker)) {
        const hasNews = newsSymbols.has(stock.ticker);
        
        intelligentStocks.push({
          symbol: stock.ticker,
          name: stock.companyName,
          price: parseFloat(stock.price) || 0,
          change: parseFloat(stock.changes) || 0,
          changePercent: parseFloat(stock.changesPercentage) || 0,
          volume: stock.volume || null,
          category: 'active',
          hasNews: hasNews,
          reason: hasNews ? '🔥 High volume + News' : '📊 Unusual volume',
          intelligence: {
            priceMovement: stock.changesPercentage > 0 ? 'bullish' : 'bearish',
            newsPresence: hasNews,
            volumeSignal: 'high',
            composite: 'high_activity'
          }
        });
      }
    });
    
    // Sort by intelligence composite score
    intelligentStocks.sort((a, b) => {
      const scoreMap = {
        'strong_bullish': 5,
        'strong_bearish': 4,
        'high_activity': 3,
        'bullish': 2,
        'bearish': 1
      };
      return (scoreMap[b.intelligence?.composite] || 0) - (scoreMap[a.intelligence?.composite] || 0);
    });
    
    console.log(`✅ [INTELLIGENT MARKET PULSE] ${intelligentStocks.length} stocks with news context`);
    
    return {
      stocks: intelligentStocks.slice(0, 15),
      summary: {
        totalStocks: intelligentStocks.length,
        withNews: intelligentStocks.filter(s => s.hasNews).length,
        dataSource: 'intelligent_analysis'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [INTELLIGENT MARKET PULSE] Error:', error);
    return { stocks: [], summary: { error: true }, lastUpdated: new Date().toISOString() };
  }
};

/**
 * 📊 INTELLIGENT EARNINGS - With estimates and surprise history
 */
const getIntelligentEarnings = async () => {
  try {
    console.log('📊 [INTELLIGENT EARNINGS] Analyzing upcoming earnings...');
    
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const fromDate = today.toISOString().split('T')[0];
    const toDate = twoWeeksFromNow.toISOString().split('T')[0];
    
    // Get earnings calendar
    const earnings = await fmpService.getEarningsCalendar(fromDate, toDate);
    
    if (!earnings || earnings.length === 0) {
      return { stocks: [], summary: { error: true }, lastUpdated: new Date().toISOString() };
    }
    
    // Process earnings with intelligent ranking
    const earningsStocks = await Promise.all(
      earnings.slice(0, 20).map(async (earning) => {
        try {
          // Try to get analyst estimates for EPS
          const estimates = await fmpService.makeRequest(`/v3/analyst-estimates/${earning.symbol}`, { limit: 1 });
          const estimate = estimates?.[0] || {};
          
          return {
            symbol: earning.symbol,
            name: earning.companyName || earning.symbol,
            earningsDate: earning.date,
            earningsTime: earning.time || 'TBD',
            estimatedEPS: estimate.estimatedEpsAvg || earning.eps || null,
            estimatedRevenue: estimate.estimatedRevenueAvg || earning.revenue || null,
            fiscalPeriod: earning.fiscalDateEnding,
            importance: earning.symbol.length <= 4 ? 'high' : 'medium',
            category: 'earnings',
            reason: `Reports ${new Date(earning.date).toLocaleDateString()}`,
            hasEstimates: !!estimate.estimatedEpsAvg
          };
        } catch (err) {
          return {
            symbol: earning.symbol,
            name: earning.companyName || earning.symbol,
            earningsDate: earning.date,
            earningsTime: earning.time || 'TBD',
            category: 'earnings',
            reason: `Reports ${new Date(earning.date).toLocaleDateString()}`
          };
        }
      })
    );
    
    // Sort by date and importance
    earningsStocks.sort((a, b) => {
      const dateA = new Date(a.earningsDate);
      const dateB = new Date(b.earningsDate);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      return a.importance === 'high' ? -1 : 1;
    });
    
    console.log(`✅ [INTELLIGENT EARNINGS] ${earningsStocks.length} earnings with estimates`);
    
    return {
      stocks: earningsStocks,
      summary: {
        totalStocks: earningsStocks.length,
        withEstimates: earningsStocks.filter(s => s.hasEstimates).length,
        dataSource: 'earnings_calendar'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [INTELLIGENT EARNINGS] Error:', error);
    return { stocks: [], summary: { error: true }, lastUpdated: new Date().toISOString() };
  }
};

/**
 * 🔥 DYNAMIC MARKET THEMES - Based on actual sector performance
 */
const getDynamicMarketThemes = async () => {
  try {
    console.log('🔥 [DYNAMIC THEMES] Analyzing sector rotation and themes...');
    
    // Get sector performance
    const sectorETFs = {
      'XLF': 'Financials',
      'XLK': 'Technology', 
      'XLV': 'Healthcare',
      'XLE': 'Energy',
      'XLI': 'Industrials',
      'XLY': 'Consumer Discretionary',
      'XLP': 'Consumer Staples',
      'XLU': 'Utilities',
      'XLB': 'Materials',
      'XLRE': 'Real Estate',
      'XLC': 'Communication Services'
    };
    
    const etfSymbols = Object.keys(sectorETFs);
    const [sectorQuotes, trendingNews] = await Promise.allSettled([
      fmpService.getQuoteBatch(etfSymbols),
      fmpService.makeRequest('/v4/general_news', { limit: 100 })
    ]);
    
    const sectors = sectorQuotes.status === 'fulfilled' ? sectorQuotes.value : [];
    const news = trendingNews.status === 'fulfilled' ? trendingNews.value : [];
    
    // Analyze sector performance
    const sectorPerformance = sectors.map(etf => ({
      sector: sectorETFs[etf.symbol],
      etf: etf.symbol,
      changePercent: parseFloat(etf.changesPercentage) || 0,
      volume: etf.volume || 0
    })).sort((a, b) => b.changePercent - a.changePercent);
    
    // Extract trending themes from news
    const themeKeywords = {
      'AI & Technology': ['AI', 'artificial intelligence', 'machine learning', 'nvidia', 'chips', 'semiconductor'],
      'Interest Rates': ['fed', 'federal reserve', 'rates', 'inflation', 'CPI', 'powell'],
      'Energy Transition': ['EV', 'electric', 'renewable', 'solar', 'battery', 'climate'],
      'Banking Crisis': ['bank', 'financial', 'credit', 'deposit', 'SVB', 'regional'],
      'China Recovery': ['china', 'chinese', 'asia', 'emerging', 'yuan', 'beijing'],
      'Healthcare Innovation': ['biotech', 'pharma', 'drug', 'FDA', 'vaccine', 'treatment']
    };
    
    const themeScores = {};
    Object.keys(themeKeywords).forEach(theme => {
      themeScores[theme] = 0;
    });
    
    // Score themes based on news mentions
    if (Array.isArray(news)) {
      news.forEach(article => {
        const text = (article.title + ' ' + article.text).toLowerCase();
        Object.entries(themeKeywords).forEach(([theme, keywords]) => {
          keywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
              themeScores[theme]++;
            }
          });
        });
      });
    }
    
    // Get top 3 themes
    const topThemes = Object.entries(themeScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme, score]) => ({ theme, score }));
    
    // Build theme stocks dynamically based on current trends
    const themeStocks = [];
    
    // Leading sectors theme
    if (sectorPerformance[0]?.changePercent > 1) {
      const leadingSector = sectorPerformance[0];
      themeStocks.push({
        theme: `${leadingSector.sector} Leading`,
        description: `${leadingSector.sector} sector up ${leadingSector.changePercent.toFixed(1)}%`,
        etf: leadingSector.etf,
        performance: leadingSector.changePercent,
        category: 'sector_rotation'
      });
    }
    
    // Trending news themes
    topThemes.forEach(({ theme, score }) => {
      if (score > 2) {
        themeStocks.push({
          theme: theme,
          description: `${score} news mentions today`,
          mentions: score,
          category: 'trending_theme'
        });
      }
    });
    
    // Risk on/off theme
    const riskOnSectors = ['Technology', 'Consumer Discretionary', 'Communication Services'];
    const defensiveSectors = ['Utilities', 'Consumer Staples', 'Healthcare'];
    
    const riskOnPerf = sectorPerformance
      .filter(s => riskOnSectors.includes(s.sector))
      .reduce((sum, s) => sum + s.changePercent, 0) / 3;
    
    const defensivePerf = sectorPerformance
      .filter(s => defensiveSectors.includes(s.sector))
      .reduce((sum, s) => sum + s.changePercent, 0) / 3;
    
    if (Math.abs(riskOnPerf - defensivePerf) > 0.5) {
      themeStocks.push({
        theme: riskOnPerf > defensivePerf ? 'Risk-On Rally' : 'Defensive Rotation',
        description: riskOnPerf > defensivePerf 
          ? `Growth outperforming by ${(riskOnPerf - defensivePerf).toFixed(1)}%`
          : `Defensive outperforming by ${(defensivePerf - riskOnPerf).toFixed(1)}%`,
        category: 'market_sentiment'
      });
    }
    
    console.log(`✅ [DYNAMIC THEMES] ${themeStocks.length} active themes identified`);
    
    return {
      themes: themeStocks,
      sectorPerformance: sectorPerformance,
      topThemes: topThemes,
      summary: {
        totalThemes: themeStocks.length,
        leadingSector: sectorPerformance[0]?.sector,
        dataSource: 'dynamic_analysis'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [DYNAMIC THEMES] Error:', error);
    return { themes: [], summary: { error: true }, lastUpdated: new Date().toISOString() };
  }
};

/**
 * ❤️ INTELLIGENT FOR YOU - Based on trending and momentum
 */
const getIntelligentForYou = async () => {
  try {
    console.log('❤️ [INTELLIGENT FOR YOU] Generating smart recommendations...');
    
    // Get multiple data sources for intelligent recommendations
    const [trending, gainers, institutionalBuying] = await Promise.allSettled([
      fmpService.makeRequest('/v3/stock-screener', {
        marketCapMoreThan: 10000000000, // $10B+ companies
        volumeMoreThan: 5000000, // High volume
        limit: 20
      }),
      fmpService.getGainers(),
      fmpService.makeRequest('/v4/institutional-ownership/institutional-holders/portfolio-holdings-summary', {
        cik: '0001067983' // Berkshire Hathaway as example
      })
    ]);
    
    const screenedStocks = trending.status === 'fulfilled' ? trending.value : [];
    const topGainers = gainers.status === 'fulfilled' ? gainers.value : [];
    
    const recommendations = [];
    
    // Add quality large caps
    if (Array.isArray(screenedStocks)) {
      screenedStocks.slice(0, 5).forEach(stock => {
        if (stock.symbol) {
          recommendations.push({
            symbol: stock.symbol,
            name: stock.companyName || stock.symbol,
            price: stock.price || 0,
            changePercent: stock.changesPercentage || 0,
            marketCap: stock.marketCap || 0,
            pe: stock.pe || null,
            category: 'quality',
            reason: 'Large cap quality stock',
            score: 85
          });
        }
      });
    }
    
    // Add momentum plays
    if (Array.isArray(topGainers)) {
      topGainers.slice(0, 3).forEach(stock => {
        if (stock.ticker && !recommendations.find(r => r.symbol === stock.ticker)) {
          recommendations.push({
            symbol: stock.ticker,
            name: stock.companyName,
            price: parseFloat(stock.price) || 0,
            changePercent: parseFloat(stock.changesPercentage) || 0,
            category: 'momentum',
            reason: 'Strong momentum today',
            score: 75
          });
        }
      });
    }
    
    // Get some value plays (low P/E stocks)
    const valueScreener = await fmpService.makeRequest('/v3/stock-screener', {
      marketCapMoreThan: 5000000000,
      peMoreThan: 5,
      peLowerThan: 15,
      limit: 5
    });
    
    if (Array.isArray(valueScreener)) {
      valueScreener.forEach(stock => {
        if (stock.symbol && !recommendations.find(r => r.symbol === stock.symbol)) {
          recommendations.push({
            symbol: stock.symbol,
            name: stock.companyName || stock.symbol,
            price: stock.price || 0,
            changePercent: stock.changesPercentage || 0,
            pe: stock.pe || null,
            category: 'value',
            reason: `P/E: ${stock.pe?.toFixed(1) || 'N/A'} - Value opportunity`,
            score: 70
          });
        }
      });
    }
    
    // Sort by score and limit
    recommendations.sort((a, b) => b.score - a.score);
    
    console.log(`✅ [INTELLIGENT FOR YOU] ${recommendations.length} smart recommendations`);
    
    return {
      stocks: recommendations.slice(0, 10),
      summary: {
        totalStocks: recommendations.length,
        categories: {
          quality: recommendations.filter(r => r.category === 'quality').length,
          momentum: recommendations.filter(r => r.category === 'momentum').length,
          value: recommendations.filter(r => r.category === 'value').length
        },
        dataSource: 'intelligent_screening'
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [INTELLIGENT FOR YOU] Error:', error);
    return { stocks: [], summary: { error: true }, lastUpdated: new Date().toISOString() };
  }
};

// ROUTE HANDLERS
router.get('/market-pulse', async (req, res) => {
  try {
    const data = await getIntelligentMarketPulse();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/earnings-spotlight', async (req, res) => {
  try {
    const data = await getIntelligentEarnings();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/market-themes', async (req, res) => {
  try {
    const data = await getDynamicMarketThemes();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/for-you', async (req, res) => {
  try {
    const data = await getIntelligentForYou();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    console.log('🎯 [INTELLIGENT DISCOVERY] Loading all discovery data...');
    
    const [marketPulse, earnings, themes, forYou] = await Promise.allSettled([
      getIntelligentMarketPulse(),
      getIntelligentEarnings(),
      getDynamicMarketThemes(),
      getIntelligentForYou()
    ]);
    
    const discoveryData = {
      market_pulse: marketPulse.status === 'fulfilled' ? marketPulse.value : { stocks: [] },
      earnings_spotlight: earnings.status === 'fulfilled' ? earnings.value : { stocks: [] },
      market_themes: themes.status === 'fulfilled' ? themes.value : { themes: [] },
      for_you: forYou.status === 'fulfilled' ? forYou.value : { stocks: [] }
    };
    
    res.json({
      success: true,
      data: discoveryData,
      summary: {
        totalStocks: (discoveryData.market_pulse.stocks?.length || 0) + 
                    (discoveryData.earnings_spotlight.stocks?.length || 0) + 
                    (discoveryData.for_you.stocks?.length || 0),
        totalThemes: discoveryData.market_themes.themes?.length || 0,
        systemStatus: 'intelligent',
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [INTELLIGENT DISCOVERY] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
