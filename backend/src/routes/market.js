// Fix for the MA200 and RSI indicators + Enhanced intraday and date filtering
import express from 'express';
import marketAnalysisService from '../services/marketAnalysisService.js';
import { marketService, eodService } from '../services/apiServices.js';
import braveService from '../services/braveService.js';
import errorTracker from '../utils/errorTracker.js';
import sectorAnalysisService from '../services/sectorAnalysisService.js';
import themeService from '../services/themeService.js';
import braveInsightsService from '../services/braveInsightsService.js';
import braveNewsService from '../services/braveNewsService.js';
import newsService from '../services/newsService.js';
import fmpMarketDataService from '../services/fmpMarketDataService.js';

const router = express.Router();

// 🚀 COMPLETELY FIXED: Calculate date range based on period with improved logic
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
      // 🚀 CRITICAL FIX: Use exact date arithmetic for 1 year
      startDate.setFullYear(endDate.getFullYear() - 1);
      // Don't modify month/day to get exactly 1 year
      break;
    case '5y':
      // 🚀 FIXED: More precise 5-year calculation
      startDate.setFullYear(endDate.getFullYear() - 5);
      break;
    default:
      startDate.setFullYear(endDate.getFullYear() - 1); // Default to 1 year
  }

  return { startDate, endDate };
}

// 🚀 COMPLETELY FIXED: Enhanced data filtering with aggressive debugging
function filterDataByPeriod(data, period) {
  if (!data || data.length === 0) {
    console.log(`🔍 filterDataByPeriod: No data to filter for ${period}`);
    return data;
  }

  const { startDate, endDate } = getDateRangeForPeriod(period);
  
  console.log(`🚀 CRITICAL 1Y FIX: Filtering data for period ${period}:`, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalDataPoints: data.length,
    startDateTimestamp: startDate.getTime(),
    endDateTimestamp: endDate.getTime()
  });

  // 🚀 FIXED: For intraday periods, don't filter by date (FMP already returns filtered data)
  if (period === '1d' || period === '5d') {
    console.log(`📊 Intraday period ${period}: Returning all ${data.length} data points (pre-filtered by FMP)`);
    return data;
  }

  // 🚀 CRITICAL FIX: Ensure data is sorted by date before filtering
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log(`📊 Sorted data: ${sortedData.length} points from ${sortedData[0]?.date} to ${sortedData[sortedData.length - 1]?.date}`);

  // 🚀 NUCLEAR OPTION: For 1Y, always use manual filtering first
  if (period === '1y') {
    console.log(`🚨 1Y PERIOD DETECTED - USING AGGRESSIVE MANUAL FILTERING`);
    
    // Calculate how many trading days we want (~252 for 1 year)
    const targetTradingDays = 252;
    const manualFiltered = sortedData.slice(-targetTradingDays);
    
    const daysDiff = manualFiltered.length > 1 ? 
      (new Date(manualFiltered[manualFiltered.length - 1].date) - new Date(manualFiltered[0].date)) / (1000 * 60 * 60 * 24) : 0;
    
    console.log(`🔧 MANUAL 1Y FILTER APPLIED:`, {
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
      console.warn(`⚠️ Item missing date:`, item);
      return false;
    }
    
    const itemDate = new Date(item.date);
    const itemTimestamp = itemDate.getTime();
    
    // Handle invalid dates
    if (isNaN(itemTimestamp)) {
      console.warn(`⚠️ Invalid date format: ${item.date}`);
      return false;
    }
    
    const isInRange = itemTimestamp >= startDate.getTime() && itemTimestamp <= endDate.getTime();
    
    return isInRange;
  });

  // 🚀 IMPROVED: Enhanced filtering diagnostics
  console.log(`✂️ Filtered results for ${period}:`, {
    originalPoints: data.length,
    filteredPoints: filteredData.length,
    filterEfficiency: `${((filteredData.length / data.length) * 100).toFixed(1)}%`,
    dateRange: filteredData.length > 0 ? {
      first: filteredData[0].date,
      last: filteredData[filteredData.length - 1].date
    } : 'No data'
  });
  
  // 🚨 CRITICAL: Check for potential date filtering issues
  if (filteredData.length === 0 && data.length > 0) {
    console.error(`❌ CRITICAL: Date filtering returned 0 results for ${period}!`, {
      sampleDataDates: data.slice(0, 3).map(d => d.date),
      requestedRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
    });
    
    // Emergency fallback: return last portion of data
    const fallbackData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-100);
    console.log(`🚨 EMERGENCY FALLBACK: Returning last 100 data points`);
    return fallbackData;
  }
  
  return filteredData;
}

