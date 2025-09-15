/**
 * Enhanced Market Data Service
 * Provides consistent, normalized market data with built-in validation, fallback data,
 * and format conversion to ensure frontend compatibility
 */

import eodService from '../eodService.js';
import errorTracker from '../../utils/errorTracker.js';

// Required indices that must be present in market data
const REQUIRED_INDICES = ['SPY.US', 'QQQ.US', 'DIA.US', 'IWM.US'];

// Fallback data for when API calls fail
const FALLBACK_MARKET_DATA = [
  {
    symbol: "SPY.US",
    code: "SPY.US",
    name: "SPDR S&P 500 ETF Trust",
    price: 520.45,
    change: 1.25,
    changePercent: 0.24,
    volume: 45623780
  },
  {
    symbol: "QQQ.US",
    code: "QQQ.US",
    name: "Invesco QQQ Trust Series 1",
    price: 438.12,
    change: 2.18,
    changePercent: 0.50,
    volume: 32456890
  },
  {
    symbol: "DIA.US",
    code: "DIA.US",
    name: "SPDR Dow Jones Industrial Average ETF",
    price: 392.75,
    change: 0.85,
    changePercent: 0.22,
    volume: 12345678
  },
  {
    symbol: "IWM.US",
    code: "IWM.US",
    name: "iShares Russell 2000 ETF",
    price: 202.38,
    change: -0.45,
    changePercent: -0.22,
    volume: 23456789
  }
];

/**
 * Validate market data meets requirements
 * @param {Array|Object} data - Market data to validate
 * @returns {Object} Validation result with status and issues
 */
const validateMarketData = (data) => {
  const result = {
    valid: true,
    format: null,
    missingIndices: [],
    issues: []
  };
  
  // Check if data exists
  if (!data) {
    result.valid = false;
    result.issues.push('Data is null or undefined');
    return result;
  }
  
  // Detect format
  if (Array.isArray(data)) {
    result.format = 'array';
    
    // Check for empty array
    if (data.length === 0) {
      result.valid = false;
      result.issues.push('Data array is empty');
      return result;
    }
    
    // Check for required indices
    const symbols = data.map(item => item.symbol || item.code);
    
    for (const requiredIndex of REQUIRED_INDICES) {
      if (!symbols.some(symbol => symbol === requiredIndex || symbol === requiredIndex.replace('.US', ''))) {
        result.valid = false;
        result.missingIndices.push(requiredIndex);
      }
    }
    
    if (result.missingIndices.length > 0) {
      result.issues.push(`Missing required indices: ${result.missingIndices.join(', ')}`);
    }
  } else if (data && typeof data === 'object') {
    result.format = 'object';
    
    // Check if object is empty
    const keys = Object.keys(data);
    if (keys.length === 0) {
      result.valid = false;
      result.issues.push('Data object is empty');
      return result;
    }
    
    // Check for required indices
    for (const requiredIndex of REQUIRED_INDICES) {
      if (
        !data[requiredIndex] && 
        !data[requiredIndex.replace('.US', '')] && 
        !keys.some(key => 
          (data[key].symbol === requiredIndex || data[key].code === requiredIndex) ||
          (data[key].symbol === requiredIndex.replace('.US', '') || data[key].code === requiredIndex.replace('.US', ''))
        )
      ) {
        result.valid = false;
        result.missingIndices.push(requiredIndex);
      }
    }
    
    if (result.missingIndices.length > 0) {
      result.issues.push(`Missing required indices: ${result.missingIndices.join(', ')}`);
    }
  } else {
    result.valid = false;
    result.format = typeof data;
    result.issues.push(`Invalid data format: ${typeof data}`);
  }
  
  return result;
};

/**
 * Normalize market data item to ensure all required fields
 * @param {Object} item - Market data item to normalize
 * @returns {Object} Normalized market data item
 */
const normalizeDataItem = (item) => {
  // Ensure all required fields are present with fallbacks
  return {
    symbol: item.symbol || item.code || 'UNKNOWN',
    code: item.code || item.symbol || 'UNKNOWN',
    name: item.name || 'Unknown Stock',
    price: typeof item.price === 'number' ? item.price : 100.00,
    change: typeof item.change === 'number' ? item.change : 0.00,
    changePercent: typeof item.changePercent === 'number' ? item.changePercent : 0.00,
    volume: item.volume || 1000000,
    ...item // Keep any additional fields
  };
};

/**
 * Convert market data between array and object formats
 * @param {Array|Object} data - Market data to convert
 * @param {string} targetFormat - Format to convert to ('array' or 'object')
 * @returns {Array|Object} Converted market data
 */
