import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

/**
 * Hook to fetch a stock quote by symbol
 * @param {string} symbol - Stock symbol (e.g., AAPL)
 * @returns {Object} Query result with data, loading state, and error
 */
export function useStockQuote(symbol) {
  return useQuery({
    queryKey: ['stock', 'quote', symbol],
    queryFn: () => apiClient.get(`/market/quote/${symbol}`),
    enabled: !!symbol, // Only run the query if we have a symbol
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}

/**
 * Hook to fetch historical stock data by symbol
 * @param {string} symbol - Stock symbol (e.g., AAPL)
 * @returns {Object} Query result with data, loading state, and error
 */
export function useStockHistory(symbol) {
  return useQuery({
    queryKey: ['stock', 'history', symbol],
    queryFn: () => apiClient.get(`/market/history/${symbol}`),
    enabled: !!symbol,
    staleTime: 60 * 60 * 1000, // 1 hour
    select: (data) => {
      // Process the data here to ensure consistent format
      if (!data || !Array.isArray(data)) {
        console.warn("Invalid history data returned from API:", data);
        return [];
      }
      
      // Ensure we have proper price data for RSI calculations
      return data.map(item => {
        // Make sure we have a price value (either from price or close)
        const price = typeof item.price === 'number' ? item.price : 
                     (typeof item.close === 'number' ? item.close : 0);
                     
        return {
          date: item?.date,
          price: price, // Explicitly set price for RSI calculation
          open: item?.open || price,
          high: item?.high || (price * 1.005), // Add small variation if not available
          low: item?.low || (price * 0.995), // Add small variation if not available
          close: item?.close || price,
          volume: item?.volume || 0,
          ma200: item?.ma200 || null
        };
      }).filter(item => item.date && item.price > 0); // Filter out invalid items
    }
  });
}

/**
 * Hook to search for stocks by query
 * @param {string} query - Search query
 * @returns {Object} Query result with data, loading state, and error
 */
export function useStockSearch(query) {
  return useQuery({
    queryKey: ['stock', 'search', query],
    queryFn: () => apiClient.get(`/search/stocks?q=${encodeURIComponent(query)}`),
    enabled: !!query && query.length >= 2, // Only run if query is at least 2 chars
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true, // Keep previous results while loading new ones
  });
}

/**
 * Hook to validate if a stock symbol exists
 * @param {string} symbol - Stock symbol to validate
 * @returns {Object} Query result with data, loading state, and error
 */
export function useSymbolValidation(symbol) {
  return useQuery({
    queryKey: ['stock', 'validate', symbol],
    queryFn: () => apiClient.get(`/search/validate/${symbol}`),
    enabled: !!symbol && symbol.length >= 1,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - symbols don't change often
  });
}

export default {
  useStockQuote,
  useStockHistory,
  useStockSearch,
  useSymbolValidation
};