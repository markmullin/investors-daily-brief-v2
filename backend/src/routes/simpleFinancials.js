import express from 'express';
import fmpService from '../services/fmpService.js';

const router = express.Router();

// Direct FMP endpoints - no complex processing
router.get('/balance-sheet/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 12 } = req.query;
    
    const data = await fmpService.makeRequest(
      `/v3/balance-sheet-statement/${symbol}`,
      { period: 'quarter', limit: parseInt(limit) },
      300
    );
    
    res.json({
      symbol,
      dataPoints: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Balance sheet error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/income-statement/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 12 } = req.query;
    
    const data = await fmpService.makeRequest(
      `/v3/income-statement/${symbol}`,
      { period: 'quarter', limit: parseInt(limit) },
      300
    );
    
    res.json({
      symbol,
      dataPoints: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Income statement error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/cash-flow/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 12 } = req.query;
    
    const data = await fmpService.makeRequest(
      `/v3/cash-flow-statement/${symbol}`,
      { period: 'quarter', limit: parseInt(limit) },
      300
    );
    
    res.json({
      symbol,
      dataPoints: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Cash flow error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
