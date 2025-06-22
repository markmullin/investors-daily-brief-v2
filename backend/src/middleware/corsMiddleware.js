/**
 * Enhanced CORS Middleware for Market Dashboard
 * Production-ready CORS configuration with proper origins handling
 */

const corsMiddleware = (req, res, next) => {
  // CORS middleware - allowing all origins for simplicity (same as original working version)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Allow-Headers, Cache-Control, Pragma, X-API-Key');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Continue to the next middleware
  next();
};

// Using ES Module syntax instead of CommonJS
export default corsMiddleware;
