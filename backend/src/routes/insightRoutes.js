import express from 'express';
import marketInsights from '../services/insights/marketInsights.js';

const router = express.Router();

router.get('/market-insights', async (req, res) => {
  try {
    const insights = await marketInsights.generateMarketInsights();
    res.json(insights);
  } catch (error) {
    console.error('Error getting market insights:', error);
    res.status(500).json({ error: 'Failed to generate market insights' });
  }
});

router.get('/relationships', async (req, res) => {
  try {
    const relationships = await marketInsights.getRelationshipInsights();
    res.json(relationships);
  } catch (error) {
    console.error('Error getting relationship insights:', error);
    res.status(500).json({ error: 'Failed to get relationship insights' });
  }
});

router.get('/environment', async (req, res) => {
  try {
    const environment = await marketInsights.getEnvironmentInsights();
    res.json(environment);
  } catch (error) {
    console.error('Error getting environment insights:', error);
    res.status(500).json({ error: 'Failed to get environment insights' });
  }
});

export default router;