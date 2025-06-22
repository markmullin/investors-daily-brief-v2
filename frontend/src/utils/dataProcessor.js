/**
 * Utility functions for processing market data
 */

/**
 * Downsample time series data to reduce storage requirements
 * @param {Array} data - The array of time series data points
 * @param {Number} targetPoints - The approximate number of points to keep
 * @returns {Array} - The downsampled data
 */
export const downsampleTimeSeries = (data, targetPoints = 180) => {
  if (!Array.isArray(data) || data.length <= targetPoints) {
    return data;
  }
  
  // Calculate the sampling interval
  const interval = Math.ceil(data.length / targetPoints);
  
  // Perform the downsampling
  const result = [];
  for (let i = 0; i < data.length; i += interval) {
    result.push(data[i]);
  }
  
  // Always include the most recent data point if it wasn't included
  const lastIndex = data.length - 1;
  if (result[result.length - 1] !== data[lastIndex]) {
    result.push(data[lastIndex]);
  }
  
  return result;
};

/**
 * Process historical market data for efficient storage
 * @param {Object} data - The historical data object with multiple symbols
 * @returns {Object} - Processed data for storage
 */
export const processHistoricalData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const result = {};
  for (const [symbol, timeData] of Object.entries(data)) {
    if (Array.isArray(timeData)) {
      // Downsample based on length
      if (timeData.length > 365) {
        // For very long time series (>1 year), keep ~180 points
        result[symbol] = downsampleTimeSeries(timeData, 180);
      } else if (timeData.length > 180) {
        // For medium time series (6mo-1yr), keep ~90 points
        result[symbol] = downsampleTimeSeries(timeData, 90);
      } else {
        // For shorter time series, keep all points
        result[symbol] = timeData;
      }
    } else {
      result[symbol] = timeData;
    }
  }
  
  return result;
};

/**
 * Format numerical value with appropriate precision
 * @param {Number} value - The numerical value to format
 * @param {Number} precision - Number of decimal places
 * @returns {String} - Formatted string
 */
export const formatNumber = (value, precision = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return Number(value).toFixed(precision);
};

/**
 * Format percentage values
 * @param {Number} value - The percentage value
 * @param {Boolean} includeSign - Whether to include + sign for positive values
 * @returns {String} - Formatted percentage
 */
export const formatPercentage = (value, includeSign = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const formattedValue = Number(value).toFixed(2);
  if (includeSign && value > 0) {
    return `+${formattedValue}%`;
  }
  return `${formattedValue}%`;
};

/**
 * Format currency values
 * @param {Number} value - The currency value
 * @param {String} currency - Currency code
 * @returns {String} - Formatted currency value
 */
export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};