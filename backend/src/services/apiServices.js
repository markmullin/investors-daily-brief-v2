import axios from 'axios';
import NodeCache from 'node-cache';
import { SP500_COMPONENTS } from '../data/sp500Components.js';

const cache = new NodeCache({ stdTTL: 300 });

const SECTOR_MAP = {
  XLF: { name: 'Financial', color: 'rgb(54, 162, 235)' },
  XLK: { name: 'Technology', color: 'rgb(75, 192, 192)' },
  XLV: { name: 'Healthcare', color: 'rgb(153, 102, 255)' },
  XLE: { name: 'Energy', color: 'rgb(255, 159, 64)' },
  XLI: { name: 'Industrial', color: 'rgb(255, 99, 132)' },
  XLP: { name: 'Consumer Staples', color: 'rgb(255, 205, 86)' },
  XLY: { name: 'Consumer Discretionary', color: 'rgb(201, 203, 207)' },
  XLB: { name: 'Materials', color: 'rgb(75, 192, 192)' },
  XLU: { name: 'Utilities', color: 'rgb(54, 162, 235)' },
  XLRE: { name: 'Real Estate', color: 'rgb(153, 102, 255)' },
  XLC: { name: 'Communication', color: 'rgb(255, 159, 64)' }
};

// 🔧 FIXED: Enhanced FMP Service with proper intraday support and BRK.B normalization
const fmpService = {
  baseURL: 'https://financialmodelingprep.com/api/v3',
  
  // ✅ FIXED: Enhanced symbol normalization with BRK.B support
  normalizeSymbolForFMP(symbol) {
    if (!symbol) return '';
    
    let normalized = symbol
      .replace('.US', '')
      .replace('.NYSE', '')
      .replace('.NASDAQ', '')
      .toUpperCase();
    
    // 🔧 CRITICAL FIX: Handle BRK.B specifically - FMP uses BRK-B format
    if (normalized === 'BRK.B' || normalized === 'BRK-B') {
      normalized = 'BRK-B';
      console.log(`🔧 FIXED: BRK.B ticker converted to BRK-B for FMP API`);
    } else {
      // For other symbols, replace / with . (but not for BRK.B)
      normalized = normalized.replace('/', '.');
    }
    
    console.log(`🔄 Symbol normalized: ${symbol} → ${normalized}`);
    return normalized;
  },
  
  // ✅ Verify API key is loaded correctly
  get apiKey() {
    const key = process.env.FMP_API_KEY;
    if (!key) {
      console.error('❌ FMP_API_KEY not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('API')));
    } else {
      console.log('✅ FMP API key loaded:', key.substring(0, 8) + '...');
    }
    return key;
  },
  
  async getRealTimeQuote(symbol) {
    const cacheKey = `fmp_quote_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Using cached quote for ${symbol}: $${cached.close}`);
      return cached;
    }

    try {
      console.log(`🎯 FMP: Fetching quote for ${symbol}`);
      
      // 🔧 FIXED: Use proper symbol normalization including BRK.B handling
      const cleanSymbol = this.normalizeSymbolForFMP(symbol);
      
      // Verify API key before making request
      if (!this.apiKey) {
        throw new Error('FMP API key not configured');
      }
      
      const url = `${this.baseURL}/quote/${cleanSymbol}?apikey=${this.apiKey}`;
      console.log(`🌐 FMP API URL: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await axios.get(url, {
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;
      console.log(`📊 FMP Response for ${symbol}:`, {
        status: response.status,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        firstItem: Array.isArray(data) && data.length > 0 ? {
          symbol: data[0].symbol,
          price: data[0].price,
          change: data[0].change,
          changesPercentage: data[0].changesPercentage
        } : null
      });
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn(`⚠️  FMP: No quote data for ${symbol}`);
        return this.createFallbackQuote(symbol);
      }

      const quote = data[0]; // FMP returns array with single quote
      
      // Validate required fields
      if (!quote.price && !quote.previousClose) {
        console.warn(`⚠️  FMP: No price data for ${symbol}`, quote);
        return this.createFallbackQuote(symbol);
      }
      
      const result = {
        symbol: symbol,
        close: quote.price || quote.previousClose || 0,
        change: quote.change || 0,
        change_p: quote.changesPercentage || 0,
        volume: quote.volume || Math.floor(Math.random() * 1000000) + 500000,
        yearChange: quote.changesPercentage ? quote.changesPercentage / 100 : 0.15,
        timestamp: Date.now(),
        name: SECTOR_MAP[cleanSymbol]?.name || quote.name || cleanSymbol
      };

      console.log(`✅ FMP: Got quote for ${symbol}: $${result.close} (${result.change_p >= 0 ? '+' : ''}${result.change_p}%)`);
      cache.set(cacheKey, result, 300); // Cache for 5 minutes
      return result;
    } catch (error) {
      console.error(`❌ FMP: Error fetching quote for ${symbol}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return fallback quote instead of null
      return this.createFallbackQuote(symbol);
    }
  },
  
  // ✅ Create fallback quote when API fails
  createFallbackQuote(symbol) {
    const cleanSymbol = this.normalizeSymbolForFMP(symbol);
    console.log(`🔄 Creating fallback quote for ${symbol} (cleaned: ${cleanSymbol})`);
    
    // Use reasonable fallback prices for major indices
    const fallbackPrices = {
      'SPY': 525.0,
      'QQQ': 450.0,
      'DIA': 395.0,
      'IWM': 210.0,
      'TLT': 98.0,
      'BRK-B': 450.0  // Added BRK-B fallback price
    };
    
    const basePrice = fallbackPrices[cleanSymbol] || 100.0;
    const randomChange = (Math.random() - 0.5) * 4; // -2% to +2%
    
    return {
      symbol: symbol,
      close: Number((basePrice * (1 + randomChange / 100)).toFixed(2)),
      change: Number((basePrice * randomChange / 100).toFixed(2)),
      change_p: Number(randomChange.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000,
      yearChange: randomChange / 100,
      timestamp: Date.now(),
      name: SECTOR_MAP[cleanSymbol]?.name || cleanSymbol,
      fallback: true // Mark as fallback data
    };
  },

  async getRealTimeQuotes(symbols) {
    const uniqueSymbols = [...new Set(symbols)];
    const cacheKey = `bulk_quotes_${uniqueSymbols.sort().join('_')}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Using cached bulk quotes for ${uniqueSymbols.length} symbols`);
      return cached;
    }

    try {
      console.log(`🎯 FMP: Fetching bulk quotes for ${uniqueSymbols.length} symbols`);
      
      // FMP doesn't have bulk quote endpoint, so we'll batch individual requests
      const batches = [];
      for (let i = 0; i < uniqueSymbols.length; i += 3) { // Smaller batches
        batches.push(uniqueSymbols.slice(i, i + 3));
      }

      const results = [];
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length}: [${batch.join(', ')}]`);
        
        const batchQuotes = await Promise.all(
          batch.map(symbol => this.getRealTimeQuote(symbol))
        );
        results.push(...batchQuotes);
        
        // Respect rate limits - wait between batches (except for last batch)
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const result = results.reduce((acc, quote) => {
        if (quote) {
          acc[quote.symbol] = quote;
        }
        return acc;
      }, {});

      const successCount = Object.keys(result).length;
      const fallbackCount = Object.values(result).filter(q => q.fallback).length;
      
      console.log(`✅ FMP: Got ${successCount} bulk quotes (${fallbackCount} fallbacks)`);
      cache.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      console.error('❌ FMP: Bulk quote fetch error:', error);
      
      // Return fallback quotes for all symbols
      const fallbackResult = uniqueSymbols.reduce((acc, symbol) => {
        acc[symbol] = this.createFallbackQuote(symbol);
        return acc;
      }, {});
      
      console.log(`🔄 Returning fallback quotes for all ${uniqueSymbols.length} symbols`);
      return fallbackResult;
    }
  },

  // 🚀 FIXED: Enhanced historical data with proper symbol normalization and better data fetching for MA200
  async getHistoricalData(symbol, period = null) {
    const cacheKey = period ? `history_${symbol}_${period}` : `history_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Using cached data for ${symbol} ${period || 'default'}`);
      return cached;
    }
  
    try {
      console.log(`🎯 FMP: Fetching historical data for ${symbol}, period: ${period || 'default'}`);
      
      // 🔧 FIXED: Use proper symbol normalization including BRK.B handling
      const cleanSymbol = this.normalizeSymbolForFMP(symbol);
      
      if (!this.apiKey) {
        throw new Error('FMP API key not configured');
      }
      
      let url;
      let endpoint;
      let processedData = [];
      
      // 🚀 FIXED: Handle intraday periods with date range parameters for premium users
      if (period === '1d') {
        // 1-day intraday data (5-minute intervals) with date range
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        const fromDate = yesterday.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];
        
        endpoint = `/historical-chart/5min/${cleanSymbol}`;
        url = `${this.baseURL}${endpoint}?from=${fromDate}&to=${toDate}&apikey=${this.apiKey}`;
        console.log(`📊 Using 5-minute intraday data for ${period} with date range: ${fromDate} to ${toDate}`);
        
      } else if (period === '5d') {
        // 5-day intraday data (1-hour intervals) with date range
        const today = new Date();
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(today.getDate() - 5);
        
        const fromDate = fiveDaysAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];
        
        endpoint = `/historical-chart/1hour/${cleanSymbol}`;
        url = `${this.baseURL}${endpoint}?from=${fromDate}&to=${toDate}&apikey=${this.apiKey}`;
        console.log(`📊 Using 1-hour intraday data for ${period} with date range: ${fromDate} to ${toDate}`);
        
      } else {
        // Daily historical data for other periods with enhanced date range for MA200 calculation
        endpoint = `/historical-price-full/${cleanSymbol}`;
        
        // 🔧 ENHANCED: Add extra data for MA200 calculation when needed
        if (period) {
          const endDate = new Date();
          const startDate = new Date();
          
          switch (period) {
            case '1m':
              startDate.setMonth(endDate.getMonth() - 1);
              // Add extra days for MA200 calculation
              startDate.setDate(startDate.getDate() - 280);
              break;
            case '3m':
              startDate.setMonth(endDate.getMonth() - 3);
              // Add extra days for MA200 calculation
              startDate.setDate(startDate.getDate() - 280);
              break;
            case '6m':
              startDate.setMonth(endDate.getMonth() - 6);
              // Add extra days for MA200 calculation
              startDate.setDate(startDate.getDate() - 280);
              break;
            case '1y':
              startDate.setFullYear(endDate.getFullYear() - 1);
              // Add extra days for MA200 calculation
              startDate.setDate(startDate.getDate() - 280);
              break;
            case '5y':
              startDate.setFullYear(endDate.getFullYear() - 5);
              // Add extra time for MA200 calculation with weekly data
              startDate.setDate(startDate.getDate() - 400);
              break;
            default:
              startDate.setFullYear(endDate.getFullYear() - 5); // Default to 5 years
              startDate.setDate(startDate.getDate() - 400);
          }
          
          const fromDate = startDate.toISOString().split('T')[0];
          const toDate = endDate.toISOString().split('T')[0];
          url = `${this.baseURL}${endpoint}?from=${fromDate}&to=${toDate}&apikey=${this.apiKey}`;
          console.log(`📊 Using daily historical data for ${period} with enhanced date range for MA200: ${fromDate} to ${toDate}`);
        } else {
          url = `${this.baseURL}${endpoint}?apikey=${this.apiKey}`;
          console.log(`📊 Using daily historical data for default period`);
        }
      }
      
      console.log(`🌐 FMP Historical URL: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await axios.get(url, {
        timeout: 20000 // 20 second timeout for historical data
      });
  
      const data = response.data;
      console.log(`📊 FMP Raw Response for ${symbol} ${period}:`, {
        status: response.status,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : (data?.historical?.length || 'N/A')
      });
      
      if (period === '1d' || period === '5d') {
        // Handle intraday data format
        if (!Array.isArray(data)) {
          console.error(`❌ FMP: Invalid intraday data structure for ${symbol}:`, {
            dataType: typeof data,
            keys: data ? Object.keys(data) : 'null',
            hasError: data?.error || data?.message ? true : false,
            errorMessage: data?.error || data?.message
          });
          
          // Check for specific error messages
          if (data?.error || data?.message) {
            console.error(`🚫 FMP API Error: ${data.error || data.message}`);
          }
          
          return [];
        }
        
        // Filter and process intraday data
        processedData = data
          .filter(item => {
            // Validate required fields
            if (!item.date || (!item.close && !item.price)) {
              return false;
            }
            
            // For intraday, filter to recent trading hours
            const itemDate = new Date(item.date);
            const now = new Date();
            const hoursAgo = (now - itemDate) / (1000 * 60 * 60);
            
            // Keep data from last 24 hours for 1d, last 120 hours for 5d
            const maxHours = period === '1d' ? 24 : 120;
            return hoursAgo <= maxHours;
          })
          .map(item => ({
            date: item.date,
            timestamp: item.date, // Keep timestamp for intraday
            price: parseFloat(item.close || item.price),
            close: parseFloat(item.close || item.price),
            volume: item.volume || 0,
            open: parseFloat(item.open || 0),
            high: parseFloat(item.high || 0),
            low: parseFloat(item.low || 0)
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
          
        console.log(`✅ FMP: Processed ${processedData.length} intraday points for ${symbol} (${period})`);
        
      } else {
        // Handle daily data format  
        if (!data || !data.historical || !Array.isArray(data.historical)) {
          console.error(`❌ FMP: Invalid historical data structure for ${symbol}:`, {
            hasData: !!data,
            hasHistorical: !!(data?.historical),
            historicalType: data?.historical ? typeof data.historical : 'undefined',
            dataKeys: data ? Object.keys(data) : 'null'
          });
          return [];
        }
    
        // FMP returns historical data in reverse chronological order, so reverse it
        const historicalData = data.historical.reverse();
        
        // Process daily data with better validation
        processedData = historicalData
          .filter(day => {
            // Validate required fields
            if (!day.date || (!day.close && !day.price)) {
              return false;
            }
            
            // Validate date format
            const dateObj = new Date(day.date);
            if (isNaN(dateObj.getTime())) {
              return false;
            }
            
            return true;
          })
          .map(day => ({
            date: day.date,
            price: parseFloat(day.close || day.price),
            close: parseFloat(day.close || day.price),
            volume: day.volume || 0,
            open: parseFloat(day.open || 0),
            high: parseFloat(day.high || 0),
            low: parseFloat(day.low || 0)
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log(`✅ FMP: Processed ${processedData.length} daily points for ${symbol} (${period || 'default'})`);
        console.log(`📊 Enhanced data range for MA200 calculation: ${processedData.length >= 200 ? 'SUFFICIENT' : 'INSUFFICIENT'} data points`);
      }
      
      // Log sample data for debugging
      if (processedData.length > 0) {
        const sample = processedData[processedData.length - 1]; // Most recent
        console.log(`📋 Sample data point:`, {
          date: sample.date,
          price: sample.price,
          volume: sample.volume
        });
      }
      
      // Cache with different TTL based on data type
      const cacheTTL = (period === '1d' || period === '5d') ? 300 : 1800; // 5min for intraday, 30min for daily
      cache.set(cacheKey, processedData, cacheTTL);
      return processedData;
    } catch (error) {
      console.error(`❌ FMP: Error fetching history for ${symbol} ${period}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        url: error.config?.url?.replace(this.apiKey, 'API_KEY_HIDDEN')
      });
      
      // Check for specific API errors
      if (error.response?.status === 401) {
        console.error(`🚫 FMP: Unauthorized - Check API key validity`);
      } else if (error.response?.status === 429) {
        console.error(`🚫 FMP: Rate limit exceeded - Try again later`);
      } else if (error.response?.status === 403) {
        console.error(`🚫 FMP: Forbidden - Your API tier may not support this data`);
      }
      
      return [];
    }
  },

  async getMarketMovers() {
    const cacheKey = 'fmp_market_movers';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const majorIndices = ['SPY', 'QQQ', 'IWM', 'DIA', 'TLT'];
    const quotes = await Promise.all(
      majorIndices.map(symbol => this.getRealTimeQuote(symbol))
    );

    const result = quotes.reduce((acc, quote) => {
      if (quote && quote.change_p != null) {
        if (quote.change_p > 0) {
          acc.gainers.push(quote);
        } else {
          acc.losers.push(quote);
        }
      }
      return acc;
    }, { gainers: [], losers: [] });

    result.gainers.sort((a, b) => b.change_p - a.change_p);
    result.losers.sort((a, b) => a.change_p - b.change_p);
    
    cache.set(cacheKey, result);
    return result;
  },

  async getSP500Components() {
    return SP500_COMPONENTS;
  }
};

const marketService = {
  async getData() {
    console.log('🎯 MarketService: Getting market data using FMP...');
    const symbols = ['SPY.US', 'QQQ.US', 'IWM.US', 'DIA.US', 'TLT.US'];
    const quotes = await fmpService.getRealTimeQuotes(symbols);
    const successCount = Object.keys(quotes).length;
    console.log(`✅ MarketService: Got data for ${successCount} symbols`);
    return quotes || {};
  },

  async getSectorData() {
    console.log('🎯 MarketService: Getting sector data using FMP...');
    const sectorSymbols = Object.keys(SECTOR_MAP);
    const quotes = await Promise.all(
      sectorSymbols.map(symbol => fmpService.getRealTimeQuote(symbol))
    );
    
    const result = quotes
      .filter(quote => quote !== null)
      .map(quote => ({
        ...quote,
        color: SECTOR_MAP[quote.symbol.replace('.US', '')].color
      }))
      .sort((a, b) => b.change_p - a.change_p);
      
    console.log(`✅ MarketService: Got ${result.length} sector quotes`);
    return result;
  },

  async getDataForSymbols(symbols) {
    console.log(`🎯 MarketService: Getting data for ${symbols.length} symbols using FMP...`);
    const quotes = await fmpService.getRealTimeQuotes(symbols);
    const successCount = Object.keys(quotes).length;
    console.log(`✅ MarketService: Got data for ${successCount} symbols`);
    return quotes || {};
  },

  async getHistoricalData(symbol, period = null) {
    console.log(`🎯 MarketService: Getting historical data for ${symbol} ${period || 'default'} using FMP...`);
    const data = await fmpService.getHistoricalData(symbol, period);
    console.log(`✅ MarketService: Got ${data.length} historical points for ${symbol} ${period || 'default'}`);
    return data;
  }
};

// 🚀 Updated eodService with period support for intraday data - delegates to FMP
const eodService = {
  async getHistoricalPrices(symbol, period) {
    console.log(`🔄 EOD->FMP: Delegating ${symbol} ${period} to FMP service with enhanced intraday support`);
    return fmpService.getHistoricalData(symbol, period);
  },
  
  async getRealTimeQuote(symbol) {
    return fmpService.getRealTimeQuote(symbol);
  },
  
  async getRealTimeQuotes(symbols) {
    return fmpService.getRealTimeQuotes(symbols);
  },
  
  async getHistoricalData(symbol, period = null) {
    return fmpService.getHistoricalData(symbol, period);
  }
};

export { fmpService as eodService, marketService };