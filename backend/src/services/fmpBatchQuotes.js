/**
 * FMP Service Extension - Add missing getQuoteBatch method
 * This file adds the missing method needed for batch quotes
 */

import enhancedFmpService from './fmpServiceEnhanced.js';

/**
 * Get batch quotes for multiple symbols
 * @param {Array} symbols - Array of stock symbols
 * @returns {Array} Array of quote data
 */
async function getQuoteBatch(symbols) {
  if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
    return [];
  }

  try {
    // FMP API supports batch quotes with comma-separated symbols
    const symbolString = symbols.join(',');
    const endpoint = `/v3/quote/${symbolString}`;
    
    console.log(`📊 [FMP] Fetching batch quotes for ${symbols.length} symbols: ${symbolString}`);
    
    // Use the enhancedFmpService instance directly
    const response = await enhancedFmpService.makeRequest(endpoint);
    
    if (!response || !Array.isArray(response)) {
      console.warn(`⚠️ [FMP] Invalid batch quote response`);
      return [];
    }
    
    return response;
    
  } catch (error) {
    console.error(`❌ [FMP] Batch quote error:`, error.message);
    
    // Fallback: fetch quotes individually
    console.log(`🔄 [FMP] Falling back to individual quotes`);
    const quotes = [];
    
    for (const symbol of symbols) {
      try {
        const quote = await enhancedFmpService.getQuote(symbol);
        if (quote && quote[0]) {
          quotes.push(quote[0]);
        }
      } catch (err) {
        console.warn(`⚠️ [FMP] Failed to get quote for ${symbol}:`, err.message);
      }
    }
    
    return quotes;
  }
}

// Add the method to the service
enhancedFmpService.getQuoteBatch = getQuoteBatch;

export { getQuoteBatch };
