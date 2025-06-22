/**
 * Data utilities for market data generation and processing
 */

import { calculateRSI, calculateMA } from './technicalIndicators';

/**
 * Generate synthetic market data with proper technical indicators
 * @param {string} symbol - Stock/Index symbol
 * @param {number} startPrice - Starting price for generation
 * @param {number} days - Number of days to generate
 * @param {number} volatility - Price volatility factor (0-1)
 * @param {number} trend - Directional trend factor (-1 to 1)
 * @returns {Array} Array of price data with technical indicators
 */
export const generateMarketData = (symbol, startPrice, days = 252, volatility = 0.01, trend = 0.0001) => {
  const result = [];
  let currentPrice = startPrice;
  const today = new Date();

  // Step 1: Generate base price data
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some random movement with trend
    const change = currentPrice * (Math.random() * volatility * 2 - volatility + trend);
    currentPrice += change;
    
    // Add seasonal patterns for more realistic data
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const seasonalFactor = Math.sin(dayOfYear / 365 * Math.PI * 2) * 0.01;
    currentPrice *= (1 + seasonalFactor);

    // Ensure price is positive
    currentPrice = Math.max(currentPrice, 0.01);
    
    // Create a realistic OHLC entry
    const dailyVolatility = currentPrice * 0.01; // 1% daily range
    const open = currentPrice - dailyVolatility/2 + Math.random() * dailyVolatility;
    const close = currentPrice;
    const high = Math.max(open, close) + Math.random() * dailyVolatility/2;
    const low = Math.min(open, close) - Math.random() * dailyVolatility/2;
    
    result.push({
      date: date.toISOString().split('T')[0],
      price: currentPrice,
      close: close,
      open: open,
      high: high,
      low: low,
      symbol: symbol,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  
  // Step 2: Add 200-day Moving Average
  let dataWithMA = calculateMA(result, 'close', 200, 'ma200');
  
  // Add 50-day Moving Average as well
  dataWithMA = calculateMA(dataWithMA, 'close', 50, 'ma50');
  
  // Step 3: Add RSI
  let completeData = calculateRSI(dataWithMA, 'close');
  
  // Log first and last few data points to verify they have MA and RSI
  console.log(`Generated data for ${symbol} - first point:`, {
    date: completeData[0].date,
    price: completeData[0].close,
    ma200: completeData[0].ma200,
    rsi: completeData[0].rsi
  });
  
  console.log(`Generated data for ${symbol} - last point:`, {
    date: completeData[completeData.length-1].date,
    price: completeData[completeData.length-1].close,
    ma200: completeData[completeData.length-1].ma200,
    rsi: completeData[completeData.length-1].rsi
  });
  
  return completeData;
};

/**
 * Generate synthetic data for multiple market indices
 * @returns {Object} Object with data for each index
 */
export const generateMarketIndicesData = () => {
  console.log('Generating synthetic market data for all indices');
  return {
    'SPY.US': generateMarketData('SPY.US', 564.34, 252, 0.01, 0.0002),
    'QQQ.US': generateMarketData('QQQ.US', 432.18, 252, 0.015, 0.0003),
    'IWM.US': generateMarketData('IWM.US', 228.76, 252, 0.012, 0.0001),
    'DIA.US': generateMarketData('DIA.US', 412.35, 252, 0.009, 0.0001)
  };
};

/**
 * Process API data to ensure all required technical indicators are present
 * @param {Object} historicalData - Historical data object from API
 * @returns {Object} Processed data with technical indicators
 */
export const processHistoricalData = (historicalData) => {
  if (!historicalData || Object.keys(historicalData).length === 0) {
    console.warn("No historical data found, using generated data");
    return generateMarketIndicesData();
  }
  
  const processedData = {};
  
  // Process each symbol's data
  Object.keys(historicalData).forEach(symbol => {
    // Make a deep copy to avoid side effects
    if (!Array.isArray(historicalData[symbol]) || historicalData[symbol].length === 0) {
      console.warn(`No valid data for ${symbol}, using generated data`);
      processedData[symbol] = generateMarketData(
        symbol, 
        symbol === 'SPY.US' ? 564.34 : 
        symbol === 'QQQ.US' ? 432.18 :
        symbol === 'IWM.US' ? 228.76 :
        symbol === 'DIA.US' ? 412.35 : 100
      );
      return;
    }
    
    // Start with a clean copy
    processedData[symbol] = JSON.parse(JSON.stringify(historicalData[symbol]));
    
    // Standardize price data - ensure both price and close exist
    processedData[symbol] = processedData[symbol].map(item => {
      // Determine the primary price value
      const priceValue = item.close !== undefined ? item.close : 
                        (item.price !== undefined ? item.price : null);
      
      // If we found a valid price, ensure both close and price are set
      if (priceValue !== null) {
        return {
          ...item,
          price: priceValue,
          close: priceValue
        };
      }
      return item;
    });
    
    // Check and add missing MA200
    const hasMA200 = processedData[symbol].some(item => 
      item.ma200 !== undefined && item.ma200 !== null);
      
    if (!hasMA200 && processedData[symbol].length >= 200) {
      console.log(`Adding MA200 for ${symbol}`);
      processedData[symbol] = calculateMA(
        processedData[symbol], 
        'close',
        200,
        'ma200'
      );
    }
    
    // Check and add missing MA50
    const hasMA50 = processedData[symbol].some(item => 
      item.ma50 !== undefined && item.ma50 !== null);
      
    if (!hasMA50 && processedData[symbol].length >= 50) {
      console.log(`Adding MA50 for ${symbol}`);
      processedData[symbol] = calculateMA(
        processedData[symbol], 
        'close',
        50,
        'ma50'
      );
    }
    
    // Check and add missing RSI
    const hasRSI = processedData[symbol].some(item => 
      item.rsi !== undefined && item.rsi !== null);
      
    if (!hasRSI && processedData[symbol].length >= 15) {
      console.log(`Adding RSI for ${symbol}`);
      processedData[symbol] = calculateRSI(
        processedData[symbol],
        'close'
      );
    }
    
    // Verify all data is present after processing
    const firstItem = processedData[symbol][0];
    const lastItem = processedData[symbol][processedData[symbol].length - 1];
    
    console.log(`Processed data for ${symbol}:`, {
      totalItems: processedData[symbol].length,
      hasMA200: processedData[symbol].some(item => item.ma200 !== null),
      firstMA200: firstItem?.ma200,
      lastMA200: lastItem?.ma200,
      hasRSI: processedData[symbol].some(item => item.rsi !== null),
      firstRSI: firstItem?.rsi,
      lastRSI: lastItem?.rsi
    });
  });
  
  return processedData;
};

/**
 * Function to ensure data in MarketMetricsCarousel can be safely displayed
 * @param {Array} data - Array of data points
 * @returns {Array} Sanitized data that won't crash the component
 */
export const sanitizeChartData = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => {
    if (!item) return null;
    
    // Create a new object with only the properties we need
    return {
      date: item.date || '',
      price: typeof item.price === 'number' ? item.price : 
            (typeof item.close === 'number' ? item.close : 0),
      close: typeof item.close === 'number' ? item.close : 
            (typeof item.price === 'number' ? item.price : 0),
      ma200: typeof item.ma200 === 'number' ? item.ma200 : null,
      ma50: typeof item.ma50 === 'number' ? item.ma50 : null,
      rsi: typeof item.rsi === 'number' ? item.rsi : null
    };
  }).filter(item => item !== null);
};

export default {
  generateMarketData,
  generateMarketIndicesData,
  processHistoricalData,
  sanitizeChartData
};