import express from 'express';
import { redis } from '../config/database.js';

const router = express.Router();

/**
 * SIMPLE DEBUG ROUTE - Test your cache directly
 */
router.get('/debug/test-cache', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Testing fundamentals cache...');
    
    // Test Redis connection
    const ping = await redis.ping();
    console.log('✅ [DEBUG] Redis ping:', ping);
    
    // Check your advanced quality data
    const cached = await redis.get('sp500:advanced_quality_fundamentals');
    console.log('📊 [DEBUG] Cache check:', cached ? 'FOUND' : 'MISSING');
    
    if (cached) {
      const data = JSON.parse(cached);
      console.log('📈 [DEBUG] Data length:', data.length);
      
      // Get TTL
      const ttl = await redis.ttl('sp500:advanced_quality_fundamentals');
      
      res.json({
        success: true,
        redis_connection: 'Working',
        cache_status: 'Found',
        companies_count: data.length,
        ttl_seconds: ttl,
        ttl_hours: (ttl / 3600).toFixed(2),
        sample_company: {
          symbol: data[0]?.symbol,
          name: data[0]?.companyName,
          qualityScore: data[0]?.qualityScore
        },
        message: 'Your advanced quality data is available'
      });
    } else {
      // Check other possible keys
      const altKeys = [
        'sp500:quality_fundamentals',
        'sp500:complete_fundamentals',
        'sp500:fundamentals',
        'fundamentals:sp500'
      ];
      
      const altResults = {};
      for (const key of altKeys) {
        const altData = await redis.get(key);
        altResults[key] = altData ? 'FOUND' : 'MISSING';
      }
      
      res.json({
        success: false,
        redis_connection: 'Working',
        cache_status: 'Missing',
        main_key: 'sp500:advanced_quality_fundamentals',
        alternative_keys: altResults,
        message: 'Your fundamental data cache is missing or expired'
      });
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Cache test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Cache test failed',
      details: error.message,
      redis_available: false
    });
  }
});

/**
 * SIMPLE TOP PERFORMERS TEST
 */
router.get('/debug/simple-top-performers', async (req, res) => {
  try {
    console.log('🏆 [DEBUG] Testing simple top performers...');
    
    const cached = await redis.get('sp500:advanced_quality_fundamentals');
    if (!cached) {
      return res.status(404).json({
        success: false,
        error: 'No cache data found',
        message: 'Your fundamental data is missing from Redis cache'
      });
    }
    
    const companies = JSON.parse(cached);
    console.log(`📊 [DEBUG] Processing ${companies.length} companies...`);
    
    // Simple revenue growth test
    const revenueGrowthCompanies = companies
      .filter(c => {
        const growth = c.fundamentalData?.revenueGrowthYoY || c.revenueGrowthYoY || c.revenueGrowth;
        return growth !== null && growth !== undefined && !isNaN(growth) && Math.abs(growth) <= 3.0;
      })
      .sort((a, b) => {
        const growthA = a.fundamentalData?.revenueGrowthYoY || a.revenueGrowthYoY || a.revenueGrowth;
        const growthB = b.fundamentalData?.revenueGrowthYoY || b.revenueGrowthYoY || b.revenueGrowth;
        return growthB - growthA;
      })
      .slice(0, 5)
      .map((c, index) => ({
        rank: index + 1,
        symbol: c.symbol,
        name: c.companyName || c.name,
        revenue_growth: c.fundamentalData?.revenueGrowthYoY || c.revenueGrowthYoY || c.revenueGrowth,
        quality_score: c.qualityScore
      }));
    
    res.json({
      success: true,
      message: 'Simple top performers test successful',
      total_companies: companies.length,
      valid_revenue_growth: revenueGrowthCompanies.length,
      top_5_revenue_growth: revenueGrowthCompanies,
      data_structure_sample: {
        first_company_keys: Object.keys(companies[0] || {}),
        fundamental_data_keys: Object.keys(companies[0]?.fundamentalData || {})
      }
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Simple top performers failed:', error);
    res.status(500).json({
      success: false,
      error: 'Simple test failed',
      details: error.message
    });
  }
});

export default router;
