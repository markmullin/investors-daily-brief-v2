/**
 * HEALTH CHECK ROUTES
 * Production-grade health monitoring for all services
 * 
 * This is like a doctor's checkup for your app:
 * - /health - Basic "are you alive?" check
 * - /health/detailed - Full system diagnostics
 * - /health/redis - Redis-specific health
 * - /health/fmp - Enhanced FMP API health with cost tracking
 * - /health/dependencies - All external services
 */

import express from 'express';
import { redisService } from '../services/redisService.js';
import fmpService from '../services/fmpService.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

const router = express.Router();

// Track server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * Basic health check - Quick "are you alive?" test
 * This is what load balancers and monitoring tools hit every few seconds
 */
router.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  
  res.json({
    status: 'healthy',
    service: 'investors-daily-brief-backend',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptime: `${uptime} seconds`
  });
});

/**
 * Detailed health check - Full system diagnostics
 * This is what you check when something seems wrong
 */
router.get('/detailed', async (req, res) => {
  console.log('🏥 Running detailed health check...');
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: pkg.version,
    uptime: getUptime(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: getMemoryUsage(),
      cpu: process.cpuUsage()
    },
    services: {}
  };

  // Check Redis health
  try {
    const redisHealth = await redisService.healthCheck();
    health.services.redis = redisHealth;
    
    if (redisHealth.status !== 'healthy') {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      error: error.message
    };
    health.status = 'degraded';
  }

  // Check database connection (if you have PostgreSQL)
  try {
    // TODO: Add database health check
    health.services.database = {
      status: 'healthy',
      type: 'postgresql'
    };
  } catch (error) {
    health.services.database = {
      status: 'unhealthy',
      error: error.message
    };
    health.status = 'degraded';
  }

  // Check Enhanced FMP API health
  try {
    const fmpHealth = await fmpService.healthCheck();
    health.services.fmpApi = {
      status: fmpHealth.status,
      ...fmpHealth
    };
    
    if (fmpHealth.status !== 'healthy') {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.fmpApi = {
      status: 'unhealthy',
      error: error.message
    };
    health.status = 'unhealthy';
  }

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 503 : 500;

  res.status(statusCode).json(health);
});

/**
 * Redis-specific health check
 * Deep dive into cache performance
 */
router.get('/redis', async (req, res) => {
  try {
    const redisHealth = await redisService.healthCheck();
    
    // Add some additional Redis-specific checks
    const testKey = 'health_check_test';
    const testValue = { timestamp: Date.now(), random: Math.random() };
    
    // Test write
    const writeStart = Date.now();
    await redisService.set(testKey, testValue, 10);
    const writeTime = Date.now() - writeStart;
    
    // Test read
    const readStart = Date.now();
    const readValue = await redisService.get(testKey);
    const readTime = Date.now() - readStart;
    
    // Test delete
    await redisService.del(testKey);
    
    const enhanced = {
      ...redisHealth,
      performance: {
        writeLatency: `${writeTime}ms`,
        readLatency: `${readTime}ms`,
        testPassed: JSON.stringify(readValue) === JSON.stringify(testValue)
      }
    };
    
    const statusCode = enhanced.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(enhanced);
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'redis',
      error: error.message
    });
  }
});

/**
 * Enhanced FMP API health check
 * Now includes circuit breaker, rate limiting, cost tracking, and queue status
 */
