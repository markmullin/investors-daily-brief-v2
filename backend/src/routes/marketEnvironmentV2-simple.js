/**
 * Minimal Market Environment V2 Routes - For Testing
 */

import express from 'express';

const router = express.Router();

// Simple test endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Market Environment V2 is working!',
    timestamp: new Date().toISOString()
  });
});

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    path: req.path,
    baseUrl: req.baseUrl
  });
});

export default router;
