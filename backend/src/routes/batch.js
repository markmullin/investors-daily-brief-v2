import express from 'express';
import { marketService } from '../services/apiServices.js';

const router = express.Router();

// 🚀 COPIED FROM MARKET.JS: Same filtering functions for consistency
function getDateRangeForPeriod(period) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1d':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '5d':
      startDate.setDate(endDate.getDate() - 5);
      break;
    case '1m':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case '5y':
      startDate.setFullYear(endDate.getFullYear() - 5);
      break;
    default:
      startDate.setFullYear(endDate.getFullYear() - 1);
  }

  return { startDate, endDate };
}

// 🚀 NEW: MA200 calculation function (copied from market.js)
function calculateMA200(data) {
  if (!data || data.length < 200) return data;
  
  const result = [...data];
  
  // Initialize the first 199 points with null MA values
  for (let i = 0; i < 199; i++) {
    result[i] = { ...result[i], ma200: null };
  }
  
  // Calculate MA for the rest of the points
  for (let i = 199; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < 200; j++) {
      sum += data[i - j].price || data[i - j].close || 0;
    }
    result[i] = { ...result[i], ma200: sum / 200 };
  }
  
  return result;
}

// 🚀 NEW: RSI calculation function (copied from market.js)
function calculateRSI(data, period = 14) {
  if (!data || data.length < period + 1) return data;
  
  const result = [...data];
  
  // Set initial RSI values to null
  for (let i = 0; i < period; i++) {
    result[i] = { ...result[i], rsi: null };
  }
  
  // Calculate initial averages
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 1; i <= period; i++) {
    const price = data[i].price || data[i].close || 0;
    const prevPrice = data[i-1].price || data[i-1].close || 0;
    const change = price - prevPrice;
    
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate RSI using Wilder's smoothing method
  for (let i = period; i < data.length; i++) {
    const price = data[i].price || data[i].close || 0;
    const prevPrice = data[i-1].price || data[i-1].close || 0;
    const change = price - prevPrice;
    
    avgGain = ((avgGain * (period - 1)) + (change > 0 ? change : 0)) / period;
    avgLoss = ((avgLoss * (period - 1)) + (change < 0 ? Math.abs(change) : 0)) / period;
    
    if (avgLoss === 0) {
      result[i] = { ...result[i], rsi: 100 };
    } else {
      const rs = avgGain / avgLoss;
      result[i] = { ...result[i], rsi: 100 - (100 / (1 + rs)) };
    }
  }
  
  return result;
}

// 🚀 CRITICAL FIX: Same filtering logic as market.js
function filterDataByPeriod(data, period) {
  if (!data || data.length === 0) {
    console.log(`🔍 BATCH filterDataByPeriod: No data to filter for ${period}`);
    return data;
  }

  const { startDate, endDate } = getDateRangeForPeriod(period);
  
  console.log(`🚀 BATCH CRITICAL 1Y FIX: Filtering data for period ${period}:`, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalDataPoints: data.length
  });

  // 🚀 FIXED: For intraday periods, don't filter by date
  if (period === '1d' || period === '5d') {
    console.log(`📊 BATCH Intraday period ${period}: Returning all ${data.length} data points`);
    return data;
  }

  // 🚀 CRITICAL FIX: Ensure data is sorted by date before filtering
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log(`📊 BATCH Sorted data: ${sortedData.length} points from ${sortedData[0]?.date} to ${sortedData[sortedData.length - 1]?.date}`);

  // 🚀 NUCLEAR OPTION: For 1Y, always use manual filtering first
  if (period === '1y') {
    console.log(`🚨 BATCH 1Y PERIOD DETECTED - USING AGGRESSIVE MANUAL FILTERING`);
    
    // Calculate how many trading days we want (~252 for 1 year)
    const targetTradingDays = 252;
    const manualFiltered = sortedData.slice(-targetTradingDays);
    
    const daysDiff = manualFiltered.length > 1 ? 
      (new Date(manualFiltered[manualFiltered.length - 1].date) - new Date(manualFiltered[0].date)) / (1000 * 60 * 60 * 24) : 0;
    
    console.log(`🔧 BATCH MANUAL 1Y FILTER APPLIED:`, {
      originalPoints: data.length,
      filteredPoints: manualFiltered.length,
      targetTradingDays: targetTradingDays,
      actualDays: Math.round(daysDiff),
      firstDate: manualFiltered[0]?.date,
      lastDate: manualFiltered[manualFiltered.length - 1]?.date,
      efficiency: `${((manualFiltered.length / data.length) * 100).toFixed(1)}%`
    });
    
    return manualFiltered;
  }

  // For other periods, use date-based filtering
  const filteredData = sortedData.filter(item => {
    if (!item.date) {
      console.warn(`⚠️ BATCH Item missing date:`, item);
      return false;
    }
    
    const itemDate = new Date(item.date);
    const itemTimestamp = itemDate.getTime();
    
    if (isNaN(itemTimestamp)) {
      console.warn(`⚠️ BATCH Invalid date format: ${item.date}`);
      return false;
    }
    
    return itemTimestamp >= startDate.getTime() && itemTimestamp <= endDate.getTime();
  });

  console.log(`✂️ BATCH Filtered results for ${period}:`, {
    originalPoints: data.length,
    filteredPoints: filteredData.length,
    filterEfficiency: `${((filteredData.length / data.length) * 100).toFixed(1)}%`,
    dateRange: filteredData.length > 0 ? {
      first: filteredData[0].date,
      last: filteredData[filteredData.length - 1].date
    } : 'No data'
  });
  
  return filteredData;
}

