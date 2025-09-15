import Redis from 'ioredis';
import NodeCache from 'node-cache';

/**
 * PRODUCTION-READY REDIS SERVICE
 * 
 * Think of this like building a fortress for your data:
 * 1. Redis = Main castle (fast but can be attacked)
 * 2. Memory Cache = Secret bunker (backup when castle falls)
 * 3. Connection Pool = One strong bridge instead of many weak ones
 * 4. Circuit Breaker = Drawbridge that closes when under attack
 * 5. Health Checks = Guards watching for problems
 */

// =================================================================
// PART 1: IN-MEMORY FALLBACK CACHE
// =================================================================
/**
 * This is our backup plan when Redis fails
 * Like having a generator when the power goes out
 */
const memoryCache = new NodeCache({
  stdTTL: 120,           // Default: Keep data for 2 minutes
  checkperiod: 30,       // Check for expired data every 30 seconds
  maxKeys: 10000,        // Maximum 10,000 items (prevent memory overflow)
  useClones: false       // Don't clone data (faster)
});

// =================================================================
// PART 2: CIRCUIT BREAKER PATTERN
// =================================================================
/**
 * Circuit Breaker = Smart electrical breaker for your app
 * - CLOSED: Everything working, requests flow through
 * - OPEN: Too many failures, stop trying (save resources)
 * - HALF_OPEN: Test if things are fixed
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.failureThreshold = threshold;    // Open circuit after 5 failures
    this.timeout = timeout;               // Try again after 1 minute
    this.state = 'CLOSED';                // Start in working state
    this.nextAttempt = Date.now();
  }

  // Record a successful operation
  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  // Record a failed operation
  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`🔴 Circuit breaker OPEN - Too many Redis failures (${this.failureCount})`);
    }
  }

  // Check if we can try again
  canAttempt() {
    if (this.state === 'CLOSED') return true;
    
    if (this.state === 'OPEN' && Date.now() > this.nextAttempt) {
      this.state = 'HALF_OPEN';
      console.log('🟡 Circuit breaker HALF_OPEN - Testing Redis connection');
      return true;
    }
    
    return false;
  }
}

// =================================================================
// PART 3: CONNECTION POOL WITH RETRY LOGIC
// =================================================================
/**
 * Connection Pool = One strong connection instead of many weak ones
 * Like having one highway instead of 100 dirt roads
 */
class RedisConnectionPool {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.circuitBreaker = new CircuitBreaker();
    
    // Retry delays: 1s, 2s, 4s, 8s, 16s (exponential backoff)
    this.retryDelays = [1000, 2000, 4000, 8000, 16000];
  }

  // Create the Redis connection with all safety features
  async connect() {
    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      
      // Connection settings
      family: 4,                    // IPv4
      connectTimeout: 5000,         // 5 second connection timeout
      commandTimeout: 3000,         // 3 second command timeout
      keepAlive: 30000,            // Keep connection alive
      
      // Retry settings
      retryStrategy: (times) => {
        // Custom retry logic with exponential backoff
        if (times > this.maxRetries) {
          console.log('❌ Redis connection failed after max retries');
          return null; // Stop retrying
        }
        
        const delay = this.retryDelays[times - 1] || 16000;
        console.log(`🔄 Retrying Redis connection in ${delay}ms (attempt ${times}/${this.maxRetries})`);
        return delay;
      },
      
      // Connection pool settings
      enableReadyCheck: true,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      
      // Performance settings
      enableOfflineQueue: true,     // Queue commands when disconnected
      enableAutoPipelining: true,   // Batch commands automatically
    };

    try {
      this.redis = new Redis(config);
      
      // Connection event handlers
      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
        this.retryCount = 0;
        this.circuitBreaker.recordSuccess();
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis error:', error.message);
        this.isConnected = false;
        this.circuitBreaker.recordFailure();
      });

      this.redis.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
        this.retryCount++;
      });

      // Wait for initial connection
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      this.isConnected = false;
      this.circuitBreaker.recordFailure();
      return false;
    }
  }

  // Get the Redis instance (with circuit breaker check)
  getInstance() {
    if (!this.circuitBreaker.canAttempt()) {
      return null; // Circuit is open, don't try
    }
    return this.redis;
  }
}

// =================================================================
// PART 4: DATA TIERING SYSTEM
// =================================================================
/**
 * Different data needs different refresh times
 * Like milk (expires fast) vs canned goods (lasts long)
 */
