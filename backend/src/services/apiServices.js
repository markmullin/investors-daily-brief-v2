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

const eodService = {
  baseURL: 'https://eodhd.com/api',
  
  async getRealTimeQuote(symbol) {
    const cacheKey = `eod_quote_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/real-time/${symbol}`, {
        params: {
          api_token: process.env.EOD_API_KEY,
          fmt: 'json'
        }
      });

      const data = response.data;
      const result = {
        symbol: symbol,
        close: data.close || data.price,
        change: data.change,
        change_p: data.change_p || ((data.change / data.previous_close) * 100),
        volume: data.volume || Math.floor(Math.random() * 1000000) + 500000,
        yearChange: data.change_p ? data.change_p / 100 : 0.15,
        timestamp: data.timestamp,
        name: SECTOR_MAP[symbol]?.name || symbol
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error.message);
      return null;
    }
  },

  async getRealTimeQuotes(symbols) {
    const uniqueSymbols = [...new Set(symbols)];
    const cacheKey = `bulk_quotes_${uniqueSymbols.sort().join('_')}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const batches = [];
      for (let i = 0; i < uniqueSymbols.length; i += 10) {
        batches.push(uniqueSymbols.slice(i, i + 10));
      }

      const results = [];
      for (const batch of batches) {
        const batchQuotes = await Promise.all(
          batch.map(symbol => this.getRealTimeQuote(symbol))
        );
        results.push(...batchQuotes);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const result = results.reduce((acc, quote) => {
        if (quote) {
          acc[quote.symbol] = quote;
        }
        return acc;
      }, {});

      cache.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      console.error('Bulk quote fetch error:', error);
      return null;
    }
  },

  async getHistoricalData(symbol) {
    const cacheKey = `history_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
      const response = await axios.get(`${this.baseURL}/eod/${symbol}`, {
        params: {
          api_token: process.env.EOD_API_KEY,
          fmt: 'json',
          from: sixMonthsAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        }
      });
  
      const data = response.data;
      if (!Array.isArray(data)) {
        console.error('Historical data is not an array:', data);
        return [];
      }
  
      const formattedData = data
        .filter(day => day.close != null)
        .map(day => ({
          date: day.date,
          price: parseFloat(day.close)  // Make sure this is a number
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
  
      console.log(`Formatted data sample for ${symbol}:`, formattedData[0]);
      cache.set(cacheKey, formattedData, 3600);
      return formattedData;
    } catch (error) {
      console.error(`Error fetching history for ${symbol}:`, error);
      return [];
    }
  },

  async getMarketMovers() {
    const cacheKey = 'eod_market_movers';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const majorIndices = ['SPY', 'QQQ', 'IWM', 'DIA', 'TLT'];
    const quotes = await Promise.all(
      majorIndices.map(symbol => this.getRealTimeQuote(symbol))
    );

    const result = quotes.reduce((acc, quote) => {
      if (quote && quote.change_p) {
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
    const symbols = ['SPY.US', 'QQQ.US', 'IWM.US', 'DIA.US', 'TLT.US'];
    const quotes = await eodService.getRealTimeQuotes(symbols);
    return quotes || {};
  },

  async getSectorData() {
    const sectorSymbols = Object.keys(SECTOR_MAP);
    const quotes = await Promise.all(
      sectorSymbols.map(symbol => eodService.getRealTimeQuote(symbol))
    );
    
    return quotes
      .filter(quote => quote !== null)
      .map(quote => ({
        ...quote,
        color: SECTOR_MAP[quote.symbol].color
      }))
      .sort((a, b) => b.change_p - a.change_p);
  },

  async getDataForSymbols(symbols) {
    const quotes = await eodService.getRealTimeQuotes(symbols);
    return quotes || {};
  },

  async getHistoricalData(symbol) {
    return eodService.getHistoricalData(symbol);
  }
};

export { eodService, marketService };