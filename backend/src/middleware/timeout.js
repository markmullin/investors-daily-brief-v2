/**
 * Timeout Middleware for API Routes
 * 
 * This middleware ensures that API routes respond within a reasonable time
 * by implementing proper timeout handling and providing fallback data.
 */

// Configuration for different route types with increased timeouts
const TIMEOUT_CONFIG = {
  // Route path prefix: [timeout in ms, priority]
  '/api/macro-analysis': [60000, 'high'],   // Macro analysis gets 60 seconds
  '/api/industry-analysis': [45000, 'high'],// Industry analysis gets 45 seconds
  '/api/market': [30000, 'critical'],       // Market data gets 30 seconds
  '/api/market-environment': [30000, 'critical'], // Market environment gets 30 seconds
  '/api/insights': [30000, 'medium'],       // Insights get 30 seconds
  '/api/monitoring': [20000, 'medium'],     // Monitoring gets 20 seconds
  'default': [30000, 'medium']              // Default for all other routes
};

// Import eodService using ES module syntax
import eodService from '../services/eodService.js';

/**
 * Middleware to handle timeouts for API routes
 */
export const timeoutMiddleware = (req, res, next) => {
  // Determine which timeout config to use based on the route
  const routePrefix = Object.keys(TIMEOUT_CONFIG).find(prefix => 
    req.path.startsWith(prefix)
  ) || 'default';
  
  const [timeout, priority] = TIMEOUT_CONFIG[routePrefix];
  
  // Skip timeout for health check routes
  if (req.path.includes('/health')) {
    return next();
  }
  
  // Flag to track if timeout has been handled
  let timeoutHandled = false;
  
  // Log long-running requests for monitoring
  const startTime = Date.now();
  const logRequestDuration = () => {
    const duration = Date.now() - startTime;
    if (duration > timeout * 0.8) { // Log if used more than 80% of allowed time
      console.warn(`⚠️ Route ${req.method} ${req.path} took ${duration}ms (threshold: ${timeout}ms)`);
    }
  };
  
  // Create timeout handler
  const timeoutId = setTimeout(() => {
    // Check if response has already been sent or timeout handled
    if (!res.headersSent && !timeoutHandled) {
      timeoutHandled = true;
      
      console.error(`🚨 Timeout (${timeout}ms) exceeded for ${req.method} ${req.path}`);
      
      // Clear listeners to prevent memory leaks
      res.removeListener('finish', logRequestDuration);
      res.removeListener('close', logRequestDuration);
      
      // Send timeout response
      res.status(503).json({
        error: 'Request timed out',
        message: 'The server took too long to process this request',
        path: req.path,
        timeout: timeout
      });
    }
  }, timeout);
  
  // Log completion time
  res.on('finish', () => {
    if (!timeoutHandled) {
      logRequestDuration();
      clearTimeout(timeoutId);
    }
  });
  
  res.on('close', () => {
    if (!timeoutHandled) {
      logRequestDuration();
      clearTimeout(timeoutId);
    }
  });
  
  next();
};

// Export as default as well for compatibility
export default timeoutMiddleware;