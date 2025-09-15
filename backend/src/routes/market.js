/**
 * Market data routes with intraday and daily data support
 */

import express from 'express';
import fmpService from '../services/fmpService.js';
import intradayService from '../services/intradayService.js';
import technicalAnalysisService from '../services/TechnicalAnalysisService.js';
import pythonBridge from '../services/PythonBridge.js';
import errorTracker from '../utils/errorTracker.js';

const router = express.Router();

function getExtendedPeriodMapping(requestedPeriod) {
  const periodConfigs = {
    '1d': {
      displayPeriod: '1d',
      fetchPeriod: '1week', // Fetch more to ensure we have data
      dataType: 'intraday',
      interval: '5min',
      indicators: ['rsi'],  // Simplified for intraday
      maType: 'intraday',
      daysToDisplay: 1,
      marketHours: true,    // Only show market hours 9:30am-4pm
      excludeWeekends: true
    },
    '5d': {
      displayPeriod: '5d', 
      fetchPeriod: '1month', // Fetch more to ensure we have data
      dataType: 'intraday',
      interval: '1hour',
      indicators: ['rsi'],   // Simplified for intraday
      maType: 'intraday',
      daysToDisplay: 5,
      marketHours: false,    // Show all hours for 5D
      excludeWeekends: true
    },
    '1m': {
      displayPeriod: '1month',
      fetchPeriod: '10months', 
      dataType: 'daily',
      indicators: ['rsi', 'ma20', 'ma50', 'ma200'],
      maType: '20-day + 50-day + 200-day',
      excludeWeekends: true
    },
    '3m': {
      displayPeriod: '3months',
      fetchPeriod: '3years',
      dataType: 'daily',
      indicators: ['rsi', 'ma50', 'ma200'],
      maType: '50-day + 200-day',
      excludeWeekends: true
    },
    '6m': {
      displayPeriod: '6months',
      fetchPeriod: '5years',
      dataType: 'daily', 
      indicators: ['rsi', 'ma50', 'ma200'],
      maType: '50-day + 200-day',
      excludeWeekends: true
    },
    '1y': {
      displayPeriod: '1year',
      fetchPeriod: '5years',
      dataType: 'daily',
      indicators: ['rsi', 'ma50', 'ma200'],
      maType: '50-day + 200-day',
      excludeWeekends: true
    },
    '5y': {
      displayPeriod: '5years',
      fetchPeriod: '5years',
      dataType: 'daily', 
      indicators: ['rsi', 'ma50', 'ma200'],
      maType: '50-day + 200-day',
      excludeWeekends: true
    }
  };
  
  const config = periodConfigs[requestedPeriod] || periodConfigs['1y'];
  
  
  return config;
}

function mapPeriodToFMP(period) {
  const periodMap = {
    '1w': '1week',
    '1week': '1week',
    '1m': '1month', 
    '1month': '1month',
    '3m': '3months',
    '3months': '3months',
    '6m': '6months',
    '6months': '6months',
    '10m': '10months',
    '10months': '10months',
    '18m': '18months',
    '18months': '18months',
    '1y': '1year',
    '1year': '1year',
    '2y': '2years',
    '2years': '2years',
    '3y': '3years', 
    '3years': '3years',
    '4y': '4years',
    '4years': '4years',
    '5y': '5years',
    '5years': '5years',
    'max': '5years'
  };
  
  return periodMap[period] || period;
}

