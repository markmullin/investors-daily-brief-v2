/**
 * News Service
 * Fetches real market news using EOD Historical Data News API
 * Falls back to S&P 500 stock price streaming
 */
import axios from 'axios';
import NodeCache from 'node-cache';

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
    this.apiKey = process.env.EOD_API_KEY || '678aec6f82cd71.08686199';
    this.baseUrl = 'https://eodhd.com/api';
    
    // Configure axios instance for EOD API
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Cache keys
    this.CACHE_KEYS = {
      MARKET_NEWS: 'market_news',
      STOCK_PRICES: 'stock_prices'
    };
  }
  
  /**
   * Get real market news from EOD News API
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
      console.log('Fetching market news from EOD News API');
      
      // Use EOD's news API endpoint for real market news
      const response = await this.client.get('/news', {
        params: {
          api_token: this.apiKey,
          s: 'SPY.US,QQQ.US,DIA.US,IWM.US', // Major indices for market news
          limit: 50,
          offset: 0,
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
          to: new Date().toISOString().split('T')[0]
        }
      });
      
      console.log('EOD News API response status:', response.status);
      
      const newsData = response.data || [];
      const articles = [];
      
      // Process news items
      newsData.forEach((item, index) => {
        if (!item.title || !item.link) return;
        
        articles.push({
          id: `eod-news-${item.date}-${index}`,
          title: item.title,
          description: item.content || '',
          url: item.link,
          source: 'Market News',
          publishedAt: item.date || new Date().toISOString(),
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
          source: 'eod'
        };
        
        newsCache.set(cacheKey, formattedNews);
        return formattedNews;
      } else {
        // If no news available, fall back to S&P 500 stock streaming
        return this.getStockPriceStream();
      }
    } catch (error) {
      console.error('Error fetching market news from EOD API:', error.message);
      // Fall back to stock price streaming
      return this.getStockPriceStream();
    }
  }
  
  /**
   * Get S&P 500 stock prices for streaming
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
      console.log('Fetching S&P 500 stock prices for streaming');
      
      // Batch request for top S&P 500 companies
      const symbols = SP500_TOP_COMPANIES.slice(0, 30).map(s => `${s}.US`).join(',');
      
      const response = await this.client.get(`/real-time/${symbols}`, {
        params: {
          api_token: this.apiKey,
          fmt: 'json'
        }
      });
      
      const stockData = Array.isArray(response.data) ? response.data : [response.data];
      const articles = [];
      
      stockData.forEach((stock) => {
        if (!stock.code || stock.volume === 0) return;
        
        const symbol = stock.code.replace('.US', '');
        const change = stock.change_p || 0;
        const direction = change >= 0 ? '▲' : '▼';
        const color = change >= 0 ? 'green' : 'red';
        
        articles.push({
          id: `stock-${symbol}-${Date.now()}`,
          title: `${symbol} ${stock.close} ${direction} ${Math.abs(change).toFixed(2)}%`,
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
      console.error('Error fetching stock prices:', error.message);
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