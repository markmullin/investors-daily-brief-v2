/**
 * Clear S&P 500 aggregation flag to allow immediate re-run
 */

import redisService from './backend/src/services/redisService.js';

async function clearAggregationFlag() {
  console.log('🔧 Clearing S&P 500 aggregation flag...\n');
  
  try {
    // Delete the last run key
    const deleted = await redisService.del('market:sp500:fundamentals:lastrun');
    
    if (deleted) {
      console.log('✅ Last run flag cleared successfully');
    } else {
      console.log('⚠️ No flag was set (already clear)');
    }
    
    // Also clear any cached data to force fresh collection
    const cacheDeleted = await redisService.del('market:sp500:fundamentals:v2');
    if (cacheDeleted) {
      console.log('✅ Cached fundamentals data cleared');
    }
    
    console.log('\n📌 You can now run the aggregation again');
    console.log('Use: POST http://localhost:5000/api/market-env/aggregate');
    
  } catch (error) {
    console.error('❌ Error clearing flag:', error.message);
  }
  
  process.exit(0);
}

clearAggregationFlag();
