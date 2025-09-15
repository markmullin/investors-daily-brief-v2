/**
 * Input validation middleware for security
 * Sanitizes and validates all incoming request data
 */

import validator from 'validator';
import xss from 'xss';

/**
 * Sanitize a value by removing potential XSS
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove XSS attempts
    return xss(value, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    }).trim();
  }
  return value;
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return sanitizeValue(obj);
};

/**
 * Validate common input patterns
 */
const validators = {
  symbol: (value) => {
    if (!value || typeof value !== 'string') return false;
    // Stock symbols: 1-5 uppercase letters, optional .US suffix
    // Index symbols: ^GSPC, ^IXIC, ^DJI, ^RUT, etc.
    // Crypto: BTCUSD, ETHUSD, etc.
    const upperValue = value.toUpperCase();
    return /^(\^)?[A-Z]{1,10}(\.US|USD)?$/.test(upperValue);
  },
  
  email: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isEmail(value);
  },
  
  number: (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },
  
  date: (value) => {
    if (!value) return false;
    return validator.isISO8601(value.toString());
  },
  
  boolean: (value) => {
    return typeof value === 'boolean' || value === 'true' || value === 'false';
  },
  
  url: (value) => {
    if (!value || typeof value !== 'string') return false;
    return validator.isURL(value, {
      protocols: ['http', 'https'],
      require_protocol: true
    });
  }
};

/**
 * Input validation middleware
 */
export const validateInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize route parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    // Validate specific parameters based on route
    const validationErrors = [];
    
    // Symbol validation for stock-related routes
    // Skip validation for certain endpoints that don't need symbols
    const skipSymbolValidation = [
      '/api/intelligent-analysis/sectors',
      '/api/intelligent-analysis/macro',
      '/api/intelligent-analysis/market-phase',
      '/api/sector-performance',
      '/api/macroeconomic'
    ];
    
    const shouldValidateSymbol = !skipSymbolValidation.some(path => req.path.includes(path));
    
    if (shouldValidateSymbol && (req.params.symbol || req.query.symbol)) {
      const symbol = req.params.symbol || req.query.symbol;
      if (!validators.symbol(symbol)) {
        validationErrors.push(`Invalid stock symbol: ${symbol}`);
      } else {
        // Normalize symbol to uppercase
        if (req.params.symbol) req.params.symbol = symbol.toUpperCase();
        if (req.query.symbol) req.query.symbol = symbol.toUpperCase();
      }
    }
    
    // Email validation for auth routes
    if (req.path.includes('/auth') && req.body.email) {
      if (!validators.email(req.body.email)) {
        validationErrors.push('Invalid email address');
      }
    }
    
    // Numeric validation for pagination
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        validationErrors.push('Limit must be between 1 and 1000');
      }
    }
    
    if (req.query.offset) {
      const offset = parseInt(req.query.offset);
      if (isNaN(offset) || offset < 0) {
        validationErrors.push('Offset must be a non-negative number');
      }
    }
    
    // Date validation for time-based queries
    if (req.query.startDate && !validators.date(req.query.startDate)) {
      validationErrors.push('Invalid start date format');
    }
    
    if (req.query.endDate && !validators.date(req.query.endDate)) {
      validationErrors.push('Invalid end date format');
    }
    
    // SQL injection prevention for any field that might be used in queries
    const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|SCRIPT)\b)/gi;
    
    const checkSqlInjection = (obj, path = '') => {
      if (typeof obj === 'string' && sqlInjectionPattern.test(obj)) {
        validationErrors.push(`Potential SQL injection detected in ${path}`);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          checkSqlInjection(value, path ? `${path}.${key}` : key);
        });
      }
    };
    
    checkSqlInjection(req.body, 'body');
    checkSqlInjection(req.query, 'query');
    checkSqlInjection(req.params, 'params');
    
    // If validation errors, return bad request
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        errors: validationErrors
      });
    }
    
    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(500).json({
      error: 'Validation Error',
      message: 'Error validating input'
    });
  }
};

// Export validators for use in specific routes
export const inputValidators = validators;
