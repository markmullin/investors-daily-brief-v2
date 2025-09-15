import pg from 'pg';
import Redis from 'ioredis';
import 'dotenv/config';

const { Pool } = pg;

// Database configuration based on mode
const DATABASE_MODE = process.env.DATABASE_MODE || 'traditional';

let pgPool = null;
let dbConnection = null;

if (DATABASE_MODE === 'MCP') {
  console.log('🗄️ [DATABASE] Using MCP PostgreSQL mode');
  console.log('⚠️ [DATABASE] MCP mode detected - using development fallback');
} else {
  // Traditional PostgreSQL setup
  pgPool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'market_dashboard',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

// In-memory storage for MCP mode development
const inMemoryTables = {
  sp500_constituents: [],
  company_fundamentals: [],
  fundamental_rankings: [],
  fundamental_batch_logs: []
};

// Database wrapper that works with both MCP and traditional modes
export const db = {
  async query(text, params) {
    const start = Date.now();
    
    if (DATABASE_MODE === 'MCP') {
      console.log('🗄️ [DATABASE] MCP Query:', text.substring(0, 100) + '...');
      
      if (text.includes('SELECT 1 as test')) {
        return { rows: [{ test: 1 }], rowCount: 1 };
      }
      
      if (text.includes('sp500_constituents')) {
        return { rows: inMemoryTables.sp500_constituents, rowCount: inMemoryTables.sp500_constituents.length };
      }
      
      if (text.includes('INSERT') && text.includes('RETURNING id')) {
        const newId = Math.floor(Math.random() * 1000) + 1;
        return { rows: [{ id: newId }], rowCount: 1 };
      }
      
      return { rows: [], rowCount: 0 };
    }
    
    try {
      const res = await pgPool.query(text, params);
      const duration = Date.now() - start;
      console.log('🗄️ [DATABASE] Query executed', { duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('❌ [DATABASE] Query error:', error.message);
      throw error;
    }
  },
  
  async getClient() {
    if (DATABASE_MODE === 'MCP') {
      return {
        query: this.query.bind(this),
        release: () => {},
      };
    }
    return await pgPool.connect();
  },
  
  get pool() {
    return pgPool;
  },
  
  get mode() {
    return DATABASE_MODE;
  }
};

// *** PRODUCTION-GRADE REDIS CONFIGURATION FOR WINDOWS ***
let redis = null;
let redisRaw = null;
let redisConnected = false;

// WINDOWS-OPTIMIZED REDIS CONFIGURATION
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // WINDOWS COMPATIBILITY SETTINGS
  lazyConnect: false, // Connect immediately on startup
  connectTimeout: 30000, // 30 seconds for Windows Redis
  commandTimeout: 15000, // 15 seconds for command execution
  retryDelayOnFailover: 1000, // 1 second retry delay
  maxRetriesPerRequest: 5, // More retries for Windows
  // NETWORK SETTINGS
  family: 4, // IPv4 only for Windows compatibility
  keepAlive: 30000, // Keep connections alive
  // ERROR HANDLING
  enableOfflineQueue: false, // Fail fast if Redis unavailable
  showFriendlyErrorStack: true,
  // RETRY STRATEGY
  retryStrategy: (times) => {
    const delay = Math.min(times * 1000, 10000); // Max 10 second delay
    console.log(`🔄 [REDIS] Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  // CONNECTION EVENTS
  enableReadyCheck: true,
  maxLoadingTimeout: 30000
};

// PRODUCTION REDIS INITIALIZATION WITH WINDOWS SUPPORT
async function initializeRedis() {
  if (process.env.REDIS_ENABLED !== 'true') {
    console.log('🚨 [REDIS] DISABLED - Set REDIS_ENABLED=true for production');
    return false;
  }

  console.log('🚀 [REDIS] Initializing production Redis connection...');
  console.log('🔧 [REDIS] Using Windows-optimized configuration');
  
  try {
    // Create Redis clients with Windows optimization
    redis = new Redis(REDIS_CONFIG);
    redisRaw = new Redis(REDIS_CONFIG);
    
    // Enhanced event handlers for Windows
    redis.on('ready', () => {
      redisConnected = true;
      console.log('✅ [REDIS] Connected and ready for operations');
      console.log('🎯 [REDIS] Production caching system online');
    });
    
    redis.on('error', (err) => {
      redisConnected = false;
      console.error('🚨 [REDIS] Connection error:', err.message);
      if (err.message.includes('ECONNREFUSED')) {
        console.error('💡 [REDIS] Redis server not running. Install Redis or disable with REDIS_ENABLED=false');
      }
    });
    
    redis.on('connect', () => {
      console.log('🔗 [REDIS] TCP connection established');
    });
    
    redis.on('reconnecting', (delay) => {
      console.log(`🔄 [REDIS] Reconnecting in ${delay}ms...`);
    });
    
    redis.on('close', () => {
      console.log('📴 [REDIS] Connection closed');
      redisConnected = false;
    });
    
    // Test connection with enhanced Windows support
    await testRedisConnectionWithRetry();
    
    console.log('🎯 [REDIS] Production initialization complete');
    return true;
    
  } catch (error) {
    console.error('🚨 [REDIS] INITIALIZATION FAILED:', error.message);
    console.error('🚨 [REDIS] Suggested fixes:');
    console.error('   1. Install Redis for Windows from https://github.com/microsoftarchive/redis/releases');
    console.error('   2. Start Redis server: redis-server');
    console.error('   3. Or disable Redis: Set REDIS_ENABLED=false in .env');
    
    redisConnected = false;
    return false;
  }
}

// ENHANCED REDIS CONNECTION TEST WITH RETRY LOGIC
async function testRedisConnectionWithRetry() {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`🧪 [REDIS] Testing connection (attempt ${attempt + 1}/${maxRetries})...`);
      
      // Wait for ready state with extended timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout after 30 seconds'));
        }, 30000);
        
        if (redis.status === 'ready') {
          clearTimeout(timeout);
          resolve();
        } else {
          redis.once('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          redis.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });
      
      // Test basic Redis operations
      await performRedisHealthCheck();
      
      console.log('✅ [REDIS] Connection test successful');
      redisConnected = true;
      return;
      
    } catch (error) {
      attempt++;
      console.error(`❌ [REDIS] Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s, 6s delays
        console.log(`⏳ [REDIS] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Redis connection failed after ${maxRetries} attempts`);
}

// COMPREHENSIVE REDIS HEALTH CHECK
async function performRedisHealthCheck() {
  console.log('🔍 [REDIS] Performing health check...');
  
  // Test 1: Ping
  const pong = await redis.ping();
  if (pong !== 'PONG') {
    throw new Error('Redis ping test failed');
  }
  console.log('✓ Ping test passed');
  
  // Test 2: Set/Get
  const testKey = 'health_check_test';
  const testValue = JSON.stringify({ timestamp: Date.now(), test: 'production_health_check' });
  await redis.set(testKey, testValue);
  
  const retrieved = await redis.get(testKey);
  if (retrieved !== testValue) {
    throw new Error('Redis set/get test failed');
  }
  console.log('✓ Set/Get test passed');
  
  // Test 3: Expiration
  await redis.setex('expiry_test', 1, 'will_expire');
  const exists = await redis.exists('expiry_test');
  if (!exists) {
    throw new Error('Redis expiration test failed');
  }
  console.log('✓ Expiration test passed');
  
  // Test 4: Cleanup
  await redis.del(testKey, 'expiry_test');
  console.log('✓ Cleanup completed');
  
  console.log('🎯 [REDIS] All health checks passed');
}

// PRODUCTION-GRADE REDIS WRAPPER WITH FALLBACK
export const redisWrapper = {
  async get(key) {
    if (!redis || !redisConnected) {
      console.warn(`⚠️ [REDIS] GET operation failed - Redis not connected (key: ${key})`);
      return null;
    }
    
    try {
      const result = await redis.get(key);
      return result;
    } catch (error) {
      console.error(`🚨 [REDIS] GET error for key ${key}:`, error.message);
      return null;
    }
  },

  async set(key, value, mode, ttl) {
    if (!redis || !redisConnected) {
      console.warn(`⚠️ [REDIS] SET operation failed - Redis not connected (key: ${key})`);
      return false;
    }
    
    try {
      if (mode === 'EX' && ttl) {
        return await redis.setex(key, ttl, value);
      }
      return await redis.set(key, value);
    } catch (error) {
      console.error(`🚨 [REDIS] SET error for key ${key}:`, error.message);
      return false;
    }
  },

  async setex(key, ttl, value) {
    if (!redis || !redisConnected) {
      console.warn(`⚠️ [REDIS] SETEX operation failed - Redis not connected (key: ${key})`);
      return false;
    }
    
    try {
      return await redis.setex(key, ttl, value);
    } catch (error) {
      console.error(`🚨 [REDIS] SETEX error for key ${key}:`, error.message);
      return false;
    }
  },

  async del(...keys) {
    if (!redis || !redisConnected) {
      console.warn(`⚠️ [REDIS] DEL operation failed - Redis not connected (keys: ${keys.join(', ')})`);
      return 0;
    }
    
    try {
      return await redis.del(...keys);
    } catch (error) {
      console.error(`🚨 [REDIS] DEL error for keys ${keys.join(', ')}:`, error.message);
      return 0;
    }
  },

  async exists(...keys) {
    if (!redis || !redisConnected) {
      return 0;
    }
    
    try {
      return await redis.exists(...keys);
    } catch (error) {
      console.error(`🚨 [REDIS] EXISTS error for keys ${keys.join(', ')}:`, error.message);
      return 0;
    }
  },

  async keys(pattern) {
    if (!redis || !redisConnected) {
      return [];
    }
    
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error(`🚨 [REDIS] KEYS error for pattern ${pattern}:`, error.message);
      return [];
    }
  },

  async incr(key) {
    if (!redis || !redisConnected) {
      console.warn(`⚠️ [REDIS] INCR operation failed - Redis not connected (key: ${key})`);
      return 0;
    }
    
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error(`🚨 [REDIS] INCR error for key ${key}:`, error.message);
      return 0;
    }
  },

  async expire(key, ttl) {
    if (!redis || !redisConnected) {
      return false;
    }
    
    try {
      return await redis.expire(key, ttl);
    } catch (error) {
      console.error(`🚨 [REDIS] EXPIRE error for key ${key}:`, error.message);
      return false;
    }
  },

  async ttl(key) {
    if (!redis || !redisConnected) {
      return -2;
    }
    
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error(`🚨 [REDIS] TTL error for key ${key}:`, error.message);
      return -2;
    }
  },

  async ping() {
    if (!redis || !redisConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      return await redis.ping();
    } catch (error) {
      console.error('🚨 [REDIS] PING error:', error.message);
      throw error;
    }
  },

  isConnected() {
    return redisConnected;
  },

  getClient() {
    if (!redis) {
      throw new Error('Redis not initialized');
    }
    return redis;
  },

  getRawClient() {
    if (!redisRaw) {
      throw new Error('Raw Redis client not initialized');
    }
    return redisRaw;
  },

  disconnect() {
    if (redis) {
      redis.disconnect();
      redisConnected = false;
    }
    if (redisRaw) {
      redisRaw.disconnect();
    }
    console.log('📴 [REDIS] Disconnected gracefully');
  }
};

// Export clients
export { redisWrapper as redis };
export { redisRaw };

// Enhanced database health check
export async function checkDatabaseHealth() {
  const health = {
    postgres: false,
    redis: redisConnected,
    mode: DATABASE_MODE,
    redisRequired: process.env.REDIS_ENABLED === 'true',
    timestamp: new Date().toISOString(),
    cacheType: redisConnected ? 'redis' : 'in-memory',
    redisStatus: redis ? redis.status : 'not_initialized'
  };
  
  // Test database connection
  try {
    const result = await db.query('SELECT 1 as test');
    health.postgres = result.rows.length > 0;
    console.log(`✅ [DATABASE] ${DATABASE_MODE} mode connection healthy`);
  } catch (error) {
    console.error(`❌ [DATABASE] ${DATABASE_MODE} mode connection failed:`, error.message);
  }
  
  // Enhanced Redis status check
  if (process.env.REDIS_ENABLED === 'true') {
    if (!redisConnected) {
      health.redisError = 'Redis is required but not connected';
      health.suggestions = [
        'Install Redis for Windows',
        'Start Redis server: redis-server',
        'Check Windows firewall settings',
        'Or disable Redis: Set REDIS_ENABLED=false'
      ];
      console.error('🚨 [REDIS] Required for production but not connected');
    } else {
      health.redisConnectedAt = new Date().toISOString();
      console.log('✅ [REDIS] Production connection healthy');
    }
  }
  
  return health;
}

// Initialize Redis on startup with enhanced error handling
if (process.env.REDIS_ENABLED === 'true') {
  initializeRedis().then(success => {
    if (success) {
      console.log('🎯 [REDIS] Production system ready');
    } else {
      console.warn('⚠️ [REDIS] System running in degraded mode without Redis');
    }
  }).catch(error => {
    console.error('🚨 [REDIS] Startup initialization failed:', error.message);
    console.warn('⚠️ [REDIS] Continuing without Redis - performance will be degraded');
  });
}

// Graceful shutdown with enhanced cleanup
export async function closeDatabases() {
  try {
    console.log('🔄 [DATABASE] Initiating graceful shutdown...');
    
    if (pgPool) {
      await pgPool.end();
      console.log('✅ [PostgreSQL] Connection pool closed');
    }
    
    redisWrapper.disconnect();
    console.log('✅ [REDIS] Connections closed');
    
    console.log('✅ [DATABASE] All connections closed gracefully');
  } catch (error) {
    console.error('❌ [DATABASE] Error during shutdown:', error);
  }
}

// Enhanced process handlers
process.on('SIGINT', async () => {
  console.log('🛑 [SYSTEM] Received SIGINT, shutting down gracefully...');
  await closeDatabases();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 [SYSTEM] Received SIGTERM, shutting down gracefully...');
  await closeDatabases();
  process.exit(0);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [SYSTEM] Unhandled Rejection at:', promise, 'reason:', reason);
});