// Batch history endpoint - handles multiple symbols at once with PROPER FILTERING + 1Y INDICATORS
router.post('/history', async (req, res) => {
  try {
    const { symbols, period = '1y' } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }
    
    console.log(`🔄 BATCH history request for ${symbols.length} symbols, period: ${period}`);
    
    const results = {};
    
    // Process symbols in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          console.log(`📊 BATCH Processing ${symbol} for ${period}`);
          
          // 🚀 CRITICAL FIX: Get full data then filter by period
          const fullData = await marketService.getHistoricalData(symbol);
          console.log(`📊 BATCH Retrieved ${fullData.length} full historical points for ${symbol}`);
          
          // 🚀 APPLY FILTERING: Filter data by requested period
          const filteredData = filterDataByPeriod(fullData, period);
          console.log(`📅 BATCH FILTERING COMPLETE for ${symbol} ${period}: ${filteredData.length} points`);
          
          // Ensure consistent format and add isDisplayed flag
          let processedData = filteredData.map(item => ({
            ...item,
            price: item.price || item.close || 0,
            close: item.close || item.price || 0,
            volume: item.volume || 0,
            isDisplayed: true,
            ma200: null, // Will be calculated below for 1Y
            rsi: null    // Will be calculated below for 1Y
          }));
          
          // 🚀 NEW: Calculate MA200 and RSI specifically for 1Y period only
          if (period === '1y' && processedData.length >= 200) {
            console.log(`📈 BATCH Calculating MA200 for ${symbol} 1Y (${processedData.length} points)`);
            
            try {
              // Calculate MA200 using full dataset, then map to filtered data
              const fullDataWithMA = calculateMA200(fullData);
              
              // Map MA200 values to our filtered dataset
              processedData = processedData.map(item => {
                const fullDataItem = fullDataWithMA.find(fd => fd.date === item.date);
                return {
                  ...item,
                  ma200: fullDataItem?.ma200 || null
                };
              });
              
              console.log(`📈 BATCH MA200 calculated for ${symbol} 1Y`);
            } catch (maError) {
              console.error(`❌ BATCH MA200 calculation error for ${symbol}:`, maError.message);
            }
            
            // Calculate RSI on the filtered data
            try {
              processedData = calculateRSI(processedData, 14);
              console.log(`📈 BATCH RSI calculated for ${symbol} 1Y`);
            } catch (rsiError) {
              console.error(`❌ BATCH RSI calculation error for ${symbol}:`, rsiError.message);
            }
            
            // Log indicator status
            const ma200Count = processedData.filter(d => d.ma200 !== null).length;
            const rsiCount = processedData.filter(d => d.rsi !== null).length;
            console.log(`📈 BATCH Calculated indicators for ${symbol} 1Y:`, {
              MA200: ma200Count,
              RSI: rsiCount,
              totalPoints: processedData.length
            });
          } else if (period === '1y') {
            console.log(`⚠️ BATCH ${symbol} 1Y: Not enough data for MA200 (${processedData.length} < 200 points)`);
          }
          
          console.log(`✅ BATCH Processed ${symbol} ${period}: ${processedData.length} points`);
          return { symbol, data: processedData, error: null };
          
        } catch (error) {
          console.error(`❌ BATCH Error fetching history for ${symbol}:`, error.message);
          return { symbol, data: [], error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Add batch results to main results
      batchResults.forEach(({ symbol, data, error }) => {
        results[symbol] = error ? { error, data: [] } : { data, error: null };
      });
      
      // Wait between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ BATCH history completed: ${Object.keys(results).length} symbols processed for ${period}`);
    
    // 🚀 ENHANCED: Log results summary for debugging
    Object.entries(results).forEach(([symbol, result]) => {
      if (result.data && result.data.length > 0) {
        const daysDiff = result.data.length > 1 ? 
          (new Date(result.data[result.data.length - 1].date) - new Date(result.data[0].date)) / (1000 * 60 * 60 * 24) : 0;
        
        // 🚀 NEW: Log indicator status for 1Y
        if (period === '1y') {
          const hasMA200 = result.data.some(d => d.ma200 !== null);
          const hasRSI = result.data.some(d => d.rsi !== null);
          console.log(`📊 BATCH FINAL ${symbol} ${period}: ${result.data.length} points, ${Math.round(daysDiff)} days, MA200: ${hasMA200}, RSI: ${hasRSI}`);
        } else {
          console.log(`📊 BATCH FINAL ${symbol} ${period}: ${result.data.length} points, ${Math.round(daysDiff)} days`);
        }
      }
    });
    
    res.json(results);
    
  } catch (error) {
    console.error('❌ BATCH history error:', error);
    res.status(500).json({ error: 'Failed to fetch batch historical data' });
  }
});

// Batch quotes endpoint - handles multiple symbols at once
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }
    
    console.log(`🔄 Batch quotes request for ${symbols.length} symbols`);
    
    const results = {};
    
    // Use the existing batch method from marketService
    const quotes = await marketService.getDataForSymbols(symbols);
    
    // Format results to match expected structure
    symbols.forEach(symbol => {
      const quote = quotes[symbol];
      if (quote) {
        results[symbol] = { quote, error: null };
      } else {
        results[symbol] = { quote: null, error: 'Quote not found' };
      }
    });
    
    console.log(`✅ Batch quotes completed: ${Object.keys(results).length} symbols processed`);
    res.json(results);
    
  } catch (error) {
    console.error('Batch quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch batch quotes' });
  }
});

export default router;