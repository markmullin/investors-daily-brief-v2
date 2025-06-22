import express from 'express';
import eodService from '../services/eodService.js';
import mistralService from '../services/mistralService.js';
import braveNewsService from '../services/braveNewsService.js';
import braveInsightsService from '../services/braveInsightsService.js';
import braveService from '../services/braveService.js';
import braveAPIManager from '../services/braveAPIManager.js';
import fredService from '../services/fredService.js';

const router = express.Router();

/**
 * @route   GET /api/test/status
 * @desc    Test all API connections
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    // Start with successful response
    const result = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: 'healthy'
    };
    
    // Test EOD API
    try {
      const eodStatus = await eodService.checkAPIStatus();
      result.services.eod = eodStatus;
    } catch (error) {
      result.services.eod = {
        status: 'error',
        message: `EOD API error: ${error.message}`
      };
      result.overall = 'degraded';
    }
    
    // Test Brave API with enhanced status information
    try {
      const braveStatus = await braveNewsService.checkApiStatus();
      
      // Add API Manager details
      const apiManagerStatus = braveAPIManager.getStatus();
      
      result.services.brave = {
        ...braveStatus,
        manager: {
          queueLength: apiManagerStatus.queueLength,
          circuitOpen: apiManagerStatus.circuitOpen,
          backoff: `${Math.round(apiManagerStatus.currentBackoff / 1000)}s`,
          quotaUsed: apiManagerStatus.quotaUsed,
          quotaLimit: apiManagerStatus.quotaLimit
        }
      };
    } catch (error) {
      result.services.brave = {
        status: 'error',
        message: `Brave API error: ${error.message}`
      };
      result.overall = 'degraded';
    }
    
    // Test Mistral API
    try {
      const mistralStatus = await mistralService.checkApiStatus();
      result.services.mistral = mistralStatus;
    } catch (error) {
      result.services.mistral = {
        status: 'error',
        message: `Mistral API error: ${error.message}`
      };
      result.overall = 'degraded';
    }
    
    // Test FRED API
    try {
      // Simple FRED API test - try to get GDP data
      await fredService.getSeries('GDP', { limit: 1 });
      result.services.fred = {
        status: 'active',
        message: 'FRED API is working correctly',
        apiKey: process.env.FRED_API_KEY ? process.env.FRED_API_KEY.substring(0, 5) + '...' : 'Not set'
      };
    } catch (error) {
      result.services.fred = {
        status: 'error',
        message: `FRED API error: ${error.message}`
      };
      result.overall = 'degraded';
    }
    
    // Set overall status to critical if all primary APIs are down
    if (result.services.eod?.status === 'error' && 
        result.services.brave?.status === 'error' && 
        result.services.mistral?.status === 'error' &&
        result.services.fred?.status === 'error') {
      result.overall = 'critical';
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Error testing APIs:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/eod/:symbol
 * @desc    Test EOD API with specific symbol
 * @access  Public
 */
router.get('/eod/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await eodService.getSingleStockData(symbol);
    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error(`Error testing EOD API for ${req.params.symbol}:`, error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/brave
 * @desc    Test Brave API with market news
 * @access  Public
 */
router.get('/brave', async (req, res) => {
  try {
    const news = await braveNewsService.getMarketNews();
    const apiManagerStatus = braveAPIManager.getStatus();
    
    return res.json({
      status: 'success',
      apiStatus: {
        isRateLimited: apiManagerStatus.isRateLimited,
        circuitOpen: apiManagerStatus.circuitOpen,
        queueLength: apiManagerStatus.queueLength,
        quota: {
          used: apiManagerStatus.quotaUsed,
          limit: apiManagerStatus.quotaLimit,
          remaining: apiManagerStatus.quotaLimit - apiManagerStatus.quotaUsed
        }
      },
      count: news.length,
      synthetic: news.some(item => item.synthetic === true),
      data: news.slice(0, 3) // Return first 3 items to keep response small
    });
  } catch (error) {
    console.error('Error testing Brave API:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/brave-insights
 * @desc    Test Brave API insights
 * @access  Public
 */
router.get('/brave-insights', async (req, res) => {
  try {
    const insights = await braveInsightsService.getKeyInsights();
    return res.json({
      status: 'success',
      count: insights.length,
      data: insights
    });
  } catch (error) {
    console.error('Error testing Brave Insights API:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/brave-sentiment/:symbol
 * @desc    Test Brave API sentiment for a symbol
 * @access  Public
 */
router.get('/brave-sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const sentiment = await braveService.getMarketSentiment(symbol);
    return res.json({
      status: 'success',
      symbol,
      sentiment
    });
  } catch (error) {
    console.error(`Error testing Brave Sentiment API for ${req.params.symbol}:`, error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/brave-manager
 * @desc    Get Brave API manager status
 * @access  Public
 */
router.get('/brave-manager', async (req, res) => {
  try {
    const status = braveAPIManager.getStatus();
    return res.json({
      status: 'success',
      manager: status
    });
  } catch (error) {
    console.error('Error getting Brave API manager status:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/test/brave-reset
 * @desc    Reset Brave API services
 * @access  Public
 */
router.post('/brave-reset', async (req, res) => {
  try {
    // Reset all Brave services
    const managerReset = braveAPIManager.reset();
    const newsReset = braveNewsService.resetService();
    const insightsReset = braveInsightsService.resetService();
    const sentimentReset = braveService.resetService();
    
    return res.json({
      status: 'success',
      message: 'All Brave API services have been reset',
      details: {
        manager: managerReset,
        news: newsReset,
        insights: insightsReset,
        sentiment: sentimentReset
      }
    });
  } catch (error) {
    console.error('Error resetting Brave API services:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/mistral
 * @desc    Test Mistral API with a simple prompt
 * @access  Public
 */
router.get('/mistral', async (req, res) => {
  try {
    const prompt = 'Provide a one-sentence summary of current market conditions.';
    const response = await mistralService.generateText(prompt);
    return res.json({
      status: 'success',
      prompt,
      response
    });
  } catch (error) {
    console.error('Error testing Mistral API:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/test/fred
 * @desc    Test FRED API with basic economic indicators
 * @access  Public
 */
router.get('/fred', async (req, res) => {
  try {
    // Fetch GDP data as a basic test
    const gdpData = await fredService.getSeries('GDP', { 
      limit: 5,
      sort_order: 'desc' 
    });
    
    return res.json({
      status: 'success',
      indicator: 'GDP',
      count: gdpData.length,
      data: gdpData
    });
  } catch (error) {
    console.error('Error testing FRED API:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;