// Fix for the MA200 and RSI indicators
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

const router = express.Router();

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

// Historical data endpoint with explicit indicators calculation
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { period = '1y' } = req.query;
    
    console.log(`History endpoint called: ${symbol}, period: ${period}`);
    
    // Skip indicators for intraday periods
    if (period === '1d' || period === '5d') {
      const data = await eodService.getHistoricalPrices?.(symbol, period) || [];
      console.log(`Intraday data: ${data.length} points (no indicators for intraday)`);
      return res.json(data);
    }
    
    // Get historical data
    let data = await marketService.getHistoricalData(symbol);
    console.log(`Raw historical data: ${data.length} points`);
    
    // Ensure consistent price field and add isDisplayed
    data = data.map(item => ({
      ...item,
      price: item.price || item.close || 0,
      close: item.close || item.price || 0,
      volume: item.volume || 0,
      isDisplayed: true,
      // Explicitly initialize indicators as properties
      ma200: null,
      rsi: null
    }));
    
    // Calculate indicators directly here
    // 1. Calculate MA200
    data = calculateMA(data, 200);
    
    // 2. Calculate RSI
    data = calculateRSI(data, 14);
    
    // Log indicator status
    const ma200Count = data.filter(d => d.ma200 !== null).length;
    const rsiCount = data.filter(d => d.rsi !== null).length;
    console.log(`Calculated indicators: MA200 points: ${ma200Count}, RSI points: ${rsiCount}`);
    
    if (data.length > 0) {
      // Log a sample data point to verify structure
      const sampleIdx = Math.min(data.length - 1, 200);  // Get a point that should have indicators
      console.log('Sample data point (index ' + sampleIdx + '):');
      console.log(JSON.stringify({
        date: data[sampleIdx].date,
        price: data[sampleIdx].price,
        ma200: data[sampleIdx].ma200,
        rsi: data[sampleIdx].rsi
      }, null, 2));
    }
    
    console.log(`Sending ${data.length} points with indicators`);
    res.json(data);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
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

// Market data endpoint
router.get('/data', async (req, res, next) => {
  try {
    const data = await marketService.getData();
    const formattedData = Object.entries(data).map(([symbol, quote]) => ({
      symbol: symbol,
      name: quote.name || symbol,
      close: quote.close,
      change_p: quote.change_p
    }));
    res.json(formattedData);
  } catch (error) {
    console.error('Market data error:', error);
    next(error);
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