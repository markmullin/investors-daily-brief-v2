/**
 * Technical Indicators Utility
 * Provides calculation functions for RSI and other technical indicators
 */

/**
 * Calculate Relative Strength Index (RSI) for historical price data
 * @param {Array} data - Array of price data objects sorted by date (oldest first)
 * @param {Number} period - Period for RSI calculation (default: 14)
 * @returns {Array} Data with RSI values added
 */
export function calculateRSI(data, period = 14) {
  // Input validation
  if (!Array.isArray(data)) {
    console.error('Invalid data provided to calculateRSI: not an array');
    return [];
  }
  
  if (data.length === 0) {
    console.log('Empty data array provided to calculateRSI');
    return [];
  }
  
  // Validate period parameter
  if (typeof period !== 'number' || period <= 0 || !Number.isInteger(period)) {
    console.error(`Invalid period parameter: ${period}. Using default of 14.`);
    period = 14;
  }
  
  console.log(`Calculating RSI(${period}) for ${data.length} data points`);
  
  try {
    // Create a copy to avoid mutating the original data
    const processedData = [...data];
    
    // Sort data by date (oldest to newest)
    const sortedData = processedData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.warn('Invalid date found in data');
        return 0;
      }
      
      return dateA - dateB;
    });
    
    // Get price values and validate
    const prices = sortedData.map(item => {
      const price = typeof item.price === 'number' ? item.price :
                   typeof item.close === 'number' ? item.close :
                   parseFloat(item.price || item.close || 0);
      
      return isNaN(price) ? null : price;
    });
    
    // Initialize RSI array with nulls
    const rsiValues = new Array(prices.length).fill(null);
    
    // Need at least period + 1 prices to calculate RSI
    if (prices.filter(p => p !== null).length < period + 1) {
      console.warn(`Not enough valid price data for RSI calculation. Need at least ${period + 1} points.`);
      return sortedData.map((item, index) => ({
        ...item,
        rsi: null
      }));
    }
    
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] !== null && prices[i - 1] !== null) {
        changes.push(prices[i] - prices[i - 1]);
      } else {
        changes.push(null);
      }
    }
    
    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;
    let validChanges = 0;
    
    for (let i = 0; i < period && i < changes.length; i++) {
      if (changes[i] !== null) {
        if (changes[i] > 0) {
          avgGain += changes[i];
        } else {
          avgLoss += Math.abs(changes[i]);
        }
        validChanges++;
      }
    }
    
    if (validChanges > 0) {
      avgGain /= period;
      avgLoss /= period;
    }
    
    // Calculate RSI using Wilder's smoothing method
    for (let i = period; i < prices.length; i++) {
      if (changes[i - 1] !== null) {
        const gain = changes[i - 1] > 0 ? changes[i - 1] : 0;
        const loss = changes[i - 1] < 0 ? Math.abs(changes[i - 1]) : 0;
        
        // Wilder's smoothing: ((prev avg * (period - 1)) + current) / period
        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
        
        let rsi;
        if (avgLoss === 0) {
          rsi = 100;
        } else {
          const rs = avgGain / avgLoss;
          rsi = 100 - (100 / (1 + rs));
        }
        
        // Validate RSI value
        if (!isNaN(rsi) && isFinite(rsi)) {
          rsiValues[i] = Number(rsi.toFixed(2));
        }
      }
    }
    
    // Map RSI values back to data
    const result = sortedData.map((item, index) => ({
      ...item,
      rsi: rsiValues[index]
    }));
    
    // Log sample calculation for debugging
    const validRSICount = rsiValues.filter(v => v !== null).length;
    console.log(`RSI calculation complete. Valid RSI values: ${validRSICount}/${prices.length}`);
    
    if (validRSICount > 0) {
      const lastRSI = rsiValues.filter(v => v !== null).pop();
      console.log(`Latest RSI value: ${lastRSI}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating RSI:', error.message, error.stack);
    // Return the original data with null RSI values as fallback
    return data.map(item => ({
      ...item,
      rsi: null
    }));
  }
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array} data - Array of price data objects
 * @param {Number} period - Period for moving average
 * @returns {Array} Data with SMA values added
 */
export function calculateSMA(data, period) {
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Invalid data provided to calculateSMA');
    return [];
  }
  
  if (typeof period !== 'number' || period <= 0 || !Number.isInteger(period)) {
    console.error(`Invalid period parameter: ${period}`);
    return data;
  }
  
  console.log(`Calculating SMA(${period}) for ${data.length} data points`);
  
  try {
    // Create a copy and sort by date
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
    
    // Get price values
    const prices = sortedData.map(item => {
      const price = typeof item.price === 'number' ? item.price :
                   typeof item.close === 'number' ? item.close :
                   parseFloat(item.price || item.close || 0);
      return isNaN(price) ? null : price;
    });
    
    // Calculate SMA values
    const smaValues = new Array(prices.length).fill(null);
    
    for (let i = period - 1; i < prices.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        if (prices[j] !== null) {
          sum += prices[j];
          count++;
        }
      }
      
      if (count === period) {
        smaValues[i] = Number((sum / period).toFixed(2));
      }
    }
    
    // Map SMA values back to data
    const result = sortedData.map((item, index) => ({
      ...item,
      [`ma${period}`]: smaValues[index]
    }));
    
    const validSMACount = smaValues.filter(v => v !== null).length;
    console.log(`SMA(${period}) calculation complete. Valid values: ${validSMACount}/${prices.length}`);
    
    return result;
  } catch (error) {
    console.error(`Error calculating SMA(${period}):`, error.message);
    return data.map(item => ({
      ...item,
      [`ma${period}`]: null
    }));
  }
}

/**
 * Calculate multiple moving averages for chart display
 * @param {Array} data - Array of price data objects
 * @param {Array} periods - Array of periods to calculate (e.g., [20, 50, 200])
 * @returns {Array} Data with all moving averages added
 */
export function calculateMovingAverages(data, periods = [20, 50, 200]) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  let result = [...data];
  
  for (const period of periods) {
    result = calculateSMA(result, period);
  }
  
  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Array} data - Array of price data objects
 * @param {Number} fastPeriod - Fast EMA period (default: 12)
 * @param {Number} slowPeriod - Slow EMA period (default: 26)
 * @param {Number} signalPeriod - Signal line EMA period (default: 9)
 * @returns {Array} Data with MACD values added
 */
export function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  // This is a placeholder for MACD calculation
  // Can be implemented later if needed
  return data.map(item => ({
    ...item,
    macd: null,
    macdSignal: null,
    macdHistogram: null
  }));
}

/**
 * Calculate Bollinger Bands
 * @param {Array} data - Array of price data objects
 * @param {Number} period - Period for moving average (default: 20)
 * @param {Number} standardDeviations - Number of standard deviations (default: 2)
 * @returns {Array} Data with Bollinger Bands added
 */
export function calculateBollingerBands(data, period = 20, standardDeviations = 2) {
  // This is a placeholder for Bollinger Bands calculation
  // Can be implemented later if needed
  return data.map(item => ({
    ...item,
    bbUpper: null,
    bbMiddle: null,
    bbLower: null
  }));
}
