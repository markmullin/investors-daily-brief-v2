/**
 * Treasury Data Service
 * Uses Treasury FiscalData API and Federal Reserve data
 * Replaces FRED for 10-year Treasury and US Dollar Index
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Cached data expiration time - 1 hour
const CACHE_EXPIRATION = 1 * 60 * 60 * 1000;

/**
 * Fetch 10-year Treasury yield data
 * @param {number} observations - Number of observations to retrieve
 * @returns {Promise<Array>} - Processed data for the indicator
 */
export const fetchTreasury10Y = async (observations = 60) => {
  console.log('Fetching 10-year Treasury yield data from Treasury API');
  
  // Check cache first
  const cacheKey = 'treasury_10y';
  try {
    const cacheString = localStorage.getItem(cacheKey);
    if (cacheString) {
      const cache = JSON.parse(cacheString);
      if (Date.now() - cache.timestamp < CACHE_EXPIRATION) {
        console.log('Using cached 10-year Treasury data');
        return cache.data;
      }
    }
  } catch (e) {
    console.error('Error parsing cached Treasury data:', e);
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/treasury/10-year-yield`, {
      params: { observations }
    });
    
    if (response.data && response.data.success && response.data.observations) {
      const processedData = response.data.observations;
      
      // Cache the data
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: processedData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error caching Treasury data:', e);
      }
      
      return processedData;
    }
    
    throw new Error('Invalid response from Treasury API');
  } catch (error) {
    console.error('Error fetching 10-year Treasury data:', error);
    
    // Generate fallback data
    return generateFallbackData('treasury10y', observations);
  }
};

/**
 * Fetch US Dollar Index data
 * @param {number} observations - Number of observations to retrieve
 * @returns {Promise<Array>} - Processed data for the indicator
 */
export const fetchDollarIndex = async (observations = 60) => {
  console.log('Fetching US Dollar Index data from Treasury API');
  
  // Check cache first
  const cacheKey = 'dollar_index';
  try {
    const cacheString = localStorage.getItem(cacheKey);
    if (cacheString) {
      const cache = JSON.parse(cacheString);
      if (Date.now() - cache.timestamp < CACHE_EXPIRATION) {
        console.log('Using cached Dollar Index data');
        return cache.data;
      }
    }
  } catch (e) {
    console.error('Error parsing cached Dollar Index data:', e);
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/treasury/dollar-index`, {
      params: { observations }
    });
    
    if (response.data && response.data.success && response.data.observations) {
      const processedData = response.data.observations;
      
      // Cache the data
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: processedData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error caching Dollar Index data:', e);
      }
      
      return processedData;
    }
    
    throw new Error('Invalid response from Treasury API');
  } catch (error) {
    console.error('Error fetching Dollar Index data:', error);
    
    // Generate fallback data
    return generateFallbackData('dollarIndex', observations);
  }
};

/**
 * Fetch treasury dashboard data
 * @returns {Promise<Object>} - Dashboard data with all indicators
 */
export const fetchTreasuryDashboard = async () => {
  console.log('Fetching Treasury dashboard data');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/treasury/dashboard`);
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid response from Treasury dashboard API');
  } catch (error) {
    console.error('Error fetching Treasury dashboard:', error);
    
    // Return fallback structure
    return {
      treasury10Y: {
        id: 'DGS10',
        name: '10-Year Treasury Yield',
        data: generateFallbackData('treasury10y', 60),
        error: error.message
      },
      dollarIndex: {
        id: 'DTWEXBGS',
        name: 'US Dollar Index (Broad)',
        data: generateFallbackData('dollarIndex', 60),
        error: error.message
      }
    };
  }
};

/**
 * Generate fallback data if API fetch fails
 * @param {string} type - Type of data ('treasury10y' or 'dollarIndex')
 * @param {number} observations - Number of observations to generate
 * @returns {Array} - Array of synthetic data
 */
const generateFallbackData = (type, observations = 60) => {
  console.log(`Generating fallback data for ${type}`);
  const fallbackData = [];
  const today = new Date();
  
  let startValue, volatility, trend;
  
  if (type === 'treasury10y') {
    startValue = 4.37; // Current 10-year Treasury yield
    volatility = 0.1;
    trend = -0.02;
  } else if (type === 'dollarIndex') {
    startValue = 115; // Current US Dollar Index level
    volatility = 0.5;
    trend = 0.03;
  } else {
    startValue = 100;
    volatility = 1;
    trend = 0.1;
  }
  
  let currentValue = startValue;
  
  for (let i = observations; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    
    // Add some random movement with trend
    const change = (Math.random() * volatility * 2 - volatility) + trend;
    currentValue += change;
    
    // Ensure value is valid
    currentValue = Math.max(currentValue, 0);
    
    fallbackData.push({
      date: date.toISOString().split('T')[0],
      value: currentValue
    });
  }
  
  return fallbackData;
};

/**
 * Calculate Year-over-Year percentage change
 * @param {Array} data - Time series data
 * @returns {Array} - Data with YoY change added
 */
export const calculateYoYChange = (data) => {
  if (!data || data.length < 13) return [];
  
  return data.map((item, index) => {
    const yearAgo = data[index + 12];
    const yoyChange = yearAgo ? ((item.value - yearAgo.value) / yearAgo.value) * 100 : null;
    
    return {
      ...item,
      yoyChange: yoyChange
    };
  }).filter(item => item.yoyChange !== null);
};

/**
 * Format values for display
 * @param {number} value - Value to format
 * @param {string} type - Type of formatting
 * @returns {string} - Formatted value
 */
export const formatValue = (value, type) => {
  if (value === undefined || value === null) return '-';
  
  switch (type) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'dollar_index':
      return value.toFixed(2); 
    case 'index':
    default:
      return value.toFixed(2);
  }
};

export default {
  fetchTreasury10Y,
  fetchDollarIndex,
  fetchTreasuryDashboard,
  calculateYoYChange,
  formatValue
};
