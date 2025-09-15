import NodeCache from 'node-cache';
import { STOCK_TICKERS, isValidStockSymbol, formatSymbolForAPI } from '../data/stockTickers.js';
import { SP500_COMPONENTS } from '../data/sp500Components.js';
import { eodService } from './apiServices.js';

const searchCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

const searchService = {
  /**
   * Search for stocks by query (symbol or name)
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - Array of search results
   */
  async searchStocks(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const normalizedQuery = query.trim().toUpperCase();
      const cacheKey = `stock_search_${normalizedQuery}`;
      
      // Check cache first
      const cachedResults = searchCache.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      // Local search from our ticker data
      let results = this.searchLocalStockData(normalizedQuery, limit);
      
      // Get real-time quotes for the top results if possible
      if (results.length > 0) {
        try {
          const symbolsToFetch = results.map(item => item.symbol);
          const quotes = await eodService.getRealTimeQuotes(symbolsToFetch);
          
          // Enrich the results with quote data
          results = results.map(item => {
            const quote = quotes && quotes[item.symbol];
            if (quote) {
              return {
                ...item,
                price: quote.close || 0,
                change: quote.change || 0,
                change_p: quote.change_p || 0
              };
            }
            return item;
          });
        } catch (error) {
          console.error('Error fetching quotes for search results:', error);
          // Continue with results without quotes
        }
      }

      // Cache the results
      searchCache.set(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('Stock search error:', error);
      return [];
    }
  },

  /**
   * Search local stock data by symbol or company name
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Array} - Array of search results
   */
  searchLocalStockData(query, limit = 10) {
    const normalizedQuery = query.trim().toUpperCase();
    const results = [];

    // Direct symbol match first (highest priority)
    if (isValidStockSymbol(normalizedQuery)) {
      const baseSymbol = normalizedQuery.replace(/\.US$/, '');
      results.push({
        symbol: baseSymbol,
        name: STOCK_TICKERS[baseSymbol] || `${baseSymbol} Stock`,
        type: 'stock',
        score: 100
      });
    }

    // Then partial symbol matches
    for (const symbol of SP500_COMPONENTS) {
      if (results.length >= limit) break;
      
      if (symbol !== normalizedQuery && symbol.includes(normalizedQuery)) {
        results.push({
          symbol: symbol,
          name: STOCK_TICKERS[symbol] || `${symbol} Stock`,
          type: 'stock',
          score: 90 - (symbol.length - normalizedQuery.length)
        });
      }
    }

    // Then search by company name
    for (const [symbol, name] of Object.entries(STOCK_TICKERS)) {
      if (results.length >= limit) break;
      
      // Skip if already included by symbol match
      if (results.some(r => r.symbol === symbol)) {
        continue;
      }
      
      if (name.toUpperCase().includes(normalizedQuery)) {
        results.push({
          symbol: symbol,
          name: name,
          type: 'stock',
          score: 80 - (name.length - normalizedQuery.length)
        });
      }
    }

    // Sort results by score (highest first)
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
};

export default searchService;