const DATA_TIERS = {
  HOT: {
    ttl: 60,          // 1 minute - Real-time quotes
    description: 'Live market data, prices'
  },
  WARM: {
    ttl: 900,         // 15 minutes - Recent analysis
    description: 'AI insights, calculations'
  },
  COLD: {
    ttl: 3600,        // 1 hour - Slow-changing data
    description: 'Company info, fundamentals'
  },
  FROZEN: {
    ttl: 86400,       // 24 hours - Rarely changes
    description: 'Historical data, earnings'
  }
};

// Determine data tier based on key name
function getDataTier(key) {
  if (key.includes('quote') || key.includes('price')) return DATA_TIERS.HOT;
  if (key.includes('insight') || key.includes('analysis')) return DATA_TIERS.WARM;
  if (key.includes('fundamental') || key.includes('company')) return DATA_TIERS.COLD;
  if (key.includes('history') || key.includes('earnings')) return DATA_TIERS.FROZEN;
  return DATA_TIERS.WARM; // Default
}

// =================================================================
// PART 5: CACHE STATISTICS & MONITORING
// =================================================================
/**
 * Track everything to find problems before users do
 * Like a car dashboard showing speed, fuel, engine temp
 */
class CacheStatistics {
  constructor() {
    this.stats = {
      hits: 0,              // Found in cache
      misses: 0,           // Not in cache
      sets: 0,             // Saved to cache
      deletes: 0,          // Removed from cache
      errors: 0,           // Things that went wrong
      fallbackHits: 0,     // Used backup cache
      apiCalls: 0,         // Had to call API
      avgResponseTime: 0,  // How fast we respond
      lastReset: Date.now()
    };
    
    this.responseTimes = []; // Track last 100 response times
  }

  recordHit() { this.stats.hits++; }
  recordMiss() { this.stats.misses++; }
  recordSet() { this.stats.sets++; }
  recordDelete() { this.stats.deletes++; }
  recordError() { this.stats.errors++; }
  recordFallback() { this.stats.fallbackHits++; }
  recordApiCall() { this.stats.apiCalls++; }
  
  recordResponseTime(ms) {
    this.responseTimes.push(ms);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift(); // Keep only last 100
    }
    
    // Calculate average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.stats.avgResponseTime = Math.round(sum / this.responseTimes.length);
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    const cacheEfficiency = this.stats.apiCalls > 0 
      ? (100 - (this.stats.apiCalls / total * 100)).toFixed(2) 
      : 100;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheEfficiency: `${cacheEfficiency}%`,
      uptime: `${Math.round((Date.now() - this.stats.lastReset) / 1000 / 60)} minutes`
    };
  }

  reset() {
    this.stats = {
      ...this.stats,
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      fallbackHits: 0,
      apiCalls: 0,
      lastReset: Date.now()
    };
    this.responseTimes = [];
  }
}

// =================================================================
// PART 6: THE MAIN REDIS SERVICE
// =================================================================
/**
 * This is the main service that your app uses
 * It handles all the complexity behind a simple interface
 */
class ProductionRedisService {
  constructor() {
    this.pool = new RedisConnectionPool();
    this.stats = new CacheStatistics();
    this.isInitialized = false;
  }

  // Initialize the service
  async initialize() {
    console.log('🚀 Initializing Production Redis Service...');
    
    const connected = await this.pool.connect();
    this.isInitialized = true;
    
    if (connected) {
      console.log('✅ Redis service ready (primary mode)');
    } else {
      console.log('⚠️ Redis service ready (fallback mode - using memory cache)');
    }
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    return true;
  }

