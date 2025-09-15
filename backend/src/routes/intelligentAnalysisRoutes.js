/**
 * Updated Intelligent Analysis Routes
 * Integrates Python calculations with GPT-OSS insights
 */

import express from 'express';
import intelligentAnalysis from '../services/intelligentAnalysisService.js';

const router = express.Router();

/**
 * Market Phase Analysis - Command Center top section
 */
router.get('/market-phase', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '1d';
    console.log(`📊 Market phase analysis requested for timeframe: ${timeframe}`);
    
    const analysis = await intelligentAnalysis.generateAnalysis('marketPhase', {
      source: 'live',
      timeframe: timeframe,
      timestamp: new Date().toISOString()
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('Market phase analysis error:', error);
    // Return minimal error without fallback content to prevent confusion
    res.status(500).json({
      error: 'Analysis service temporarily unavailable',
      success: false,
      type: 'marketPhase',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Individual Index Analysis - handles both GET and POST
 */
const handleIndexAnalysis = async (req, res) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe || req.body?.timeframe || '1d';
    const specificData = req.body || {};
    
    console.log(`📊 Index analysis for ${symbol} (${timeframe}) with specific data:`, {
      hasHistoricalData: !!specificData.historicalData,
      currentPrice: specificData.currentPrice,
      currentChange: specificData.currentChange,
      technicalIndicators: specificData.technicalIndicators
    });
    
    const indexMap = {
      '^GSPC': 'S&P 500',
      '^IXIC': 'NASDAQ Composite', 
      '^DJI': 'Dow Jones',
      '^RUT': 'Russell 2000',
      'BTCUSD': 'Bitcoin'
    };
    
    const analysis = await intelligentAnalysis.generateAnalysis('marketIndices', {
      symbol,
      name: indexMap[symbol] || symbol,
      timeframe,
      specificData: specificData.historicalData ? specificData : null,
      source: 'specific_chart_data'
    });
    
    res.json(analysis);
  } catch (error) {
    console.error(`Index analysis error for ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Analysis service temporarily unavailable',
      success: false,
      type: 'indexAnalysis',
      timestamp: new Date().toISOString()
    });
  }
};

router.get('/index/:symbol', handleIndexAnalysis);
router.post('/index/:symbol', handleIndexAnalysis);

/**
 * Sector Rotation Analysis
 */
router.get('/sectors', async (req, res) => {
  try {
    // Get timeframe from query params and normalize it
    const timeframe = req.query.timeframe || '1d';
    
    const analysis = await intelligentAnalysis.generateAnalysis('sectorRotation', {
      timeframe: timeframe.toLowerCase() // Ensure lowercase for consistency
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('Sector analysis error:', error);
    res.status(500).json({
      error: 'Sector analysis service temporarily unavailable',
      success: false,
      type: 'sectorRotation',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Market Correlations Analysis - FIXED to handle all 8 relationship pairs
 */
router.get('/correlations/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    const correlationPairs = {
      // All 8 relationships from KeyRelationships component
      'spy-vs-tlt': { asset1: 'SPY', asset2: 'TLT', name: 'Stocks vs Bonds' },
      'spy-vs-eem-vs-efa': { asset1: 'SPY', asset2: 'EEM', asset3: 'EFA', name: 'Global Equity Markets' },
      'ive-vs-ivw': { asset1: 'IVE', asset2: 'IVW', name: 'Value vs Growth' },
      'ibit-vs-gld': { asset1: 'IBIT', asset2: 'GLD', name: 'Bitcoin vs Gold' },
      'bnd-vs-jnk': { asset1: 'BND', asset2: 'JNK', name: 'Investment Grade vs High Yield' },
      'uso-vs-uup': { asset1: 'USO', asset2: 'UUP', name: 'Oil vs Dollar' },
      'xlp-vs-xly': { asset1: 'XLP', asset2: 'XLY', name: 'Consumer Sectors' },
      'smh-vs-xsw': { asset1: 'SMH', asset2: 'XSW', name: 'Tech Sectors' },
      // Legacy mappings for backward compatibility
      'stocks-bonds': { asset1: 'SPY', asset2: 'TLT', name: 'Stocks vs Bonds' },
      'growth-value': { asset1: 'IVW', asset2: 'IVE', name: 'Growth vs Value' },
      'fear-greed': { asset1: 'VXX', asset2: 'SPY', name: 'Fear vs Greed' },
      'gold-dollar': { asset1: 'GLD', asset2: 'UUP', name: 'Gold vs Dollar' },
      'banks-rates': { asset1: 'XLF', asset2: 'TNX', name: 'Banks vs Rates' }
    };
    
    const pairConfig = correlationPairs[pair] || correlationPairs['spy-vs-tlt'];
    
    const analysis = await intelligentAnalysis.generateAnalysis('correlations', pairConfig);
    
    res.json(analysis);
  } catch (error) {
    console.error('Correlation analysis error:', error);
    res.status(500).json({
      error: 'Analysis service temporarily unavailable',
      success: false,
      type: 'correlationAnalysis',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Macroeconomic Environment Analysis
 */
router.get('/macro', async (req, res) => {
  try {
    const analysis = await intelligentAnalysis.generateAnalysis('macroeconomic', {
      indicators: req.query.indicators || 'all'
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('Macro analysis error:', error);
    res.status(500).json({
      error: 'Analysis service temporarily unavailable',
      success: false,
      type: 'macroAnalysis',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Batch Analysis - Get multiple analyses at once
 */
router.post('/batch', async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ error: 'Invalid batch request format' });
    }
    
    const results = await intelligentAnalysis.batchAnalysis(requests);
    
    res.json({
      success: true,
      analyses: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Analysis service temporarily unavailable',
      success: false,
      type: 'batchAnalysis',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Check if all services are running
    const pythonHealth = await fetch('http://localhost:8000/health').then(r => r.ok).catch(() => false);
    const gptOssHealth = await fetch('http://localhost:8080/health').then(r => r.ok).catch(() => false);
    
    res.json({
      status: 'operational',
      services: {
        python: pythonHealth ? 'healthy' : 'unavailable',
        gptOss: gptOssHealth ? 'healthy' : 'unavailable',
        backend: 'healthy'
      },
      pipeline: pythonHealth && gptOssHealth ? 'fully operational' : 'degraded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
