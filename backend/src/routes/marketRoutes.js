import express from 'express';
import marketAnalysisService from '../services/marketAnalysisService.js';
import { marketService } from '../services/apiServices.js';
import braveService from '../services/braveService.js';
import errorTracker from '../utils/errorTracker.js';
import sectorAnalysisService from '../services/sectorAnalysisService.js';
import themeService from '../services/themeService.js';
import braveInsightsService from '../services/braveInsightsService.js';
import braveNewsService from '../services/braveNewsService.js';

const router = express.Router();

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const enrichMarketMover = async (moverData) => {
  try {
    // Make sure moverData is valid before proceeding
    if (!moverData || typeof moverData !== 'object') {
      console.error('Invalid moverData:', moverData);
      return moverData;
    }

    // Ensure required properties exist with fallbacks
    const safeData = {
      symbol: moverData.symbol || 'Unknown',
      price: moverData.price || 0,
      changePercent: moverData.changePercent || 0,
      volume: moverData.volume || 0,
      averageVolume: moverData.averageVolume || 10000,
      companyName: moverData.companyName || moverData.symbol || 'Unknown',
      sectorImpact: moverData.sectorImpact || false,
      ...moverData
    };

    // Get news if possible
    let news = [];
    try {
      news = await braveNewsService.getStockNews(safeData.symbol, safeData.companyName);
    } catch (err) {
      console.error('Error fetching news for market mover:', err);
      news = [];
    }

    const moveSize = Math.abs(safeData.changePercent);
    const isUpMove = safeData.changePercent > 0;
    const volumeRatio = safeData.volume / safeData.averageVolume || 1;

    const basicInsight = news.length > 0 
      ? `The move appears to be driven by ${news[0].title}. ${news[0].description || ''}`
      : `The stock is showing ${isUpMove ? 'strength' : 'weakness'} with ${moveSize.toFixed(1)}% change${volumeRatio > 1 ? ` on ${volumeRatio.toFixed(1)}x normal volume` : ''}.`;

    const advancedInsight = `
      Price action shows ${isUpMove ? 'bullish' : 'bearish'} momentum with 
      ${volumeRatio ? volumeRatio.toFixed(1) : 'N/A'}x normal volume. ${moveSize > 5 ? 'Extreme' : 'Notable'} 
      move relative to historical volatility.
    `;

    const volumeAnalysis = `
      Trading at ${volumeRatio ? volumeRatio.toFixed(1) : 'N/A'}x average volume. 
      ${volumeRatio > 2 ? 'Significant institutional activity likely.' : 'Retail-driven move possible.'}
    `;

    const technicalLevels = `
      Near-term resistance: $${(safeData.price * 1.05).toFixed(2)}
      Near-term support: $${(safeData.price * 0.95).toFixed(2)}
    `;

    const marketImpact = `
      ${safeData.symbol}'s move is ${safeData.sectorImpact ? 'affecting' : 'isolated from'} 
      its sector. ${news.length > 0 ? 'News-driven' : 'Technical'} move with 
      ${moveSize > 5 ? 'high' : 'moderate'} significance.
    `;

    return {
      ...safeData,
      news,
      basicInsight,
      advancedInsight,
      volumeAnalysis,
      technicalLevels,
      marketImpact
    };
  } catch (error) {
    console.error('Error enriching market mover:', error);
    return moverData;
  }
};

router.get('/data', async (req, res, next) => {
  try {
    console.log('Fetching market data...');
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

router.get('/sector-rotation', async (req, res, next) => {
  try {
    const analysis = await sectorAnalysisService.getSectorRotationAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Sector rotation error:', error);
    next(error);
  }
});

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

router.get('/macro', async (req, res, next) => {
  try {
    const macroSymbols = ['TLT', 'UUP', 'GLD', 'VIXY', 'USO', 'EEM', 'IBIT', 'JNK'];
    const macroData = await marketService.getDataForSymbols(macroSymbols);
    
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
      vix: {
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
    
    if (!mover.dailyChange) {
      mover.dailyChange = (mover.price * mover.changePercent / 100);
    }
    
    try {
      const enrichedMover = await enrichMarketMover(mover);
      res.json(enrichedMover);
    } catch (enrichError) {
      console.error('Error enriching mover data:', enrichError);
      res.json(mover);
    }
  } catch (error) {
    console.error('Market mover error:', error);
    res.status(500).json({
      error: 'Failed to fetch market mover',
      details: error.message
    });
  }
});

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

router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await marketService.getDataForSymbols([symbol]);
    res.json(quote[symbol]);
  } catch (error) {
    next(error);
  }
});

router.get('/history/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const history = await marketService.getHistoricalData(symbol);
    res.json(history);
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
    console.error('Sentiment error:', error);
    next(error);
  }
});

router.get('/insights', async (req, res, next) => {
  try {
    const insights = await braveInsightsService.getKeyInsights();
    res.json(insights);
  } catch (error) {
    console.error('Insights error:', error);
    next(error);
  }
});

export default router;