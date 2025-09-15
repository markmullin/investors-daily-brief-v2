/**
 * INPUT VALIDATION MIDDLEWARE
 * Production-grade input sanitization and validation
 * 
 * Think of this like airport security for your API:
 * 1. Scanner = Check for dangerous patterns
 * 2. Metal Detector = Block SQL injection
 * 3. X-Ray = Prevent XSS attacks
 * 4. ID Check = Validate data formats
 * 5. Security Log = Track suspicious activity
 */

import validator from 'validator';
import xss from 'xss';
import sqlstring from 'sqlstring';

/**
 * SECURITY PATTERNS
 * Common attack patterns to block
 */
const DANGEROUS_PATTERNS = {
  // SQL Injection patterns
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi,
    /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/gi,  // OR 1=1
    /(--|\||;|\/\*|\*\/)/g,              // SQL comments and delimiters
    /(\bSLEEP\b|\bWAITFOR\b|\bDELAY\b)/gi, // Time-based attacks
  ],
  
  // XSS patterns
  xssPatterns: [
    /<script[^>]*>.*?<\/script>/gi,      // Script tags
    /javascript:/gi,                     // JavaScript protocol
    /on\w+\s*=/gi,                      // Event handlers (onclick, etc)
    /<iframe/gi,                        // iFrames
    /<object/gi,                        // Objects
    /<embed/gi,                         // Embeds
  ],
  
  // Path traversal patterns
  pathTraversal: [
    /\.\.\//g,                          // ../
    /\.\.%2F/gi,                        // URL encoded ../
    /\.\.%5C/gi,                        // URL encoded ..\
    /%2e%2e/gi,                         // Double encoded
  ],
  
  // Command injection patterns
  commandInjection: [
    /[;&|`$]/g,                         // Shell metacharacters
    /\$\(/g,                            // Command substitution
    /\|\|/g,                            // OR operator
    /&&/g,                              // AND operator
  ]
};

/**
 * VALIDATION RULES
 * Rules for common input types
 */
const VALIDATION_RULES = {
  // Stock symbol validation
  stockSymbol: {
    pattern: /^[A-Z]{1,5}$/,
    maxLength: 5,
    errorMessage: 'Invalid stock symbol. Must be 1-5 uppercase letters.'
  },
  
  // Period validation
  period: {
    allowed: ['1d', '5d', '1m', '3m', '6m', '1y', '5y', 'max'],
    errorMessage: 'Invalid period. Must be one of: 1d, 5d, 1m, 3m, 6m, 1y, 5y, max'
  },
  
  // Numeric ID validation
  numericId: {
    pattern: /^\d+$/,
    maxLength: 20,
    errorMessage: 'Invalid ID. Must be numeric.'
  },
  
  // Date validation
  date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    validator: (value) => validator.isDate(value),
    errorMessage: 'Invalid date. Must be YYYY-MM-DD format.'
  },
  
  // Email validation
  email: {
    validator: (value) => validator.isEmail(value),
    maxLength: 255,
    errorMessage: 'Invalid email address.'
  },
  
  // Search query validation
  searchQuery: {
    maxLength: 100,
    minLength: 1,
    errorMessage: 'Search query must be 1-100 characters.'
  }
};

/**
 * REQUEST TRACKING
 * Track suspicious requests for security monitoring
 */
class SecurityMonitor {
  constructor() {
    this.suspiciousIPs = new Map();
    this.blockedIPs = new Set();
    this.alertThreshold = 10; // Block after 10 suspicious requests
  }
  
  recordSuspiciousActivity(ip, reason) {
    const count = (this.suspiciousIPs.get(ip) || 0) + 1;
    this.suspiciousIPs.set(ip, count);
    
    console.warn(`🚨 [SECURITY] Suspicious activity from ${ip}: ${reason} (count: ${count})`);
    
    if (count >= this.alertThreshold) {
      this.blockIP(ip);
    }
    
    return count;
  }
  
  blockIP(ip) {
    this.blockedIPs.add(ip);
    console.error(`🔒 [SECURITY] IP BLOCKED: ${ip} - Too many suspicious requests`);
  }
  
  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }
  
  getStats() {
    return {
      suspiciousIPs: this.suspiciousIPs.size,
      blockedIPs: this.blockedIPs.size,
      topOffenders: Array.from(this.suspiciousIPs.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count }))
    };
  }
}

const securityMonitor = new SecurityMonitor();

/**
 * MAIN VALIDATION MIDDLEWARE
 * Validates and sanitizes all incoming requests
 */
export function validateInput(validationConfig = {}) {
  return (req, res, next) => {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check if IP is blocked
    if (securityMonitor.isBlocked(clientIP)) {
      console.error(`🚫 [SECURITY] Blocked IP attempted access: ${clientIP}`);
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied due to security violations.'
      });
    }
    
    try {
      // Validate params
      if (req.params) {
        validateParams(req.params, validationConfig.params || {}, clientIP);
      }
      
      // Validate query
      if (req.query) {
        validateQuery(req.query, validationConfig.query || {}, clientIP);
      }
      
      // Validate body
      if (req.body) {
        validateBody(req.body, validationConfig.body || {}, clientIP);
      }
      
      // Log validation time
      const validationTime = Date.now() - startTime;
      if (validationTime > 10) {
        console.log(`⏱️ [SECURITY] Validation took ${validationTime}ms for ${req.path}`);
      }
      
      next();
    } catch (error) {
      // Record suspicious activity
      securityMonitor.recordSuspiciousActivity(clientIP, error.message);
      
      // Return validation error
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field || null
      });
    }
  };
}

/**
 * PARAMETER VALIDATION
 * Validates URL parameters (e.g., /api/quote/:symbol)
 */
function validateParams(params, rules, clientIP) {
  for (const [key, value] of Object.entries(params)) {
    // Check for dangerous patterns
    checkForAttacks(value, key, clientIP);
    
    // Apply validation rules
    if (rules[key]) {
      validateField(key, value, rules[key]);
    }
    
    // Sanitize the value
    params[key] = sanitizeValue(value);
  }
}

/**
 * QUERY VALIDATION
 * Validates query parameters (e.g., ?period=1d&limit=10)
 */
function validateQuery(query, rules, clientIP) {
  for (const [key, value] of Object.entries(query)) {
    // Check for dangerous patterns
    checkForAttacks(value, key, clientIP);
    
    // Apply validation rules
    if (rules[key]) {
      validateField(key, value, rules[key]);
    }
    
    // Sanitize the value
    query[key] = sanitizeValue(value);
  }
}

/**
 * BODY VALIDATION
 * Validates request body (POST/PUT data)
 */
function validateBody(body, rules, clientIP) {
  // Check body size
  const bodySize = JSON.stringify(body).length;
  if (bodySize > 1048576) { // 1MB limit
    throw new ValidationError('Request body too large', 'body');
  }
  
  // Recursively validate body
  function validateObject(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        checkForAttacks(value, fieldPath, clientIP);
        obj[key] = sanitizeValue(value);
      } else if (typeof value === 'object' && value !== null) {
        validateObject(value, fieldPath);
      }
      
      // Apply specific rules
      if (rules[fieldPath]) {
        validateField(fieldPath, value, rules[fieldPath]);
      }
    }
  }
  
  validateObject(body);
}

/**
 * CHECK FOR ATTACKS
 * Detects common attack patterns
 */
function checkForAttacks(value, field, clientIP) {
  if (typeof value !== 'string') return;
  
  // Check SQL injection
  for (const pattern of DANGEROUS_PATTERNS.sqlInjection) {
    if (pattern.test(value)) {
      throw new ValidationError(`SQL injection attempt detected in ${field}`, field);
    }
  }
  
  // Check XSS
  for (const pattern of DANGEROUS_PATTERNS.xssPatterns) {
    if (pattern.test(value)) {
      throw new ValidationError(`XSS attempt detected in ${field}`, field);
    }
  }
  
  // Check path traversal
  for (const pattern of DANGEROUS_PATTERNS.pathTraversal) {
    if (pattern.test(value)) {
      throw new ValidationError(`Path traversal attempt detected in ${field}`, field);
    }
  }
  
  // Check command injection
  for (const pattern of DANGEROUS_PATTERNS.commandInjection) {
    if (pattern.test(value)) {
      throw new ValidationError(`Command injection attempt detected in ${field}`, field);
    }
  }
}

/**
 * FIELD VALIDATION
 * Validates individual fields against rules
 */
function validateField(field, value, rule) {
  // Check if using predefined rule
  if (typeof rule === 'string' && VALIDATION_RULES[rule]) {
    rule = VALIDATION_RULES[rule];
  }
  
  // Required check
  if (rule.required && !value) {
    throw new ValidationError(`${field} is required`, field);
  }
  
  // Skip validation if not required and empty
  if (!rule.required && !value) return;
  
  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    throw new ValidationError(rule.errorMessage || `Invalid format for ${field}`, field);
  }
  
  // Custom validator
  if (rule.validator && !rule.validator(value)) {
    throw new ValidationError(rule.errorMessage || `Invalid value for ${field}`, field);
  }
  
  // Allowed values
  if (rule.allowed && !rule.allowed.includes(value)) {
    throw new ValidationError(rule.errorMessage || `Invalid value for ${field}`, field);
  }
  
  // Length validation
  if (rule.maxLength && value.length > rule.maxLength) {
    throw new ValidationError(`${field} exceeds maximum length of ${rule.maxLength}`, field);
  }
  
  if (rule.minLength && value.length < rule.minLength) {
    throw new ValidationError(`${field} must be at least ${rule.minLength} characters`, field);
  }
}

/**
 * VALUE SANITIZATION
 * Cleans values to prevent attacks
 */
function sanitizeValue(value) {
  if (typeof value !== 'string') return value;
  
  // Remove null bytes
  value = value.replace(/\0/g, '');
  
  // Trim whitespace
  value = value.trim();
  
  // Basic XSS prevention (for output)
  value = xss(value, {
    whiteList: {},          // No HTML tags allowed
    stripIgnoreTag: true,   // Remove all HTML
    stripIgnoreTagBody: ['script', 'style'] // Remove script/style content
  });
  
  return value;
}

/**
 * VALIDATION ERROR CLASS
 */
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * PRE-CONFIGURED VALIDATORS
 * Ready-to-use validators for common endpoints
 */
export const validators = {
  // Stock quote validation
  stockQuote: validateInput({
    params: {
      symbol: 'stockSymbol'
    }
  }),
  
  // Historical data validation
  historicalData: validateInput({
    params: {
      symbol: 'stockSymbol'
    },
    query: {
      period: 'period',
      timestamp: 'numericId'
    }
  }),
  
  // Search validation
  search: validateInput({
    query: {
      q: 'searchQuery',
      limit: {
        pattern: /^\d+$/,
        validator: (value) => parseInt(value) > 0 && parseInt(value) <= 100,
        errorMessage: 'Limit must be between 1 and 100'
      }
    }
  }),
  
  // Portfolio upload validation
  portfolioUpload: validateInput({
    body: {
      name: {
        required: true,
        maxLength: 100,
        minLength: 1,
        errorMessage: 'Portfolio name must be 1-100 characters'
      }
    }
  })
};

/**
 * SQL ESCAPE HELPER
 * For database queries (if needed)
 */
export function escapeSql(value) {
  return sqlstring.escape(value);
}

/**
 * SECURITY STATS ENDPOINT
 * Get security monitoring statistics
 */
export function getSecurityStats() {
  return securityMonitor.getStats();
}

export default validateInput;
