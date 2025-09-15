/**
 * RATE LIMITING & DDOS PROTECTION MIDDLEWARE
 * Production-grade protection against abuse and attacks
 * 
 * Think of this like a bouncer at a club:
 * 1. Guest List = Whitelist of trusted IPs
 * 2. Banned List = Blacklist of malicious IPs
 * 3. Entry Limit = Rate limiting per person
 * 4. Crowd Control = Global rate limiting
 * 5. Security Camera = Attack detection and logging
 */

import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redisService } from '../services/redisService.js';
import geoip from 'geoip-lite';

/**
 * RATE LIMIT CONFIGURATIONS
 * Different limits for different endpoints
 */
const RATE_LIMIT_CONFIGS = {
  // Strict limits for auth endpoints
  auth: {
    points: 5,          // 5 requests
    duration: 900,      // per 15 minutes
    blockDuration: 900, // block for 15 minutes
    keyPrefix: 'auth'
  },
  
  // Standard API limits
  api: {
    points: 100,        // 100 requests
    duration: 60,       // per minute
    blockDuration: 300, // block for 5 minutes
    keyPrefix: 'api'
  },
  
  // Relaxed limits for static content
  static: {
    points: 500,        // 500 requests
    duration: 60,       // per minute
    blockDuration: 60,  // block for 1 minute
    keyPrefix: 'static'
  },
  
  // Search endpoint limits
  search: {
    points: 30,         // 30 searches
    duration: 60,       // per minute
    blockDuration: 300, // block for 5 minutes
    keyPrefix: 'search'
  },
  
  // Data-intensive endpoints
  dataIntensive: {
    points: 10,         // 10 requests
    duration: 60,       // per minute
    blockDuration: 600, // block for 10 minutes
    keyPrefix: 'data'
  },
  
  // Global limit per IP
  global: {
    points: 1000,       // 1000 requests
    duration: 3600,     // per hour
    blockDuration: 3600,// block for 1 hour
    keyPrefix: 'global'
  }
};

/**
 * ATTACK PATTERNS
 * Common DDoS and abuse patterns to detect
 */
const ATTACK_PATTERNS = {
  // Rapid fire requests
  rapidFire: {
    requests: 50,
    window: 10,    // 50 requests in 10 seconds
    severity: 'high'
  },
  
  // Distributed attack
  distributed: {
    uniqueIPs: 100,
    window: 60,    // 100 different IPs in 1 minute
    severity: 'critical'
  },
  
  // Slow loris attack
  slowLoris: {
    connections: 100,
    duration: 300, // 100 connections open for 5+ minutes
    severity: 'high'
  },
  
  // Suspicious user agents
  suspiciousAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /ruby/i,
    /perl/i
  ],
  
  // Known attack signatures
  attackSignatures: [
    /union.*select/i,
    /\';.*drop/i,
    /<script/i,
    /javascript:/i,
    /onerror=/i
  ]
};

/**
 * IP REPUTATION MANAGER
 * Tracks IP behavior and reputation
 */
class IpReputationManager {
  constructor() {
    this.whitelist = new Set();
    this.blacklist = new Set();
    this.graylist = new Map(); // Temporary restrictions
    this.reputation = new Map(); // IP scores
    
    // Load predefined lists
    this.loadPredefinedLists();
  }
  
  loadPredefinedLists() {
    // Whitelist: Add your office IPs, monitoring services, etc.
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    trustedIPs.forEach(ip => this.whitelist.add(ip.trim()));
    
    // Always whitelist localhost
    this.whitelist.add('127.0.0.1');
    this.whitelist.add('::1');
    this.whitelist.add('::ffff:127.0.0.1');
    
    // Blacklist: Known bad IPs (could be loaded from threat intelligence feeds)
    const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];
    blockedIPs.forEach(ip => this.blacklist.add(ip.trim()));
  }
  
  isWhitelisted(ip) {
    return this.whitelist.has(ip);
  }
  
  isBlacklisted(ip) {
    // Check permanent blacklist
    if (this.blacklist.has(ip)) return true;
    
    // Check temporary graylist
    const graylistEntry = this.graylist.get(ip);
    if (graylistEntry && graylistEntry.until > Date.now()) {
      return true;
    }
    
    return false;
  }
  
  addToBlacklist(ip, reason, duration = null) {
    if (duration) {
      // Temporary ban (graylist)
      this.graylist.set(ip, {
        reason,
        until: Date.now() + duration,
        added: new Date().toISOString()
      });
      console.log(`⏰ [RATE_LIMIT] Temporarily banned ${ip} for ${duration}ms - ${reason}`);
    } else {
      // Permanent ban
      this.blacklist.add(ip);
      console.log(`🚫 [RATE_LIMIT] Permanently banned ${ip} - ${reason}`);
    }
  }
  
  updateReputation(ip, action) {
    const current = this.reputation.get(ip) || {
      score: 100,
      requests: 0,
      violations: 0,
      lastSeen: Date.now()
    };
    
    switch (action) {
      case 'request':
        current.requests++;
        current.lastSeen = Date.now();
        break;
      case 'violation':
        current.violations++;
        current.score = Math.max(0, current.score - 10);
        break;
      case 'blocked':
        current.score = Math.max(0, current.score - 20);
        break;
      case 'attack':
        current.score = 0;
        break;
    }
    
    this.reputation.set(ip, current);
    
    // Auto-ban if reputation too low
    if (current.score <= 0) {
      this.addToBlacklist(ip, 'Low reputation score', 24 * 60 * 60 * 1000); // 24 hour ban
    }
    
    return current.score;
  }
  
  getIpInfo(ip) {
    const geo = geoip.lookup(ip);
    const reputation = this.reputation.get(ip);
    
    return {
      ip,
      geo: geo ? {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone
      } : null,
      reputation: reputation || { score: 100, requests: 0, violations: 0 },
      status: this.isBlacklisted(ip) ? 'blacklisted' :
              this.isWhitelisted(ip) ? 'whitelisted' : 'normal'
    };
  }
  
  cleanupOldEntries() {
    // Clean up expired graylist entries
    const now = Date.now();
    for (const [ip, entry] of this.graylist.entries()) {
      if (entry.until < now) {
        this.graylist.delete(ip);
      }
    }
    
    // Clean up old reputation entries (not seen in 30 days)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    for (const [ip, data] of this.reputation.entries()) {
      if (data.lastSeen < thirtyDaysAgo) {
        this.reputation.delete(ip);
      }
    }
  }
}

