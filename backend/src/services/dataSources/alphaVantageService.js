// Alpha Vantage API service for alternative financial data
import axios from 'axios';
import NodeCache from 'node-cache';

// Configuration
const API_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || ''; // Add your API key to .env file
const CACHE_TTL = 3600; // Cache for 1 hour (in seconds)

// Cache setup
const dataCache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120 });

// Alpha Vantage service
const alphaVantageService = {
  /**
   * Check if the API is available and configured
   * @returns {boolean} True if the API is available
   */
  isAvailable: () => {
    return Boolean(API_KEY);
  },
  
  /**
   * Get time series data for a symbol
   * @param {string} symbol Stock symbol
   * @param {string} interval Interval (daily, weekly, monthly)
   * @param {string} outputSize Output size (compact, full)
   * @returns {Promise<Array>} Time series data
   */
  getTimeSeries: async (symbol, interval = 'daily', outputSize = 'compact') => {
    if (!API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }
    
    // Determine the function to use
    let functionName;
    switch (interval.toLowerCase()) {
      case 'daily':
        functionName = 'TIME_SERIES_DAILY_ADJUSTED';
        break;
      case 'weekly':
        functionName = 'TIME_SERIES_WEEKLY';
        break;
      case 'monthly':
        functionName = 'TIME_SERIES_MONTHLY';
        break;
      default:
        functionName = 'TIME_SERIES_DAILY_ADJUSTED';
    }
    
    // Generate cache key
    const cacheKey = `av_${symbol}_${functionName}_${outputSize}`;
    
    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await axios.get(API_URL, {
        params: {
          function: functionName,
          symbol,
          outputsize: outputSize,
          apikey: API_KEY
        }
      });
      
      // Process the data
      const result = processTimeSeriesData(response.data, functionName);
      
      // Cache the results
      dataCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch data from Alpha Vantage: ${error.message}`);
    }
  },
  
  /**
   * Get company overview data
   * @param {string} symbol Stock symbol
   * @returns {Promise<Object>} Company overview data
   */
  getCompanyOverview: async (symbol) => {
    if (!API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }
    
    // Generate cache key
    const cacheKey = `av_overview_${symbol}`;
    
    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await axios.get(API_URL, {
        params: {
          function: 'OVERVIEW',
          symbol,
          apikey: API_KEY
        }
      });
      
      // Cache the results
      dataCache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol} overview:`, error.message);
      throw new Error(`Failed to fetch company overview: ${error.message}`);
    }
  },
  
  /**
   * Get global economic indicator data
   * @param {string} indicator Economic indicator (GDP, CPI, etc.)
   * @param {string} interval Interval (annual, quarterly, monthly, etc.)
   * @returns {Promise<Array>} Economic indicator data
   */
  getEconomicIndicator: async (indicator, interval = 'annual') => {
    if (!API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }
    
    // Generate cache key
    const cacheKey = `av_econ_${indicator}_${interval}`;
    
    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await axios.get(API_URL, {
        params: {
          function: indicator,
          interval,
          apikey: API_KEY
        }
      });
      
      // Process the data
      const result = processEconomicData(response.data);
      
      // Cache the results
      dataCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Alpha Vantage API error for ${indicator}:`, error.message);
      throw new Error(`Failed to fetch economic indicator: ${error.message}`);
    }
  },
  
  /**
   * Search for symbols
   * @param {string} keywords Search keywords
   * @returns {Promise<Array>} Search results
   */
  searchSymbols: async (keywords) => {
    if (!API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }
    
    // Generate cache key
    const cacheKey = `av_search_${keywords}`;
    
    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await axios.get(API_URL, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords,
          apikey: API_KEY
        }
      });
      
      const results = response.data.bestMatches || [];
      
      // Format the results
      const formattedResults = results.map(item => ({
        symbol: item['1. symbol'],
        name: item['2. name'],
        type: item['3. type'],
        region: item['4. region'],
        currency: item['8. currency']
      }));
      
      // Cache the results
      dataCache.set(cacheKey, formattedResults);
      
      return formattedResults;
    } catch (error) {
      console.error(`Alpha Vantage API error for search ${keywords}:`, error.message);
      throw new Error(`Failed to search symbols: ${error.message}`);
    }
  },
  
  /**
   * Clear the cache
   * @param {string} pattern Optional pattern to clear specific cache entries
   */
  clearCache: (pattern = null) => {
    if (pattern) {
      // Clear specific cache entries matching pattern
      const keys = dataCache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      matchingKeys.forEach(key => dataCache.del(key));
    } else {
      // Clear all cache
      dataCache.flushAll();
    }
  }
};

// Helper functions to process response data

/**
 * Process time series data from Alpha Vantage
 * @param {Object} data Raw response data
 * @param {string} functionName The function name used
 * @returns {Array} Processed time series data
 */
function processTimeSeriesData(data, functionName) {
  // Get the time series data
  let timeSeriesKey;
  switch (functionName) {
    case 'TIME_SERIES_DAILY_ADJUSTED':
      timeSeriesKey = 'Time Series (Daily)';
      break;
    case 'TIME_SERIES_WEEKLY':
      timeSeriesKey = 'Weekly Time Series';
      break;
    case 'TIME_SERIES_MONTHLY':
      timeSeriesKey = 'Monthly Time Series';
      break;
    default:
      timeSeriesKey = 'Time Series (Daily)';
  }
  
  const timeSeries = data[timeSeriesKey];
  
  if (!timeSeries) {
    throw new Error('Invalid response format from Alpha Vantage');
  }
  
  // Convert to array format
  const result = [];
  
  for (const [date, values] of Object.entries(timeSeries)) {
    result.push({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['6. volume'], 10),
      ...(values['5. adjusted close'] && { adjusted_close: parseFloat(values['5. adjusted close']) }),
      ...(values['7. dividend amount'] && { dividend: parseFloat(values['7. dividend amount']) }),
      ...(values['8. split coefficient'] && { split: parseFloat(values['8. split coefficient']) })
    });
  }
  
  // Sort by date (ascending)
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return result;
}

/**
 * Process economic data from Alpha Vantage
 * @param {Object} data Raw response data
 * @returns {Array} Processed economic data
 */
function processEconomicData(data) {
  // Get the data key
  const dataKey = Object.keys(data).find(key => key.startsWith('data'));
  
  if (!dataKey || !data[dataKey]) {
    throw new Error('Invalid response format from Alpha Vantage');
  }
  
  // Get the value key
  const sampleEntry = data[dataKey][0];
  const valueKey = Object.keys(sampleEntry).find(key => key.includes('value'));
  
  if (!valueKey) {
    throw new Error('Could not find value key in economic data');
  }
  
  // Convert to standardized format
  return data[dataKey].map(item => ({
    date: item.date,
    value: parseFloat(item[valueKey])
  }));
}

export default alphaVantageService;