function isTradingDay(dateTime) {
  const date = new Date(dateTime);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Exclude weekends (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // TODO: Add major market holidays if needed
  // For now, just exclude weekends
  
  return true;
}

// Calculate technical indicators
function calculateUltraEnhancedTechnicalIndicators(data, config) {
  if (!data || data.length === 0) return [];
  
  
  // Sort data by date ascending
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate moving averages for each point
  const enhancedData = sortedData.map((point, index) => {
    const result = { ...point };
    
    // Calculate MA20 if configured
    if (config.indicators?.includes('ma20') && index >= 19) {
      const sum20 = sortedData.slice(index - 19, index + 1)
        .reduce((acc, d) => acc + (d.close || d.price || 0), 0);
      result.ma20 = sum20 / 20;
    } else {
      result.ma20 = null;
    }
    
    // Calculate MA50 if configured
    if (config.indicators?.includes('ma50') && index >= 49) {
      const sum50 = sortedData.slice(index - 49, index + 1)
        .reduce((acc, d) => acc + (d.close || d.price || 0), 0);
      result.ma50 = sum50 / 50;
    } else {
      result.ma50 = null;
    }
    
    // Calculate MA200 if configured
    if (config.indicators?.includes('ma200') && index >= 199) {
      const sum200 = sortedData.slice(index - 199, index + 1)
        .reduce((acc, d) => acc + (d.close || d.price || 0), 0);
      result.ma200 = sum200 / 200;
    } else {
      result.ma200 = null;
    }
    
    // Calculate RSI if configured
    if (config.indicators?.includes('rsi') && index >= 14) {
      result.rsi = calculateRSI(sortedData.slice(0, index + 1));
    } else {
      result.rsi = null;
    }
    
    return result;
  });
  
  // Log statistics about calculated indicators
  const ma50Count = enhancedData.filter(d => d.ma50 !== null).length;
  const ma200Count = enhancedData.filter(d => d.ma200 !== null).length;
  const rsiCount = enhancedData.filter(d => d.rsi !== null).length;
  
  
  return enhancedData;
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param {Array} data - Price data array
 * @returns {number} - RSI value
 */
function calculateRSI(data) {
  if (data.length < 15) return null;
  
  const period = 14;
  const changes = [];
  
  for (let i = 1; i < data.length; i++) {
    const currentPrice = data[i].close || data[i].price || 0;
    const prevPrice = data[i - 1].close || data[i - 1].price || 0;
    changes.push(currentPrice - prevPrice);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  
  // Use the last 14 changes for RSI calculation
  const recentGains = gains.slice(-period);
  const recentLosses = losses.slice(-period);
  
  const avgGain = recentGains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = recentLosses.reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 10) / 10; // Round to 1 decimal place
}

/**
 * Helper function to filter market hours (9:30 AM - 4:00 PM ET)
 */
function isMarketHours(dateTime) {
  const date = new Date(dateTime);
  const dayOfWeek = date.getDay();
  
  // First check if it's a trading day
  if (!isTradingDay(dateTime)) {
    return false;
  }
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Market hours: 9:30 AM (570 minutes) to 4:00 PM (960 minutes)
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;     // 4:00 PM
  
  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

/**
 * *** ENHANCED: Helper function to filter to last N trading days (excludes weekends) ***
 */
function filterToLastTradingDays(data, days) {
  if (!data || data.length === 0) return [];
  
  // Sort by date to ensure proper ordering
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Filter out weekend data first
  const tradingDayData = sortedData.filter(item => isTradingDay(item.date));
  
  console.log(`📅 [TRADING_DAYS] Filtered out weekends: ${sortedData.length} → ${tradingDayData.length} points`);
  
  // Get unique trading days (dates only, ignoring time)
  const tradingDays = [...new Set(tradingDayData.map(item => {
    const date = new Date(item.date);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }))].sort();
  
  // Take the last N trading days
  const lastTradingDays = tradingDays.slice(-days);
  
  // Filter data to only include those days
  const filteredData = tradingDayData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return lastTradingDays.includes(itemDate);
  });
  
  console.log(`📅 [TRADING_DAYS] Final filter to last ${days} trading days:`, {
    totalData: data.length,
    afterWeekendFilter: tradingDayData.length,
    uniqueTradingDays: tradingDays.length,
    requestedDays: days,
    lastTradingDays: lastTradingDays,
    filteredData: filteredData.length
  });
  
  // Verify no weekend data made it through
  const weekendCheck = filteredData.filter(item => !isTradingDay(item.date));
  if (weekendCheck.length > 0) {
    console.warn(`🚨 [WEEKEND_CHECK] Found ${weekendCheck.length} weekend data points that shouldn't be there:`, 
      weekendCheck.map(item => ({ date: item.date, day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' }) }))
    );
  } else {
  }
  
  return filteredData;
}

/**
 * *** FIXED: ULTRA-AGGRESSIVE HISTORICAL DATA WITH PROPER INTRADAY SUPPORT + WEEKEND FILTERING ***
 */
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = '1y', timestamp, forceRefresh } = req.query;
    
    const cacheBustId = timestamp || Date.now();
    console.log(`🚀 [INTRADAY_FIXED] ${symbol} ${period} - ID: ${cacheBustId}`);
    
    const config = getExtendedPeriodMapping(period);
    
    let historicalData = [];
    let extendedData = [];
    
    if (config.dataType === 'intraday') {
      console.log(`🕐 [INTRADAY] Using ${config.interval} for ${symbol} period ${period}`);
      
      try {
        const intradayData = await intradayService.getIntradayData(symbol, config.interval);
        
        if (intradayData && Array.isArray(intradayData)) {
          console.log(`📊 [INTRADAY] Raw intraday data: ${intradayData.length} points`);
          
          // Process and sort intraday data
          let processedData = intradayData
            .filter(item => item && item.date)
            .map(item => ({
              date: item.date,
              price: item.close || item.price,
              close: item.close || item.price,
              open: item.open,
              high: item.high,
              low: item.low,
              volume: item.volume || 0
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          console.log(`📊 [INTRADAY] Processed: ${processedData.length} points`);
          console.log(`📊 [INTRADAY] Date range: ${processedData[0]?.date} to ${processedData[processedData.length - 1]?.date}`);
          
          // Apply weekend filtering if configured
          if (config.excludeWeekends) {
            const beforeWeekendFilter = processedData.length;
            processedData = processedData.filter(item => isTradingDay(item.date));
            console.log(`🗓️ [WEEKEND_FILTER] Removed weekend data: ${beforeWeekendFilter} → ${processedData.length} points`);
          }
          
          if (period === '1d') {
            // For 1D: Filter to most recent trading day and market hours only
            const lastTradingDay = filterToLastTradingDays(processedData, 1);
            
            if (config.marketHours) {
              // Further filter to market hours (9:30 AM - 4:00 PM)
              historicalData = lastTradingDay.filter(item => isMarketHours(item.date));
              console.log(`🕐 [1D] Market hours only: ${historicalData.length} points (9:30am-4pm, weekdays only)`);
            } else {
              historicalData = lastTradingDay;
              console.log(`🕐 [1D] All hours: ${historicalData.length} points (weekdays only)`);
            }
            
            extendedData = historicalData; // For 1D, extended = display
            
          } else if (period === '5d') {
            // For 5D: Filter to last 5 trading days
            historicalData = filterToLastTradingDays(processedData, 5);
            extendedData = historicalData; // For 5D, extended = display
            
            console.log(`🕐 [5D] Last 5 trading days: ${historicalData.length} points`);
          }
          
          console.log(`🕐 [INTRADAY] Final data - Extended: ${extendedData.length}, Display: ${historicalData.length}`);
        } else {
          console.warn(`⚠️ [INTRADAY] No intraday data returned for ${symbol}`);
        }
      } catch (error) {
        console.error(`❌ [INTRADAY] Error fetching intraday data for ${symbol}:`, error.message);
        
        // Fallback to daily data if intraday fails
        console.log(`🔄 [INTRADAY] Falling back to daily data for ${symbol}`);
        const dailyFallback = await fmpService.getHistoricalPrices(symbol, config.fetchPeriod);
        
        if (dailyFallback && dailyFallback.historical) {
          let fallbackData = dailyFallback.historical
            .filter(item => item && item.date)
            .map(item => ({
              date: item.date,
              price: item.close,
              close: item.close,
              open: item.open,
              high: item.high,
              low: item.low,
              volume: item.volume
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // Apply weekend filtering to fallback data too
          if (config.excludeWeekends) {
            fallbackData = fallbackData.filter(item => isTradingDay(item.date));
            console.log(`🗓️ [FALLBACK_WEEKEND_FILTER] Applied to fallback data`);
          }
          
          extendedData = fallbackData;
          
          // For fallback, take recent data
          if (period === '1d') {
            historicalData = extendedData.slice(-1); // Last day only
          } else if (period === '5d') {
            historicalData = extendedData.slice(-5); // Last 5 days
          }
          
          console.log(`🔄 [FALLBACK] Using daily fallback (weekends filtered): ${historicalData.length} points`);
        }
      }
      
    } else {
      // Daily data processing (1M, 3M, 6M, 1Y, 5Y)
      console.log(`📅 [DAILY] Fetching daily data for ${symbol}...`);
      const fetchPeriod = mapPeriodToFMP(config.fetchPeriod);
      const dailyData = await fmpService.getHistoricalPrices(symbol, fetchPeriod);
      
      if (dailyData && dailyData.historical && Array.isArray(dailyData.historical)) {
        let processedDailyData = dailyData.historical
          .filter(item => item && item.date)
          .map(item => ({
            date: item.date,
            price: item.close,
            close: item.close,
            open: item.open,
            high: item.high,
            low: item.low,
            volume: item.volume
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Apply weekend filtering to daily data too
        if (config.excludeWeekends) {
          const beforeFilter = processedDailyData.length;
          processedDailyData = processedDailyData.filter(item => isTradingDay(item.date));
          console.log(`🗓️ [DAILY_WEEKEND_FILTER] Removed weekends: ${beforeFilter} → ${processedDailyData.length} points`);
        }
        
        extendedData = processedDailyData;
        
        console.log(`📅 [DAILY] Processed ${extendedData.length} daily points for ${symbol} (weekends filtered)`);
        
        // Filter by display period
        const displayPeriodDays = {
          '1month': 30,
          '3months': 90,
          '6months': 180,
          '1year': 365,
          '5years': 1825
        };
        
        const requestedDays = displayPeriodDays[config.displayPeriod] || 365;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - requestedDays);
        
        historicalData = extendedData.filter(item => 
          new Date(item.date) >= cutoffDate
        );
        
        console.log(`📅 [DAILY] Extended data: ${extendedData.length} points, Display data: ${historicalData.length} points`);
      }
    }
    
    // Calculate indicators on extended data (only for daily data that has enough points)
    if (extendedData.length > 0 && config.dataType === 'daily') {
      
      const extendedWithIndicators = calculateUltraEnhancedTechnicalIndicators(extendedData, config);
      
      if (extendedWithIndicators && extendedWithIndicators.length > 0) {
        const dateToIndicators = {};
        extendedWithIndicators.forEach(item => {
          if (item && item.date) {
            dateToIndicators[item.date] = {
              ma20: item.ma20,
              ma50: item.ma50, 
              ma200: item.ma200,
              rsi: item.rsi
            };
          }
        });
        
        historicalData = historicalData.map(item => ({
          ...item,
          ...dateToIndicators[item.date]
        }));
        
      }
    } else if (config.dataType === 'intraday') {
      // For intraday data, calculate simple RSI only
      if (historicalData.length >= 15) {
        historicalData = calculateSimpleRSI(historicalData);
      }
    }
    
    // Final verification - no weekend data should be present
    const finalWeekendCheck = historicalData.filter(item => !isTradingDay(item.date));
    if (finalWeekendCheck.length > 0) {
      console.error(`🚨 [FINAL_WEEKEND_CHECK] ERROR: ${finalWeekendCheck.length} weekend data points found in final result!`);
      console.error('Weekend data:', finalWeekendCheck.map(item => ({
        date: item.date,
        day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })
      })));
      
      // Emergency filter to remove any remaining weekend data
      historicalData = historicalData.filter(item => isTradingDay(item.date));
      console.log(`🚨 [EMERGENCY_FILTER] Removed weekend data, final count: ${historicalData.length}`);
    } else {
    }
    
    // Cache-busting headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache'); 
    res.setHeader('Expires', '0');
    res.setHeader('X-Cache-Bust', cacheBustId);
    res.setHeader('X-Period-Config', JSON.stringify(config));
    res.setHeader('X-Intraday-Fixed', 'true');
    res.setHeader('X-Weekends-Excluded', 'true');
    
    console.log(`🎯 [INTRADAY_FIXED] Returning ${historicalData.length} points for ${symbol} ${period} (weekends excluded)`);
    
    res.json(historicalData);
    
  } catch (error) {
    console.error(`❌ [INTRADAY_FIXED] Error for ${req.params.symbol} ${req.query.period}:`, error.message);
    res.status(500).json({
      error: 'INTRADAY_FIXED_ERROR',
      message: 'Failed to fetch historical data with intraday fix and weekend filtering',
      details: error.message
    });
  }
});

/**
 * Simple RSI calculation for intraday data
 */
function calculateSimpleRSI(data, period = 14) {
  if (!data || data.length < period + 1) {
    return data.map(item => ({ ...item, rsi: null }));
  }
  
  const result = [...data];
  
  // Initialize first period values to null
  for (let i = 0; i < period; i++) {
    result[i] = { ...result[i], rsi: null };
  }
  
  let avgGain = 0;
  let avgLoss = 0;
  
  // Calculate initial averages
  for (let i = 1; i <= period; i++) {
    const currentPrice = data[i].price || data[i].close;
    const previousPrice = data[i-1].price || data[i-1].close;
    
    if (currentPrice && previousPrice) {
      const change = currentPrice - previousPrice;
      if (change > 0) {
        avgGain += change;
      } else {
        avgLoss += Math.abs(change);
      }
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate RSI for remaining points
  for (let i = period; i < data.length; i++) {
    const currentPrice = data[i].price || data[i].close;
    const previousPrice = data[i-1].price || data[i-1].close;
    
    if (currentPrice && previousPrice) {
      const change = currentPrice - previousPrice;
      
      avgGain = ((avgGain * (period - 1)) + (change > 0 ? change : 0)) / period;
      avgLoss = ((avgLoss * (period - 1)) + (change < 0 ? Math.abs(change) : 0)) / period;
      
      if (avgLoss === 0) {
        result[i] = { ...result[i], rsi: 100 };
      } else {
        const rs = avgGain / avgLoss;
        result[i] = { ...result[i], rsi: 100 - (100 / (1 + rs)) };
      }
    } else {
      result[i] = { ...result[i], rsi: null };
    }
  }
  
  return result;
}


// Include all the other routes from the previous file...
// (sectors, technical-analysis, gainers, losers, etc.)

/**
 * 🎯 FIXED: Enhanced sectors endpoint with period-specific historical data
 */
router.get('/sectors/:period', async (req, res, next) => {
  try {
    const { period } = req.params;
    console.log(`🏭 [SECTORS_FIXED] Request for period: ${period}`);
    
    // Sector ETF mapping with detailed info
    const sectorETFs = {
      'XLF': { name: 'Financials', color: '#1e40af', type: 'cyclical' },
      'XLK': { name: 'Technology', color: '#3b82f6', type: 'cyclical' },
      'XLE': { name: 'Energy', color: '#059669', type: 'cyclical' },
      'XLV': { name: 'Healthcare', color: '#dc2626', type: 'defensive' },
      'XLI': { name: 'Industrials', color: '#92400e', type: 'cyclical' },
      'XLP': { name: 'Consumer Staples', color: '#7c3aed', type: 'defensive' },
      'XLY': { name: 'Consumer Discretionary', color: '#db2777', type: 'cyclical' },
      'XLB': { name: 'Materials', color: '#a16207', type: 'cyclical' },
      'XLRE': { name: 'Real Estate', color: '#65a30d', type: 'rate_sensitive' },
      'XLU': { name: 'Utilities', color: '#475569', type: 'defensive' },
      'XLC': { name: 'Communication', color: '#0891b2', type: 'cyclical' }
    };
    
    const sectorSymbols = Object.keys(sectorETFs);
    
    // Map frontend periods to FMP API periods - STRICT CALENDAR DAYS
    const periodMapping = {
      '1d': { fmpPeriod: '1week', days: 1 },
      '5d': { fmpPeriod: '1month', days: 7 }, // 1 week = 7 calendar days
      '1w': { fmpPeriod: '1month', days: 7 }, // 1 week = 7 calendar days  
      '1m': { fmpPeriod: '3months', days: 30 }, // 1 month = 30 calendar days
      '3m': { fmpPeriod: '1year', days: 90 }, // 3 months = 90 calendar days
      '6m': { fmpPeriod: '2years', days: 180 }, // 6 months = 180 calendar days
      '1y': { fmpPeriod: '5years', days: 365 }, // 1 year = 365 calendar days
      '3y': { fmpPeriod: '5years', days: 1095 }, // 3 years = 1095 calendar days (accounting for leap year)
      '5y': { fmpPeriod: '5years', days: 1826 } // 5 years = 1826 calendar days (accounting for leap year)
    };
    
    const periodConfig = periodMapping[period] || periodMapping['1m'];
    console.log(`📅 [SECTORS_FIXED] Using FMP period: ${periodConfig.fmpPeriod}, calculating ${periodConfig.days} day performance`);
    
    // Fetch historical data for all sector ETFs
    const sectorHistoricalData = {};
    const sectorCurrentData = {};
    
    // Get current quotes first (for real-time prices)
    console.log(`📊 [SECTORS_FIXED] Fetching current quotes for ${sectorSymbols.length} sectors...`);
    const currentQuotes = await fmpService.getQuoteBatch(sectorSymbols);
    
    for (const quote of currentQuotes) {
      sectorCurrentData[quote.symbol] = {
        currentPrice: quote.price,
        volume: quote.volume,
        marketCap: quote.marketCap
      };
    }
    
    // Fetch historical data for each sector
    console.log(`📈 [SECTORS_FIXED] Fetching historical data for period analysis...`);
    for (const symbol of sectorSymbols) {
      try {
        const historicalData = await fmpService.getHistoricalPrices(symbol, periodConfig.fmpPeriod);
        
        if (historicalData && historicalData.historical && historicalData.historical.length > 0) {
          // Sort by date (oldest first) and filter weekends
          const sortedData = historicalData.historical
            .filter(item => item && item.date && item.close && isTradingDay(item.date))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          sectorHistoricalData[symbol] = sortedData;
        } else {
          console.warn(`⚠️ [SECTORS_FIXED] No historical data for ${symbol}`);
        }
      } catch (error) {
        console.error(`❌ [SECTORS_FIXED] Error fetching ${symbol}:`, error.message);
      }
    }
    
    // Calculate period-specific performance for each sector
    const sectorPerformanceData = [];
    
    for (const symbol of sectorSymbols) {
      const etfInfo = sectorETFs[symbol];
      const currentData = sectorCurrentData[symbol];
      const historicalData = sectorHistoricalData[symbol];
      
      // CRITICAL FIX: For 1-day periods, use current quote's changesPercentage (today's intraday change)
      if (period === '1d') {
        const currentQuote = currentQuotes.find(q => q.symbol === symbol);
        const percentChange = currentQuote?.changesPercentage || 0;
        const currentPrice = currentQuote?.price || 0;
        
        console.log(`📊 [SECTORS_FIXED] ${symbol} (${etfInfo.name}): 1-day intraday = ${percentChange.toFixed(2)}%`);
        
        sectorPerformanceData.push({
          symbol,
          name: etfInfo.name,
          color: etfInfo.color,
          type: etfInfo.type,
          close: currentPrice,
          changePercent: percentChange,
          change_p: percentChange,
          price: currentPrice,
          period_performance: percentChange,
          data_quality: 'intraday_quote'
        });
        continue;
      }
      
      if (!historicalData || historicalData.length === 0) {
        // Fallback to current data only
        sectorPerformanceData.push({
          symbol,
          name: etfInfo.name,
          color: etfInfo.color,
          type: etfInfo.type,
          close: currentData?.currentPrice || 0,
          changePercent: 0,
          change_p: 0,
          price: currentData?.currentPrice || 0,
          period_performance: 0,
          data_quality: 'current_only'
        });
        continue;
      }
      
      // Calculate period performance for multi-day periods
      const currentPrice = currentData?.currentPrice || historicalData[historicalData.length - 1].close;
      
      let startPrice;
      if (period === '5d') {
        // For 5 day periods, use data from 5 trading days ago
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - periodConfig.days);
        
        // Find closest historical point to target date (trading days only)
        const historicalPoint = historicalData.find(item => new Date(item.date) >= targetDate) || historicalData[0];
        startPrice = historicalPoint.close;
      } else {
        // For longer periods, find the price closest to exactly X days ago
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - periodConfig.days);
        
        // Find the historical data point closest to the target date
        // Prefer EARLIER dates when there are ties (avoid post-event distortions)
        let closestPoint = historicalData[0];
        let minDiff = Math.abs(new Date(historicalData[0].date) - targetDate);
        
        for (const point of historicalData) {
          const pointDate = new Date(point.date);
          const diff = Math.abs(pointDate - targetDate);
          
          // If this point is closer, OR if it's equally close but earlier, use it
          if (diff < minDiff || (diff === minDiff && pointDate < new Date(closestPoint.date))) {
            minDiff = diff;
            closestPoint = point;
          }
        }
        
        startPrice = closestPoint.close;
        console.log(`🎯 [DATE_FIX] ${symbol}: Target date ${targetDate.toISOString().split('T')[0]}, Found ${closestPoint.date}, Price ${closestPoint.close}`);
      }
      
      // Calculate percentage change
      const percentChange = ((currentPrice - startPrice) / startPrice) * 100;
      
      console.log(`📊 [SECTORS_FIXED] ${symbol} (${etfInfo.name}): ${startPrice.toFixed(2)} → ${currentPrice.toFixed(2)} = ${percentChange.toFixed(2)}%`);
      
      sectorPerformanceData.push({
        symbol,
        name: etfInfo.name,
        color: etfInfo.color,
        type: etfInfo.type,
        close: currentPrice,
        changePercent: percentChange,
        change_p: percentChange,
        price: currentPrice,
        period_performance: percentChange,
        start_price: startPrice,
        end_price: currentPrice,
        data_quality: 'historical',
        volume: currentData?.volume || 0
      });
    }
    
    // Sort by performance (best to worst)
    sectorPerformanceData.sort((a, b) => b.changePercent - a.changePercent);
    
    
    // Return response
    const enhancedResponse = {
      sectors: sectorPerformanceData,
      period: period,
      timestamp: new Date().toISOString()
    };
    
    res.json(enhancedResponse);
    
  } catch (error) {
    console.error(`❌ [SECTORS_FIXED] Error for period ${req.params.period}:`, error.message);
    res.status(500).json({
      error: 'ENHANCED_SECTORS_ERROR',
      message: `Failed to fetch enhanced sector data for period ${req.params.period}`,
      details: error.message,
      period: req.params.period
    });
  }
});

// Market movers endpoints
router.get('/gainers', async (req, res, next) => {
  try {
    console.log('📈 [MARKET] Gainers endpoint called');
    const gainers = await fmpService.getGainers();
    res.json(gainers || []);
  } catch (error) {
    console.error('❌ [MARKET] Gainers error:', error.message);
    res.status(500).json({ error: 'Failed to fetch gainers', details: error.message });
  }
});

router.get('/losers', async (req, res, next) => {
  try {
    console.log('📉 [MARKET] Losers endpoint called');
    const losers = await fmpService.getLosers();
    res.json(losers || []);
  } catch (error) {
    console.error('❌ [MARKET] Losers error:', error.message);
    res.status(500).json({ error: 'Failed to fetch losers', details: error.message });
  }
});

router.get('/actives', async (req, res, next) => {
  try {
    console.log('📊 [MARKET] Actives endpoint called');
    const actives = await fmpService.getActives();
    res.json(actives || []);
  } catch (error) {
    console.error('❌ [MARKET] Actives error:', error.message);
    res.status(500).json({ error: 'Failed to fetch active stocks', details: error.message });
  }
});

router.get('/data', async (req, res, next) => {
  try {
    console.log('🎯 [MARKET] Market /data endpoint called');
    
    // Using REAL MARKET INDICES instead of ETFs
    const symbols = ['^GSPC', '^IXIC', '^DJI', '^RUT'];
    const marketData = await fmpService.getQuoteBatch(symbols);
    
    
    res.json(marketData);
    
  } catch (error) {
    console.error('❌ [MARKET] Market data error:', error.message);
    res.status(500).json({ 
      error: 'MARKET_DATA_ERROR',
      message: 'Failed to fetch market data',
      details: error.message 
    });
  }
});

// REMOVED DUPLICATE /sp500-top endpoint that was returning indices

router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    console.log(`💰 [MARKET] Quote endpoint called for ${symbol}`);
    
    const quote = await fmpService.getQuote(symbol);
    
    if (!quote || quote.length === 0) {
      return res.status(404).json({
        error: 'QUOTE_NOT_FOUND',
        message: `Quote for ${symbol} could not be found.`
      });
    }
    
    
    res.json(quote[0]);
    
  } catch (error) {
    console.error(`❌ [MARKET] Quote error for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'QUOTE_ERROR',
      message: `Failed to fetch quote: ${error.message}`
    });
  }
});

/**
 * *** NEW: MACROECONOMIC DATA ENDPOINT ***
 * Provides real-time macro data for charts
 */
router.get('/macro', async (req, res) => {
  try {
    console.log('🏛️ [MACRO] Macro data endpoint called');
    
    // Get key macro indicators from FMP
    const macroSymbols = ['^TNX', '^TYX', '^FVX', 'DXY', 'GLD', 'TLT', 'VIX', 'USO'];
    
    const quotes = await fmpService.getQuoteBatch(macroSymbols);
    
    const macroData = quotes.map(quote => ({
      symbol: quote.symbol,
      name: getMacroName(quote.symbol),
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      volume: quote.volume,
      category: getMacroCategory(quote.symbol)
    }));
    
    
    res.json({
      success: true,
      data: macroData,
      timestamp: new Date().toISOString(),
      source: 'FMP'
    });
    
  } catch (error) {
    console.error(`❌ [MACRO] Error:`, error.message);
    res.status(500).json({
      error: 'MACRO_ERROR',
      message: `Failed to fetch macro data: ${error.message}`
    });
  }
});

// Helper functions for macro data
function getMacroName(symbol) {
  const names = {
    '^TNX': '10-Year Treasury',
    '^TYX': '30-Year Treasury',
    '^FVX': '5-Year Treasury',
    'DXY': 'US Dollar Index',
    'GLD': 'Gold',
    'TLT': '20+ Year Treasury Bond',
    'VIX': 'Volatility Index',
    'USO': 'Oil Fund'
  };
  return names[symbol] || symbol;
}

function getMacroCategory(symbol) {
  const categories = {
    '^TNX': 'rates',
    '^TYX': 'rates', 
    '^FVX': 'rates',
    'DXY': 'currency',
    'GLD': 'commodities',
    'TLT': 'bonds',
    'VIX': 'volatility',
    'USO': 'commodities'
  };
  return categories[symbol] || 'other';
}

/**
 * GET TOP S&P 500 COMPANIES BY MARKET CAP
 * Returns the top 15 S&P 500 companies for the ticker display
 */
router.get('/sp500-top', async (req, res) => {
  try {
    console.log('📊 [SP500] Fetching top S&P 500 companies by market cap...');
    
    // Top S&P 500 companies by market cap (as of 2025)
    const sp500Symbols = [
      'AAPL',  // Apple
      'NVDA',  // NVIDIA
      'MSFT',  // Microsoft
      'GOOGL', // Alphabet
      'AMZN',  // Amazon
      'META',  // Meta
      'TSLA',  // Tesla
      'BRK.B', // Berkshire Hathaway
      'JPM',   // JPMorgan Chase
      'V',     // Visa
      'JNJ',   // Johnson & Johnson
      'WMT',   // Walmart
      'UNH',   // UnitedHealth
      'MA',    // Mastercard
      'XOM'    // Exxon Mobil
    ];
    
    // Fetch real-time quotes for these companies
    const quotes = await fmpService.getQuoteBatch(sp500Symbols);
    
    // Format the data for the ticker
    const formattedData = quotes
      .filter(quote => quote && quote.symbol && quote.price)
      .map(quote => ({
        symbol: quote.symbol,
        name: quote.name || quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changesPercentage,
        volume: quote.volume,
        marketCap: quote.marketCap
      }))
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)); // Sort by market cap descending
    
    console.log(`✅ [SP500] Successfully fetched ${formattedData.length} S&P 500 companies`);
    
    res.json(formattedData);
    
  } catch (error) {
    console.error('❌ [SP500] Error fetching S&P 500 data:', error.message);
    res.status(500).json({
      error: 'SP500_ERROR',
      message: `Failed to fetch S&P 500 data: ${error.message}`
    });
  }
});

// Test endpoint
router.get('/test-periods', (req, res) => {
  const testConfig1d = getExtendedPeriodMapping('1d');
  const testConfig5d = getExtendedPeriodMapping('5d');
  const testConfig1m = getExtendedPeriodMapping('1m');
  
  res.json({
    message: 'INTRADAY DATA CONFIGURATION FIXED + WEEKEND FILTERING - USING FMP ULTIMATE API',
    timestamp: new Date().toISOString(),
    configurations: {
      '1d': testConfig1d,
      '5d': testConfig5d,
      '1m': testConfig1m
    },
    intradayFix: 'APPLIED - 1D uses 5min intervals, 5D uses 1hour intervals, 1M+ uses daily',
    weekendFilter: 'APPLIED - All weekend data (Saturday/Sunday) excluded from results',
    marketHours: '1D filtered to 9:30am-4pm ET market hours on trading days only',
    status: 'INTRADAY_ULTIMATE_READY_WITH_WEEKEND_FILTERING'
  });
});

export default router;
