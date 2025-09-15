/**
 * Clean Analysis Routes - Uses proper separation of concerns
 * CRITICAL: Python handles ALL calculations, AI handles ONLY interpretations
 */

import express from 'express';
import properAnalysisService from '../services/properAnalysisService.js';

const router = express.Router();

// All routes use the same clean pattern
router.get('/market-phase', async (req, res) => {
  const result = await properAnalysisService.analyze('marketPhase', {});
  res.json(result);
});

router.get('/sectors', async (req, res) => {
  const result = await properAnalysisService.analyze('sectors', {});
  res.json(result);
});

router.get('/correlations/:pair', async (req, res) => {
  const result = await properAnalysisService.analyze('correlations', {
    pair: req.params.pair
  });
  res.json(result);
});

router.get('/index/:symbol', async (req, res) => {
  const result = await properAnalysisService.analyze('marketPhase', {
    symbol: req.params.symbol
  });
  res.json(result);
});

router.get('/macro', async (req, res) => {
  const result = await properAnalysisService.analyze('marketPhase', {});
  res.json(result);
});

export default router;