/**
 * ATTACK DETECTOR
 * Monitors for DDoS and abuse patterns
 */
class AttackDetector {
  constructor() {
    this.requestLog = new Map(); // IP -> timestamps
    this.globalRequestCount = 0;
    this.attackMode = false;
    this.attackModeUntil = 0;
  }
  
  logRequest(ip, headers) {
    // Update request log
    if (!this.requestLog.has(ip)) {
      this.requestLog.set(ip, []);
    }
    
    const timestamps = this.requestLog.get(ip);
    timestamps.push(Date.now());
    
    // Keep only recent timestamps (last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentTimestamps = timestamps.filter(ts => ts > oneMinuteAgo);
    this.requestLog.set(ip, recentTimestamps);
    
    // Check for rapid fire attack
    const tenSecondsAgo = Date.now() - 10000;
    const recentRequests = recentTimestamps.filter(ts => ts > tenSecondsAgo).length;
    
    if (recentRequests > ATTACK_PATTERNS.rapidFire.requests) {
      console.error(`🚨 [ATTACK_DETECTOR] Rapid fire attack detected from ${ip}`);
      return { attack: true, type: 'rapid_fire', severity: 'high' };
    }
    
    // Check suspicious user agent
    const userAgent = headers['user-agent'] || '';
    for (const pattern of ATTACK_PATTERNS.suspiciousAgents) {
      if (pattern.test(userAgent)) {
        console.warn(`⚠️ [ATTACK_DETECTOR] Suspicious user agent from ${ip}: ${userAgent}`);
        return { attack: true, type: 'suspicious_agent', severity: 'medium' };
      }
    }
    
    // Check attack signatures in referer or user agent
    const referer = headers['referer'] || '';
    const checkString = `${userAgent} ${referer}`;
    
    for (const pattern of ATTACK_PATTERNS.attackSignatures) {
      if (pattern.test(checkString)) {
        console.error(`🚨 [ATTACK_DETECTOR] Attack signature detected from ${ip}`);
        return { attack: true, type: 'attack_signature', severity: 'critical' };
      }
    }
    
    // Check for distributed attack
    if (this.requestLog.size > ATTACK_PATTERNS.distributed.uniqueIPs) {
      console.error(`🚨 [ATTACK_DETECTOR] Possible distributed attack - ${this.requestLog.size} unique IPs`);
      this.enableAttackMode();
      return { attack: true, type: 'distributed', severity: 'critical' };
    }
    
    return { attack: false };
  }
  
  enableAttackMode() {
    this.attackMode = true;
    this.attackModeUntil = Date.now() + (5 * 60 * 1000); // 5 minutes
    console.error('🛡️ [ATTACK_DETECTOR] ATTACK MODE ENABLED - Enhanced protection active');
  }
  
  isInAttackMode() {
    if (this.attackMode && Date.now() > this.attackModeUntil) {
      this.attackMode = false;
      console.log('✅ [ATTACK_DETECTOR] Attack mode disabled - Normal operation resumed');
    }
    return this.attackMode;
  }
  
  cleanup() {
    // Clean up old request logs
    const oneMinuteAgo = Date.now() - 60000;
    for (const [ip, timestamps] of this.requestLog.entries()) {
      const recent = timestamps.filter(ts => ts > oneMinuteAgo);
      if (recent.length === 0) {
        this.requestLog.delete(ip);
      } else {
        this.requestLog.set(ip, recent);
      }
    }
  }
}

// Create instances
const ipReputation = new IpReputationManager();
const attackDetector = new AttackDetector();

/**
 * CREATE RATE LIMITERS
 * Use Redis if available, fallback to memory
 */
