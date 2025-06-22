import NodeCache from 'node-cache';
import braveAPIManager from './braveAPIManager.js';
import newsSynthesizer from './newsSynthesizer.js';

/**
 * Brave News Service - Updated Implementation
 * Fetches financial news using Brave Search API with enhanced
 * caching, rate limiting, and fallback mechanisms
 */
class BraveNewsService {
    constructor() {
        // Enhanced cache with dynamic TTL
        this.cache = new NodeCache();
        
        // Default cache durations
        this.standardCacheTTL = 7200; // 2 hours standard cache
        this.extendedCacheTTL = 21600; // 6 hours during rate limiting
        this.emergencyCacheTTL = 43200; // 12 hours during circuit breaking
        
        // Query configurations
        this.primaryQueries = [
            'market news today',
            'stock market highlights',
            'financial markets today',
            'wall street news today',
            'market movers today'
        ];
        
        this.secondaryQueries = [
            'economic data impact',
            'earnings reports market',
            'fed policy markets',
            'global markets update',
            'sector performance today'
        ];
        
        // Query success tracking
        this.querySuccessRates = new Map();
        this.primaryQueries.forEach(query => this.querySuccessRates.set(query, 1.0));
        this.secondaryQueries.forEach(query => this.querySuccessRates.set(query, 0.8));
        
        // Listen for rate limit events
        braveAPIManager.on('rateLimited', this.handleRateLimitEvent.bind(this));
        braveAPIManager.on('circuitOpen', this.handleCircuitOpenEvent.bind(this));
        
        console.log('Brave News Service initialized with enhanced caching and fallback mechanisms');
    }
    
    /**
     * Handle rate limit events from the API manager
     * @param {Object} event - Rate limit event data
     */
    handleRateLimitEvent(event) {
        console.log('Brave News Service received rate limit event:', event);
        
        // Extend cache TTL for existing items
        if (this.cache.keys().length > 0) {
            console.log('Extending cache TTL for all news items due to rate limiting');
            
            // Get current cached news
            const cachedNews = this.cache.get('market-news');
            if (cachedNews) {
                // Extend TTL
                this.cache.set('market-news', cachedNews, this.extendedCacheTTL);
                console.log(`Cache TTL extended to ${this.extendedCacheTTL} seconds (${Math.round(this.extendedCacheTTL/3600)} hours)`);
            }
        }
    }
    
    /**
     * Handle circuit open events from the API manager
     * @param {Object} event - Circuit open event data
     */
    handleCircuitOpenEvent(event) {
        console.log('Brave News Service received circuit open event:', event);
        
        // Extend cache TTL for existing items to maximum
        if (this.cache.keys().length > 0) {
            console.log('Extending cache TTL for all news items due to circuit breaker');
            
            // Get current cached news
            const cachedNews = this.cache.get('market-news');
            if (cachedNews) {
                // Extend TTL to emergency duration
                this.cache.set('market-news', cachedNews, this.emergencyCacheTTL);
                console.log(`Cache TTL extended to ${this.emergencyCacheTTL} seconds (${Math.round(this.emergencyCacheTTL/3600)} hours)`);
            }
        }
        
        // Generate synthetic content as backup
        this.generateAndCacheSyntheticNews();
    }
    
    /**
     * Generate synthetic news and cache it as backup
     */
    async generateAndCacheSyntheticNews() {
        try {
            console.log('Generating synthetic news as backup');
            const syntheticNews = await newsSynthesizer.generateNews(5);
            
            if (syntheticNews && syntheticNews.length > 0) {
                this.cache.set('synthetic-news', syntheticNews, this.emergencyCacheTTL);
                console.log(`Generated and cached ${syntheticNews.length} synthetic news items`);
            }
        } catch (error) {
            console.error('Error generating synthetic news:', error.message);
        }
    }
    
    /**
     * Select the best query based on past success rates
     * @returns {String} Selected query
     */
    selectBestQuery() {
        // Combine all queries
        const allQueries = [...this.primaryQueries, ...this.secondaryQueries];
        
        // Sort by success rate (higher first)
        allQueries.sort((a, b) => {
            const rateA = this.querySuccessRates.get(a) || 0;
            const rateB = this.querySuccessRates.get(b) || 0;
            return rateB - rateA;
        });
        
        // Select top query with some randomness for exploration
        // 80% chance of using top query, 20% chance of trying others
        if (Math.random() < 0.8) {
            return allQueries[0];
        } else {
            // Pick a random query from top 5
            const topQueries = allQueries.slice(0, Math.min(5, allQueries.length));
            return topQueries[Math.floor(Math.random() * topQueries.length)];
        }
    }
    
