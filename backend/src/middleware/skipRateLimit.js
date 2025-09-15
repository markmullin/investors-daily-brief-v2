/**
 * Disable rate limiting for GPT-OSS endpoints
 * These take 30-50 seconds for GPU generation, so rate limiting breaks them
 */

import express from 'express';
const router = express.Router();

// Middleware to skip rate limiting for GPT-OSS routes
router.use((req, res, next) => {
  // Mark these requests to skip rate limiting
  req.skipRateLimit = true;
  next();
});

export default router;