  /**
   * GET data from cache with all safety features
   * This is what your app calls to get data
   */
  async get(key) {
    const startTime = Date.now();
    
    try {
      // STEP 1: Try Redis first (if circuit breaker allows)
      const redis = this.pool.getInstance();
      if (redis && this.pool.isConnected) {
        try {
          const value = await redis.get(key);
          if (value) {
            this.stats.recordHit();
            this.stats.recordResponseTime(Date.now() - startTime);
            return JSON.parse(value);
          }
        } catch (redisError) {
          console.error(`Redis GET error: ${redisError.message}`);
          this.pool.circuitBreaker.recordFailure();
        }
      }

      // STEP 2: Try memory cache fallback
      const memValue = memoryCache.get(key);
      if (memValue !== undefined) {
        this.stats.recordFallback();
        this.stats.recordResponseTime(Date.now() - startTime);
        console.log(`📦 Using memory cache for key: ${key}`);
        return memValue;
      }

      // STEP 3: Cache miss
      this.stats.recordMiss();
      this.stats.recordResponseTime(Date.now() - startTime);
      return null;
      
    } catch (error) {
      this.stats.recordError();
      console.error(`Cache GET error for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * SET data in cache with automatic tiering
   */
  async set(key, value, customTtl = null) {
    const startTime = Date.now();
    
    try {
      // Determine TTL based on data tier
      const tier = getDataTier(key);
      const ttl = customTtl || tier.ttl;

      // STEP 1: Always save to memory cache (backup)
      memoryCache.set(key, value, ttl);

      // STEP 2: Try to save to Redis
      const redis = this.pool.getInstance();
      if (redis && this.pool.isConnected) {
        try {
          await redis.setex(key, ttl, JSON.stringify(value));
          this.stats.recordSet();
          this.pool.circuitBreaker.recordSuccess();
        } catch (redisError) {
          console.error(`Redis SET error: ${redisError.message}`);
          this.pool.circuitBreaker.recordFailure();
        }
      }

      this.stats.recordResponseTime(Date.now() - startTime);
      return true;
      
    } catch (error) {
      this.stats.recordError();
      console.error(`Cache SET error for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * DELETE data from both caches
   */
  async del(key) {
    try {
      // Delete from memory cache
      memoryCache.del(key);

      // Delete from Redis
      const redis = this.pool.getInstance();
      if (redis && this.pool.isConnected) {
        await redis.del(key);
      }

      this.stats.recordDelete();
      return true;
      
    } catch (error) {
      this.stats.recordError();
      console.error(`Cache DEL error for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * CACHED FUNCTION WRAPPER
   * Automatically caches any async function result
   */
  async cached(key, asyncFunc, ttl = null) {
    // Check cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, call the function
    try {
      const result = await asyncFunc();
      this.stats.recordApiCall();
      
      // Save to cache if we got a result
      if (result !== null && result !== undefined) {
        await this.set(key, result, ttl);
      }
      
      return result;
    } catch (error) {
      console.error(`Cached function error for ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * HEALTH CHECK - Is the cache system healthy?
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        redis: {
          connected: this.pool.isConnected,
          circuitBreaker: this.pool.circuitBreaker.state
        },
        memoryCache: {
          keys: memoryCache.keys().length,
          stats: memoryCache.getStats()
        },
        performance: this.stats.getStats()
      }
    };

    // Determine overall health
    if (!this.pool.isConnected && this.pool.circuitBreaker.state === 'OPEN') {
      health.status = 'degraded';
    }
    
    if (this.stats.stats.errors > 100) {
      health.status = 'unhealthy';
    }

    return health;
  }

  /**
   * Start monitoring cache health
   */
  startHealthMonitoring() {
    // Log stats every 5 minutes
    setInterval(async () => {
      const stats = this.stats.getStats();
      console.log('📊 Cache Performance:', {
        hitRate: stats.hitRate,
        efficiency: stats.cacheEfficiency,
        avgResponseTime: `${stats.avgResponseTime}ms`,
        errors: stats.errors
      });
      
      // Reset stats daily
      if (Date.now() - this.stats.stats.lastReset > 86400000) {
        this.stats.reset();
      }
    }, 300000); // 5 minutes

    // Try to reconnect Redis every minute if disconnected
    setInterval(async () => {
      if (!this.pool.isConnected && this.pool.circuitBreaker.canAttempt()) {
        console.log('🔄 Attempting to reconnect to Redis...');
        await this.pool.connect();
      }
    }, 60000); // 1 minute
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Redis service...');
    
    // Save cache stats
    const finalStats = this.stats.getStats();
    console.log('📊 Final cache statistics:', finalStats);
    
    // Close Redis connection
    if (this.pool.redis) {
      await this.pool.redis.quit();
    }
    
    // Clear memory cache
    memoryCache.flushAll();
    
    console.log('✅ Redis service shutdown complete');
  }
}

// =================================================================
// PART 7: EXPORT THE SERVICE
// =================================================================
// Create a single instance
const redisService = new ProductionRedisService();

// Initialize on first import
if (!redisService.isInitialized) {
  redisService.initialize().catch(error => {
    console.error('Failed to initialize Redis service:', error);
  });
}

// Handle process shutdown gracefully
process.on('SIGTERM', () => redisService.shutdown());
process.on('SIGINT', () => redisService.shutdown());

// Export both the instance and the class (for testing)
export { redisService, ProductionRedisService };
export default redisService;
