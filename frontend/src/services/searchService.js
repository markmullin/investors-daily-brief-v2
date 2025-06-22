import { fetchWithConfig } from './api';

/**
 * Service for stock search functionality
 */
export const searchService = {
  /**
   * Search for stocks by symbol or name
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - Array of search results
   */
  async searchStocks(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const response = await fetchWithConfig(`/search/stocks?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response || [];
    } catch (error) {
      console.error('Stock search error:', error);
      
      // Use fallback search if API fails
      try {
        const fallback = await fetchWithConfig(`/search/fallback?q=${encodeURIComponent(query)}`);
        return fallback || [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Validate if a stock symbol exists
   * @param {string} symbol - The stock symbol to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validateSymbol(symbol) {
    try {
      if (!symbol) {
        return { valid: false };
      }

      const response = await fetchWithConfig(`/search/validate/${encodeURIComponent(symbol)}`);
      return response;
    } catch (error) {
      console.error('Symbol validation error:', error);
      return { valid: false };
    }
  }
};

export default searchService;