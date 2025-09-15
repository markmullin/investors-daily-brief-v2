/**
 * API Key validation middleware for protecting sensitive endpoints
 */

import crypto from 'crypto';
import { redis } from '../config/database.js';

// In production, these would be stored securely (e.g., AWS Secrets Manager)
const API_KEYS = new Set([
  process.env.API_KEY_1 || 'test-api-key-2024',
  process.env.API_KEY_2 || 'development-key-12345'
]);

// Cache for validated API keys (5 minute TTL)
const validatedKeys = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hash API key for logging (never log raw keys)
 */
const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
};

/**
 * Validate API key from request
 */
export const apiKeyValidator = async (req, res, next) => {
  try {
    // Skip validation in development if configured
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_API_KEY_VALIDATION === 'true') {
      return next();
    }
    
    // Extract API key from headers
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      console.warn(`⚠️ Missing API key for ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'Please provide a valid API key'
      });
    }
    
    // Check cache first
    const cachedValidation = validatedKeys.get(apiKey);
    if (cachedValidation && cachedValidation.expiry > Date.now()) {
      req.apiKeyHash = cachedValidation.hash;
      return next();
    }
    
    // Validate API key
    if (!API_KEYS.has(apiKey)) {
      const keyHash = hashApiKey(apiKey);
      console.error(`🚨 Invalid API key attempt: ${keyHash} for ${req.method} ${req.path} from IP: ${req.ip}`);
      
      // Log to Redis for monitoring
      if (redis.isConnected()) {
        await redis.incr(`api:invalid_key:${req.ip}`);
        await redis.expire(`api:invalid_key:${req.ip}`, 3600); // 1 hour
      }
      
      return res.status(403).json({
        error: 'Invalid API Key',
        message: 'The provided API key is not valid'
      });
    }
    
    // Cache successful validation
    const keyHash = hashApiKey(apiKey);
    validatedKeys.set(apiKey, {
      hash: keyHash,
      expiry: Date.now() + CACHE_TTL
    });
    
    // Clean up expired cache entries
    if (validatedKeys.size > 100) {
      const now = Date.now();
      for (const [key, value] of validatedKeys.entries()) {
        if (value.expiry <= now) {
          validatedKeys.delete(key);
        }
      }
    }
    
    // Add key hash to request for logging
    req.apiKeyHash = keyHash;
    
    // Log successful authentication
    console.log(`✅ API key authenticated: ${keyHash} for ${req.method} ${req.path}`);
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      error: 'Authentication Error',
      message: 'Error validating API key'
    });
  }
};

/**
 * Generate a new API key
 */
export const generateApiKey = () => {
  const buffer = crypto.randomBytes(32);
  return `idb-${buffer.toString('hex')}`;
};

/**
 * Rotate API keys (called from security routes)
 */
export const rotateApiKey = (oldKey, newKey) => {
  if (API_KEYS.has(oldKey)) {
    API_KEYS.delete(oldKey);
    API_KEYS.add(newKey);
    validatedKeys.clear(); // Clear cache on rotation
    return true;
  }
  return false;
};
