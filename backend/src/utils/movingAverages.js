/**
 * Moving Averages Utility
 * Enhanced implementation for calculating various moving averages
 * with robust error handling, data validation, and optimization.
 */

/**
 * Calculate moving averages for historical price data
 * @param {Array} data - Array of price data objects
 * @param {Number} period - Period for moving average (default: 200)
 * @returns {Array} Data with moving averages added
 */
export function calculateMovingAverage(data, period = 200) {
  // Input validation
  if (!Array.isArray(data)) {
    console.error('Invalid data provided to calculateMovingAverage: not an array');
    return [];
  }
  
  if (data.length === 0) {
    console.log('Empty data array provided to calculateMovingAverage');
    return [];
  }
  
  // Validate period parameter
  if (typeof period !== 'number' || period <= 0 || !Number.isInteger(period)) {
    console.error(`Invalid period parameter: ${period}. Using default of 200.`);
    period = 200;
  }
  
  // Log input data characteristics for debugging
  console.log(`Calculating MA${period} for ${data.length} data points`);
  
  try {
    // Create a copy to avoid mutating the original data
    const processedData = [...data];
    
    // Sort data by date (oldest to newest) with robust date validation
    const sortedData = processedData.sort((a, b) => {
      // First check if we have valid date fields
      if (!a.date || !b.date) {
        console.warn('Missing date in data points:', a, b);
        return 0; // Keep original order if dates are missing
      }
      
      // Parse dates safely
      let dateA, dateB;
      try {
        dateA = new Date(a.date);
        dateB = new Date(b.date);
      } catch (error) {
        console.warn('Error parsing dates:', error.message, a.date, b.date);
        return 0; // Keep original order if dates can't be parsed
      }
      
      // Validate dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.warn('Invalid date found in data:', a.date, b.date);
        return 0; // Keep original order if dates are invalid
      }
      
      return dateA - dateB;
    });
    
    // Make sure data has required price fields
    const validatedData = sortedData.map(item => {
      // Get price value (accommodate different formats)
      let price;
      
      // Try different potential price fields
      if (typeof item.price === 'number' && !isNaN(item.price)) {
        price = item.price;
      } else if (typeof item.close === 'number' && !isNaN(item.close)) {
        price = item.close;
      } else if (typeof item.price === 'string' && item.price.trim() !== '') {
        price = parseFloat(item.price);
        if (isNaN(price)) price = null;
      } else if (typeof item.close === 'string' && item.close.trim() !== '') {
        price = parseFloat(item.close);
        if (isNaN(price)) price = null;
      } else {
        price = null;
        console.warn(`No valid price data found for item with date ${item.date}`);
      }
      
      return {
        ...item,
        price: price
      };
    });
    
    // Calculate moving average with optimized window calculation
    // This avoids recalculating the sum for each window from scratch
    let sum = 0;
    const result = validatedData.map((item, index, array) => {
      // Skip calculation if price is missing or invalid
      if (item.price === null || item.price === undefined || isNaN(item.price)) {
        return {
          ...item,
          [`ma${period}`]: null
        };
      }
      
      // Calculate MA using a sliding window approach for better performance
      let ma = null;
      
      if (index < period - 1) {
        // Not enough data points yet, but we can start accumulating the sum
        sum += item.price;
      } else if (index === period - 1) {
        // We have exactly enough data points for the first window
        sum += item.price;
        ma = sum / period;
      } else {
        // Slide the window: add current value, remove oldest value
        sum = sum + item.price - array[index - period].price;
        ma = sum / period;
      }
      
      // Handle cases where the calculation is invalid
      if (ma !== null && (isNaN(ma) || !isFinite(ma))) {
        console.warn(`Invalid MA calculation for index ${index}, date ${item.date}: ${ma}`);
        ma = null;
      }
      
      // Use a consistent field name format: ma{period}
      const maField = `ma${period}`;
      
      return {
        ...item,
        [maField]: ma !== null ? Number(ma.toFixed(6)) : null // Higher precision for better accuracy
      };
    });
    
    // Log a sample calculation for debugging
    if (result.length > 0) {
      const lastPoint = result[result.length - 1];
      console.log(`MA${period} calculation complete. Latest point (${lastPoint.date}): Price=${lastPoint.price}, MA${period}=${lastPoint[`ma${period}`]}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating moving average:', error.message, error.stack);
    // Return the original data as a fallback
    return data.map(item => ({
      ...item,
      [`ma${period}`]: null
    }));
  }
}

/**
 * Calculate multiple moving averages for historical price data
 * @param {Array} data - Array of price data objects
 * @param {Array} periods - Array of periods for moving averages
 * @returns {Array} Data with multiple moving averages added
 */
export function calculateMultipleMovingAverages(data, periods = [50, 200]) {
  // Input validation
  if (!Array.isArray(data)) {
    console.error('Invalid data provided to calculateMultipleMovingAverages: not an array');
    return [];
  }
  
  if (data.length === 0) {
    console.log('Empty data array provided to calculateMultipleMovingAverages');
    return [];
  }
  
  // Validate periods array
  if (!Array.isArray(periods)) {
    console.error(`Invalid periods parameter: ${periods}. Using default [50, 200].`);
    periods = [50, 200];
  }
  
  // Filter out invalid periods
  const validPeriods = periods.filter(p => typeof p === 'number' && p > 0 && Number.isInteger(p));
  if (validPeriods.length === 0) {
    console.error('No valid periods provided. Using default [50, 200].');
    validPeriods.push(50, 200);
  }
  
  try {
    // Sort data by date to ensure proper time series
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // Handle invalid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      
      return dateA - dateB;
    });
    
    // Optimize by calculating all MAs in a single pass
    const sums = validPeriods.map(() => 0); // Initialize sum for each period
    
    // Add price to each data point
    const processedData = sortedData.map(item => {
      const price = typeof item.price === 'number' ? item.price : 
                   typeof item.close === 'number' ? item.close :
                   typeof item.price === 'string' ? parseFloat(item.price) :
                   typeof item.close === 'string' ? parseFloat(item.close) : null;
      
      return {
        ...item,
        price: price
      };
    });
    
    // Calculate all MAs in a single loop for efficiency
    return processedData.map((item, index, array) => {
      const result = { ...item };
      
      // For each period, calculate MA
      validPeriods.forEach((period, periodIndex) => {
        if (item.price === null || isNaN(item.price)) {
          result[`ma${period}`] = null;
          return;
        }
        
        // Sliding window approach for better performance
        if (index < period - 1) {
          sums[periodIndex] += item.price;
          result[`ma${period}`] = null;
        } else if (index === period - 1) {
          sums[periodIndex] += item.price;
          result[`ma${period}`] = Number((sums[periodIndex] / period).toFixed(6));
        } else {
          sums[periodIndex] = sums[periodIndex] + item.price - array[index - period].price;
          result[`ma${period}`] = Number((sums[periodIndex] / period).toFixed(6));
        }
        
        // Validate the result
        if (result[`ma${period}`] !== null && (isNaN(result[`ma${period}`]) || !isFinite(result[`ma${period}`]))) {
          console.warn(`Invalid MA${period} calculation for date ${item.date}`);
          result[`ma${period}`] = null;
        }
      });
      
      return result;
    });
  } catch (error) {
    console.error('Error calculating multiple moving averages:', error.message, error.stack);
    // Return the original data as a fallback
    return data;
  }
}

/**
 * Calculate exponential moving average (EMA) for historical price data
 * @param {Array} data - Array of price data objects
 * @param {Number} period - Period for EMA calculation
 * @returns {Array} Data with EMA added
 */
export function calculateEMA(data, period = 20) {
  // Input validation
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Invalid or empty data provided to calculateEMA');
    return [];
  }
  
  if (typeof period !== 'number' || period <= 0 || !Number.isInteger(period)) {
    console.error(`Invalid period parameter: ${period}. Using default of 20.`);
    period = 20;
  }
  
  try {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate multiplier
    const multiplier = 2 / (period + 1);
    
    // Initialize EMA with SMA for the first period points
    let ema = null;
    if (sortedData.length >= period) {
      let sum = 0;
      for (let i = 0; i < period; i++) {
        const price = typeof sortedData[i].price === 'number' ? sortedData[i].price : 
                     typeof sortedData[i].close === 'number' ? sortedData[i].close :
                     parseFloat(sortedData[i].price || sortedData[i].close || 0);
        
        if (isNaN(price)) {
          console.warn(`Invalid price at index ${i}`);
          continue;
        }
        
        sum += price;
      }
      
      ema = sum / period;
    }
    
    // Calculate EMA for each point
    return sortedData.map((item, index) => {
      const price = typeof item.price === 'number' ? item.price : 
                   typeof item.close === 'number' ? item.close :
                   parseFloat(item.price || item.close || 0);
      
      // Skip calculation if price is invalid
      if (isNaN(price)) {
        return {
          ...item,
          [`ema${period}`]: null
        };
      }
      
      // First period points use SMA
      if (index < period - 1) {
        return {
          ...item,
          [`ema${period}`]: null
        };
      } 
      // First EMA value is SMA
      else if (index === period - 1) {
        return {
          ...item,
          [`ema${period}`]: Number(ema.toFixed(6))
        };
      } 
      // Calculate EMA based on previous EMA
      else {
        ema = (price - ema) * multiplier + ema;
        return {
          ...item,
          [`ema${period}`]: Number(ema.toFixed(6))
        };
      }
    });
  } catch (error) {
    console.error('Error calculating EMA:', error.message, error.stack);
    return data;
  }
}