async function createRateLimiter(config) {
  try {
    // Try to use Redis for distributed rate limiting
    const redis = redisService.pool?.redis;
    if (redis && redisService.pool.isConnected) {
      return new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: config.keyPrefix,
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration
      });
    }
  } catch (error) {
    console.warn('⚠️ [RATE_LIMIT] Redis not available, using memory store');
  }
  
  // Fallback to memory store
  return new RateLimiterMemory({
    keyPrefix: config.keyPrefix,
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration
  });
}

// Initialize rate limiters
const rateLimiters = {};
(async () => {
  for (const [name, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    rateLimiters[name] = await createRateLimiter(config);
  }
})();

/**
 * MAIN RATE LIMITING MIDDLEWARE
 * Protects endpoints from abuse
 */
export function rateLimitMiddleware(type = 'api') {
  return async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Check if whitelisted
    if (ipReputation.isWhitelisted(ip)) {
      return next();
    }
    
    // Check if blacklisted
    if (ipReputation.isBlacklisted(ip)) {
      console.error(`🚫 [RATE_LIMIT] Blocked request from blacklisted IP: ${ip}`);
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Your IP has been blocked due to suspicious activity'
      });
    }
    
    // Log request for attack detection
    const attackCheck = attackDetector.logRequest(ip, req.headers);
    if (attackCheck.attack) {
      // Update reputation
      ipReputation.updateReputation(ip, 'attack');
      
      // Add to blacklist based on severity
      const banDuration = attackCheck.severity === 'critical' ? 24 * 60 * 60 * 1000 : // 24 hours
                         attackCheck.severity === 'high' ? 60 * 60 * 1000 :      // 1 hour
                         15 * 60 * 1000;                                         // 15 minutes
      
      ipReputation.addToBlacklist(ip, `${attackCheck.type} attack detected`, banDuration);
      
      return res.status(403).json({
        error: 'ATTACK_DETECTED',
        message: 'Suspicious activity detected'
      });
    }
    
    // Apply rate limiting
    try {
      // Check global limit first
      const globalLimiter = rateLimiters.global;
      if (globalLimiter) {
        await globalLimiter.consume(ip);
      }
      
      // Check specific endpoint limit
      const limiter = rateLimiters[type];
      if (limiter) {
        await limiter.consume(ip);
      }
      
      // Update reputation (good request)
      ipReputation.updateReputation(ip, 'request');
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIGS[type].points);
      res.setHeader('X-RateLimit-Duration', RATE_LIMIT_CONFIGS[type].duration);
      
      next();
    } catch (rateLimiterRes) {
      // Rate limit exceeded
      ipReputation.updateReputation(ip, 'violation');
      
      // Check if in attack mode
      if (attackDetector.isInAttackMode()) {
        // Stricter response during attack
        ipReputation.addToBlacklist(ip, 'Rate limit exceeded during attack', 60 * 60 * 1000); // 1 hour
        
        return res.status(503).json({
          error: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable'
        });
      }
      
      // Normal rate limit response
      res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000);
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIGS[type].points);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints || 0);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
      
      console.warn(`⚠️ [RATE_LIMIT] Rate limit exceeded for ${ip} on ${type} endpoint`);
      
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000)
      });
    }
  };
}

/**
 * ADMIN ENDPOINTS
 * For managing IP reputation and monitoring
 */
export const rateLimitAdminRoutes = {
  // Get IP info
  getIpInfo: (req, res) => {
    const { ip } = req.params;
    const info = ipReputation.getIpInfo(ip);
    res.json(info);
  },
  
  // Whitelist an IP
  whitelistIp: (req, res) => {
    const { ip } = req.body;
    ipReputation.whitelist.add(ip);
    console.log(`✅ [RATE_LIMIT] Added ${ip} to whitelist`);
    res.json({ success: true, message: `${ip} added to whitelist` });
  },
  
  // Blacklist an IP
  blacklistIp: (req, res) => {
    const { ip, reason, duration } = req.body;
    ipReputation.addToBlacklist(ip, reason || 'Manual ban', duration);
    res.json({ success: true, message: `${ip} added to blacklist` });
  },
  
  // Get attack status
  getAttackStatus: (req, res) => {
    res.json({
      attackMode: attackDetector.isInAttackMode(),
      activeIPs: attackDetector.requestLog.size,
      blacklistedIPs: ipReputation.blacklist.size,
      graylistedIPs: ipReputation.graylist.size
    });
  },
  
  // Get rate limit stats
  getRateLimitStats: async (req, res) => {
    const stats = {};
    
    for (const [name, limiter] of Object.entries(rateLimiters)) {
      // This is limiter-specific, implementation depends on rate-limiter-flexible
      stats[name] = {
        points: RATE_LIMIT_CONFIGS[name].points,
        duration: RATE_LIMIT_CONFIGS[name].duration,
        type: limiter.constructor.name
      };
    }
    
    res.json(stats);
  }
};

/**
 * CLEANUP SCHEDULER
 * Runs periodically to clean up old data
 */
setInterval(() => {
  ipReputation.cleanupOldEntries();
  attackDetector.cleanup();
}, 60 * 60 * 1000); // Run every hour

export default rateLimitMiddleware;
