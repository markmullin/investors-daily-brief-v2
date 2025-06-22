/**
 * Timeout Middleware for API Routes
 * 
 * This middleware ensures that API routes respond within a reasonable time
 * by implementing proper timeout handling and providing fallback data.
 */

// Configuration for different route types
const TIMEOUT_CONFIG = {
  // Route path prefix: [timeout in ms, priority]
  '/api/macro-analysis': [45000, 'high'],   // Macro analysis gets 45 seconds
  '/api/industry-analysis': [30000, 'high'],// Industry analysis gets 30 seconds
  '/api/market': [15000, 'critical'],       // Market data is critical, 15 seconds
  '/api/insights': [20000, 'medium'],       // Insights get 20 seconds
  'default': [20000, 'medium']              // Default for all other routes
};

// Import eodService using ES module syntax
import eodService from '../services/eodService.js';

/**
 * Middleware to handle timeouts for API routes
 */
const timeoutMiddleware = (req, res, next) => {
  // Determine which timeout config to use based on the route
  const routePrefix = Object.keys(TIMEOUT_CONFIG).find(prefix => 
    req.path.startsWith(prefix)
  ) || 'default';
  
  const [timeout, priority] = TIMEOUT_CONFIG[routePrefix];
  
  // Skip timeout for health check routes
  if (req.path.includes('/health')) {
    return next();
  }
  
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
    // Clear listeners to prevent memory leaks
    res.removeListener('finish', logRequestDuration);
    res.removeListener('close', logRequestDuration);
    
    // Only handle timeout if response hasn't been sent yet
    if (!res.headersSent) {
      console.error(`🚨 Timeout (${timeout}ms) exceeded for ${req.method} ${req.path}`);
      
      // For critical endpoints, return fallback data instead of error
      if (priority === 'critical') {
        // Determine appropriate fallback based on the endpoint
        let fallbackData = { error: 'Request timed out', fallback: true };
        
        if (req.path.includes('/indices')) {
          fallbackData = eodService.getFallbackMarketData();
        } else if (req.path.includes('/market-data')) {
          fallbackData = { indices: [], sectors: [], fallback: true };
        }
        
        res.status(200).json(fallbackData);
      } else {
        // For non-critical endpoints, return a timeout error
        res.status(503).json({
          error: 'Request timed out',
          message: 'The server took too long to process this request',
          path: req.path,
          timeout: timeout
        });
      }
    }
  }, timeout);
  
  // Log completion time
  res.on('finish', logRequestDuration);
  res.on('close', logRequestDuration);
  
  // Clear timeout when response is sent
  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));
  
  next();
};

// Export using ES module syntax
export default timeoutMiddleware;
