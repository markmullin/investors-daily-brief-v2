import express from 'express';
import treasuryDataService from '../services/treasuryDataService.js';

const router = express.Router();

/**
 * @route GET /api/treasury/10-year-yield
 * @description Get 10-year Treasury yield data from FiscalData API
 * @access Public
 */
router.get('/10-year-yield', async (req, res) => {
  try {
    const { observations = 60 } = req.query;
    console.log(`Treasury API Request for 10-year yield, observations: ${observations}`);
    
    const data = await treasuryDataService.getTreasuryYield10Year(parseInt(observations));
    
    return res.json({
      success: true,
      seriesId: 'DGS10',
      name: '10-Year Treasury Yield',
      observations: data,
      source: 'Treasury FiscalData API'
    });
  } catch (error) {
    console.error('Error fetching 10-year Treasury yield:', error.message);
    
    // Return fallback data instead of error
    const fallbackData = [];
    const today = new Date();
    const count = parseInt(req.query.observations) || 60;
    
    for (let i = count; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      fallbackData.push({
        date: date.toISOString().split('T')[0],
        value: 4.37 + (Math.random() * 0.4 - 0.2) // Simulated values around 4.37%
      });
    }
    
    return res.json({
      success: true,
      seriesId: 'DGS10',
      name: '10-Year Treasury Yield',
      observations: fallbackData,
      source: 'Fallback Data',
      note: 'Using simulated data due to service issues'
    });
  }
});

/**
 * @route GET /api/treasury/dollar-index
 * @description Get US Dollar Index (Broad) data
 * @access Public
 */
router.get('/dollar-index', async (req, res) => {
  try {
    const { observations = 60 } = req.query;
    console.log(`Treasury API Request for US Dollar Index, observations: ${observations}`);
    
    const data = await treasuryDataService.getUSDollarIndex(parseInt(observations));
    
    return res.json({
      success: true,
      seriesId: 'DTWEXBGS',
      name: 'US Dollar Index (Broad)',
      observations: data,
      source: 'Federal Reserve H.10'
    });
  } catch (error) {
    console.error('Error fetching US Dollar Index:', error.message);
    
    // Return fallback data instead of error
    const fallbackData = [];
    const today = new Date();
    const count = parseInt(req.query.observations) || 60;
    
    for (let i = count; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      fallbackData.push({
        date: date.toISOString().split('T')[0],
        value: 115 + (Math.random() * 10 - 5) // Simulated values around 115
      });
    }
    
    return res.json({
      success: true,
      seriesId: 'DTWEXBGS',
      name: 'US Dollar Index (Broad)',
      observations: fallbackData,
      source: 'Fallback Data',
      note: 'Using simulated data due to service issues'
    });
  }
});

/**
 * @route GET /api/treasury/dashboard
 * @description Get treasury dashboard with all key indicators
 * @access Public
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await treasuryDataService.getAllTreasuryData();
    
    // Add latest values and changes
    for (const key in dashboard) {
      const indicator = dashboard[key];
      if (indicator.data && indicator.data.length > 0) {
        indicator.latestValue = indicator.data[0].value;
        indicator.latestDate = indicator.data[0].date;
        indicator.monthlyChange = treasuryDataService.calculateChange(indicator.data, 1);
        indicator.yearlyChange = treasuryDataService.calculateChange(indicator.data, 12);
      }
    }
    
    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching treasury dashboard:', error.message);
    
    // Return minimal dashboard structure
    return res.json({
      success: true,
      data: {
        treasury10Y: {
          id: 'DGS10',
          name: '10-Year Treasury Yield',
          data: [],
          error: error.message
        },
        dollarIndex: {
          id: 'DTWEXBGS',
          name: 'US Dollar Index (Broad)',
          data: [],
          error: error.message
        }
      },
      note: 'Service temporarily unavailable'
    });
  }
});

/**
 * @route GET /api/treasury/status
 * @description Check treasury data service status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = await treasuryDataService.checkServiceStatus();
    return res.json(status);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
