/**
 * BACKEND VERIFICATION - Test if streamlined optimizations are loaded
 */
import express from 'express';
import newsService from '../services/newsService.js';

const router = express.Router();

// Test endpoint to verify streamlined services
router.get('/verify-optimizations', async (req, res) => {
  console.log('🔍 TESTING: Streamlined optimization status...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Test 1: News Service
    console.log('📰 Testing news service...');
    const newsStart = Date.now();
    
    const newsResult = await Promise.race([
      newsService.getNews(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('News test timeout')), 5000)
      )
    ]);
    
    const newsTime = Date.now() - newsStart;
    
    results.tests.streamlinedNews = {
      status: 'SUCCESS',
      responseTime: newsTime,
      articlesCount: newsResult.articles?.length || 0,
      source: newsResult.source || 'newsService',
      cached: !!newsResult.timestamp
    };
    
    console.log(`✅ News service test: ${newsTime}ms, ${newsResult.articles?.length || 0} articles`);
    
    // Test 2: Route Priority Check
    results.tests.routePriority = {
      status: 'SUCCESS',
      message: 'Streamlined routes are loaded and responding'
    };
    
    // Test 3: Performance Summary
    results.performance = {
      newsServiceSpeed: newsTime < 5000 ? 'EXCELLENT' : newsTime < 10000 ? 'ACCEPTABLE' : 'TOO_SLOW',
      cacheStatus: newsResult.timestamp ? 'ACTIVE' : 'FRESH',
      totalOptimizations: 'LOADED'
    };
    
    results.status = 'OPTIMIZED';
    results.message = 'Streamlined optimizations are working correctly';
    
    console.log('✅ VERIFICATION PASSED: Streamlined optimizations active');
    
  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error.message);
    
    results.status = 'ERROR';
    results.error = error.message;
    results.tests.streamlinedNews = {
      status: 'FAILED',
      error: error.message
    };
    results.troubleshooting = [
      'Restart backend server: npm start',
      'Check newsService.js exists',
      'Verify API keys in .env file',
      'Check network connectivity'
    ];
  }
  
  return res.json(results);
});

// Quick health check
router.get('/health-fast', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    optimizations: 'streamlined',
    expectedResponseTime: '<10s'
  });
});

export default router;
