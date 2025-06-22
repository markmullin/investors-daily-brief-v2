/**
 * Brave API Manager
 * Centralized manager for all Brave API requests with enhanced rate limiting, priority queue, and backoff
 */
import axios from 'axios';
import EventEmitter from 'events';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config();

class BraveAPIManager {
  constructor() {
    // Replace multiple queues with a single priority queue
    this.requestQueue = [];
    
    // Rate limiting state
    this.isRateLimited = false;
    this.rateLimitResetTime = null;
    this.consecutiveErrors = 0;
    this.lastRequestTime = 0;
    
    // Base timing configuration - drastically increased to better respect rate limits
    this.baseInterval = 3500; // 3.5 seconds (increased from 2s)
    this.currentBackoff = this.baseInterval;
    this.maxBackoff = 30 * 60 * 1000; // 30 minutes max backoff (doubled from 15 minutes)
    
    // Circuit breaker configuration
    this.circuitOpen = false;
    this.circuitResetTime = null;
    this.errorThreshold = 4; // Reduced from 5 to be more cautious
    
    // Quota tracking
    this.quotaUsed = 0;
    this.quotaLimit = 2000;
    this.quotaResetDay = 1; // Assume quota resets on the 1st of each month
    
    // Request tracking for persistent storage
    this.dailyRequestCount = 0;
    this.lastRequestDate = new Date().toDateString();
    
    // Enhanced caching strategy with much increased durations
    this.cacheSettings = {
      normal: 12 * 60 * 60,     // 12 hours (doubled from 6 hours)
      rateLimited: 24 * 60 * 60, // 24 hours (increased from 18 hours)
      emergency: 48 * 60 * 60    // 48 hours (increased from 36 hours)
    };
    
    // Create event emitter for status changes
    this.events = new EventEmitter();
    
    // API configuration
    this.apiKey = process.env.BRAVE_API_KEY;
    
    // Use the correct URL format
    this.baseUrl = process.env.BRAVE_API_URL || 'https://api.search.brave.com/res/v1/news/search';
    
    // Request limits
    this.maxDailyRequests = 200; // Conservative limit
    this.loadStoredState();
    
    // Start processing queue
    this.processQueue();
    
    console.log('Brave API Manager initialized with SIGNIFICANTLY enhanced rate limiting');
    console.log(`- API Key: ${this.apiKey ? 'Available' : 'Not set'}`);
    console.log(`- Base URL: ${this.baseUrl}`);
    console.log(`- Base interval: ${this.baseInterval}ms (${this.baseInterval/1000}s)`);
    console.log(`- Cache durations: Normal=${this.cacheSettings.normal/3600}h, Rate Limited=${this.cacheSettings.rateLimited/3600}h, Emergency=${this.cacheSettings.emergency/3600}h`);
    console.log(`- Daily request limit: ${this.maxDailyRequests}, Current count: ${this.dailyRequestCount}`);
  }
  
  /**
   * Load stored state from file
   */
  loadStoredState() {
    try {
      const stateDir = path.join(process.cwd(), 'data');
      const stateFile = path.join(stateDir, 'brave-api-state.json');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      
      // Check if state file exists
      if (fs.existsSync(stateFile)) {
        const data = fs.readFileSync(stateFile, 'utf8');
        const state = JSON.parse(data);
        
        // Check if state is from today
        if (state.date === new Date().toDateString()) {
          this.dailyRequestCount = state.dailyRequestCount || 0;
          this.quotaUsed = state.quotaUsed || 0;
          this.lastRequestDate = state.date;
          
          console.log(`Loaded state from file: ${this.dailyRequestCount} requests today, ${this.quotaUsed} quota used`);
        } else {
          // New day, reset daily counter
          this.dailyRequestCount = 0;
          this.lastRequestDate = new Date().toDateString();
          
          console.log(`New day detected. Resetting daily request count.`);
          
          // Save new state
          this.saveState();
        }
      } else {
        // No state file, initialize with defaults
        this.saveState();
      }
    } catch (error) {
      console.warn(`Failed to load state: ${error.message}`);
      // Continue with default values
    }
  }
  
