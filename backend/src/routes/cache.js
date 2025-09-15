import express from 'express';
import { redis } from '../config/database.js';

const router = express.Router();

// Clear cache for specific symbol
router.post('/clear/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cleanSymbol = symbol.toUpperCase();
    
    console.log(`🧹 [CACHE] Clearing cache for symbol: ${cleanSymbol}`);
    
    // Find all keys related to this symbol
    const patterns = [
      `unified:quote:${cleanSymbol}`,
      `unified:history:${cleanSymbol}:*`,
      `unified:fundamentals:${cleanSymbol}`,
      `unified:fundamentals:enhanced:${cleanSymbol}`,
      `unified:batch:*${cleanSymbol}*`
    ];
    
    let totalDeleted = 0;
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
        console.log(`   ✅ Deleted ${keys.length} keys matching ${pattern}`);
      }
    }
    
    res.json({
      success: true,
      symbol: cleanSymbol,
      keysDeleted: totalDeleted,
      message: `Cache cleared for ${cleanSymbol}`
    });
    
  } catch (error) {
    console.error('❌ [CACHE] Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Clear all unified data cache
router.post('/clear-all', async (req, res) => {
  try {
    console.log('🧹 [CACHE] Clearing all unified data cache...');
    
    const keys = await redis.keys('unified:*');
    let deleted = 0;
    
    if (keys.length > 0) {
      deleted = await redis.del(...keys);
    }
    
    res.json({
      success: true,
      keysDeleted: deleted,
      message: 'All unified data cache cleared'
    });
    
  } catch (error) {
    console.error('❌ [CACHE] Error clearing all cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Get cache statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      unified: {
        quotes: await redis.keys('unified:quote:*').then(k => k.length),
        history: await redis.keys('unified:history:*').then(k => k.length),
        fundamentals: await redis.keys('unified:fundamentals:*').then(k => k.length),
        market: await redis.keys('unified:market:*').then(k => k.length),
        sectors: await redis.keys('unified:sectors:*').then(k => k.length),
        batch: await redis.keys('unified:batch:*').then(k => k.length),
        sp500: await redis.keys('unified:sp500:*').then(k => k.length)
      },
      total: await redis.keys('unified:*').then(k => k.length)
    };
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [CACHE] Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

export default router;
