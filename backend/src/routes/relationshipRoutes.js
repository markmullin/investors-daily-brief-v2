import express from 'express';
import marketEnvironmentService from '../services/marketEnvironmentService.js';

const router = express.Router();

router.get('/relationships', async (req, res) => {
  try {
    const relationships = await marketEnvironmentService.analyzeMarketRelationships();
    res.json(relationships);
  } catch (error) {
    console.error('Error fetching relationship data:', error);
    res.status(500).json({ error: 'Failed to fetch relationship data' });
  }
});

export default router;