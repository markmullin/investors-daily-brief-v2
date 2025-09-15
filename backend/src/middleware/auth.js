import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { redis } from '../config/database.js';

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = User.verifyToken(token);
    
    // Get fresh user data
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (!isBlacklisted) {
        const decoded = User.verifyToken(token);
        const user = await User.findById(decoded.userId);
        
        if (user) {
          req.user = user;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Investment experience authorization
export const requireExperience = (minExperience) => {
  const experienceLevels = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'professional': 4
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userLevel = experienceLevels[req.user.investmentExperience] || 1;
    const requiredLevel = experienceLevels[minExperience] || 1;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `This feature requires ${minExperience} investment experience level`,
        currentExperience: req.user.investmentExperience,
        requiredExperience: minExperience
      });
    }

    next();
  };
};

// Rate limiting per user
export const userRateLimit = (requestsPerMinute = 60) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(); // Skip if no user (should be used after auth middleware)
    }

    const userId = req.user.id;
    const key = `rate_limit:user:${userId}`;
    
    try {
      const current = await redis.get(key);
      
      if (current === null) {
        // First request
        await redis.setex(key, 60, 1); // 60 seconds window
        next();
      } else if (parseInt(current) < requestsPerMinute) {
        // Within limit
        await redis.incr(key);
        next();
      } else {
        // Rate limit exceeded
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: await redis.ttl(key)
        });
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
};

// Logout (blacklist token)
export const logout = async (req, res) => {
  try {
    const token = req.token;
    
    if (token) {
      // Get token expiration
      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      
      // Blacklist token until it would naturally expire
      if (expiresIn > 0) {
        await redis.setex(`blacklist:${token}`, expiresIn, 'true');
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Validate API key (for external integrations)
export const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Check if API key is valid (you'll need to implement API key storage)
    const isValid = await redis.get(`api_key:${apiKey}`);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    req.apiKey = apiKey;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      message: 'API key validation failed'
    });
  }
};

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireExperience,
  userRateLimit,
  logout,
  validateApiKey
};
