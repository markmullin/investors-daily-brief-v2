import NodeCache from 'node-cache';
import axios from 'axios';
import { EOD_API_KEY } from '../config/envConfig.js';
import { marketService } from './apiServices.js';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const marketService = {
  async getHistoricalData(symbol, period = '1y') {
    try {
      const cacheKey = `historical_${symbol}_${period}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const response = await axios.get(`https://eodhd.com/api/eod/${symbol}`, {
        params: {
          api_token: EOD_API_KEY,
          period: period,
          fmt: 'json'
        }
      });

      const data = response.data.map(item => ({
        date: item.date,
        price: item.adjusted_close || item.close,
        volume: item.volume,
        high: item.high,
        low: item.low,
        open: item.open
      }));

      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  },

  async getSectorData() {
    try {
      const cacheKey = 'sector_data';
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const sectors = [
        'XLK.US',  // Technology
        'XLF.US',  // Financials
        'XLV.US',  // Healthcare
        'XLE.US',  // Energy
        'XLI.US',  // Industrials
        'XLP.US',  // Consumer Staples
        'XLY.US',  // Consumer Discretionary
        'XLB.US',  // Materials
        'XLU.US',  // Utilities
        'XLRE.US'  // Real Estate
      ];

      const data = await Promise.all(
        sectors.map(async symbol => {
          const historicalData = await this.getHistoricalData(symbol, '5d');
          if (!historicalData.length) return null;

          const latest = historicalData[historicalData.length - 1];
          const previous = historicalData[historicalData.length - 2];

          return {
            symbol,
            price: latest.price,
            change: latest.price - previous.price,
            change_p: ((latest.price - previous.price) / previous.price) * 100
          };
        })
      );

      const filteredData = data.filter(item => item !== null);
      cache.set(cacheKey, filteredData);
      return filteredData;
    } catch (error) {
      console.error('Error fetching sector data:', error);
      return [];
    }
  },

  async getDataForSymbols(symbols) {
    try {
      const data = {};
      await Promise.all(
        symbols.map(async symbol => {
          const historicalData = await this.getHistoricalData(symbol, '5d');
          if (historicalData.length) {
            data[symbol] = {
              close: historicalData[historicalData.length - 1].price,
              data: historicalData
            };
          }
        })
      );
      return data;
    } catch (error) {
      console.error('Error fetching data for symbols:', error);
      return {};
    }
  },

  async getData() {
    try {
      const cacheKey = 'market_data';
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const symbols = ['SPY.US', 'QQQ.US', 'IWM.US', 'VIX.US'];
      const data = await this.getDataForSymbols(symbols);

      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return {};
    }
  }
};

export default marketService;