/**
 * Clear Market Environment Cache
 * Forces all services to fetch fresh data
 */

import redisService from './backend/src/services/redisService.js';

async function clearMarketCache() {
  console.log('🧹 Clearing market environment cache...\n');
  
  try {
    // Clear all market-related cache keys
    const keysToDelete = [
      'market:phase:v2',
      'market:breadth:v2',
      'market:sentiment:v2',
      'market:sp500:fundamentals:v2',
      'market:synthesis:v2'
    ];
    
    for (const key of keysToDelete) {
      const deleted = await redisService.del(key);
      console.log(`${deleted ? '✅' : '⚠️'} ${key} - ${deleted ? 'cleared' : 'not found'}`);
    }
    
    console.log('\n✅ Market cache cleared successfully');
    console.log('📌 Backend will fetch fresh data on next request');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  }
  
  process.exit(0);
}

clearMarketCache();