  /**
   * Save state to file
   */
  saveState() {
    try {
      const stateDir = path.join(process.cwd(), 'data');
      const stateFile = path.join(stateDir, 'brave-api-state.json');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      
      // Save state
      const state = {
        date: new Date().toDateString(),
        dailyRequestCount: this.dailyRequestCount,
        quotaUsed: this.quotaUsed,
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      console.warn(`Failed to save state: ${error.message}`);
    }
  }
  
  /**
   * Add a request to the queue with priority
   * @param {Object} config - Request configuration
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   * @param {String} priority - Priority ('high', 'normal', or 'low')
   */
  addToQueue(config, resolve, reject, priority = 'normal') {
    // Check if we've hit daily request limit
    if (this.dailyRequestCount >= this.maxDailyRequests) {
      console.warn(`Daily request limit (${this.maxDailyRequests}) reached. Rejecting request.`);
      reject(new Error(`Daily request limit (${this.maxDailyRequests}) reached. Try again tomorrow.`));
      return;
    }
    
    // Add request to queue with priority
    this.requestQueue.push({
      config,
      resolve,
      reject,
      addedAt: Date.now(),
      priority // 'high', 'normal', or 'low'
    });
    
    console.log(`Request added to queue with ${priority} priority. Queue length: ${this.requestQueue.length}`);
    
    // If circuit is open, warn about it
    if (this.circuitOpen) {
      console.warn('Circuit is open. Request added to queue but will be delayed.');
      
      // If circuit reset time is set, log when it will reset
      if (this.circuitResetTime) {
        const waitTime = Math.ceil((this.circuitResetTime - Date.now()) / 1000);
        console.log(`Circuit will reset in ${waitTime} seconds`);
      }
    }
    
    // Log queue status if it's getting long
    if (this.requestQueue.length > 5) {
      console.warn(`Queue is building up (${this.requestQueue.length} items)`);
    }
  }
  
  /**
   * Process the request queue with priority handling
   */
  async processQueue() {
    // Continue processing indefinitely
    while (true) {
      try {
        // Check if it's a new day
        const currentDate = new Date().toDateString();
        if (currentDate !== this.lastRequestDate) {
          console.log(`New day detected. Resetting daily request count.`);
          this.dailyRequestCount = 0;
          this.lastRequestDate = currentDate;
          this.saveState();
        }
        
        // If queue is empty, wait a bit and check again
        if (this.requestQueue.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        // Check if we've hit daily request limit
        if (this.dailyRequestCount >= this.maxDailyRequests) {
          console.warn(`Daily request limit (${this.maxDailyRequests}) reached. Holding all requests until tomorrow.`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Check again after 10 seconds
          continue;
        }
        
        // Check if circuit is open
        if (this.circuitOpen) {
          // If circuit reset time is set and has passed, close the circuit
          if (this.circuitResetTime && Date.now() > this.circuitResetTime) {
            console.log('Circuit reset time reached. Closing circuit.');
            this.closeCircuit();
          } else {
            // Otherwise, wait and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // Check if we're rate limited
        if (this.isRateLimited) {
          // If rate limit reset time is set and has passed, clear rate limited flag
          if (this.rateLimitResetTime && Date.now() > this.rateLimitResetTime) {
            console.log('Rate limit reset time reached. Clearing rate limited flag.');
            this.isRateLimited = false;
            this.rateLimitResetTime = null;
          } else {
            // Otherwise, wait and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // Enforce minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.currentBackoff) {
          // Wait the remaining time
          const waitTime = this.currentBackoff - timeSinceLastRequest;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Sort queue by priority ('high' > 'normal' > 'low')
        this.requestQueue.sort((a, b) => {
          const priorityValues = { 'high': 3, 'normal': 2, 'low': 1 };
          return priorityValues[b.priority || 'normal'] - priorityValues[a.priority || 'normal'];
        });
        
        // Get the next request from the queue (highest priority first)
        const nextRequest = this.requestQueue.shift();
        
        // Process the request
        await this.executeRequest(nextRequest);
        
      } catch (error) {
        console.error('Error in queue processor:', error.message);
        // Wait a bit before continuing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  /**
   * Execute a single request
   * @param {Object} request - Request object from queue
   */
  async executeRequest(request) {
    try {
      // Update last request time
      this.lastRequestTime = Date.now();
      
      // Increment daily request count and save state
      this.dailyRequestCount++;
      this.saveState();
      
      // Get URL from config or use default
      const url = request.config.url || this.baseUrl;
      
      // Extract the query parameter
      let query, count;
      let params = {};
      
      // Support both parameter formats
      if (request.config.params) {
        // Format: { params: { q: 'query', count: 5 } }
        params = { ...request.config.params };
        query = params.q;
        count = params.count || 5;
      } else if (request.config.q) {
        // Format: { q: 'query', count: 5 }
        query = request.config.q;
        count = request.config.count || 5;
        params = { q: query, count: count };
        
        // Copy any other parameters
        if (request.config.search_lang) params.search_lang = request.config.search_lang;
        if (request.config.country) params.country = request.config.country;
        if (request.config.spellcheck !== undefined) params.spellcheck = request.config.spellcheck;
        if (request.config.safesearch !== undefined) params.safesearch = request.config.safesearch;
      } else {
        throw new Error('Missing required parameter: q (query)');
      }
      
      // Add essential parameters if not present 
      // These parameters are crucial for getting valid results
      if (!params.search_lang) params.search_lang = 'en';
      if (!params.country) params.country = 'us';
      if (params.spellcheck === undefined) params.spellcheck = 1;
      if (params.safesearch === undefined) params.safesearch = 'off';
      
      console.log(`Executing ${request.priority || 'normal'} priority request to ${url} with query: "${query}", count: ${count}`);
      
      // Apply some jitter to user agent to reduce fingerprinting
      const userAgents = [
        'Investor-Daily-Brief/1.0',
        'Market-Dashboard/2.0',
        'Financial-Dashboard/1.1',
        'Financial-News-Service/2.1'
      ];
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      // Make request with standardized parameters
      const response = await axios({
        method: 'GET',
        url: url,
        params: params,
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.apiKey,
          'Accept-Encoding': 'gzip',
          'User-Agent': userAgent,
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000 // 15 second timeout
      });
      
      // Successful request, reset backoff and error count
      this.currentBackoff = this.baseInterval;
      this.consecutiveErrors = 0;
      
      // Increment quota used
      this.quotaUsed++;
      this.saveState();
      
      // Emit quota update event
      this.events.emit('quotaUpdate', {
        used: this.quotaUsed,
        limit: this.quotaLimit,
        remaining: this.quotaLimit - this.quotaUsed
      });
      
      // Resolve the promise with the response data
      request.resolve(response.data);
      
    } catch (error) {
      // Handle error
      console.error('Brave API request error:', error.message);
      if (error.response) {
        console.error(`Status code: ${error.response.status}`);
        console.error('Response data:', error.response.data);
      }
      
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        this.handleRateLimitError(error);
      } else {
        // Increment consecutive errors
        this.consecutiveErrors++;
        
        // Apply exponential backoff
        this.applyBackoff();
        
        // Check if we need to open the circuit
        if (this.consecutiveErrors >= this.errorThreshold) {
          this.openCircuit();
        }
      }
      
      // Reject with the real error - don't synthesize a response
      request.reject(error);
    }
  }
  
  /**
   * Handle a rate limit error
   * @param {Error} error - Error object
   */
  handleRateLimitError(error) {
    this.isRateLimited = true;
    
    // Extract meta information if available
    const meta = error.response?.data?.error?.meta;
    let resetDelay = 300000; // Default 5 minutes (increased from 60 seconds)
    
    if (meta) {
      // Extract quota information
      if (meta.quota_current) {
        this.quotaUsed = meta.quota_current;
        this.saveState();
      }
      
      if (meta.quota_limit) {
        this.quotaLimit = meta.quota_limit;
      }
      
      // Calculate reset delay based on current rate count - much more aggressive
      if (meta.rate_current) {
        resetDelay = Math.max(60, meta.rate_current * 15) * 1000; // Much more aggressive (15x instead of 5x)
      }
      
      console.log(`Rate limit info: limit=${meta.rate_limit || 'unknown'}, current=${meta.rate_current || 'unknown'}, quota=${meta.quota_current || 'unknown'}/${meta.quota_limit || 'unknown'}`);
    }
    
    // Check for Retry-After header
    if (error.response?.headers['retry-after']) {
      const retryAfter = parseInt(error.response.headers['retry-after'], 10) * 1000;
      if (!isNaN(retryAfter)) {
        resetDelay = Math.max(resetDelay, retryAfter * 2); // Double the suggested retry time
      }
    }
    
    // Set rate limit reset time with a minimum of 60 seconds (increased from 15)
    const minDelay = 60000; // 60 seconds minimum
    resetDelay = Math.max(minDelay, resetDelay);
    this.rateLimitResetTime = Date.now() + resetDelay;
    
    console.log(`Rate limited. Will try again after ${new Date(this.rateLimitResetTime).toLocaleTimeString()} (${Math.round(resetDelay/1000)}s delay)`);
    
    // Apply more aggressive backoff
    this.applyBackoff(true);
    
    // Emit rate limit event
    this.events.emit('rateLimited', {
      resetTime: this.rateLimitResetTime,
      quotaUsed: this.quotaUsed,
      quotaLimit: this.quotaLimit
    });
  }
  
  /**
   * Apply exponential backoff
   * @param {Boolean} aggressive - Whether to apply more aggressive backoff
   */
  applyBackoff(aggressive = false) {
    // Calculate new backoff with exponential increase
    if (aggressive) {
      // More aggressive for rate limits (8x instead of 5x)
      this.currentBackoff = Math.min(this.currentBackoff * 8, this.maxBackoff);
    } else {
      // Standard exponential backoff (3x + jitter instead of 2x)
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 randomization factor
      this.currentBackoff = Math.min(this.currentBackoff * 3 * jitter, this.maxBackoff);
    }
    
    console.log(`Backoff increased to ${Math.round(this.currentBackoff / 1000)} seconds`);
  }
  
  /**
   * Open the circuit breaker
   */
  openCircuit() {
    if (!this.circuitOpen) {
      this.circuitOpen = true;
      
      // Set circuit reset time (20 minutes - increased from 10 minutes)
      this.circuitResetTime = Date.now() + 20 * 60 * 1000;
      
      console.warn(`Circuit opened due to ${this.consecutiveErrors} consecutive errors. Will reset at ${new Date(this.circuitResetTime).toLocaleTimeString()}`);
      
      // Emit circuit open event
      this.events.emit('circuitOpen', {
        resetTime: this.circuitResetTime,
        reason: `${this.consecutiveErrors} consecutive errors`
      });
    }
  }
  
  /**
   * Close the circuit breaker
   */
  closeCircuit() {
    if (this.circuitOpen) {
      this.circuitOpen = false;
      this.circuitResetTime = null;
      this.consecutiveErrors = 0;
      
      console.log('Circuit closed. Resuming normal operation.');
      
      // Emit circuit close event
      this.events.emit('circuitClosed', {
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Make a request to the Brave API with priority support
   * @param {Object} config - Request configuration
   * @param {String} priority - Request priority ('high', 'normal', or 'low')
   * @returns {Promise<Object>} Response data
   */
  async request(config, priority = 'normal') {
    return new Promise((resolve, reject) => {
      // Add to queue with priority
      this.addToQueue(config, resolve, reject, priority);
    });
  }
  
  /**
   * Get the status of the API manager
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRateLimited: this.isRateLimited,
      rateLimitResetTime: this.rateLimitResetTime,
      circuitOpen: this.circuitOpen,
      circuitResetTime: this.circuitResetTime,
      queueLength: this.requestQueue.length,
      currentBackoff: this.currentBackoff,
      consecutiveErrors: this.consecutiveErrors,
      quotaUsed: this.quotaUsed,
      quotaLimit: this.quotaLimit,
      quotaRemaining: this.quotaLimit - this.quotaUsed,
      dailyRequestCount: this.dailyRequestCount,
      maxDailyRequests: this.maxDailyRequests,
      dailyRemaining: this.maxDailyRequests - this.dailyRequestCount,
      cacheSettings: this.cacheSettings
    };
  }
  
  /**
   * Get cache TTL based on current API status
   * @returns {Number} Cache TTL in seconds
   */
  getCurrentCacheTTL() {
    if (this.circuitOpen) {
      return this.cacheSettings.emergency;
    } else if (this.isRateLimited) {
      return this.cacheSettings.rateLimited;
    } else {
      return this.cacheSettings.normal;
    }
  }
  
  /**
   * Reset the API manager
   */
  reset() {
    // Clear queue
    const queueLength = this.requestQueue.length;
    this.requestQueue = [];
    
    // Reset state
    this.isRateLimited = false;
    this.rateLimitResetTime = null;
    this.consecutiveErrors = 0;
    this.currentBackoff = this.baseInterval;
    this.circuitOpen = false;
    this.circuitResetTime = null;
    
    console.log(`API Manager reset. Cleared ${queueLength} pending requests.`);
    
    // Emit reset event
    this.events.emit('reset', {
      timestamp: Date.now(),
      clearedRequests: queueLength
    });
    
    return {
      clearedRequests: queueLength,
      status: 'reset_complete'
    };
  }
  
  /**
   * Register an event listener
   * @param {String} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    this.events.on(event, callback);
  }
}

// Export singleton instance
export default new BraveAPIManager();