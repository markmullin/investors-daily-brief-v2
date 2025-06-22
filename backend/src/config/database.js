import pg from 'pg';
import Redis from 'ioredis';
import Influx from 'influx';
import 'dotenv/config';

const { Pool } = pg;

// PostgreSQL Configuration (Main Database)
export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'market_dashboard',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis Configuration - DISABLED BY DEFAULT (NO MORE SPAM ERRORS)
let redis = null;
let redisAvailable = false;

// Only initialize Redis if explicitly requested
if (process.env.REDIS_ENABLED === 'true') {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 0, // Disable retries
      connectTimeout: 1000,
      lazyConnect: true,
      showFriendlyErrorStack: false,
    });
    
    redis.on('error', () => { /* Silent */ });
    redis.on('connect', () => { redisAvailable = true; });
    
    console.log('📁 Redis connection attempted (set REDIS_ENABLED=true)');
  } catch (error) {
    redis = null;
  }
} else {
  console.log('📁 Using in-memory cache (Redis disabled - no connection attempts)');
}

// In-memory cache for when Redis is disabled
const memoryCache = new Map();
const cacheExpiry = new Map();

// Clean expired cache entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of cacheExpiry.entries()) {
    if (now > expiry) {
      memoryCache.delete(key);
      cacheExpiry.delete(key);
    }
  }
}, 60000);

// Redis wrapper with silent in-memory fallback
export const redisWrapper = {
  async get(key) {
    if (redisAvailable && redis) {
      try {
        return await redis.get(key);
      } catch {
        redisAvailable = false;
      }
    }
    
    // Use memory cache
    const now = Date.now();
    const expiry = cacheExpiry.get(key);
    if (expiry && now > expiry) {
      memoryCache.delete(key);
      cacheExpiry.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  },

  async set(key, value, mode, ttl) {
    if (redisAvailable && redis) {
      try {
        if (mode === 'EX') {
          return await redis.setex(key, ttl, value);
        }
        return await redis.set(key, value);
      } catch {
        redisAvailable = false;
      }
    }
    
    memoryCache.set(key, value);
    if (mode === 'EX' && ttl) {
      cacheExpiry.set(key, Date.now() + (ttl * 1000));
    }
    return 'OK';
  },

  async setex(key, ttl, value) {
    return this.set(key, value, 'EX', ttl);
  },

  async del(key) {
    if (redisAvailable && redis) {
      try {
        return await redis.del(key);
      } catch {
        redisAvailable = false;
      }
    }
    
    memoryCache.delete(key);
    cacheExpiry.delete(key);
    return 1;
  },

  async incr(key) {
    if (redisAvailable && redis) {
      try {
        return await redis.incr(key);
      } catch {
        redisAvailable = false;
      }
    }
    
    const current = parseInt(memoryCache.get(key) || '0');
    const newValue = current + 1;
    memoryCache.set(key, newValue.toString());
    return newValue;
  },

  async expire(key, ttl) {
    if (redisAvailable && redis) {
      try {
        return await redis.expire(key, ttl);
      } catch {
        redisAvailable = false;
      }
    }
    
    cacheExpiry.set(key, Date.now() + (ttl * 1000));
    return 1;
  },

  async ttl(key) {
    if (redisAvailable && redis) {
      try {
        return await redis.ttl(key);
      } catch {
        redisAvailable = false;
      }
    }
    
    const expiry = cacheExpiry.get(key);
    if (!expiry) return -1;
    return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  },

  async ping() {
    if (redisAvailable && redis) {
      try {
        return await redis.ping();
      } catch {
        redisAvailable = false;
      }
    }
    return 'PONG';
  },

  disconnect() {
    if (redis) {
      redis.disconnect();
    }
    memoryCache.clear();
    cacheExpiry.clear();
  }
};

export { redisWrapper as redis };

// InfluxDB - Disabled by default
export let influx = null;

// Database Health Check
export async function checkDatabaseHealth() {
  return {
    postgres: false,
    redis: redisAvailable,
    influx: false,
    cacheType: redisAvailable ? 'redis' : 'memory',
    timestamp: new Date().toISOString()
  };
}

// Graceful shutdown
export async function closeDatabases() {
  try {
    await pgPool.end();
    redisWrapper.disconnect();
    console.log('Database connections closed gracefully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

process.on('SIGINT', closeDatabases);
process.on('SIGTERM', closeDatabases);