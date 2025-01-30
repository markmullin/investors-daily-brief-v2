import NodeCache from 'node-cache';

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Improve performance by not cloning objects
    });

    // Cache settings for different data types
    this.TTL = {
      QUOTE: 30,         // 30 seconds for real-time quotes
      HISTORY: 3600,     // 1 hour for historical data
      SECTOR: 300,       // 5 minutes for sector data
      MOVERS: 60,        // 1 minute for market movers
      SENTIMENT: 1800    // 30 minutes for sentiment data
    };

    // Setup cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0
    };
  }

  get(key, fetchFn, ttl) {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.stats.hits++;
      return Promise.resolve(cached);
    }

    this.stats.misses++;
    return fetchFn().then(data => {
      if (data !== null && data !== undefined) {
        this.cache.set(key, data, ttl);
        this.stats.keys = this.cache.keys().length;
      }
      return data;
    });
  }

  invalidate(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => this.cache.del(key));
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      size: this.stats.keys
    };
  }
}

export const cacheService = new CacheService();