/**
 * Clear Redis cache for earnings data
 */

import 'dotenv/config';
import { redis } from './src/config/database.js';

async function clearEarningsCache() {
  console.log('🔄 Clearing earnings cache...');
  
  try {
    // Clear all earnings analysis cache keys
    const keys = await redis.keys('earnings_analysis:*');
    
    if (keys.length > 0) {
      console.log(`Found ${keys.length} cached earnings entries`);
      
      for (const key of keys) {
        await redis.del(key);
        console.log(`  Deleted: ${key}`);
      }
      
      console.log('✅ All earnings cache cleared!');
    } else {
      console.log('No cached earnings data found');
    }
    
  } catch (error) {
    console.error('Error clearing cache:', error.message);
  }
  
  process.exit(0);
}

clearEarningsCache();
