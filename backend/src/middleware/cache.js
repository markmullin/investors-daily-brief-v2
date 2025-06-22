import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes default

const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Generate cache key based on URL and query parameters
  const key = req.originalUrl || req.url;

  // Try to get data from cache
  const cachedData = cache.get(key);
  if (cachedData) {
    console.log(`Cache hit for ${key}`);
    return res.json(cachedData);
  }

  // Store the original res.json method
  const originalJson = res.json.bind(res);

  // Override res.json to cache the response
  res.json = (data) => {
    // Check if headers have already been sent
    if (res.headersSent) {
      console.warn(`Headers already sent for ${key}, skipping cache`);
      return;
    }
    
    // Cache successful responses
    if (res.statusCode === 200) {
      cache.set(key, data);
      console.log(`Cached response for ${key}`);
    }
    
    // Call the original res.json method
    return originalJson(data);
  };

  next();
};

export default cacheMiddleware;