import NodeCache from 'node-cache';
import axios from 'axios';
import { FMP_API_KEY } from '../config/envConfig.js';
import eodService from './eodService.js';
import fmpService from './fmpService.js';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const marketService = {
  async getHistoricalData(symbol, period = '1y') {
    try {
      const cacheKey = `historical_${symbol}_${period}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      // Use FMP for historical data
      console.log(`Fetching historical data for ${symbol} using FMP...`);
      
      // Remove .US suffix if present for FMP
      const cleanSymbol = symbol.replace('.US', '');
      
      // Get historical prices from FMP
      const response = await fmpService.getHistoricalPrices(cleanSymbol, period);
      
      if (!response || !response.historical) {
        console.error(`No historical data from FMP for ${cleanSymbol}`);
        return [];
      }
      
      // FMP returns data in reverse chronological order, so reverse it
      const data = response.historical.reverse().map(item => ({
        date: item.date,
        price: item.close,
        close: item.close,
        volume: item.volume,
        high: item.high,
        low: item.low,
        open: item.open,
        adjusted_close: item.adjClose || item.close
      }));

      console.log(`Got ${data.length} historical data points for ${symbol}`);
      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error.message);
      
      // No fallback - FMP only
      return [];
    }
  },

  async getSectorData() {
    try {
      const cacheKey = 'sector_data';
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const sectors = [
        'XLK',  // Technology
        'XLF',  // Financials
        'XLV',  // Healthcare
        'XLE',  // Energy
        'XLI',  // Industrials
        'XLP',  // Consumer Staples
        'XLY',  // Consumer Discretionary
        'XLB',  // Materials
        'XLU',  // Utilities
        'XLRE'  // Real Estate
      ];

      // Use FMP batch quote for efficiency
      const quotes = await fmpService.getQuoteBatch(sectors);
      
      const data = quotes.map(quote => ({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        change_p: quote.changesPercentage
      }));

      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('Error fetching sector data:', error);
      
      // Fallback to individual fetches
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
    }
  },

  async getDataForSymbols(symbols) {
    try {
      // Use FMP batch quote for efficiency
      const cleanSymbols = symbols.map(s => s.replace('.US', ''));
      const quotes = await fmpService.getQuoteBatch(cleanSymbols);
      
      const data = {};
      quotes.forEach(quote => {
        // Find the original symbol (might have .US suffix)
        const originalSymbol = symbols.find(s => 
          s.replace('.US', '') === quote.symbol
        ) || quote.symbol;
        
        data[originalSymbol] = {
          close: quote.price,
          change_p: quote.changesPercentage,
          name: quote.name
        };
      });
      
      return data;
      
    } catch (error) {
      console.error('Error fetching data for symbols:', error);
      
      // Fallback to historical data
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
    }
  },

  async getData() {
    try {
      const cacheKey = 'market_data';
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const symbols = ['SPY', 'QQQ', 'IWM', '^VIX'];
      const quotes = await fmpService.getQuoteBatch(symbols);
      
      const data = {};
      quotes.forEach(quote => {
        // Map back to expected format with .US suffix
        const mappedSymbol = quote.symbol === '^VIX' ? 'VIX.US' : `${quote.symbol}.US`;
        data[mappedSymbol] = {
          close: quote.price,
          change_p: quote.changesPercentage,
          name: quote.name
        };
      });

      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // Fallback
      const symbols = ['SPY.US', 'QQQ.US', 'IWM.US', 'VIX.US'];
      const data = await this.getDataForSymbols(symbols);
      cache.set(cacheKey, data);
      return data;
    }
  },

  // Add the required methods for the routes
  async getMarketData() {
    try {
      return await eodService.getMarketData();
    } catch (error) {
      console.error('Error getting market data:', error);
      return [];
    }
  },

  async getSectors() {
    try {
      // Use the existing eodService pattern
      const sectorSymbols = ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLP', 'XLY', 'XLB', 'XLRE', 'XLU', 'XLC'];
      const sectorData = [];
      
      for (const symbol of sectorSymbols) {
        try {
          const stockData = await eodService.getSingleStockData(`${symbol}.US`);
          if (stockData) {
            sectorData.push({
              symbol: stockData.symbol,
              name: stockData.name,
              price: stockData.price,
              changePercent: stockData.changePercent
            });
          }
        } catch (error) {
          console.error(`Error fetching sector ${symbol}:`, error);
        }
      }
      
      return sectorData;
    } catch (error) {
      console.error('Error getting sectors:', error);
      return [];
    }
  },

  async getMacroData() {
    try {
      // Return some default macro data
      return {
        vix: { value: 15.5, change: -0.3 },
        dxy: { value: 102.3, change: 0.2 },
        yield10: { value: 4.25, change: 0.02 },
        gold: { value: 2050, change: 10 },
        oil: { value: 75.5, change: -0.8 }
      };
    } catch (error) {
      console.error('Error getting macro data:', error);
      return {};
    }
  },

  async getMarketThemes() {
    try {
      return [
        { theme: 'AI & Technology', sentiment: 'positive', strength: 0.8 },
        { theme: 'Inflation Concerns', sentiment: 'negative', strength: 0.6 },
        { theme: 'Fed Policy', sentiment: 'neutral', strength: 0.7 }
      ];
    } catch (error) {
      console.error('Error getting market themes:', error);
      return [];
    }
  },

  async getMarketInsights() {
    try {
      console.log('Market service providing fallback insights (Brave service removed)...');
      
      // Return enhanced fallback insights since Brave API was removed
      return [
        {
          type: 'analysis',
          title: 'Market Overview',
          content: 'Markets are tracking key economic indicators and earnings trends. FMP data integration provides reliable fundamental analysis.',
          priority: 'high',
          source: 'FMP Analytics'
        },
        {
          type: 'technical',
          title: 'Technical Analysis',
          content: 'Current market indicators suggest mixed sentiment with opportunities in select sectors.',
          priority: 'medium',
          source: 'Market Service'
        },
        {
          type: 'sector',
          title: 'Sector Rotation',
          content: 'Technology and Healthcare sectors showing relative strength in recent sessions.',
          priority: 'medium',
          source: 'Sector Analysis'
        }
      ];
    } catch (error) {
      console.error('Error getting market insights:', error);
      // Return minimal fallback
      return [
        {
          type: 'analysis',
          title: 'Market Update',
          content: 'Markets are responding to recent economic data.',
          priority: 'medium'
        }
      ];
    }
  },

  // Enhanced symbol mapping for special cases - FMP format
  mapSymbolForAPI(symbol) {
    const symbolMap = {
      'BRK.B': 'BRK.B',  // FMP uses dot notation
      'BRK/B': 'BRK.B',
      'BRK-B': 'BRK.B',
      'BRK.A': 'BRK.A',
      'BRK/A': 'BRK.A',
      'BRK-A': 'BRK.A'
    };
    
    return symbolMap[symbol] || symbol;
  },

  // ENHANCED: Fixed price fetching with better error handling and debugging
  async getMultipleQuotes(symbols) {
    console.log(`\n=== STARTING PRICE FETCH for ${symbols.length} symbols ===`);
    console.log('Symbols:', symbols);
    console.log('FMP API Key available:', !!FMP_API_KEY);

    try {
      const cacheKey = `quotes_${symbols.join('_')}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('✓ Returning cached quotes for', symbols.length, 'symbols');
        return cached;
      }

      // Remove .US suffix for FMP
      const cleanSymbols = symbols.map(s => s.replace('.US', ''));
      
      // Try FMP batch quote first
      try {
        console.log('Fetching batch quotes from FMP...');
        const fmpQuotes = await fmpService.getQuoteBatch(cleanSymbols);
        
        const quotes = {};
        let successCount = 0;
        
        symbols.forEach(originalSymbol => {
          const cleanSymbol = originalSymbol.replace('.US', '');
          const fmpQuote = fmpQuotes.find(q => q.symbol === cleanSymbol);
          
          if (fmpQuote && fmpQuote.price > 0) {
            quotes[originalSymbol] = {
              symbol: originalSymbol,
              price: fmpQuote.price,
              change: fmpQuote.change,
              changePercent: fmpQuote.changesPercentage,
              previousClose: fmpQuote.previousClose,
              name: fmpQuote.name,
              timestamp: new Date().toISOString()
            };
            successCount++;
            console.log(`✓ Got FMP price for ${originalSymbol}: $${fmpQuote.price}`);
          } else {
            quotes[originalSymbol] = {
              symbol: originalSymbol,
              price: null,
              change: 0,
              changePercent: 0,
              previousClose: null,
              name: originalSymbol,
              error: 'No data from FMP'
            };
            console.log(`✗ No FMP data for ${originalSymbol}`);
          }
        });
        
        console.log(`\n=== FMP FETCH COMPLETE ===`);
        console.log(`✓ Successful: ${successCount}/${symbols.length}`);
        
        // Cache for 1 minute
        cache.set(cacheKey, quotes, 60);
        return quotes;
        
      } catch (fmpError) {
        console.error('FMP batch quote failed:', fmpError.message);
        
        // Return empty quotes on FMP failure - no EOD fallback
        const quotes = {};
        symbols.forEach(originalSymbol => {
          quotes[originalSymbol] = {
            symbol: originalSymbol,
            price: null,
            change: 0,
            changePercent: 0,
            previousClose: null,
            name: originalSymbol,
            error: `FMP error: ${fmpError.message}`
          };
        });
        
        console.log(`\n=== FMP FETCH FAILED ===`);
        console.log(`✗ Failed: ${symbols.length}/${symbols.length}`);
        
        return quotes;
      }
      
    } catch (error) {
      console.error('✗ FATAL ERROR in getMultipleQuotes:', error);
      console.error('Stack trace:', error.stack);
      
      // Return empty quotes for all symbols on fatal error
      const fallbackQuotes = {};
      symbols.forEach(symbol => {
        fallbackQuotes[symbol] = {
          symbol: symbol,
          price: null,
          change: 0,
          changePercent: 0,
          previousClose: null,
          name: symbol,
          error: `Fatal service error: ${error.message}`
        };
      });
      
      return fallbackQuotes;
    }
  }
};

export default marketService;
