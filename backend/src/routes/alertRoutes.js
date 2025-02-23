import express from 'express';
import marketAlertService from '../services/insights/marketAlertService.js';

const router = express.Router();

router.get('/market-alerts', async (req, res) => {
  try {
    const alerts = await marketAlertService.checkForAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error getting market alerts:', error);
    res.status(500).json({ error: 'Failed to get market alerts' });
  }
});

router.get('/market-state', async (req, res) => {
  try {
    const state = await marketAlertService.getCurrentState();
    res.json(state);
  } catch (error) {
    console.error('Error getting market state:', error);
    res.status(500).json({ error: 'Failed to get market state' });
  }
});

export default router;