const convertFormat = (data, targetFormat) => {
  // If data is already in the target format, return it
  if (Array.isArray(data) && targetFormat === 'array') {
    return data.map(normalizeDataItem);
  }
  
  if (!Array.isArray(data) && targetFormat === 'object') {
    return Object.keys(data).reduce((obj, key) => {
      obj[key] = normalizeDataItem(data[key]);
      return obj;
    }, {});
  }
  
  // Convert array to object
  if (Array.isArray(data) && targetFormat === 'object') {
    const result = {};
    
    for (const item of data) {
      const normalizedItem = normalizeDataItem(item);
      const key = normalizedItem.symbol || normalizedItem.code;
      result[key] = normalizedItem;
    }
    
    return result;
  }
  
  // Convert object to array
  if (!Array.isArray(data) && targetFormat === 'array') {
    return Object.keys(data).map(key => normalizeDataItem(data[key]));
  }
  
  // If we can't convert, return the original data
  return data;
};

/**
 * Ensure required indices are present in the data
 * @param {Array|Object} data - Market data to fill
 * @param {string} format - Format of the data ('array' or 'object')
 * @returns {Array|Object} Data with required indices
 */
const ensureRequiredIndices = (data, format) => {
  // Create a mapping of indices we already have
  const existingIndices = {};
  
  if (format === 'array') {
    for (const item of data) {
      const symbol = item.symbol || item.code;
      if (symbol) {
        // Store with and without .US suffix
        existingIndices[symbol] = item;
        existingIndices[symbol.replace('.US', '')] = item;
      }
    }
  } else if (format === 'object') {
    for (const key of Object.keys(data)) {
      existingIndices[key] = data[key];
      existingIndices[key.replace('.US', '')] = data[key];
      
      // Also check symbol and code fields
      const symbol = data[key].symbol || data[key].code;
      if (symbol) {
        existingIndices[symbol] = data[key];
        existingIndices[symbol.replace('.US', '')] = data[key];
      }
    }
  }
  
  // Check which required indices are missing
  const missingIndices = [];
  for (const requiredIndex of REQUIRED_INDICES) {
    if (!existingIndices[requiredIndex] && !existingIndices[requiredIndex.replace('.US', '')]) {
      missingIndices.push(requiredIndex);
    }
  }
  
  // If nothing is missing, return the original data
  if (missingIndices.length === 0) {
    return data;
  }
  
  // Add missing indices from fallback data
  if (format === 'array') {
    const result = [...data];
    
    for (const missingIndex of missingIndices) {
      const fallbackItem = FALLBACK_MARKET_DATA.find(item => 
        item.symbol === missingIndex || 
        item.symbol === missingIndex.replace('.US', '') ||
        item.code === missingIndex ||
        item.code === missingIndex.replace('.US', '')
      );
      
      if (fallbackItem) {
        result.push(normalizeDataItem(fallbackItem));
      }
    }
    
    return result;
  } else if (format === 'object') {
    const result = { ...data };
    
    for (const missingIndex of missingIndices) {
      const fallbackItem = FALLBACK_MARKET_DATA.find(item => 
        item.symbol === missingIndex || 
        item.symbol === missingIndex.replace('.US', '') ||
        item.code === missingIndex ||
        item.code === missingIndex.replace('.US', '')
      );
      
      if (fallbackItem) {
        result[missingIndex] = normalizeDataItem(fallbackItem);
      }
    }
    
    return result;
  }
  
  return data;
};

/**
 * Get market data with validation and fallback data
 * @param {Object} options - Options for fetching market data
 * @returns {Promise<Array>} Market data in array format
 */
