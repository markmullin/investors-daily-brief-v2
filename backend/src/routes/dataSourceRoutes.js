// Data source routes for accessing financial data from multiple sources
import express from 'express';
import dataSourceManager from '../services/dataSources/dataSourceManager.js';

const router = express.Router();

/**
 * Get available data sources
 * GET /api/data-sources
 */
router.get('/', async (req, res) => {
  try {
    const sources = dataSourceManager.getAvailableSources();
    
    return res.json({
      status: 'success',
      sources
    });
  } catch (error) {
    console.error('Error getting data sources:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to get data sources',
      status: 'error'
    });
  }
});

/**
 * Get historical data from the best available source
 * GET /api/data-sources/historical/:symbol
 */
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      start_date, 
      end_date, 
      metrics = 'price', 
      sources
    } = req.query;
    
    // Parse dates
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = end_date ? new Date(end_date) : new Date();
    
    // Parse metrics
    const metricsList = metrics.split(',');
    
    // Parse sources priority
    const sourcesPriority = sources ? sources.split(',') : undefined;
    
    const result = await dataSourceManager.getHistoricalData(
      symbol,
      startDate,
      endDate,
      metricsList,
      sourcesPriority
    );
    
    return res.json({
      status: 'success',
      data: result.data,
      source: result.source
    });
  } catch (error) {
    console.error('Error getting historical data:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to get historical data',
      status: 'error'
    });
  }
});

/**
 * Get combined data from multiple sources
 * GET /api/data-sources/combined/:symbol
 */
router.get('/combined/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      start_date, 
      end_date, 
      metrics = 'price', 
      sources
    } = req.query;
    
    // Parse dates
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = end_date ? new Date(end_date) : new Date();
    
    // Parse metrics
    const metricsList = metrics.split(',');
    
    // Parse sources priority
    const sourcesPriority = sources ? sources.split(',') : undefined;
    
    const result = await dataSourceManager.getCombinedData(
      symbol,
      startDate,
      endDate,
      metricsList,
      sourcesPriority
    );
    
    return res.json({
      status: 'success',
      data: result.data,
      sources: result.sources
    });
  } catch (error) {
    console.error('Error getting combined data:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to get combined data',
      status: 'error'
    });
  }
});

/**
 * Get company information from the best available source
 * GET /api/data-sources/company/:symbol
 */
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { sources } = req.query;
    
    // Parse sources priority
    const sourcesPriority = sources ? sources.split(',') : undefined;
    
    const result = await dataSourceManager.getCompanyInfo(
      symbol,
      sourcesPriority
    );
    
    return res.json({
      status: 'success',
      data: result.data,
      source: result.source
    });
  } catch (error) {
    console.error('Error getting company info:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to get company info',
      status: 'error'
    });
  }
});

/**
 * Search for symbols across multiple data sources
 * GET /api/data-sources/search
 */
router.get('/search', async (req, res) => {
  try {
    const { query, sources } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameter: query',
        status: 'error'
      });
    }
    
    // Parse sources priority
    const sourcesPriority = sources ? sources.split(',') : undefined;
    
    const result = await dataSourceManager.searchSymbols(
      query,
      sourcesPriority
    );
    
    return res.json({
      status: 'success',
      results: result.results
    });
  } catch (error) {
    console.error('Error searching symbols:', error);
    
    return res.status(500).json({
      error: error.message || 'Failed to search symbols',
      status: 'error'
    });
  }
});

export default router;
