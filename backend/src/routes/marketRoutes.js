import express from 'express';
import marketAnalysisService from '../services/marketAnalysisService.js';
import { marketService } from '../services/apiServices.js';
import braveService from '../services/braveService.js';
import errorTracker from '../utils/errorTracker.js';
import sectorAnalysisService from '../services/sectorAnalysisService.js';
import themeService from '../services/themeService.js';
import braveInsightsService from '../services/braveInsightsService.js';

const router = express.Router();

// Market Data endpoint
router.get('/data', async (req, res, next) => {
  try {
    console.log('Fetching market data...');
    const data = await marketService.getData();
    console.log('Market data:', data);
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

// Sector Rotation endpoint
router.get('/sector-rotation', async (req, res, next) => {
  try {
    const analysis = await sectorAnalysisService.getSectorRotationAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Sector rotation error:', error);
    next(error);
  }
});

// Sectors endpoint
router.get('/sectors', async (req, res, next) => {
  try {
    console.log('Fetching sector data...');
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
      XLC: { name: 'Communication', color: '#0891b2' }  // Added XLC
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

// Updated Macro endpoint with all 8 indicators
router.get('/macro', async (req, res, next) => {
  try {
    console.log('Fetching macro data...');
    // Update VIX symbol to match EOD format
    const macroSymbols = ['TLT', 'UUP', 'GLD', 'VIXY', 'USO', 'EEM', 'IBIT', 'JNK'];
    const macroData = await marketService.getDataForSymbols(macroSymbols);
    console.log('Macro data:', macroData);
    
    res.json({
      tlt: {
        price: macroData.TLT?.close || 0,
        change: macroData.TLT?.change_p || 0
      },
      uup: {
        price: macroData.UUP?.close || 0,
        change: macroData.UUP?.change_p || 0
      },
      gld: {
        price: macroData.GLD?.close || 0,
        change: macroData.GLD?.change_p || 0
      },
      vix: {  // we keep 'vix' as the key for frontend compatibility
        price: macroData.VIXY?.close || 0,
        change: macroData.VIXY?.change_p || 0
      },
      uso: {
        price: macroData.USO?.close || 0,
        change: macroData.USO?.change_p || 0
      },
      eem: {
        price: macroData.EEM?.close || 0,
        change: macroData.EEM?.change_p || 0
      },
      ibit: {
        price: macroData.IBIT?.close || 0,
        change: macroData.IBIT?.change_p || 0
      },
      jnk: {
        price: macroData.JNK?.close || 0,
        change: macroData.JNK?.change_p || 0
      }
    });
  } catch (error) {
    console.error('Macro data error:', error);
    next(error);
  }
});

router.get('/themes', async (req, res, next) => {
  try {
    const themes = await themeService.getCurrentThemes();
    res.json(themes);
  } catch (error) {
    console.error('Market themes error:', error);
    next(error);
  }
});

// Market Mover endpoint
router.get('/mover', async (req, res, next) => {
  try {
    const mover = await marketAnalysisService.getTopMover();
    console.log('Sending mover data:', mover);
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
    
    // Calculate daily change if not present
    if (!mover.dailyChange) {
      mover.dailyChange = (mover.price * mover.changePercent / 100);
    }
    
    res.json(mover);
  } catch (error) {
    console.error('Market mover error:', error);
    next(error);
  }
});

// Mover History endpoint
router.get('/mover-history', async (req, res, next) => {
  try {
    const mover = await marketAnalysisService.getTopMover();
    if (!mover) {
      return res.json([]);
    }
    const history = await marketService.getHistoricalData(mover.symbol);
    res.json(history);
  } catch (error) {
    console.error('Mover history error:', error);
    next(error);
  }
});

// Quote endpoint
router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await marketService.getDataForSymbols([symbol]);
    res.json(quote[symbol]);
  } catch (error) {
    next(error);
  }
});

// History endpoint
router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const history = await marketService.getHistoricalData(symbol);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Sentiment endpoint
router.get('/sentiment/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    console.log(`Fetching sentiment for ${symbol}...`);
    const sentiment = await braveService.getMarketSentiment(symbol);
    res.json(sentiment);
  } catch (error) {
    console.error('Sentiment error:', error);
    next(error);
  }
});

// Insights endpoint
router.get('/insights', async (req, res, next) => {
  try {
    console.log('Fetching market insights...');
    const insights = await braveInsightsService.getKeyInsights();
    console.log('Insights retrieved:', insights);
    res.json(insights);
  } catch (error) {
    console.error('Insights error:', error);
    next(error);
  }
});

export default router;
