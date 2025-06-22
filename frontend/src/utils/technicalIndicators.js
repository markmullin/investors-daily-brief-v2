/**
 * Technical indicator calculations for financial charts
 */

/**
 * Calculate Relative Strength Index (RSI)
 * @param {Array} data - Array of price data objects
 * @param {String} priceKey - The key for price in the data objects
 * @param {Number} period - The RSI period (typically 14)
 * @returns {Array} Data array with RSI values added
 */
export const calculateRSI = (data, priceKey = 'close', period = 14) => {
  // Input validation
  if (!data || !Array.isArray(data) || data.length < period + 1) {
    console.warn('Not enough data for RSI calculation, returning placeholder values');
    return data.map(item => ({ ...item, rsi: 50 }));
  }

  // Check if the price key exists in the data
  const priceExists = data.some(item => item[priceKey] !== undefined);
  if (!priceExists) {
    console.error(`Price key "${priceKey}" not found in data for RSI calculation`);
    console.log('Available keys:', Object.keys(data[0] || {}));
    
    // Look for alternative price keys
    const alternativeKeys = ['close', 'price', 'value', 'adjClose'];
    let alternativeKey = null;
    
    for (const key of alternativeKeys) {
      if (key !== priceKey && data.some(item => item[key] !== undefined)) {
        alternativeKey = key;
        console.log(`Using alternative price key: ${alternativeKey}`);
        break;
      }
    }
    
    if (alternativeKey) {
      return calculateRSI(data, alternativeKey, period);
    }
    
    return data.map(item => ({ ...item, rsi: 50 }));
  }

  try {
    // Make a deep copy to avoid mutating the original data
    const result = JSON.parse(JSON.stringify(data));
    
    // Extract price data and ensure it's valid
    const prices = result.map(item => {
      // Handle string values, nulls, and NaN
      if (item[priceKey] === null || item[priceKey] === undefined) return null;
      const price = typeof item[priceKey] === 'string' ? parseFloat(item[priceKey]) : Number(item[priceKey]);
      return isNaN(price) ? null : price;
    });
    
    // Filter out null values for validation check
    const validPrices = prices.filter(price => price !== null);
    if (validPrices.length < period + 1) {
      console.warn(`Not enough valid prices for RSI calculation, only ${validPrices.length} valid prices`);
      return data.map(item => ({ ...item, rsi: 50 }));
    }
    
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] !== null && prices[i-1] !== null) {
        changes.push(prices[i] - prices[i-1]);
      } else {
        changes.push(0);
      }
    }
    
    // Calculate initial averages
    let sumGain = 0;
    let sumLoss = 0;
    
    // Use only valid changes for the initial period
    let validChangesInPeriod = 0;
    for (let i = 0; i < period; i++) {
      if (i < changes.length) {
        if (changes[i] > 0) {
          sumGain += changes[i];
          validChangesInPeriod++;
        } else if (changes[i] < 0) {
          sumLoss += Math.abs(changes[i]);
          validChangesInPeriod++;
        } else if (changes[i] === 0) {
          validChangesInPeriod++; // Count zero changes as valid
        }
      }
    }
    
    // Initialize avgGain and avgLoss
    let avgGain, avgLoss;
    
    // Only proceed if we have some valid changes
    if (validChangesInPeriod > 0) {
      avgGain = sumGain / period;
      avgLoss = sumLoss / period;
    } else {
      console.warn('No valid changes found for initial RSI calculation');
      return data.map(item => ({ ...item, rsi: 50 }));
    }
    
    // Calculate standard placeholder RSI values for the first period points
    for (let i = 0; i < period; i++) {
      if (i < result.length) {
        result[i].rsi = 50; // Neutral value for initial points
      }
    }
    
    // Calculate RSI values using Wilder's smoothing method
    for (let i = period; i < result.length; i++) {
      // Calculate current gain/loss
      const currentChange = changes[i - 1];
      let currentGain = 0;
      let currentLoss = 0;
      
      if (currentChange > 0) {
        currentGain = currentChange;
      } else if (currentChange < 0) {
        currentLoss = Math.abs(currentChange);
      }
      
      // Apply Wilder's smoothing
      avgGain = ((avgGain * (period - 1)) + currentGain) / period;
      avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
      
      // Calculate RSI
      // Handle division by zero
      if (avgLoss === 0) {
        result[i].rsi = 100; // If no losses, RSI is 100
      } else {
        const rs = avgGain / avgLoss;
        result[i].rsi = 100 - (100 / (1 + rs));
      }
      
      // Add validation - RSI should always be between 0 and 100
      if (result[i].rsi < 0) result[i].rsi = 0;
      if (result[i].rsi > 100) result[i].rsi = 100;
    }
    
    // Log some sample values for verification
    console.log(`RSI calculation complete for ${priceKey}: First RSI value: ${result[period]?.rsi?.toFixed(2)}, 
                 Middle: ${result[Math.floor(result.length/2)]?.rsi?.toFixed(2)}, 
                 Last: ${result[result.length-1]?.rsi?.toFixed(2)}`);
    
    return result;
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return data.map(item => ({ ...item, rsi: 50 }));
  }
};