    /**
     * Update query success rates
     * @param {String} query - The query used
     * @param {Boolean} success - Whether the query was successful
     * @param {Number} resultCount - Number of results returned
     */
    updateQuerySuccessRate(query, success, resultCount) {
        // Get current success rate
        const currentRate = this.querySuccessRates.get(query) || 0.5;
        
        // Calculate new rate with dampening (slow adaptation)
        let newRate;
        if (success) {
            // Success is weighted by result count (0-5 scale)
            const resultQuality = Math.min(resultCount, 5) / 5;
            // Increase by 10% of the distance to 1.0, multiplied by result quality
            newRate = currentRate + (1 - currentRate) * 0.1 * resultQuality;
        } else {
            // Decrease by 20% toward 0.0 for failures
            newRate = currentRate * 0.8;
        }
        
        // Update rate
        this.querySuccessRates.set(query, newRate);
        console.log(`Updated success rate for query "${query}": ${currentRate.toFixed(2)} -> ${newRate.toFixed(2)}`);
    }
    
    /**
     * Call Brave API to get news
     * @param {String} query - Search query
     * @param {Number} count - Number of results to return
     * @returns {Promise<Object>} API response
     */
    async callAPI(query, count = 10) {
        try {
            console.log(`Making Brave API request with query: "${query}"`);
            
            // Make request via the API manager
            const response = await braveAPIManager.request({
                url: process.env.BRAVE_API_URL || 'https://api.search.brave.com/res/v1/news/search',
                params: {
                    q: query,
                    count: count
                }
            });
            
            // Extract news items
            const newsItems = response?.news || [];
            console.log(`Brave API returned ${newsItems.length} results for query "${query}"`);
            
            // Update query success rate
            this.updateQuerySuccessRate(query, true, newsItems.length);
            
            return response;
        } catch (error) {
            console.error(`Brave API error for query "${query}":`, error.message);
            
            // Update query success rate negatively
            this.updateQuerySuccessRate(query, false, 0);
            
            throw error;
        }
    }
    
