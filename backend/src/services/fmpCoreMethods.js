/**
 * FMP Service Extension - Add missing core methods
 * This file adds the essential methods that are missing from the FMP service
 */

import enhancedFmpService from './fmpServiceEnhanced.js';

/**
 * Get quote for a single symbol
 * @param {string} symbol - Stock symbol
 * @returns {Array} Quote data array
 */
async function getQuote(symbol) {
  if (!symbol) {
    return [];
  }

  try {
    const endpoint = `/v3/quote/${symbol}`;
    console.log(`📊 [FMP] Fetching quote for ${symbol}`);
    
    const response = await enhancedFmpService.makeRequest(endpoint);
    
    if (!response) {
      console.warn(`⚠️ [FMP] No quote data for ${symbol}`);
      return [];
    }
    
    return Array.isArray(response) ? response : [response];
    
  } catch (error) {
    console.error(`❌ [FMP] Quote error for ${symbol}:`, error.message);
    return [];
  }
}

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
        const quote = await getQuote(symbol);
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

/**
 * Get market gainers
 * @returns {Array} Array of gaining stocks
 */
async function getGainers() {
  try {
    const endpoint = '/v3/stock_market/gainers';
    console.log(`📈 [FMP] Fetching market gainers`);
    const response = await enhancedFmpService.makeRequest(endpoint);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error(`❌ [FMP] Gainers error:`, error.message);
    return [];
  }
}

/**
 * Get market losers
 * @returns {Array} Array of losing stocks
 */
async function getLosers() {
  try {
    const endpoint = '/v3/stock_market/losers';
    console.log(`📉 [FMP] Fetching market losers`);
    const response = await enhancedFmpService.makeRequest(endpoint);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error(`❌ [FMP] Losers error:`, error.message);
    return [];
  }
}

/**
 * Get most active stocks
 * @returns {Array} Array of most active stocks
 */
async function getActives() {
  try {
    const endpoint = '/v3/stock_market/actives';
    console.log(`📊 [FMP] Fetching most active stocks`);
    const response = await enhancedFmpService.makeRequest(endpoint);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error(`❌ [FMP] Actives error:`, error.message);
    return [];
  }
}

// Add all methods to the service
enhancedFmpService.getQuote = getQuote;
enhancedFmpService.getQuoteBatch = getQuoteBatch;
enhancedFmpService.getGainers = getGainers;
enhancedFmpService.getLosers = getLosers;
enhancedFmpService.getActives = getActives;

export { 
  getQuote, 
  getQuoteBatch, 
  getGainers, 
  getLosers, 
  getActives 
};
