import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { redis } from '../config/database.js';
import logger from '../utils/logger.js';
import { AppError, RateLimitError } from './errorHandler.js';

// Redis-based rate limiting store
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rate_limit:';
    this.client = redis;
  }

  async increment(key) {
    const fullKey = this.prefix + key;
    
    try {
      const current = await this.client.incr(fullKey);
      
      if (current === 1) {
        // First request, set expiration
        await this.client.expire(fullKey, 60); // 60 seconds default window
      }
      
      const ttl = await this.client.ttl(fullKey);
      
      return {
        totalHits: current,
        resetTime: new Date(Date.now() + (ttl * 1000))
      };
    } catch (error) {
      logger.error('Redis rate limit store error:', error);
      // Fallback to allow request on Redis error
      return { totalHits: 1, resetTime: new Date(Date.now() + 60000) };
    }
  }

  async decrement(key) {
    const fullKey = this.prefix + key;
    
    try {
      await this.client.decr(fullKey);
    } catch (error) {
      logger.error('Redis rate limit decrement error:', error);
    }
  }

  async resetKey(key) {
    const fullKey = this.prefix + key;
    
    try {
      await this.client.del(fullKey);
    } catch (error) {
      logger.error('Redis rate limit reset error:', error);
    }
  }
}

// Create rate limiting configurations
export const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per windowMs
    message = 'Too many requests from this IP',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    standardHeaders = true,
    legacyHeaders = false,
    store = new RedisStore({ prefix: options.prefix || 'rate_limit:' })
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    keyGenerator,
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders,
    legacyHeaders,
    store,
    handler: (req, res) => {
      const error = new RateLimitError(message, Math.ceil(windowMs / 1000));
      
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        userId: req.user?.id
      });

      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limiting strategies

// General API rate limiting
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later',
  prefix: 'general:'
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  prefix: 'auth:',
  keyGenerator: (req) => req.ip + ':auth',
  skipSuccessfulRequests: true
});

// Market data endpoints rate limiting
export const marketDataRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Market data rate limit exceeded',
  prefix: 'market:',
  keyGenerator: (req) => {
    // Rate limit by user if authenticated, otherwise by IP
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  }
});

// Portfolio operations rate limiting
export const portfolioRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute per user
  message: 'Portfolio operations rate limit exceeded',
  prefix: 'portfolio:',
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`
});

// Calculation endpoints rate limiting (more restrictive)
export const calculationRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 calculations per minute per user
  message: 'Financial calculations rate limit exceeded',
  prefix: 'calc:',
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`
});

// Registration rate limiting (very strict)
export const registrationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many registration attempts from this IP',
  prefix: 'register:',
  skipSuccessfulRequests: false
});

// Password reset rate limiting
export const passwordResetRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 password reset attempts per 15 minutes
  message: 'Too many password reset attempts',
  prefix: 'reset:',
  keyGenerator: (req) => req.ip + ':reset'
});

// Dynamic rate limiting based on user tier
export const dynamicRateLimit = (req, res, next) => {
  if (!req.user) {
    return generalRateLimit(req, res, next);
  }

  // Adjust limits based on user's investment experience
  let maxRequests;
  switch (req.user.investmentExperience) {
    case 'professional':
      maxRequests = 2000;
      break;
    case 'advanced':
      maxRequests = 1500;
      break;
    case 'intermediate':
      maxRequests = 1000;
      break;
    default: // beginner
      maxRequests = 500;
      break;
  }

  const userRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: `Rate limit exceeded for your account tier`,
    prefix: `user_tier:${req.user.investmentExperience}:`,
    keyGenerator: (req) => `user:${req.user.id}`
  });

  return userRateLimit(req, res, next);
};

// Security middleware configuration
export const securityMiddleware = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "wss:", "https://api.financialmodelingprep.com", "https://eodhistoricaldata.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Disable for API usage
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
};

// Compression middleware with optimization
export const compressionMiddleware = () => {
  return compression({
    filter: (req, res) => {
      // Don't compress if the request includes a cache-control no-transform directive
      if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
        return false;
      }

      // Compress JSON and text responses
      return compression.filter(req, res);
    },
    level: 6, // Compression level (1-9, 6 is good balance)
    threshold: 1024, // Only compress if response is over 1KB
    memLevel: 8 // Memory usage (1-9, 8 is default)
  });
};

// Request timeout middleware
export const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout:', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timeout: timeoutMs
        });

        res.status(408).json({
          success: false,
          message: 'Request timeout',
          timeout: `${timeoutMs}ms`
        });
      }
    }, timeoutMs);

    // Clear timeout if response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Request size limiting middleware
export const requestSizeLimit = (limit = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = typeof limit === 'string' ? 
      parseInt(limit.replace(/[^\d]/g, '')) * (limit.includes('mb') ? 1024 * 1024 : 1024) : 
      limit;

    if (contentLength > maxSize) {
      logger.warn('Request size limit exceeded:', {
        contentLength,
        maxSize,
        ip: req.ip,
        url: req.originalUrl
      });

      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        maxSize: limit
      });
    }

    next();
  };
};

// IP whitelist/blacklist middleware
export const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;

  return (req, res, next) => {
    const clientIP = req.ip;

    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIP)) {
      logger.warn('Blocked IP attempted access:', {
        ip: clientIP,
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check whitelist if configured
    if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
      logger.warn('Non-whitelisted IP attempted access:', {
        ip: clientIP,
        url: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

// API version middleware
export const apiVersioning = (req, res, next) => {
  // Get version from header or default to v1
  const version = req.get('API-Version') || req.query.version || 'v1';
  
  // Validate version
  const supportedVersions = ['v1', 'v2'];
  if (!supportedVersions.includes(version)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported API version',
      supportedVersions
    });
  }

  req.apiVersion = version;
  res.set('API-Version', version);
  next();
};

// CORS configuration for market dashboard
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'API-Version',
    'X-API-Key'
  ],
  exposedHeaders: ['API-Version', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

export default {
  createRateLimit,
  generalRateLimit,
  authRateLimit,
  marketDataRateLimit,
  portfolioRateLimit,
  calculationRateLimit,
  registrationRateLimit,
  passwordResetRateLimit,
  dynamicRateLimit,
  securityMiddleware,
  compressionMiddleware,
  timeoutMiddleware,
  requestSizeLimit,
  ipFilter,
  apiVersioning,
  corsOptions
};