import express from 'express';
import fredService from '../services/fredService.js';
import NodeCache from 'node-cache';

const router = express.Router();
// Cache for 1 hour (3600 seconds) since macro data doesn't change frequently
const cache = new NodeCache({ stdTTL: 3600 });

// Get all macro data
router.get('/all', async (req, res) => {
  try {
    // Check cache first
    const cachedData = cache.get('macro_all');
    if (cachedData) {
      console.log('Returning cached macro data');
      return res.json(cachedData);
    }

    console.log('Fetching fresh macro data from FRED API...');
    const data = await fredService.getAllMacroData();
    
    // Cache the data
    cache.set('macro_all', data);
    
    res.json(data);
  } catch (error) {
    console.error('Macro data endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch macroeconomic data',
      details: error.message 
    });
  }
});

// Get interest rates
router.get('/interest-rates', async (req, res) => {
  try {
    const cachedData = cache.get('macro_interest_rates');
    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await fredService.getInterestRates();
    cache.set('macro_interest_rates', data);
    
    res.json(data);
  } catch (error) {
    console.error('Interest rates endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch interest rate data',
      details: error.message 
    });
  }
});

// Get growth and inflation data
router.get('/growth-inflation', async (req, res) => {
  try {
    const cachedData = cache.get('macro_growth_inflation');
    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await fredService.getGrowthAndInflation();
    cache.set('macro_growth_inflation', data);
    
    res.json(data);
  } catch (error) {
    console.error('Growth/inflation endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch growth and inflation data',
      details: error.message 
    });
  }
});

// Get labor and consumer data
router.get('/labor-consumer', async (req, res) => {
  try {
    const cachedData = cache.get('macro_labor_consumer');
    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await fredService.getLaborAndConsumer();
    cache.set('macro_labor_consumer', data);
    
    res.json(data);
  } catch (error) {
    console.error('Labor/consumer endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch labor and consumer data',
      details: error.message 
    });
  }
});

export default router;