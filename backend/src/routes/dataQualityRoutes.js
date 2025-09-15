// DATA QUALITY API ENDPOINTS - Add to your Express routes
// Provides real-time data quality monitoring for the frontend dashboard

import express from 'express';
import portfolioDataQualityService from '../services/portfolioDataQualityService.js';

const router = express.Router();

// GET /api/data-quality/portfolio - Get overall portfolio data quality
router.get('/portfolio', async (req, res) => {
  try {
    console.log('📊 API: Getting portfolio data quality summary...');
    
    // Get tickers from query params or use defaults
    const tickers = req.query.tickers 
      ? req.query.tickers.split(',').map(t => t.trim().toUpperCase())
      : ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'];
    
    const healthSummary = await portfolioDataQualityService.getPortfolioHealthSummary(tickers);
    
    res.json({
      success: true,
      data: healthSummary,
      message: 'Portfolio data quality retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Portfolio data quality failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get portfolio data quality'
    });
  }
});

// GET /api/data-quality/stock/:ticker - Get data quality for specific stock
router.get('/stock/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    console.log(`📊 API: Getting data quality for ${ticker}...`);
    
    const stockQuality = await portfolioDataQualityService.validateStockDataQuality(ticker);
    
    res.json({
      success: true,
      data: stockQuality,
      message: `Data quality for ${ticker} retrieved successfully`
    });
    
  } catch (error) {
    console.error(`❌ API: Data quality for ${req.params.ticker} failed:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Failed to get data quality for ${req.params.ticker}`
    });
  }
});

// POST /api/data-quality/validate - Run comprehensive validation
router.post('/validate', async (req, res) => {
  try {
    console.log('🔍 API: Running comprehensive portfolio validation...');
    
    const { tickers } = req.body;
    const report = await portfolioDataQualityService.validatePortfolioDataQuality(tickers);
    
    res.json({
      success: true,
      data: report,
      message: 'Portfolio validation completed successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Portfolio validation failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Portfolio validation failed'
    });
  }
});

// GET /api/data-quality/last-report - Get last validation report
router.get('/last-report', async (req, res) => {
  try {
    const lastReport = portfolioDataQualityService.getLastQualityReport();
    
    if (!lastReport.report) {
      return res.json({
        success: true,
        data: null,
        message: 'No validation report available yet'
      });
    }
    
    res.json({
      success: true,
      data: lastReport,
      message: 'Last validation report retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Get last report failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get last validation report'
    });
  }
});

// GET /api/data-quality/dashboard - Comprehensive dashboard data for frontend
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 API: Getting comprehensive data quality dashboard...');
    
    // Get portfolio health summary
    const healthSummary = await portfolioDataQualityService.getPortfolioHealthSummary();
    
    // Get last validation report
    const lastReport = portfolioDataQualityService.getLastQualityReport();
    
    // Create dashboard data structure
    const dashboardData = {
      overview: {
        overallScore: healthSummary.overallScore,
        totalStocks: healthSummary.totalStocks,
        lastUpdated: healthSummary.lastUpdated,
        status: parseFloat(healthSummary.overallScore) >= 85 ? 'EXCELLENT' : 
                parseFloat(healthSummary.overallScore) >= 70 ? 'GOOD' : 
                parseFloat(healthSummary.overallScore) >= 50 ? 'FAIR' : 'POOR'
      },
      distribution: healthSummary.distribution,
      issues: {
        count: healthSummary.issuesCount,
        topIssues: healthSummary.topIssues
      },
      trends: {
        // Could add historical trends here
        message: 'Trends data will be available after multiple validations'
      },
      recommendations: healthSummary.topIssues || [],
      lastValidation: lastReport.timestamp,
      hasDetailedReport: !!lastReport.report
    };
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'Data quality dashboard retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Data quality dashboard failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get data quality dashboard'
    });
  }
});

export default router;
