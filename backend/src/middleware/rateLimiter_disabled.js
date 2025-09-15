/**
 * TEMPORARILY DISABLE RATE LIMITING FOR DEVELOPMENT
 * Comment this out to disable all rate limiting
 */

// Configuration
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true'; // Defaults to false

export const rateLimiter = {
  global: (req, res, next) => {
    // SKIP ALL RATE LIMITING IN DEVELOPMENT
    if (!RATE_LIMIT_ENABLED) {
      return next();
    }
    
    // Original rate limiting code would go here
    next();
  },
  
  strict: (req, res, next) => {
    // SKIP ALL RATE LIMITING IN DEVELOPMENT
    if (!RATE_LIMIT_ENABLED) {
      return next();
    }
    
    // Original strict limiting would go here
    next();
  },
  
  api: (req, res, next) => {
    // SKIP ALL RATE LIMITING IN DEVELOPMENT
    if (!RATE_LIMIT_ENABLED) {
      return next();
    }
    
    // Original API limiting would go here
    next();
  }
};

console.log('⚠️ RATE LIMITING:', RATE_LIMIT_ENABLED ? 'ENABLED' : 'DISABLED (Development Mode)');