// Calculate MA for a given period
function calculateMA(data, period) {
  if (!data || data.length < period) return data;
  
  const result = [...data];
  
  // Initialize the first period-1 points with null MA values
  for (let i = 0; i < period - 1; i++) {
    // Make sure ma200 is a property directly on each data point
    result[i] = { ...result[i], ma200: null };
  }
  
  // Calculate MA for the rest of the points
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].price || data[i - j].close || 0;
    }
    // Make sure ma200 is a property directly on each data point
    result[i] = { ...result[i], ma200: sum / period };
  }
  
  return result;
}

// Calculate RSI for a given period
function calculateRSI(data, period = 14) {
  if (!data || data.length < period + 1) return data;
  
  const result = [...data];
  
  // Set initial RSI values to null
  for (let i = 0; i < period; i++) {
    // Make sure rsi is a property directly on each data point
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

// 🚀 NEW: FMP-FIRST FUNDAMENTALS ENDPOINT - NO EDGAR!
router.get('/fundamentals/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 FMP-FIRST Fundamentals endpoint called for ${symbol}`);
    
    // Use FMP directly as PRIMARY source (not EDGAR!)
    const fundamentalsData = await fmpMarketDataService.getFundamentals(symbol);
    
    console.log(`✅ Retrieved FMP fundamentals for ${symbol}:`, {
      companyName: fundamentalsData.companyName,
      currentPrice: fundamentalsData.currentPrice,
      hasRevenue: Boolean(fundamentalsData.fundamentals?.latest?.revenue),
      hasNetIncome: Boolean(fundamentalsData.fundamentals?.latest?.netIncome),
      dataSource: 'FMP'
    });
    
    res.json(fundamentalsData);
    
  } catch (error) {
    console.error(`❌ FMP fundamentals error for ${symbol}:`, error.message);
    
    // Provide descriptive error message based on error type
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return res.status(404).json({
        error: 'COMPANY_NOT_FOUND',
        message: `Fundamentals data for ${symbol} could not be found. This may be because ${symbol} is not a US-listed company or the symbol is incorrect.`
      });
    } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return res.status(500).json({
        error: 'FMP_SERVICE_ERROR',
        message: `Server error while fetching fundamentals for ${symbol}. The FMP service may be temporarily unavailable.`
      });
    } else {
      return res.status(500).json({
        error: 'FUNDAMENTALS_ERROR',
        message: `Fundamentals data could not be loaded from FMP. ${error.message}`
      });
    }
  }
});

