import express from 'express';
import axios from 'axios';

const router = express.Router();
const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Helper function for FMP requests with error handling
async function fetchFromFMP(endpoint) {
  try {
    const url = `${FMP_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${FMP_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`FMP API Error for ${endpoint}:`, error.message);
    throw error;
  }
}

// GET /api/earnings/:symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 Fetching earnings data for ${symbol}`);
    
    // Fetch earnings data
    const [historical, calendar, surprises] = await Promise.all([
      fetchFromFMP(`/historical-earning-calendar/${symbol}?limit=12`),
      fetchFromFMP(`/earning_calendar?symbol=${symbol}`),
      fetchFromFMP(`/earnings-surprises/${symbol}`)
    ]);
    
    const earningsData = {
      symbol,
      nextEarnings: calendar[0] || {},
      historicalEarnings: historical.map(e => ({
        date: e.date,
        eps: e.eps,
        epsEstimated: e.epsEstimated,
        revenue: e.revenue,
        revenueEstimated: e.revenueEstimated,
        time: e.time,
        updatedFromDate: e.updatedFromDate,
        fiscalDateEnding: e.fiscalDateEnding
      })),
      surprises: surprises.map(s => ({
        date: s.date,
        actualEarningResult: s.actualEarningResult,
        estimatedEarning: s.estimatedEarning,
        epsSurprise: s.actualEarningResult - s.estimatedEarning,
        epsSurprisePercent: ((s.actualEarningResult - s.estimatedEarning) / Math.abs(s.estimatedEarning)) * 100
      })),
      summary: {
        beatCount: surprises.filter(s => s.actualEarningResult > s.estimatedEarning).length,
        missCount: surprises.filter(s => s.actualEarningResult < s.estimatedEarning).length,
        meetCount: surprises.filter(s => s.actualEarningResult === s.estimatedEarning).length,
        averageSurprise: surprises.length > 0 
          ? surprises.reduce((acc, s) => acc + (s.actualEarningResult - s.estimatedEarning), 0) / surprises.length
          : 0
      }
    };
    
    res.json(earningsData);
  } catch (error) {
    console.error('Error fetching earnings data:', error);
    res.status(500).json({ error: 'Failed to fetch earnings data', message: error.message });
  }
});

export default router;
