import NodeCache from 'node-cache';

// Create different cache instances for different data types
const caches = {
  quotes: new NodeCache({ stdTTL: 60 }), // 1 minute for quotes
  history: new NodeCache({ stdTTL: 300 }), // 5 minutes for historical data
  macro: new NodeCache({ stdTTL: 600 }), // 10 minutes for macro data
  sectors: new NodeCache({ stdTTL: 180 }), // 3 minutes for sectors
  insights: new NodeCache({ stdTTL: 900 }), // 15 minutes for insights
  default: new NodeCache({ stdTTL: 120 }) // 2 minutes default
};

// Memory usage monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// Get appropriate cache based on key pattern
function getCacheInstance(key) {
  if (key.includes('quote')) return caches.quotes;
  if (key.includes('history')) return caches.history;
  if (key.includes('macro')) return caches.macro;
  if (key.includes('sector')) return caches.sectors;
  if (key.includes('insight')) return caches.insights;
  return caches.default;
}

// Optimized cache service
export const cacheService = {
  get(key) {
    const cache = getCacheInstance(key);
    const value = cache.get(key);
    
    if (value) {
      cacheStats.hits++;
      return value;
    }
    
    cacheStats.misses++;
    return null;
  },
  
  set(key, value, ttl = null) {
    const cache = getCacheInstance(key);
    
    // Check memory usage before setting
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    // If memory usage is high, clear some old cache entries
    if (heapUsedMB > 400) { // 400MB threshold
      console.log('High memory usage detected, clearing old cache entries');
      this.cleanup();
    }
    
    const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
    if (success) {
      cacheStats.sets++;
    }
    return success;
  },
  
  del(key) {
    const cache = getCacheInstance(key);
    const deleted = cache.del(key);
    if (deleted) {
      cacheStats.deletes++;
    }
    return deleted;
  },
  
  flush() {
    Object.values(caches).forEach(cache => cache.flushAll());
    console.log('All caches flushed');
  },
  
  cleanup() {
    // Remove expired keys and oldest entries if needed
    Object.values(caches).forEach(cache => {
      const keys = cache.keys();
      const stats = cache.getStats();
      
      // If cache has more than 1000 entries, remove oldest 20%
      if (keys.length > 1000) {
        const toRemove = Math.floor(keys.length * 0.2);
        const keysToRemove = keys.slice(0, toRemove);
        cache.del(keysToRemove);
        console.log(`Removed ${toRemove} old cache entries`);
      }
    });
  },
  
  getStats() {
    const stats = {
      ...cacheStats,
      caches: {}
    };
    
    Object.entries(caches).forEach(([name, cache]) => {
      const keys = cache.keys();
      stats.caches[name] = {
        keys: keys.length,
        stats: cache.getStats()
      };
    });
    
    return stats;
  },
  
  // Wrapper for caching async functions
  async cached(key, asyncFunc, ttl = null) {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // If not cached, call the function
    try {
      const result = await asyncFunc();
      if (result !== null && result !== undefined) {
        this.set(key, result, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Error in cached function for key ${key}:`, error);
      throw error;
    }
  }
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

// Log cache stats every minute in development
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const stats = cacheService.getStats();
    console.log('Cache stats:', {
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      totalRequests: stats.hits + stats.misses,
      ...stats
    });
  }, 60 * 1000);
}

export default cacheService;
