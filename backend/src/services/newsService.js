/**
 * News Service - FMP ONLY
 * Fetches real market news using FMP API exclusively
 */
import NodeCache from 'node-cache';
import fmpService from './fmpService.js';

// Cache configuration - keep news for 15 minutes
const newsCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 });

// S&P 500 companies by market cap (top companies)
const SP500_TOP_COMPANIES = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'GOOG', 'META', 'BRK.B', 'LLY', 'AVGO',
  'JPM', 'V', 'TSLA', 'UNH', 'XOM', 'MA', 'PG', 'JNJ', 'HD', 'MRK',
  'COST', 'ORCL', 'ABBV', 'CVX', 'CRM', 'AMD', 'BAC', 'NFLX', 'KO', 'PEP',
  'TMO', 'WMT', 'ADBE', 'DIS', 'MCD', 'CSCO', 'ABT', 'WFC', 'INTC', 'VZ',
  'TXN', 'CAT', 'INTU', 'IBM', 'SPGI', 'BA', 'GE', 'QCOM', 'RTX', 'HON'
];

class NewsService {
  constructor() {
    this.fmpService = fmpService;
    
    // Cache keys
    this.CACHE_KEYS = {
      MARKET_NEWS: 'market_news',
      STOCK_PRICES: 'stock_prices'
    };
  }
  
  /**
   * Get real market news from FMP News API
   */
  async getMarketNews() {
    const cacheKey = this.CACHE_KEYS.MARKET_NEWS;
    
    // Check cache first
    const cachedNews = newsCache.get(cacheKey);
    if (cachedNews) {
      console.log('Returning cached market news');
      return cachedNews;
    }
    
    try {
      console.log('Fetching market news from FMP News API');
      
      // Use FMP's general news endpoint for market news
      const newsData = await this.fmpService.getGeneralNews(50);
      const articles = [];
      
      // Process news items
      newsData.forEach((item, index) => {
        if (!item.title || !item.url) return;
        
        articles.push({
          id: `fmp-news-${item.publishedDate}-${index}`,
          title: item.title,
          description: item.text || item.summary || '',
          url: item.url,
          source: item.site || 'Financial Modeling Prep',
          publishedAt: item.publishedDate || new Date().toISOString(),
          category: 'markets'
        });
      });
      
      if (articles.length > 0) {
        // Sort by date (most recent first)
        articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        // Limit to 15 most recent articles
        const topArticles = articles.slice(0, 15);
        
        const formattedNews = {
          articles: topArticles,
          source: 'fmp'
        };
        
        newsCache.set(cacheKey, formattedNews);
        return formattedNews;
      } else {
        // If no news available, fall back to S&P 500 stock streaming
        return this.getStockPriceStream();
      }
    } catch (error) {
      console.error('Error fetching market news from FMP API:', error.message);
      // Fall back to stock price streaming
      return this.getStockPriceStream();
    }
  }
  
  /**
   * Get S&P 500 stock prices for streaming via FMP
   */
  async getStockPriceStream() {
    const cacheKey = this.CACHE_KEYS.STOCK_PRICES;
    
    // Check cache first
    const cachedPrices = newsCache.get(cacheKey);
    if (cachedPrices) {
      console.log('Returning cached stock prices');
      return cachedPrices;
    }
    
    try {
      console.log('Fetching S&P 500 stock prices for streaming via FMP');
      
      // Get batch quotes from FMP for top S&P 500 companies
      const symbols = SP500_TOP_COMPANIES.slice(0, 30);
      const stockData = await this.fmpService.getQuoteBatch(symbols);
      const articles = [];
      
      stockData.forEach((stock) => {
        if (!stock.symbol || !stock.price) return;
        
        const symbol = stock.symbol;
        const change = stock.changesPercentage || 0;
        const direction = change >= 0 ? '▲' : '▼';
        
        articles.push({
          id: `stock-${symbol}-${Date.now()}`,
          title: `${symbol} ${stock.price} ${direction} ${Math.abs(change).toFixed(2)}%`,
          description: '',
          url: `https://finance.yahoo.com/quote/${symbol}`,
          source: 'Stock Price',
          publishedAt: new Date().toISOString(),
          category: 'stock_price'
        });
      });
      
      const formattedData = {
        articles: articles,
        source: 'sp500_stream'
      };
      
      // Cache for shorter duration (2 minutes) for price updates
      newsCache.set(cacheKey, formattedData, 120);
      
      return formattedData;
    } catch (error) {
      console.error('Error fetching stock prices from FMP:', error.message);
      return {
        articles: [],
        source: 'error',
        error: error.message
      };
    }
  }
  
  /**
   * Clear the news cache
   */
  clearCache() {
    newsCache.flushAll();
    console.log('News cache cleared');
  }
}

export default new NewsService();
