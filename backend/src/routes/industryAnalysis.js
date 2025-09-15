// backend/src/routes/industryAnalysis.js
import express from 'express';
import { industryAnalysisService } from '../services/industryAnalysis/industryAnalysisService.js';

const router = express.Router();

router.get('/all', async (req, res, next) => {
  try {
    const response = await industryAnalysisService.getAllPairs();
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/:pairKey', async (req, res, next) => {
  try {
    const { pairKey } = req.params;
    const response = await industryAnalysisService.getAllPairs();
    res.json(response[pairKey]);
  } catch (error) {
    next(error);
  }
});

export default router;
