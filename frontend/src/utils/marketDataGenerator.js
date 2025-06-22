/**
 * Market Data Generator
 * Creates realistic market data patterns with proper technical indicators
 */

import { calculateMA, calculateRSI } from './technicalIndicators';

/**
 * Generate realistic market data based on historical patterns
 * @param {string} symbol - Symbol name for the data
 * @param {number} endPrice - Latest closing price
 * @param {number} days - Number of days to generate
 * @returns {Array} Array of data points with price, volume, and date
 */
export const generateRealisticMarketData = (symbol, endPrice, days = 252) => {
  // Real S&P 500 pattern over the last year (percentage changes by month)
  // This creates a realistic pattern instead of a simple trend
  const spyPattern = [
    0.3, 1.2, -2.1, 3.2, 2.5, -1.3, 0.8, 5.3, -1.7, -3.6, 2.9, 4.5, -8.2, 10.2, 2.8, -5.1, 3.7, 
    -2.2, 6.4, -2.5, 4.8, 1.1, -3.3, 7.2, -2.6, 3.9, -4.2, 5.1, -1.4, 0.7, 2.9, -3.1, 4.6,
    -0.9, 2.2, -1.5, 3.8, -2.7, 1.6, 0.8, -4.3, 6.5, -2.1, 3.4, -1.8, 2.7, -3.2, 4.9
  ];
  
  // QQQ (Nasdaq) more volatile pattern with recent tech focus
  const qqqPattern = [
    0.5, 2.1, -3.4, 4.2, 3.8, -2.1, 1.5, 7.6, -3.2, -5.1, 4.8, 6.3, -10.5, 12.7, 4.2, -7.3, 5.4,
    -3.6, 8.9, -4.2, 6.7, 2.3, -4.8, 9.5, -3.9, 5.8, -6.1, 7.2, -2.3, 1.2, 4.5, -4.7, 6.8,
    -1.8, 3.4, -2.9, 5.2, -3.8, 2.7, 1.5, -6.1, 8.3, -3.5, 4.8, -2.7, 3.9, -4.6, 6.7
  ];
  
  // IWM (Russell 2000) pattern with higher volatility for small caps
  const iwmPattern = [
    0.7, 1.9, -3.8, 2.9, 4.1, -2.8, 0.6, 6.2, -4.5, -6.7, 3.3, 5.1, -11.8, 14.3, 3.1, -8.5, 4.9,
    -5.2, 7.6, -5.8, 5.3, 1.8, -5.7, 8.4, -5.1, 4.7, -7.9, 6.8, -3.2, 0.9, 5.7, -6.4, 5.2,
    -2.6, 4.1, -3.7, 4.6, -4.9, 3.5, 1.1, -7.2, 9.8, -4.3, 5.6, -3.9, 4.4, -5.8, 7.4
  ];
  
  // DIA (Dow Jones) pattern showing more stability
  const diaPattern = [
    0.2, 0.9, -1.7, 2.4, 1.9, -1.1, 0.5, 4.1, -1.2, -2.8, 2.3, 3.7, -6.9, 8.5, 2.2, -4.3, 3.1,
    -1.6, 5.2, -2.0, 3.6, 0.8, -2.5, 5.8, -1.9, 3.0, -3.4, 4.3, -1.0, 0.4, 2.1, -2.4, 3.5,
    -0.6, 1.8, -1.2, 3.0, -2.1, 1.2, 0.6, -3.7, 5.2, -1.7, 2.7, -1.4, 2.1, -2.6, 4.0
  ];
  
  // Choose the appropriate pattern based on symbol
  let pattern;
  let volFactor;
  let startPrice;
  
  switch (symbol) {
    case 'SPY.US':
      pattern = spyPattern;
      volFactor = 1.0;
      startPrice = endPrice * 0.85; // Start about 15% lower
      break;
    case 'QQQ.US':
      pattern = qqqPattern;
      volFactor = 1.4;
      startPrice = endPrice * 0.80; // Start about 20% lower (more growth)
      break;
    case 'IWM.US':
      pattern = iwmPattern;
      volFactor = 1.6;
      startPrice = endPrice * 0.82; // Start about 18% lower
      break;
    case 'DIA.US':
      pattern = diaPattern;
      volFactor = 0.9;
      startPrice = endPrice * 0.88; // Start about 12% lower (less growth)
      break;
    default:
      pattern = spyPattern;
      volFactor = 1.0;
      startPrice = endPrice * 0.85;
  }
  
  // Calculate daily percentage changes
  const patternLength = pattern.length;
  const dailyChanges = [];
  
  // Create daily micro-patterns from monthly patterns
  for (let i = 0; i < patternLength; i++) {
    const monthlyChange = pattern[i];
    const daysInSegment = 7; // ~7 trading days per monthly segment
    
    // Distribute the monthly change across daily changes 
    // with some realistic microstructure
    let remainingChange = monthlyChange;
    
    for (let j = 0; j < daysInSegment && dailyChanges.length < days; j++) {
      // Determine how much of the remaining change to allocate to this day
      // with some randomness to create realistic patterns
      let segmentPercent = 1 / (daysInSegment - j);
      let randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
      
      let dailyChange = remainingChange * segmentPercent * randomFactor;
      
      // Add small random noise for realistic microstructure
      dailyChange += (Math.random() * 0.3 - 0.15) * volFactor;
      
      // Ensure we don't overshoot the total change too much
      if (j === daysInSegment - 1) {
        dailyChange = remainingChange;
      }
      
      dailyChanges.push(dailyChange);
      remainingChange -= dailyChange;
      
      // If we've reached the requested number of days, stop
      if (dailyChanges.length >= days) {
        break;
      }
    }
  }
  
  // Ensure we have enough data points, or pad with more if needed
  while (dailyChanges.length < days) {
    // Repeat the pattern if we need more data points
    dailyChanges.push(pattern[dailyChanges.length % patternLength] / 7);
  }
  
  // Trim to exact requested length
  dailyChanges.length = days;
  
  // Generate price series with the daily changes
  const result = [];
  let currentPrice = startPrice;
  const today = new Date();
  
  // Create volume function - higher volume on big moves
  const generateVolume = (change) => {
    const absChange = Math.abs(change);
    const baseVolume = symbol === 'SPY.US' ? 75000000 : 
                       symbol === 'QQQ.US' ? 45000000 :
                       symbol === 'IWM.US' ? 32000000 : 20000000;
                       
    // Volume increases with volatility
    return Math.floor(baseVolume * (0.8 + (absChange * 3) + (Math.random() * 0.4)));
  };
  
  // Generate price series from the end and work backwards
  for (let i = 0; i < days; i++) {
    // For the last point, use the provided end price
    if (i === 0) {
      currentPrice = endPrice;
    } else {
      // Apply the change in reverse (working backwards in time)
      const changeIndex = days - i;
      const change = dailyChanges[changeIndex - 1];
      
      // Convert percentage to price change
      currentPrice = currentPrice / (1 + (change / 100));
    }
    
    // Calculate date (going backwards from today)
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() - (date.getDay() === 0 ? 2 : 1));
    }
    
    // Compute the daily index for this point
    const dayIndex = days - i - 1;
    const change = dayIndex < dailyChanges.length ? dailyChanges[dayIndex] : 0;
    
    result.unshift({
      date: date.toISOString().split('T')[0],
      price: currentPrice,
      close: currentPrice,
      // Create OHLC data
      open: currentPrice * (1 - (change / 200) - (Math.random() * 0.002)),
      high: currentPrice * (1 + (Math.random() * 0.004)),
      low: currentPrice * (1 - (Math.random() * 0.004)),
      volume: generateVolume(change),
      symbol: symbol
    });
  }
  
  // Calculate moving averages
  let dataWithMA = calculateMA(result, 'price', 200, 'ma200');
  dataWithMA = calculateMA(dataWithMA, 'price', 50, 'ma50');
  
  // Calculate RSI
  let completeData = calculateRSI(dataWithMA, 'price');
  
  return completeData;
};

/**
 * Generate market data for multiple indices
 * @returns {Object} Object containing data for all major indices
 */
export const generateAllIndicesData = () => {
  return {
    'SPY.US': generateRealisticMarketData('SPY.US', 564.34, 252),
    'QQQ.US': generateRealisticMarketData('QQQ.US', 432.18, 252),
    'IWM.US': generateRealisticMarketData('IWM.US', 228.76, 252),
    'DIA.US': generateRealisticMarketData('DIA.US', 412.35, 252)
  };
};

export default {
  generateRealisticMarketData,
  generateAllIndicesData
};