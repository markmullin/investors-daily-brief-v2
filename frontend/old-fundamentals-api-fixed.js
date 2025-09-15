// *** FIXED: Enhanced Fundamentals API with Cache Busting ***

// Add this method to your fundamentalsApi object in api.js
export const fundamentalsApi = {
  // *** NEW: Emergency cache clear and fresh fetch ***
  async getTopPerformersForceRefresh() {
    console.log('🚨 FORCE REFRESH: Clearing cache and fetching fresh fundamentals data...');
    
    try {
      // Clear related cache entries first
      const db = await initDB();
      const cacheKeysToDelete = [
        'fundamentals_top_performers',
        'fundamentals_summary', 
        'fundamentals_status'
      ];
      
      for (const key of cacheKeysToDelete) {
        try {
          await db.delete(CACHE_STORE, key);
          console.log(`✅ Cleared cache: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Could not clear cache: ${key}`, error);
        }
      }
      
      // Force fresh fetch with no cache
      console.log('🌐 Fetching fresh data from backend...');
      const data = await fetchWithRetry('/api/fundamentals/top-performers?_cacheBust=' + Date.now(), {}, 1);
      
      // Cache the fresh data
      await setCached('fundamentals_top_performers', data, 1800000);
      
      console.log('✅ Fresh fundamentals data loaded successfully!');
      return data;
      
    } catch (error) {
      console.error('❌ Force refresh failed:', error.message);
      throw error;
    }
  },

  async getTopPerformers() {
    console.log('🏆 Fundamentals: Getting top performers for all metrics from complete S&P 500');
    
    const cacheKey = 'fundamentals_top_performers';
    const cached = await getCached(cacheKey, 1800000); // 30 minutes cache
    if (cached) {
      console.log('📦 Using cached fundamentals data');
      return cached;
    }
    
    try {
      // FIXED: Use longer timeout for fundamentals processing
      const data = await fetchWithRetry('/api/fundamentals/top-performers', {}, 1);
      await setCached(cacheKey, data, 1800000);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch top performers:', error.message);
      
      // Provide more specific error messages
      if (error.message.includes('aborted') || error.message.includes('timeout')) {
        throw new Error('Data collection in progress. The system is processing S&P 500 fundamental data - please wait a few minutes and try again.');
      }
      throw error;
    }
  },

  // *** ENHANCED: Clear fundamentals cache utility ***
  async clearFundamentalsCache() {
    console.log('🧹 Clearing fundamentals cache...');
    
    try {
      const db = await initDB();
      const allKeys = await db.getAllKeys(CACHE_STORE);
      
      for (const key of allKeys) {
        if (key.includes('fundamentals_')) {
          await db.delete(CACHE_STORE, key);
          console.log(`✅ Cleared: ${key}`);
        }
      }
      
      console.log('✅ Fundamentals cache cleared successfully');
      return { success: true, message: 'Fundamentals cache cleared' };
      
    } catch (error) {
      console.error('❌ Cache clear error:', error);
      throw error;
    }
  },

  // Rest of existing methods...
  async getTopPerformersForMetric(metric) {
    console.log(`🎯 Fundamentals: Getting top performers for ${metric} from complete S&P 500`);
    
    const cacheKey = `fundamentals_top_${metric}`;
    const cached = await getCached(cacheKey, 1800000); // 30 minutes cache
    if (cached) return cached;
    
    try {
      const data = await fetchWithRetry(`/api/fundamentals/top-performers/${metric}`, {}, 1);
      await setCached(cacheKey, data, 1800000);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch top performers for ${metric}:`, error.message);
      
      if (error.message.includes('aborted') || error.message.includes('timeout')) {
        throw new Error('Data collection in progress. Please wait a few minutes and try again.');
      }
      throw error;
    }
  },

  async getSummary() {
    console.log('📊 Fundamentals: Getting summary status');
    
    const cacheKey = 'fundamentals_summary';
    const cached = await getCached(cacheKey, 300000); // 5 minutes cache
    if (cached) return cached;
    
    try {
      const data = await fetchWithRetry('/api/fundamentals/summary');
      await setCached(cacheKey, data, 300000);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch fundamentals summary:', error.message);
      throw error;
    }
  },

  async getStatus() {
    console.log('📊 Fundamentals: Getting system status');
    
    const cacheKey = 'fundamentals_status';
    const cached = await getCached(cacheKey, 300000); // 5 minutes cache
    if (cached) return cached;
    
    try {
      const data = await fetchWithRetry('/api/fundamentals/status');
      await setCached(cacheKey, data, 300000);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch fundamentals status:', error.message);
      throw error;
    }
  },

  async collectTest() {
    console.log('🧪 Fundamentals: Running test collection');
    
    try {
      const data = await fetchWithRetry('/api/fundamentals/collect/test', {
        method: 'POST'
      });
      return data;
    } catch (error) {
      console.error('❌ Failed to run test collection:', error.message);
      throw error;
    }
  },

  async clearCache() {
    console.log('🧹 Fundamentals: Clearing cache');
    
    try {
      const data = await fetchWithRetry('/api/fundamentals/cache', {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('❌ Failed to clear fundamentals cache:', error.message);
      throw error;
    }
  }
};
