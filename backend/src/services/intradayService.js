/**
 * FIXED: Intraday Service using FMP API ONLY
 * NO MORE EOD API - Complete migration to FMP
 */

import axios from 'axios';

class IntradayService {
  constructor() {
    // FMP API configuration ONLY
    this.baseURL = 'https://financialmodelingprep.com/api/v3';
    this.apiKey = process.env.FMP_API_KEY || '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
    this.cache = new Map();
    this.cacheDuration = parseInt(process.env.CACHE_DURATION) || 300000;
  }

  /**
   * Get intraday data using FMP historical-chart endpoint
   */
  async getIntradayData(symbol, interval = '5min') {
    try {
      // Clean symbol for FMP (remove .US suffix if present)
      const cleanSymbol = symbol.replace('.US', '');
      
      // Check cache first
      const cacheKey = `${cleanSymbol}-${interval}`;
      const cachedData = this.cache.get(cacheKey);
      
      if (cachedData && Date.now() - cachedData.timestamp < this.cacheDuration) {
        console.log(`📦 [INTRADAY] Cache hit for ${cleanSymbol} ${interval}`);
        return cachedData.data;
      }

      // FMP intraday endpoint - historical-chart/{interval}/{symbol}
      const url = `${this.baseURL}/historical-chart/${interval}/${cleanSymbol}`;
      console.log(`🌐 [INTRADAY] Fetching FMP data: ${url}`);
      
      const response = await axios.get(url, {
        params: {
          apikey: this.apiKey
        },
        timeout: 10000
      });

      const data = response.data || [];
      console.log(`✅ [INTRADAY] FMP returned ${data.length} data points for ${cleanSymbol}`);

      // Cache the response
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: data
      });

      return data;
    } catch (error) {
      console.error(`❌ [INTRADAY] Error fetching FMP data for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch intraday data: ${error.message}`);
    }
  }

  /**
   * Get latest price from intraday data
   */
  async getLatestPrice(symbol) {
    try {
      const data = await this.getIntradayData(symbol);
      if (Array.isArray(data) && data.length > 0) {
        return data[0]; // FMP returns data in descending order (latest first)
      }
      return null;
    } catch (error) {
      console.error(`❌ [INTRADAY] Error getting latest price for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get multiple intervals for comprehensive data
   */
  async getMultipleIntervals(symbol, intervals = ['5min', '1hour']) {
    try {
      const results = {};
      
      for (const interval of intervals) {
        results[interval] = await this.getIntradayData(symbol, interval);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ [INTRADAY] Error fetching multiple intervals for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Clear cache for symbol
   */
  clearCache(symbol) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(symbol)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 [INTRADAY] Cleared cache for ${symbol}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 100, // Reasonable limit
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new IntradayService();