/**
 * Calculate Moving Average
 * @param {Array} data - Array of price data objects
 * @param {String} priceKey - The key for price in the data objects
 * @param {Number} period - The MA period (e.g. 50, 200)
 * @param {String} resultKey - The key to store the MA value in the result
 * @returns {Array} Data array with MA values added
 */
export const calculateMA = (data, priceKey = 'close', period = 200, resultKey = 'ma200') => {
  if (!data || !Array.isArray(data) || data.length < period) {
    console.warn(`Not enough data for ${period}-day MA calculation`);
    return data; // Not enough data
  }
  
  try {
    // Make a deep copy to avoid mutating the original data
    const result = JSON.parse(JSON.stringify(data));
    
    // Find alternate price key if needed
    if (!data.some(item => item[priceKey] !== undefined)) {
      const alternativeKeys = ['close', 'price', 'value', 'adjClose'];
      for (const key of alternativeKeys) {
        if (key !== priceKey && data.some(item => item[key] !== undefined)) {
          console.log(`MA calculation: Using alternate price key ${key} instead of ${priceKey}`);
          priceKey = key;
          break;
        }
      }
    }
    
    // Calculate MA for each point
    for (let i = period - 1; i < result.length; i++) {
      const window = result.slice(i - period + 1, i + 1);
      
      // Filter out invalid values before calculating sum
      const validPrices = window
        .map(item => {
          if (item[priceKey] === null || item[priceKey] === undefined) return null;
          const price = typeof item[priceKey] === 'string' 
            ? parseFloat(item[priceKey]) 
            : Number(item[priceKey]);
          return isNaN(price) ? null : price;
        })
        .filter(price => price !== null);
      
      // Only calculate MA if we have enough valid prices
      if (validPrices.length >= period * 0.8) { // Allow up to 20% missing data
        const sum = validPrices.reduce((total, price) => total + price, 0);
        const ma = sum / validPrices.length; // Use actual count of valid prices
        result[i][resultKey] = ma;
      } else {
        result[i][resultKey] = null; // Mark as no valid MA available
      }
    }
    
    // Log for debugging
    console.log(`MA${period} calculation complete: First valid MA: ${result.find(item => item[resultKey] !== undefined && item[resultKey] !== null)?.[resultKey]?.toFixed(2)}, 
                 Last: ${result[result.length-1]?.[resultKey]?.toFixed(2)}`);
    
    return result;
  } catch (error) {
    console.error('Error calculating MA:', error);
    return data; // Return original data on error
  }
};

/**
 * Prepare OHLC data for candlestick charts
 * @param {Array} data - Raw data array
 * @returns {Array} Processed data with OHLC values
 */
export const prepareOHLCData = (data) => {
  if (!data || data.length === 0) {
    return [];
  }
  
  try {
    return data.map(item => {
      // Check if we have complete OHLC data
      const hasOHLC = item.open !== undefined && 
                     item.high !== undefined && 
                     item.low !== undefined && 
                     item.close !== undefined;
      
      // If we have price but not OHLC, create synthetic OHLC
      if (!hasOHLC && item.price) {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        
        // Add small variations to create visible candlesticks
        const variation = price * 0.005; // 0.5% variation
        
        return {
          ...item,
          open: price * (1 - (Math.random() * 0.005)),
          high: price * (1 + (Math.random() * 0.005)),
          low: price * (1 - (Math.random() * 0.005)),
          close: price
        };
      }
      
      // Ensure all OHLC values are numeric
      return {
        ...item,
        open: typeof item.open === 'string' ? parseFloat(item.open) : (item.open || item.price || 0),
        high: typeof item.high === 'string' ? parseFloat(item.high) : (item.high || item.price || 0),
        low: typeof item.low === 'string' ? parseFloat(item.low) : (item.low || item.price || 0),
        close: typeof item.close === 'string' ? parseFloat(item.close) : (item.close || item.price || 0)
      };
    });
  } catch (error) {
    console.error('Error preparing OHLC data:', error);
    return data; // Return original data on error
  }
};

/**
 * Determine the color for RSI based on value
 * @param {Number} value - RSI value
 * @returns {String} Color code
 */
export const getRsiColor = (value) => {
  if (value >= 70) return '#ef4444'; // Overbought (red)
  if (value <= 30) return '#22c55e'; // Oversold (green)
  return '#9ca3af'; // Neutral (gray)
};

export default {
  calculateRSI,
  calculateMA,
  prepareOHLCData,
  getRsiColor
};