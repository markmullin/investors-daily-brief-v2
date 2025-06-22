/**
 * ChartDataManager.js
 * REAL DATA ONLY - No synthetic or fallback data generation
 */

/**
 * Validates data has required fields but NEVER generates synthetic data
 * @param {Array} data - Price data array
 * @param {String} symbol - Symbol for the data
 * @returns {Array} - The original data unchanged, or an empty array if invalid
 */
export const validateData = (data, symbol) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.error(`No valid data available for ${symbol}. No fallbacks will be used.`);
    return [];
  }

  // Log data statistics for debugging but don't modify the data
  const hasMa200 = data.some(item => typeof item.ma200 === 'number');
  const hasRsi = data.some(item => typeof item.rsi === 'number');
  
  console.log(`Data validation for ${symbol}:`, {
    totalPoints: data.length,
    hasMa200,
    hasRsi,
    firstPoint: {
      date: data[0]?.date,
      price: data[0]?.price || data[0]?.close,
      ma200: data[0]?.ma200,
      rsi: data[0]?.rsi
    },
    lastPoint: {
      date: data[data.length-1]?.date,
      price: data[data.length-1]?.price || data[data.length-1]?.close,
      ma200: data[data.length-1]?.ma200,
      rsi: data[data.length-1]?.rsi
    }
  });
  
  // Return the original data unchanged - no modification
  return data;
};

/**
 * Processes market data - validating only, NEVER generating synthetic data
 * @param {Object} marketData - Raw market data object
 * @returns {Object} - The original data, or empty object if invalid
 */
export const processMarketData = (marketData) => {
  if (!marketData || typeof marketData !== 'object') {
    console.error('No valid market data provided. No fallbacks will be used.');
    return {};
  }
  
  // Process each symbol - validation only, no synthetic data
  const result = {};
  Object.keys(marketData).forEach(symbol => {
    result[symbol] = validateData(marketData[symbol], symbol);
  });
  
  return result;
};

export default {
  validateData,
  processMarketData
};