const getMarketData = async (options = {}) => {
  const {
    format = 'array',  // Output format ('array' or 'object')
    forceFresh = true, // Force fresh data from API
    useEod = true,     // Use EOD service
    timeoutMs = 5000   // Timeout for API calls
  } = options;
  
  try {
    let marketData;
    
    // Fetch data from EOD service with timeout
    if (useEod) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`API timeout after ${timeoutMs}ms`)), timeoutMs);
      });
      
      try {
        marketData = await Promise.race([
          eodService.getMarketData(forceFresh),
          timeoutPromise
        ]);
      } catch (error) {
        console.error('Error or timeout fetching market data from EOD service:', error.message);
        errorTracker.track(error, 'Market Data Service - EOD Timeout');
        marketData = null;
      }
    }
    
    // Validate the data
    const validation = validateMarketData(marketData);
    
    // If the data is invalid or missing required indices, use fallback data
    if (!validation.valid) {
      console.warn(`Invalid market data: ${validation.issues.join(', ')}. Using fallback data.`);
      
      // Start with fallback data
      marketData = FALLBACK_MARKET_DATA;
    } else if (validation.format !== format) {
      // Convert to the requested format
      marketData = convertFormat(marketData, format);
    }
    
    // Ensure required indices are present
    marketData = ensureRequiredIndices(marketData, Array.isArray(marketData) ? 'array' : 'object');
    
    // Convert to the final requested format
    if ((Array.isArray(marketData) && format === 'object') || (!Array.isArray(marketData) && format === 'array')) {
      marketData = convertFormat(marketData, format);
    }
    
    // Final validation to ensure we're returning valid data
    const finalValidation = validateMarketData(marketData);
    if (!finalValidation.valid) {
      console.error(`Failed to create valid market data: ${finalValidation.issues.join(', ')}`);
      // Ultimate fallback - just return the static data in the requested format
      return format === 'array' ? FALLBACK_MARKET_DATA : convertFormat(FALLBACK_MARKET_DATA, 'object');
    }
    
    return marketData;
  } catch (error) {
    console.error('Error in getMarketData:', error.message);
    errorTracker.track(error, 'Market Data Service - Unhandled Error');
    
    // Return fallback data in the requested format
    return format === 'array' ? FALLBACK_MARKET_DATA : convertFormat(FALLBACK_MARKET_DATA, 'object');
  }
};

/**
 * Get sector data with validation and fallback data
 * @param {Object} options - Options for fetching sector data
 * @returns {Promise<Array>} Sector data
 */
const getSectorData = async (options = {}) => {
  const {
    forceFresh = true,
    timeoutMs = 5000
  } = options;
  
  try {
    let sectorData;
    
    // Fetch data from EOD service with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`API timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    try {
      sectorData = await Promise.race([
        eodService.getSectorData(forceFresh),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Error or timeout fetching sector data from EOD service:', error.message);
      errorTracker.track(error, 'Market Data Service - EOD Sector Timeout');
      
      // Fallback sector data
      return [
        { name: "Technology", symbol: "XLK.US", price: 187.25, changePercent: 0.85 },
        { name: "Financial", symbol: "XLF.US", price: 39.82, changePercent: 0.45 },
        { name: "Healthcare", symbol: "XLV.US", price: 143.65, changePercent: 0.12 },
        { name: "Consumer Discretionary", symbol: "XLY.US", price: 184.30, changePercent: 0.65 },
        { name: "Consumer Staples", symbol: "XLP.US", price: 76.40, changePercent: -0.20 },
        { name: "Energy", symbol: "XLE.US", price: 92.15, changePercent: -0.35 },
        { name: "Industrial", symbol: "XLI.US", price: 122.70, changePercent: 0.25 },
        { name: "Utilities", symbol: "XLU.US", price: 67.90, changePercent: -0.15 },
        { name: "Materials", symbol: "XLB.US", price: 85.50, changePercent: 0.30 },
        { name: "Real Estate", symbol: "XLRE.US", price: 42.80, changePercent: -0.10 }
      ];
    }
    
    // Ensure we have an array of data
    if (!Array.isArray(sectorData) || sectorData.length === 0) {
      return [
        { name: "Technology", symbol: "XLK.US", price: 187.25, changePercent: 0.85 },
        { name: "Financial", symbol: "XLF.US", price: 39.82, changePercent: 0.45 },
        { name: "Healthcare", symbol: "XLV.US", price: 143.65, changePercent: 0.12 }
      ];
    }
    
    // Normalize each sector item
    return sectorData.map(item => ({
      name: item.name || 'Unknown Sector',
      symbol: item.symbol || 'UNKNOWN',
      price: typeof item.price === 'number' ? item.price : 100.00,
      changePercent: typeof item.changePercent === 'number' ? item.changePercent : 0.00,
      ...item // Keep any additional fields
    }));
  } catch (error) {
    console.error('Error in getSectorData:', error.message);
    errorTracker.track(error, 'Market Data Service - Unhandled Error');
    
    // Fallback sector data
    return [
      { name: "Technology", symbol: "XLK.US", price: 187.25, changePercent: 0.85 },
      { name: "Financial", symbol: "XLF.US", price: 39.82, changePercent: 0.45 },
      { name: "Healthcare", symbol: "XLV.US", price: 143.65, changePercent: 0.12 }
    ];
  }
};

export default {
  getMarketData,
  getSectorData,
  validateMarketData,
  convertFormat,
  ensureRequiredIndices,
  REQUIRED_INDICES,
  FALLBACK_MARKET_DATA
};
