/**
 * Rate limiting middleware
 */

// Configuration
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10); // Default: 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // Default: 100 requests per window

// Store for tracking requests
const requestCounts = new Map();

// Store for tracking first request timestamps
const windowStartTimes = new Map();

/**
 * Rate limiting middleware implementation
 */
function rateLimit(req, res, next) {
  // DISABLE RATE LIMITING FOR GPT-OSS ENDPOINTS
  if (req.path.includes('/gpt-oss/')) {
    return next();
  }
  
  // Skip rate limiting if disabled
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return next();
  }
  
  // Get client IP
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  
  // Get current timestamp
  const now = Date.now();
  
  // Check if we have an entry for this client
  if (!requestCounts.has(clientIp)) {
    // First request from this client
    requestCounts.set(clientIp, 1);
    windowStartTimes.set(clientIp, now);
    return next();
  }
  
  // Get window start time for this client
  const windowStart = windowStartTimes.get(clientIp);
  
  // Check if window has expired
  if (now - windowStart > WINDOW_MS) {
    // Reset window
    requestCounts.set(clientIp, 1);
    windowStartTimes.set(clientIp, now);
    return next();
  }
  
  // Increment request count
  const requestCount = requestCounts.get(clientIp) + 1;
  requestCounts.set(clientIp, requestCount);
  
  // Check if limit exceeded
  if (requestCount > MAX_REQUESTS) {
    // Calculate time until window reset
    const resetTime = windowStart + WINDOW_MS - now;
    
    // Add headers
    res.setHeader('Retry-After', Math.ceil(resetTime / 1000));
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + WINDOW_MS) / 1000));
    
    // Return error response
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)} seconds.`
    });
  }
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - requestCount);
  res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + WINDOW_MS) / 1000));
  
  next();
}

module.exports = rateLimit;
