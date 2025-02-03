import express from 'express';
import marketEnvironmentService from '../services/marketEnvironmentService.js';

const router = express.Router();

router.get('/score', async (req, res, next) => {
  try {
    const environmentData = await marketEnvironmentService.calculateMarketScore();
    res.json(environmentData);
  } catch (error) {
    next(error);
  }
});

export default router;