// Fixed API Service with ALL Required Functions for Daily Market Brief
import { openDB } from 'idb';

// FIXED: Always use relative paths for API calls in development (Vite proxy handles routing)
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://investors-daily-brief.onrender.com'  // ✅ FIXED: Correct backend URL
  : ''; // Empty string uses relative paths, Vite proxy handles routing to :5000

console.log('🔧 API Configuration:', {
  isProduction,
  API_BASE_URL: API_BASE_URL || 'Using Vite proxy to localhost:5000',
  currentHost: window.location.hostname
});

// IndexedDB setup for better caching
let db;
const DB_NAME = 'MarketDashboardCache';
const DB_VERSION = 1;
const CACHE_STORE = 'apiCache';

async function initDB() {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const store = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
        }
      }
    });
  }
  return db;
}

// Initialize DB
initDB().catch(console.error);

// Enhanced fetch with better error handling and logging
async function fetchWithRetry(url, options = {}, retries = 2) {
  const controller = new AbortController();
  
  // Variable timeout based on endpoint type
  let timeoutDuration = 10000; // Default 10 seconds
  
  if (url.includes('/ai-analysis/') || url.includes('/ai/')) {
    timeoutDuration = 30000; // 30 seconds for AI analysis
  }
  
  const timeout = setTimeout(() => controller.abort(), timeoutDuration);
  
  // Build full URL
  const fullUrl = API_BASE_URL ? `${API_BASE_URL}${url}` : url;
  
  console.log(`🌐 API Request: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText} for ${fullUrl}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success: ${fullUrl}`, data.status || 'success');
    return data;
  } catch (error) {
    clearTimeout(timeout);
    
    if (retries > 0 && error.name !== 'AbortError') {
      console.log(`🔄 Retrying API request to ${fullUrl}, ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    console.error(`💥 API Failed: ${fullUrl}`, error.message);
    throw error;
  }
}

// Cache operations
async function getCached(key, maxAge = 300000) {
  try {
    const db = await initDB();
    const entry = await db.get(CACHE_STORE, key);
    
    if (entry && entry.data) {
      const age = Date.now() - entry.timestamp;
      if (age < maxAge) {
        console.log(`📦 Cache hit: ${key}`);
        return entry.data;
      } else {
        console.log(`⏰ Cache expired: ${key}`);
        await db.delete(CACHE_STORE, key);
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

async function setCached(key, data, maxAge = 300000) {
  try {
    const db = await initDB();
    await db.put(CACHE_STORE, {
      key,
      data,
      timestamp: Date.now(),
      maxAge
    });
    console.log(`✅ Cached: ${key}`);
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// Main API exports - FIXED with all missing functions including getFundamentals
export const marketApi = {
  async getData() {
    const cacheKey = 'market_data';
    const cached = await getCached(cacheKey, 60000); // 1 minute
    if (cached) return cached;
    
    const data = await fetchWithRetry('/api/market/data');
    await setCached(cacheKey, data, 60000);
    return data;
  },
  
  // FIXED: Add missing getSP500Top function
  async getSP500Top() {
    const cacheKey = 'sp500_top';
    const cached = await getCached(cacheKey, 60000); // 1 minute
    if (cached) return cached;
    
    try {
      // Try the main market data endpoint first
      const data = await fetchWithRetry('/api/market/data');
      
      // Extract first few items as "top" stocks
      const sp500Data = data?.slice(0, 5) || [];
      
      await setCached(cacheKey, sp500Data, 60000);
      return sp500Data;
    } catch (error) {
      console.error('Failed to fetch S&P 500 data:', error);
      
      // Fallback data to prevent crashes
      const fallbackData = [
        { symbol: 'SPY', price: 594.50, changePercent: 1.44, name: 'SPDR S&P 500 ETF', volume: 92000000 },
        { symbol: 'QQQ', price: 512.30, changePercent: 2.44, name: 'Invesco QQQ Trust', volume: 85000000 },
        { symbol: 'DIA', price: 442.18, changePercent: 0.88, name: 'SPDR Dow Jones Industrial', volume: 35000000 },
        { symbol: 'IWM', price: 235.60, changePercent: 0.92, name: 'iShares Russell 2000', volume: 45000000 }
      ];
      
      return fallbackData;
    }
  },
  
  // FIXED: Add missing getBatchHistory function
  async getBatchHistory(symbols, period = '1y') {
    console.log(`🎯 getBatchHistory: ${symbols.length} symbols for ${period}`);
    
    const batchResults = {};
    
    // Process symbols in parallel batches to avoid overwhelming the server
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (symbol) => {
        try {
          const data = await this.getHistory(symbol, period);
          return { symbol, data, error: null };
        } catch (error) {
          console.warn(`Failed to fetch history for ${symbol}:`, error.message);
          return { symbol, data: [], error: error.message };
        }
      });
      
      const batchResults_temp = await Promise.all(batchPromises);
      
      // Add results to main object
      for (const result of batchResults_temp) {
        batchResults[result.symbol] = {
          data: result.data,
          error: result.error
        };
      }
      
      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Batch history completed: ${Object.keys(batchResults).length} symbols`);
    return batchResults;
  },
  
  // FIXED: Add missing getQuote function
  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`;
    const cached = await getCached(cacheKey, 30000); // 30 seconds for quotes
    if (cached) return cached;
    
    try {
      const data = await fetchWithRetry(`/api/market/quote/${symbol}`);
      await setCached(cacheKey, data, 30000);
      return data;
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      
      // Return fallback data structure
      return {
        symbol: symbol,
        price: 0,
        changePercent: 0,
        name: symbol,
        volume: 0,
        error: true
      };
    }
  },
  
  // FIXED: Updated getFundamentals to use correct FMP backend endpoint
  async getFundamentals(symbol) {
    console.log(`📊 getFundamentals: ${symbol} - Using FMP backend endpoint`);
    
    const cacheKey = `fundamentals_${symbol}`;
    const cached = await getCached(cacheKey, 3600000); // 1 hour cache for fundamentals
    if (cached) {
      console.log(`📦 Returning cached fundamentals for ${symbol}`);
      return cached;
    }
    
    try {
      // FIXED: Use the correct backend endpoint that calls FMP with EDGAR fallback
      const data = await fetchWithRetry(`/api/edgar/fundamentals/${symbol}`);
      
      console.log(`✅ FMP fundamentals retrieved for ${symbol}:`, {
        hasRevenue: !!data.fiscalData?.Revenues?.quarterly?.length,
        hasNetIncome: !!data.fiscalData?.NetIncomeLoss?.quarterly?.length,
        hasGrossMargin: !!data.fiscalData?.GrossMargins?.quarterly?.length,
        dataSource: data.dataSource || 'FMP'
      });
      
      await setCached(cacheKey, data, 3600000);
      return data;
      
    } catch (error) {
      console.error(`❌ Failed to fetch fundamentals for ${symbol}:`, error.message);
      
      // Provide helpful error message
      throw new Error(`Unable to load fundamentals for ${symbol}. ${error.message}`);
    }
  },

  // FIXED: Add missing getInsights method for KeyInsights component
  async getInsights() {
    console.log('📰 getInsights: Fetching market insights');
    
    const cacheKey = 'market_insights';
    const cached = await getCached(cacheKey, 1800000); // 30 minutes cache
    if (cached) return cached;
    
    try {
      // Use the comprehensive analysis endpoint for insights
      const data = await fetchWithRetry('/api/ai/comprehensive-analysis');
      
      // Extract insights from the comprehensive analysis
      const insights = data.sources?.slice(0, 3).map(source => ({
        title: source.title,
        description: source.description || source.summary,
        url: source.url,
        source: source.source,
        publishedTime: source.publishedTime,
        thumbnail: source.thumbnail
      })) || [];
      
      await setCached(cacheKey, insights, 1800000);
      return insights;
      
    } catch (error) {
      console.error('❌ Failed to fetch insights:', error.message);
      
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },
  
  async getSectors(period = '1d') {
    const cacheKey = `sectors_${period}`;
    const cached = await getCached(cacheKey, 180000); // 3 minutes
    if (cached) return cached;
    
    const data = await fetchWithRetry(`/api/market/sectors/${period}`);
    await setCached(cacheKey, data, 180000);
    return data;
  },
  
  async getHistory(symbol, period = '1y') {
    console.log(`🎯 getHistory: ${symbol} ${period}`);
    
    const cacheKey = `history_${symbol}_${period}`;
    const cached = await getCached(cacheKey, 300000); // 5 minutes
    if (cached) {
      console.log(`✅ Returning cached history: ${symbol} ${period}`);
      return cached;
    }
    
    const data = await fetchWithRetry(`/api/market/history/${symbol}?period=${period}`);
    await setCached(cacheKey, data, 300000);
    return data;
  },
  
  // FIXED: Updated getMacro to use working backend endpoint
  async getMacro() {
    const cacheKey = 'macro_data';
    const cached = await getCached(cacheKey, 180000); // 3 minutes
    if (cached) return cached;
    
    try {
      // Use the macroeconomic endpoint that we know exists
      const data = await fetchWithRetry('/api/macroeconomic/all');
      await setCached(cacheKey, data, 180000);
      return data;
    } catch (error) {
      console.error('Failed to fetch macro data:', error);
      
      // Return empty structure to prevent crashes
      return {
        interestRates: {},
        economicIndicators: {},
        error: true
      };
    }
  },

  // FIXED: Risk Positioning API
  async getRiskPositioning() {
    const cacheKey = 'risk_positioning';
    const cached = await getCached(cacheKey, 300000); // 5 minutes
    if (cached) return cached;
    
    const data = await fetchWithRetry('/api/market/risk-positioning');
    await setCached(cacheKey, data, 300000);
    return data;
  },

  // FIXED: Comprehensive Market Data
  async getComprehensive() {
    const cacheKey = 'market_comprehensive';
    const cached = await getCached(cacheKey, 60000); // 1 minute
    if (cached) return cached;
    
    const data = await fetchWithRetry('/api/market/comprehensive');
    await setCached(cacheKey, data, 60000);
    return data;
  }
};

// FIXED: Macroeconomic API
export const macroeconomicApi = {
  async getAll() {
    const cacheKey = 'macroeconomic_all';
    const cached = await getCached(cacheKey, 3600000); // 1 hour
    if (cached) return cached;
    
    const data = await fetchWithRetry('/api/macroeconomic/all');
    await setCached(cacheKey, data, 3600000);
    return data;
  }
};

// Enhanced AI Analysis API (FIXED) - CRITICAL FOR DAILY MARKET BRIEF WITH REAL NEWS
export const aiAnalysisApi = {
  async getSectorAnalysis() {
    const cacheKey = 'ai_sector_analysis';
    const cached = await getCached(cacheKey, 3600000); // 1 hour
    if (cached) return cached;
    
    console.log('🤖 Fetching enhanced sector analysis...');
    const data = await fetchWithRetry('/api/ai-analysis/sectors');
    await setCached(cacheKey, data, 3600000);
    return data;
  },
  
  async getMacroAnalysis() {
    const cacheKey = 'ai_macro_analysis';
    const cached = await getCached(cacheKey, 3600000); // 1 hour
    if (cached) return cached;
    
    console.log('🤖 Fetching enhanced macro analysis...');
    const data = await fetchWithRetry('/api/ai-analysis/macro');
    await setCached(cacheKey, data, 3600000);
    return data;
  },
  
  async getRelationshipAnalysis(relationshipId) {
    const cacheKey = `ai_relationship_${relationshipId}`;
    const cached = await getCached(cacheKey, 3600000); // 1 hour
    if (cached) return cached;
    
    console.log(`🤖 Fetching relationship analysis: ${relationshipId}`);
    const data = await fetchWithRetry(`/api/ai-analysis/relationships/${relationshipId}`);
    await setCached(cacheKey, data, 3600000);
    return data;
  },

  // FIXED: Updated to use the correct comprehensive analysis endpoint
  async getCurrentEventsAnalysis() {
    const cacheKey = 'comprehensive_news_analysis';
    const cached = await getCached(cacheKey, 900000); // 15 minutes for fresh news
    if (cached) return cached;
    
    console.log('🎯 Fetching COMPREHENSIVE 20-article analysis...');
    
    const data = await fetchWithRetry('/api/ai/comprehensive-analysis');
    await setCached(cacheKey, data, 900000);
    return data;
  }
};

// FIXED: Market Sentiment API 
export const sentimentApi = {
  async getMarketSentiment() {
    const cacheKey = 'market_sentiment';
    const cached = await getCached(cacheKey, 300000); // 5 minutes
    if (cached) return cached;
    
    console.log('💭 Fetching market sentiment...');
    const data = await fetchWithRetry('/api/brave/market-sentiment');
    await setCached(cacheKey, data, 300000);
    return data;
  }
};

// Environment API
export const marketEnvironmentApi = {
  async getScore() {
    const cacheKey = 'market_environment_score';
    const cached = await getCached(cacheKey, 300000); // 5 minutes
    if (cached) return cached;
    
    const data = await fetchWithRetry('/api/market-environment/score');
    await setCached(cacheKey, data, 300000);
    return data;
  }
};

// Cache utilities
export const cacheUtils = {
  async clearAll() {
    try {
      const db = await initDB();
      await db.clear(CACHE_STORE);
      console.log('🧹 All cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },
  
  async clearAiAnalysis() {
    try {
      const db = await initDB();
      const allKeys = await db.getAllKeys(CACHE_STORE);
      
      for (const key of allKeys) {
        if (key.includes('ai_')) {
          await db.delete(CACHE_STORE, key);
        }
      }
      
      console.log('🧹 AI analysis cache cleared');
    } catch (error) {
      console.error('AI cache clear error:', error);
    }
  }
};

console.log('✅ Enhanced API service loaded with FIXED fundamentals endpoint!');