router.get('/fmp', async (req, res) => {
  try {
    // Get comprehensive health check from enhanced FMP service
    const fmpHealth = await fmpService.healthCheck();
    
    // Determine overall FMP status based on circuit breaker and rate limiting
    let overallStatus = 'healthy';
    let warnings = [];
    
    // Check circuit breaker state
    if (fmpHealth.circuitBreaker.state === 'OPEN') {
      overallStatus = 'unhealthy';
      warnings.push('Circuit breaker is OPEN - too many API failures');
    } else if (fmpHealth.circuitBreaker.state === 'HALF_OPEN') {
      overallStatus = 'degraded';
      warnings.push('Circuit breaker is HALF_OPEN - testing recovery');
    }
    
    // Check rate limiting
    const rateUsagePercent = parseFloat(fmpHealth.rateLimiter.percentUsed);
    if (rateUsagePercent > 90) {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
      warnings.push(`Rate limit critical: ${rateUsagePercent}% used`);
    } else if (rateUsagePercent > 75) {
      warnings.push(`Rate limit warning: ${rateUsagePercent}% used`);
    }
    
    // Check error rate
    const errorRate = parseFloat(fmpHealth.performance.errorRate);
    if (errorRate > 10) {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
      warnings.push(`High error rate: ${errorRate}%`);
    }
    
    // Check request queue
    if (fmpHealth.requestQueue.queueLength > 50) {
      warnings.push(`Large request queue: ${fmpHealth.requestQueue.queueLength} pending`);
    }
    
    // Run a simple connectivity test
    let connectivityTest = { passed: false, latency: null, error: null };
    try {
      const start = Date.now();
      const quote = await fmpService.getQuote('SPY');
      const latency = Date.now() - start;
      
      connectivityTest = {
        passed: quote && quote.length > 0,
        latency: `${latency}ms`,
        lastPrice: quote?.[0]?.price
      };
    } catch (error) {
      connectivityTest.error = error.message;
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }
    
    // Compile comprehensive response
    const enhancedHealth = {
      status: overallStatus,
      timestamp: fmpHealth.timestamp,
      warnings: warnings,
      uptime: fmpHealth.uptime,
      connectivityTest: connectivityTest,
      circuitBreaker: {
        ...fmpHealth.circuitBreaker,
        recommendation: fmpHealth.circuitBreaker.state === 'OPEN' 
          ? 'Wait for automatic recovery or check API credentials'
          : 'Circuit breaker protecting API from overload'
      },
      rateLimiter: {
        ...fmpHealth.rateLimiter,
        recommendation: rateUsagePercent > 75
          ? 'Consider reducing API usage or upgrading plan'
          : 'Rate limit usage is healthy'
      },
      requestQueue: {
        ...fmpHealth.requestQueue,
        recommendation: fmpHealth.requestQueue.queueLength > 20
          ? 'High queue indicates API congestion'
          : 'Queue processing normally'
      },
      costTracking: {
        ...fmpHealth.costTracking,
        recommendation: parseFloat(fmpHealth.costTracking.monthly.cost.replace('$', '')) > 100
          ? 'Monthly costs exceeding $100 - review usage patterns'
          : 'Costs within expected range'
      },
      performance: {
        ...fmpHealth.performance,
        recommendation: parseFloat(fmpHealth.performance.cacheHitRate) < 70
          ? 'Low cache hit rate - consider optimizing cache TTLs'
          : 'Cache performance is optimal'
      }
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 503 : 500;
    
    res.status(statusCode).json(enhancedHealth);
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'fmp-api',
      error: error.message,
      recommendation: 'Check FMP service initialization and API credentials'
    });
  }
});

/**
 * All dependencies health check
 * One endpoint to check everything
 */
router.get('/dependencies', async (req, res) => {
  const results = {
    healthy: [],
    unhealthy: [],
    degraded: []
  };
  
  // List of all services to check
  const services = [
    {
      name: 'redis',
      check: async () => {
        const health = await redisService.healthCheck();
        return health.status;
      }
    },
    {
      name: 'fmp-api',
      check: async () => {
        const health = await fmpService.healthCheck();
        return health.status;
      }
    },
    {
      name: 'memory',
      check: async () => {
        const usage = process.memoryUsage();
        const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
        return heapUsedPercent < 90 ? 'healthy' : 'degraded';
      }
    }
  ];
  
  // Check all services
  for (const service of services) {
    try {
      const status = await service.check();
      results[status === 'healthy' ? 'healthy' : 
              status === 'degraded' ? 'degraded' : 'unhealthy'].push(service.name);
    } catch (error) {
      results.unhealthy.push({
        name: service.name,
        error: error.message
      });
    }
  }
  
  // Determine overall status
  const overallStatus = results.unhealthy.length > 0 ? 'unhealthy' :
                       results.degraded.length > 0 ? 'degraded' : 'healthy';
  
  const statusCode = overallStatus === 'healthy' ? 200 :
                    overallStatus === 'degraded' ? 503 : 500;
  
  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    summary: {
      healthy: results.healthy.length,
      degraded: results.degraded.length,
      unhealthy: results.unhealthy.length
    },
    services: results
  });
});

// Helper functions
function getUptime() {
  const seconds = Math.floor((Date.now() - serverStartTime) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapPercent: `${Math.round((usage.heapUsed / usage.heapTotal) * 100)}%`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`
  };
}

export default router;
