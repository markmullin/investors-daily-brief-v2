import axios from 'axios';
import { marketService } from './apiServices.js';

class MarketDataService {
  constructor() {
    this.baseURL = 'https://eodhd.com/api';
    this.apiKey = '678aec6f82cd71.08686199';
    this.cache = new Map();
    this.cacheDuration = 60000; // 1 minute cache
    
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });
  }

  isCacheValid(key) {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheDuration;
  }

  async fetchWithCache(key, fetchFn) {
    if (this.isCacheValid(key)) {
      console.log(`Using cached data for ${key}`);
      return this.cache.get(key).data;
    }

    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  }

  async getStockData(symbol) {
    try {
      const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.US`;
      return await this.fetchWithCache(
        `stock_${formattedSymbol}`,
        async () => {
          console.log(`Fetching real-time data for ${formattedSymbol}`);
          const response = await this.axios.get(`/real-time/${formattedSymbol}`, {
            params: {
              api_token: this.apiKey,
              fmt: 'json'
            }
          });
          return {
            symbol: formattedSymbol,
            ...response.data
          };
        }
      );
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getHistoricalData(symbol, from = '2024-01-01') {
    try {
      const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.US`;
      return await this.fetchWithCache(
        `historical_${formattedSymbol}_${from}`,
        async () => {
          console.log(`Fetching historical data for ${formattedSymbol}`);
          const response = await this.axios.get(`/eod/${formattedSymbol}`, {
            params: {
              api_token: this.apiKey,
              fmt: 'json',
              from: from
            }
          });
          return response.data;
        }
      );
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getAllMarketData() {
    try {
      const symbols = [
        'SPY', 'QQQ', 'DIA',           // Major indices
        'TLT', 'VWO', 'IBIT', 'UUP',   // Risk metrics
        'XLF', 'XLK', 'XLE', 'XLV'     // Key sectors
      ];

      console.log('Fetching all market data...');
      const results = await Promise.allSettled(
        symbols.map(symbol => this.getStockData(symbol))
      );

      const validData = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      console.log(`Successfully fetched data for ${validData.length} symbols`);
      return validData;
    } catch (error) {
      console.error('Error in getAllMarketData:', error.message);
      throw error;
    }
  }

  async getFocusedMover() {
    try {
      // First get all data
      const allData = await this.getAllMarketData();
      
      // Find the biggest mover
      const mover = allData
        .sort((a, b) => Math.abs(b.change_p) - Math.abs(a.change_p))[0];

      if (!mover) {
        throw new Error('No mover data available');
      }

      // Get historical data for context
      const historicalData = await this.getHistoricalData(mover.symbol);

      return {
        ...mover,
        historicalData
      };
    } catch (error) {
      console.error('Error getting focused mover:', error.message);
      throw error;
    }
  }
}

export default new MarketDataService();