// 🔧 FIXED: Enhanced historical data endpoint using FMP service through marketService
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = '1y' } = req.query;
    
    console.log(`🎯 History endpoint called: ${symbol}, period: ${period}`);
    console.log(`🕐 Request timestamp: ${new Date().toISOString()}`);
    
    // 🚀 FMP service handles all periods including intraday
    try {
      const fullData = await marketService.getHistoricalData(symbol, period);
      
      console.log(`📊 Retrieved ${fullData.length} points for ${symbol} ${period} from FMP`);
      
      if (!fullData || fullData.length === 0) {
        console.warn(`⚠️ No historical data available for ${symbol} ${period}`);
        return res.json({
          error: 'NO_HISTORICAL_DATA',
          message: `No historical data available for ${symbol}`,
          data: []
        });
      }
      
      // For intraday periods, return data as-is without indicators
      if (period === '1d' || period === '5d') {
        console.log(`✅ Returning ${fullData.length} intraday points for ${symbol} ${period}`);
        return res.json(fullData);
      }
      
      // Ensure consistent price field and add isDisplayed
      let data = fullData.map(item => ({
        ...item,
        price: item.price || item.close || 0,
        close: item.close || item.price || 0,
        volume: item.volume || 0,
        isDisplayed: true,
        // Explicitly initialize indicators as properties
        ma200: null,
        rsi: null
      }));
      
      // For shorter periods, adjust MA calculation or skip it
      let maData = data;
      if (period === '1m' || period === '3m') {
        // Use 50-day MA for shorter periods instead of 200-day
        const maPeriod = Math.min(50, Math.floor(data.length / 2));
        if (maPeriod > 1) {
          maData = calculateMA(data, maPeriod);
          // Rename ma200 to ma50 for display
          maData = maData.map(item => ({
            ...item,
            ma50: item.ma200,  // Use MA50 for shorter periods
            ma200: null       // Clear MA200 for shorter periods
          }));
          console.log(`📈 Calculated MA${maPeriod} for ${period} (${maPeriod} points)`);
        }
      } else if (data.length >= 200) {
        // Calculate MA200 only if we have enough data
        maData = calculateMA(data, 200);
        console.log(`📈 Calculated MA200 for ${period} data`);
      }
      
      // Calculate RSI on the data
      let finalData;
      try {
        finalData = calculateRSI(maData, 14);
        console.log(`📈 Calculated RSI for ${period} data`);
      } catch (rsiError) {
        console.error(`❌ RSI calculation error:`, rsiError.message);
        finalData = maData; // Use data without RSI
      }
      
      // Log indicator status
      const ma200Count = finalData.filter(d => d.ma200 !== null).length;
      const ma50Count = finalData.filter(d => d.ma50 !== null).length; 
      const rsiCount = finalData.filter(d => d.rsi !== null).length;
      console.log(`📈 Calculated indicators for ${period}:`, {
        MA200: ma200Count,
        MA50: ma50Count,
        RSI: rsiCount,
        totalPoints: finalData.length
      });
      
      // Log return calculation for debugging
      if (finalData.length > 0) {
        const first = finalData[0];
        const last = finalData[finalData.length - 1];
        
        if (first.price && last.price) {
          const returnPercent = ((last.price - first.price) / first.price) * 100;
          console.log(`💰 ${period} return calculation for ${symbol}:`, {
            firstDate: first.date,
            lastDate: last.date,
            firstPrice: first.price.toFixed(2),
            lastPrice: last.price.toFixed(2),
            returnPercent: returnPercent.toFixed(2) + '%',
            dataPoints: finalData.length
          });
        }
      }
      
      console.log(`✅ FINAL: Sending ${finalData.length} points for ${period} with indicators`);
      res.json(finalData);
      
    } catch (dataError) {
      console.error(`❌ Failed to fetch data for ${symbol} ${period}:`, dataError.message);
      
      // Check if it's an FMP API issue
      if (dataError.message.includes('FMP')) {
        return res.json({
          error: 'API_ERROR',
          message: `Financial data service error: ${dataError.message}`,
          suggestions: [
            'Check if the FMP API key is valid',
            'Verify the symbol is supported',
            'Try again in a few moments'
          ],
          data: []
        });
      }
      
      return res.json({
        error: 'DATA_FETCH_ERROR',
        message: `Failed to fetch historical data: ${dataError.message}`,
        data: []
      });
    }
    
  } catch (error) {
    console.error(`❌ History endpoint error for ${req.params.symbol} ${req.query.period}:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch historical data',
      details: error.message 
    });
  }
});

// News endpoint
router.get('/news', async (req, res, next) => {
  try {
    const data = await newsService.getMarketNews();
    res.json(data.articles || data);
  } catch (error) {
    console.error('News endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch news',
      articles: []
    });
  }
});

// FIXED: Market data endpoint - Returns main indices with proper symbol format
router.get('/data', async (req, res, next) => {
  try {
    console.log('🎯 Market /data endpoint called');
    
    // Get main market indices (with .US suffix for API)
    const symbolsWithUS = ['SPY.US', 'QQQ.US', 'IWM.US', 'DIA.US', 'TLT.US'];
    const data = await marketService.getDataForSymbols(symbolsWithUS);
    
    console.log('📊 Raw market data:', Object.keys(data));
    
    // Format data for frontend (remove .US suffix from symbols)
    const formattedData = symbolsWithUS.map(symbolWithUS => {
      const quote = data[symbolWithUS];
      const cleanSymbol = symbolWithUS.replace('.US', '');
      
      if (!quote) {
        console.warn(`⚠️ No data for ${symbolWithUS}`);
        return {
          symbol: cleanSymbol,
          name: cleanSymbol,
          close: 0,
          change_p: 0,
          volume: 0
        };
      }
      
      return {
        symbol: cleanSymbol,  // Remove .US for frontend
        name: quote.name || cleanSymbol,
        close: quote.close || 0,
        change_p: quote.change_p || 0,
        volume: quote.volume || 0
      };
    }).filter(item => item.close > 0); // Filter out failed requests
    
    console.log(`✅ Returning ${formattedData.length} market indices:`, formattedData.map(d => `${d.symbol}: $${d.close}`));
    res.json(formattedData);
  } catch (error) {
    console.error('❌ Market data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: error.message 
    });
  }
});

// NEW: SP500 Top endpoint (was missing)
router.get('/sp500-top', async (req, res, next) => {
  try {
    console.log('SP500 top endpoint called');
    
    // Get major S&P 500 symbols 
    const sp500Symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.B', 'JNJ', 'V'];
    const sp500Data = await marketService.getDataForSymbols(sp500Symbols);
    
    const formattedData = sp500Symbols.map(symbol => {
      const quote = sp500Data[symbol] || sp500Data[`${symbol}.US`];
      return {
        symbol: symbol,
        name: quote?.name || symbol,
        close: quote?.close || 0,
        price: quote?.close || 0,
        change_p: quote?.change_p || 0,
        changePercent: quote?.change_p || 0,
        volume: quote?.volume || 0
      };
    }).filter(item => item.close > 0); // Filter out failed requests
    
    console.log(`Returning ${formattedData.length} SP500 top stocks`);
    res.json(formattedData);
  } catch (error) {
    console.error('SP500 top error:', error);
    res.status(500).json({ error: 'Failed to fetch SP500 top data' });
  }
});

// Sectors endpoint
router.get('/sectors', async (req, res, next) => {
  try {
    const sectorETFs = {
      XLF: { name: 'Financials', color: '#1e40af' },
      XLK: { name: 'Technology', color: '#3b82f6' },
      XLE: { name: 'Energy', color: '#059669' },
      XLV: { name: 'Healthcare', color: '#dc2626' },
      XLI: { name: 'Industrials', color: '#92400e' },
      XLP: { name: 'Consumer Staples', color: '#7c3aed' },
      XLY: { name: 'Consumer Discretionary', color: '#db2777' },
      XLB: { name: 'Materials', color: '#a16207' },
      XLRE: { name: 'Real Estate', color: '#65a30d' },
      XLU: { name: 'Utilities', color: '#475569' },
      XLC: { name: 'Communication', color: '#0891b2' }
    };

    const symbols = Object.keys(sectorETFs);
    const sectorData = await marketService.getDataForSymbols(symbols);

    const formattedData = symbols.map(symbol => ({
      symbol,
      name: sectorETFs[symbol].name,
      color: sectorETFs[symbol].color,
      close: sectorData[symbol]?.close || 0,
      change_p: sectorData[symbol]?.change_p || 0
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Sector data error:', error);
    next(error);
  }
});

// Sectors with period endpoint (fix for /sectors/1d 404 error)
router.get('/sectors/:period', async (req, res, next) => {
  try {
    const { period } = req.params;
    console.log(`Sectors endpoint called with period: ${period}`);
    
    const sectorETFs = {
      XLF: { name: 'Financials', color: '#1e40af' },
      XLK: { name: 'Technology', color: '#3b82f6' },
      XLE: { name: 'Energy', color: '#059669' },
      XLV: { name: 'Healthcare', color: '#dc2626' },
      XLI: { name: 'Industrials', color: '#92400e' },
      XLP: { name: 'Consumer Staples', color: '#7c3aed' },
      XLY: { name: 'Consumer Discretionary', color: '#db2777' },
      XLB: { name: 'Materials', color: '#a16207' },
      XLRE: { name: 'Real Estate', color: '#65a30d' },
      XLU: { name: 'Utilities', color: '#475569' },
      XLC: { name: 'Communication', color: '#0891b2' }
    };

    const symbols = Object.keys(sectorETFs);
    const sectorData = await marketService.getDataForSymbols(symbols);

    const formattedData = symbols.map(symbol => ({
      symbol,
      name: sectorETFs[symbol].name,
      color: sectorETFs[symbol].color,
      close: sectorData[symbol]?.close || 0,
      change_p: sectorData[symbol]?.change_p || 0,
      period: period // Include the requested period
    }));

    console.log(`Returning sector data for period ${period}:`, formattedData.length, 'sectors');
    res.json(formattedData);
  } catch (error) {
    console.error('Sector data error with period:', error);
    next(error);
  }
});

// Other endpoints
router.get('/macro', async (req, res, next) => {
  try {
    const macroSymbols = ['TLT', 'UUP', 'GLD', 'VIXY', 'USO', 'EEM', 'IBIT', 'JNK'];
    const macroData = await marketService.getDataForSymbols(macroSymbols);
    
    res.json({
      tlt: { price: macroData.TLT?.close || 0, change: macroData.TLT?.change_p || 0 },
      uup: { price: macroData.UUP?.close || 0, change: macroData.UUP?.change_p || 0 },
      gld: { price: macroData.GLD?.close || 0, change: macroData.GLD?.change_p || 0 },
      vix: { price: macroData.VIXY?.close || 0, change: macroData.VIXY?.change_p || 0 },
      uso: { price: macroData.USO?.close || 0, change: macroData.USO?.change_p || 0 },
      eem: { price: macroData.EEM?.close || 0, change: macroData.EEM?.change_p || 0 },
      ibit: { price: macroData.IBIT?.close || 0, change: macroData.IBIT?.change_p || 0 },
      jnk: { price: macroData.JNK?.close || 0, change: macroData.JNK?.change_p || 0 }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/themes', async (req, res, next) => {
  try {
    const themes = await themeService.getCurrentThemes();
    res.json(themes);
  } catch (error) {
    next(error);
  }
});

router.get('/mover', async (req, res, next) => {
  try {
    const mover = await marketAnalysisService.getTopMover();
    if (!mover) {
      return res.json({
        symbol: null,
        price: 0,
        changePercent: 0,
        dailyChange: 0,
        reason: 'No significant market moves',
        history: []
      });
    }
    res.json(mover);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/insights', async (req, res, next) => {
  try {
    const insights = await braveInsightsService.getKeyInsights();
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await marketService.getDataForSymbols([symbol]);
    res.json(quote[symbol]);
  } catch (error) {
    next(error);
  }
});

router.get('/sector-rotation', async (req, res, next) => {
  try {
    const analysis = await sectorAnalysisService.getSectorRotationAnalysis();
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

router.get('/sentiment/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const sentiment = await braveService.getMarketSentiment(symbol);
    res.json(sentiment);
  } catch (error) {
    next(error);
  }
});

export default router;