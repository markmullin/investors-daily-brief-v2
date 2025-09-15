/**
 * *** UNIFIED DATA SERVICE TEST ENDPOINT ***
 * 
 * Purpose: Test and verify Phase 1B unified data service implementation
 * Usage: GET /api/test/unified-service
 */

import express from 'express';
import unifiedDataService from '../services/unifiedDataService.js';

// NOTE: analystTest.js removed - file doesn't exist
// import analystTestRoutes from './analystTest.js';

const router = express.Router();

// Include analyst test routes - REMOVED: analystTestRoutes doesn't exist
// router.use('/', analystTestRoutes);

/**
 * *** COMPREHENSIVE UNIFIED SERVICE TEST ***
 */
router.get('/unified-service', async (req, res) => {
  try {
    console.log('🧪 [UNIFIED TEST] Starting comprehensive service test...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 1B - Unified Data Service',
      status: 'running',
      tests: {},
      systemHealth: null,
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
    
    // Test 1: System Health
    try {
      console.log('🧪 [TEST 1] Testing system health...');
      testResults.systemHealth = await unifiedDataService.getSystemHealth();
      testResults.tests.systemHealth = {
        passed: testResults.systemHealth.services.fmpAPI.status === 'healthy' && 
                testResults.systemHealth.services.redis.status === 'healthy',
        details: testResults.systemHealth,
        message: 'System health check'
      };
    } catch (error) {
      testResults.tests.systemHealth = {
        passed: false,
        error: error.message,
        message: 'System health check failed'
      };
    }
    
    // Test 2: Real-time quote
    try {
      console.log('🧪 [TEST 2] Testing real-time quote...');
      const quote = await unifiedDataService.getRealTimeQuote('AAPL');
      testResults.tests.realTimeQuote = {
        passed: quote && quote.symbol === 'AAPL' && quote.price > 0,
        data: quote,
        message: `Real-time quote test for AAPL: $${quote?.price || 'N/A'}`
      };
    } catch (error) {
      testResults.tests.realTimeQuote = {
        passed: false,
        error: error.message,
        message: 'Real-time quote test failed'
      };
    }
    
    // Test 3: Batch quotes
    try {
      console.log('🧪 [TEST 3] Testing batch quotes...');
      const batchQuotes = await unifiedDataService.getRealTimeQuoteBatch(['SPY', 'QQQ']);
      testResults.tests.batchQuotes = {
        passed: Array.isArray(batchQuotes) && batchQuotes.length === 2,
        data: batchQuotes,
        message: `Batch quotes test: ${batchQuotes?.length || 0} quotes retrieved`
      };
    } catch (error) {
      testResults.tests.batchQuotes = {
        passed: false,
        error: error.message,
        message: 'Batch quotes test failed'
      };
    }
    
    // Test 4: Market data
    try {
      console.log('🧪 [TEST 4] Testing market data...');
      const marketData = await unifiedDataService.getMarketData();
      testResults.tests.marketData = {
        passed: Array.isArray(marketData) && marketData.length > 0,
        data: marketData,
        message: `Market data test: ${marketData?.length || 0} indices retrieved`
      };
    } catch (error) {
      testResults.tests.marketData = {
        passed: false,
        error: error.message,
        message: 'Market data test failed'
      };
    }
    
    // Test 5: Historical data
    try {
      console.log('🧪 [TEST 5] Testing historical data...');
      const historicalData = await unifiedDataService.getHistoricalData('SPY', '1m');
      testResults.tests.historicalData = {
        passed: historicalData && historicalData.data && historicalData.data.length > 0,
        data: {
          symbol: historicalData?.symbol,
          period: historicalData?.period,
          dataPoints: historicalData?.data?.length || 0,
          startDate: historicalData?.startDate,
          endDate: historicalData?.endDate
        },
        message: `Historical data test: ${historicalData?.data?.length || 0} data points for SPY 1M`
      };
    } catch (error) {
      testResults.tests.historicalData = {
        passed: false,
        error: error.message,
        message: 'Historical data test failed'
      };
    }
    
    // Test 6: Fundamentals
    try {
      console.log('🧪 [TEST 6] Testing fundamentals...');
      const fundamentals = await unifiedDataService.getFundamentals('AAPL');
      testResults.tests.fundamentals = {
        passed: fundamentals && fundamentals.symbol === 'AAPL' && fundamentals.marketCap > 0,
        data: {
          symbol: fundamentals?.symbol,
          companyName: fundamentals?.companyName,
          sector: fundamentals?.sector,
          marketCap: fundamentals?.marketCap,
          pe: fundamentals?.pe,
          roe: fundamentals?.roe
        },
        message: `Fundamentals test: ${fundamentals?.companyName || 'Unknown'} data retrieved`
      };
    } catch (error) {
      testResults.tests.fundamentals = {
        passed: false,
        error: error.message,
        message: 'Fundamentals test failed'
      };
    }
    
    // Test 7: Sector performance
    try {
      console.log('🧪 [TEST 7] Testing sector performance...');
      const sectorData = await unifiedDataService.getSectorPerformance();
      testResults.tests.sectorPerformance = {
        passed: Array.isArray(sectorData) && sectorData.length > 0,
        data: sectorData,
        message: `Sector performance test: ${sectorData?.length || 0} sectors retrieved`
      };
    } catch (error) {
      testResults.tests.sectorPerformance = {
        passed: false,
        error: error.message,
        message: 'Sector performance test failed'
      };
    }
    
    // Calculate summary
    const testNames = Object.keys(testResults.tests);
    testResults.summary.total = testNames.length;
    testResults.summary.passed = testNames.filter(test => testResults.tests[test].passed).length;
    testResults.summary.failed = testResults.summary.total - testResults.summary.passed;
    testResults.status = testResults.summary.failed === 0 ? 'all_passed' : 'some_failed';
    
    console.log(`🧪 [UNIFIED TEST] Completed: ${testResults.summary.passed}/${testResults.summary.total} tests passed`);
    
    res.json({
      success: true,
      phase1B: 'Unified Data Service Implementation',
      testResults: testResults,
      nextSteps: testResults.summary.failed === 0 ? [
        'Run migration: POST /api/market/migrate',
        'Test frontend components with unified data',
        'Monitor performance and caching efficiency'
      ] : [
        'Review failed tests and fix issues',
        'Check FMP API connectivity and Redis connection',
        'Verify unifiedDataService.js configuration'
      ]
    });
    
  } catch (error) {
    console.error('🧪 [UNIFIED TEST] Test suite failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Unified service test suite failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * *** DATA FORMAT CONSISTENCY TEST ***
 */
router.get('/data-consistency', async (req, res) => {
  try {
    console.log('🧪 [CONSISTENCY TEST] Testing data format consistency...');
    
    const consistencyResults = {
      timestamp: new Date().toISOString(),
      purpose: 'Verify data format consistency across all unified service methods',
      tests: {}
    };
    
    // Test data format consistency
    const [quote, fundamentals, marketData] = await Promise.all([
      unifiedDataService.getRealTimeQuote('AAPL'),
      unifiedDataService.getFundamentals('AAPL'),
      unifiedDataService.getMarketData(['SPY'])
    ]);
    
    // Check quote format
    consistencyResults.tests.quoteFormat = {
      passed: quote && 
              typeof quote.price === 'number' && 
              typeof quote.changePercent === 'number' &&
              quote.dataSource === 'FMP_API_UNIFIED',
      data: {
        price: quote?.price,
        changePercent: quote?.changePercent,
        dataSource: quote?.dataSource
      },
      message: 'Quote data format validation'
    };
    
    // Check fundamentals format
    consistencyResults.tests.fundamentalsFormat = {
      passed: fundamentals && 
              typeof fundamentals.roe === 'number' && 
              typeof fundamentals.profitMargin === 'number' &&
              fundamentals.dataSource === 'FMP_API_UNIFIED',
      data: {
        roe: fundamentals?.roe,
        profitMargin: fundamentals?.profitMargin,
        dataSource: fundamentals?.dataSource
      },
      message: 'Fundamentals data format validation'
    };
    
    // Check market data format
    const spyData = marketData?.[0];
    consistencyResults.tests.marketDataFormat = {
      passed: spyData && 
              typeof spyData.price === 'number' && 
              typeof spyData.changePercent === 'number' &&
              spyData.dataSource === 'FMP_API_UNIFIED',
      data: {
        symbol: spyData?.symbol,
        price: spyData?.price,
        changePercent: spyData?.changePercent,
        dataSource: spyData?.dataSource
      },
      message: 'Market data format validation'
    };
    
    const passedTests = Object.values(consistencyResults.tests).filter(test => test.passed).length;
    const totalTests = Object.keys(consistencyResults.tests).length;
    
    console.log(`🧪 [CONSISTENCY TEST] ${passedTests}/${totalTests} consistency tests passed`);
    
    res.json({
      success: true,
      phase1B: 'Data Format Consistency Verification',
      consistencyResults: consistencyResults,
      summary: {
        passed: passedTests,
        total: totalTests,
        allConsistent: passedTests === totalTests
      }
    });
    
  } catch (error) {
    console.error('🧪 [CONSISTENCY TEST] Failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Data consistency test failed',
      details: error.message
    });
  }
});

export default router;