    /**
     * Get market news with enhanced caching and fallback
     * @returns {Promise<Array>} Market news articles
     */
    async getMarketNews() {
        try {
            // Create cache key
            const cacheKey = 'market-news';
            
            // Check cache first
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
                console.log(`Using cached market news (TTL: ${this.cache.getTtl(cacheKey)})`);
                return cachedData;
            }
            
            // Check if we have synthetic news as backup
            const syntheticNews = this.cache.get('synthetic-news');
            
            // Check API manager status
            const apiStatus = braveAPIManager.getStatus();
            if (apiStatus.circuitOpen) {
                console.log('Brave API circuit is open. Using synthetic news.');
                
                // If we have synthetic news, use it
                if (syntheticNews) {
                    return syntheticNews;
                }
                
                // Otherwise, generate new synthetic news
                const newSyntheticNews = await newsSynthesizer.generateNews(5);
                return newSyntheticNews;
            }
            
            // If rate limited, use synthetic news with high probability
            if (apiStatus.isRateLimited && syntheticNews && Math.random() < 0.8) {
                console.log('Brave API is rate limited. Using synthetic news to reduce API load.');
                return syntheticNews;
            }
            
            console.log('Fetching market news from Brave API');
            
            // Select best query
            const query = this.selectBestQuery();
            console.log(`Selected query: "${query}" with success rate: ${this.querySuccessRates.get(query)?.toFixed(2) || 'unknown'}`);
            
            try {
                // Make API request
                const response = await this.callAPI(query, 5);
                
                // Process and normalize data
                const newsItems = response?.news || [];
                if (newsItems.length > 0) {
                    const processedItems = newsItems.map(item => ({
                        id: item.url || `${Date.now()}-${Math.random()}`,
                        title: item.title || 'No title',
                        url: item.url || '#',
                        source: item.source || 'News',
                        published: item.published_time || new Date().toISOString(),
                        snippet: item.description || ''
                    }));
                    
                    // Cache the results with standard TTL
                    this.cache.set(cacheKey, processedItems, this.standardCacheTTL);
                    console.log(`Cached ${processedItems.length} news items for ${this.standardCacheTTL} seconds`);
                    
                    return processedItems;
                } else {
                    throw new Error(`Query "${query}" returned 0 items`);
                }
            } catch (error) {
                // If first query fails, try a different query
                console.log('First query failed, trying alternative query');
                
                // Remove failed query from top list temporarily
                const failedQuery = query;
                const alternativeQuery = this.primaryQueries.find(q => q !== failedQuery) || 
                                      this.secondaryQueries[0];
                
                try {
                    const response = await this.callAPI(alternativeQuery, 5);
                    
                    // Process and normalize data
                    const newsItems = response?.news || [];
                    if (newsItems.length > 0) {
                        const processedItems = newsItems.map(item => ({
                            id: item.url || `${Date.now()}-${Math.random()}`,
                            title: item.title || 'No title',
                            url: item.url || '#',
                            source: item.source || 'News',
                            published: item.published_time || new Date().toISOString(),
                            snippet: item.description || ''
                        }));
                        
                        // Cache the results
                        this.cache.set(cacheKey, processedItems, this.standardCacheTTL);
                        
                        return processedItems;
                    }
                } catch (secondError) {
                    console.error('Second query also failed:', secondError.message);
                }
                
                throw error; // Re-throw for fallback handler
            }
        } catch (error) {
            console.error('Error fetching market news:', error.message);
            
            // Check if we have synthetic news
            const syntheticNews = this.cache.get('synthetic-news');
            if (syntheticNews) {
                console.log('Using cached synthetic news as fallback');
                return syntheticNews;
            }
            
            // Generate synthetic news
            console.log('Generating synthetic news as fallback');
            const newSynthetic = await newsSynthesizer.generateNews(5);
            
            // Cache synthetic news for emergency use
            this.cache.set('synthetic-news', newSynthetic, this.emergencyCacheTTL);
            
            return newSynthetic;
        }
    }
    
    /**
     * Check Brave API status
     * @returns {Promise<Object>} API status
     */
    async checkApiStatus() {
        // Get status from API manager
        const status = braveAPIManager.getStatus();
        
        // If circuit is open, return that status
        if (status.circuitOpen) {
            return {
                status: 'circuit_open',
                message: 'Brave API circuit breaker is open due to multiple failures',
                resetTime: status.circuitResetTime ? new Date(status.circuitResetTime).toISOString() : 'unknown',
                quotaUsed: status.quotaUsed,
                quotaLimit: status.quotaLimit
            };
        }
        
        // If rate limited, return that status
        if (status.isRateLimited) {
            return {
                status: 'rate_limited',
                message: 'Brave API is rate limited',
                resetTime: status.rateLimitResetTime ? new Date(status.rateLimitResetTime).toISOString() : 'unknown',
                quotaUsed: status.quotaUsed,
                quotaLimit: status.quotaLimit
            };
        }
        
        // Otherwise, try a simple API call to check health
        try {
            // Make a simple call via the manager
            await braveAPIManager.request({
                url: process.env.BRAVE_API_URL || 'https://api.search.brave.com/res/v1/news/search',
                params: {
                    q: 'test',
                    count: 1
                }
            });
            
            return {
                status: 'active',
                message: 'Brave API is working correctly',
                apiKey: process.env.BRAVE_API_KEY ? `${process.env.BRAVE_API_KEY.substring(0, 5)}...` : 'Not set',
                quotaUsed: status.quotaUsed,
                quotaLimit: status.quotaLimit,
                quotaRemaining: status.quotaLimit - status.quotaUsed
            };
        } catch (error) {
            // If the call fails with 429, it means the API works but is rate limited
            if (error.response?.status === 429) {
                return {
                    status: 'rate_limited',
                    message: 'Brave API is rate limited but otherwise working',
                    resetTime: status.rateLimitResetTime ? new Date(status.rateLimitResetTime).toISOString() : 'unknown',
                    quotaUsed: status.quotaUsed,
                    quotaLimit: status.quotaLimit
                };
            }
            
            // Otherwise, there's a different error
            return {
                status: 'error',
                message: `Brave API error: ${error.message}`,
                apiKey: process.env.BRAVE_API_KEY ? `${process.env.BRAVE_API_KEY.substring(0, 5)}...` : 'Not set',
                statusCode: error.response?.status
            };
        }
    }
    
    /**
     * Reset the service
     */
    resetService() {
        // Clear cache
        this.cache.flushAll();
        console.log('Brave News Service cache cleared');
        
        // Reset API manager
        braveAPIManager.reset();
        
        // Reset query success rates to initial values
        this.primaryQueries.forEach(query => this.querySuccessRates.set(query, 1.0));
        this.secondaryQueries.forEach(query => this.querySuccessRates.set(query, 0.8));
        
        return {
            status: 'reset_complete',
            message: 'Brave News Service has been reset'
        };
    }
}

export default new BraveNewsService();