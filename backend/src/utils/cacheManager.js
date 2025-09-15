// cacheManager.js - Production cache management system
import NodeCache from 'node-cache';

class CacheManager {
  constructor() {
    // Create multiple cache instances for different data types
    this.caches = {
      market: new NodeCache({ 
        stdTTL: 300,      // 5 minutes for market data
        checkperiod: 60   // Check for expired keys every minute
      }),
      analysis: new NodeCache({ 
        stdTTL: 3600,     // 1 hour for AI analysis
        checkperiod: 300  // Check every 5 minutes
      }),
      macro: new NodeCache({ 
        stdTTL: 1800,     // 30 minutes for macro data
        checkperiod: 300
      }),
      portfolio: new NodeCache({ 
        stdTTL: 600,      // 10 minutes for portfolio data
        checkperiod: 120
      }),
      historical: new NodeCache({ 
        stdTTL: 7200,     // 2 hours for historical data
        checkperiod: 600
      })
    };

    console.log('✅ Cache Manager initialized with multiple cache instances');
  }

  /**
   * Get data from appropriate cache
   */
  get(key, cacheType = 'market') {
    try {
      const cache = this.caches[cacheType];
      if (!cache) {
        console.warn(`⚠️ Unknown cache type: ${cacheType}`);
        return null;
      }

      const value = cache.get(key);
      if (value) {
        console.log(`📦 Cache hit: ${key} (${cacheType})`);
        return value;
      }
      
      console.log(`💾 Cache miss: ${key} (${cacheType})`);
      return null;
    } catch (error) {
      console.error('❌ Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set data in appropriate cache
   */
  set(key, value, ttl = null, cacheType = 'market') {
    try {
      const cache = this.caches[cacheType];
      if (!cache) {
        console.warn(`⚠️ Unknown cache type: ${cacheType}`);
        return false;
      }

      const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
      
      if (success) {
        console.log(`💾 Cached: ${key} (${cacheType}, TTL: ${ttl || 'default'})`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  del(key, cacheType = 'market') {
    try {
      const cache = this.caches[cacheType];
      if (!cache) {
        console.warn(`⚠️ Unknown cache type: ${cacheType}`);
        return false;
      }

      const deleted = cache.del(key);
      if (deleted) {
        console.log(`🗑️ Cache deleted: ${key} (${cacheType})`);
      }
      
      return deleted > 0;
    } catch (error) {
      console.error('❌ Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Clear all caches or specific cache type
   */
  clear(cacheType = null) {
    try {
      if (cacheType) {
        const cache = this.caches[cacheType];
        if (cache) {
          cache.flushAll();
          console.log(`🧹 Cleared ${cacheType} cache`);
          return true;
        }
        return false;
      } else {
        // Clear all caches
        Object.keys(this.caches).forEach(type => {
          this.caches[type].flushAll();
        });
        console.log('🧹 Cleared all caches');
        return true;
      }
    } catch (error) {
      console.error('❌ Cache clear error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const stats = {};
      
      Object.keys(this.caches).forEach(type => {
        const cache = this.caches[type];
        stats[type] = {
          keys: cache.keys().length,
          hits: cache.getStats().hits,
          misses: cache.getStats().misses,
          hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0
        };
      });

      return stats;
    } catch (error) {
      console.error('❌ Cache stats error:', error.message);
      return {};
    }
  }

  /**
   * Get or set pattern - useful for ensuring data exists
   */
  async getOrSet(key, fetchFunction, ttl = null, cacheType = 'market') {
    try {
      // Try to get from cache first
      const cached = this.get(key, cacheType);
      if (cached !== null) {
        return cached;
      }

      // Not in cache, fetch the data
      console.log(`🔄 Fetching fresh data for: ${key}`);
      const freshData = await fetchFunction();
      
      // Cache the fresh data
      this.set(key, freshData, ttl, cacheType);
      
      return freshData;
    } catch (error) {
      console.error('❌ Cache getOrSet error:', error.message);
      throw error;
    }
  }

  /**
   * Set data with tags for group operations
   */
  setWithTags(key, value, tags = [], ttl = null, cacheType = 'market') {
    try {
      // Set the main data
      const success = this.set(key, value, ttl, cacheType);
      
      if (success && tags.length > 0) {
        // Store tag mappings
        tags.forEach(tag => {
          const tagKey = `tag:${tag}`;
          const existingKeys = this.get(tagKey, 'market') || [];
          
          if (!existingKeys.includes(key)) {
            existingKeys.push(key);
            this.set(tagKey, existingKeys, ttl, 'market');
          }
        });
      }
      
      return success;
    } catch (error) {
      console.error('❌ Cache setWithTags error:', error.message);
      return false;
    }
  }

  /**
   * Clear cache entries by tag
   */
  clearByTag(tag, cacheType = 'market') {
    try {
      const tagKey = `tag:${tag}`;
      const keys = this.get(tagKey, 'market');
      
      if (keys && Array.isArray(keys)) {
        keys.forEach(key => {
          this.del(key, cacheType);
        });
        
        // Clear the tag mapping itself
        this.del(tagKey, 'market');
        
        console.log(`🏷️ Cleared ${keys.length} cache entries with tag: ${tag}`);
        return keys.length;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Cache clearByTag error:', error.message);
      return 0;
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
