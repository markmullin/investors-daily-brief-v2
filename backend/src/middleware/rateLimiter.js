/**
 * Rate limiting middleware for production security
 * Implements tiered rate limiting for different endpoint types
 */

import rateLimit from 'express-rate-limit';

// Global rate limiter - general API endpoints
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Please wait a moment before making another request',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, options) => {
    console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Strict rate limiter - auth and sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  skipSuccessfulRequests: false,
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait before trying again',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, options) => {
    console.error(`🚨 Auth rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// API rate limiter - external API calls
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API calls. Please reduce request frequency',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Data-intensive endpoints limiter
const dataLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes
  message: {
    error: 'Data request limit exceeded',
    message: 'Too many data-intensive requests. Please wait before requesting large datasets',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Export all limiters
export const rateLimiter = {
  global: globalLimiter,
  strict: strictLimiter,
  api: apiLimiter,
  data: dataLimiter
};
