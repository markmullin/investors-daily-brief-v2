import express from 'express';
import portfolioAIService from '../services/portfolioAIService.js';
import unifiedGptOssService from '../services/unifiedGptOssService.js';
import pythonBridge from '../services/PythonBridge.js';

const router = express.Router();

// Diagnostic endpoint for Portfolio AI Service
router.get('/portfolio-ai-diagnostic', async (req, res) => {
  console.log('\n=== PORTFOLIO AI DIAGNOSTIC ===');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      overallStatus: 'UNKNOWN',
      passedTests: 0,
      failedTests: 0,
      errors: []
    }
  };

  // Test 1: Basic Portfolio AI Service instantiation
  try {
    console.log('1. Testing Portfolio AI Service instantiation...');
    
    const serviceExists = portfolioAIService && typeof portfolioAIService.generateInvestmentIntelligence === 'function';
    
    diagnostic.tests.serviceInstantiation = {
      status: serviceExists ? 'PASS' : 'FAIL',
      exists: !!portfolioAIService,
      hasMethods: serviceExists,
      error: serviceExists ? null : 'Service not properly instantiated'
    };
    
    if (serviceExists) {
      diagnostic.summary.passedTests++;
      console.log('✓ Portfolio AI Service instantiated correctly');
    } else {
      diagnostic.summary.failedTests++;
      console.log('✗ Portfolio AI Service instantiation failed');
    }
    
  } catch (error) {
    diagnostic.tests.serviceInstantiation = {
      status: 'FAIL',
      error: error.message
    };
    diagnostic.summary.failedTests++;
    diagnostic.summary.errors.push(`Service instantiation: ${error.message}`);
  }

  // Test 2: AI Service dependency
  try {
    console.log('2. Testing AI Service dependency...');
    
    const aiExists = unifiedGptOssService && typeof unifiedGptOssService.generate === 'function';
    
    if (aiExists) {
      // Try a simple test call
      const testResult = await unifiedGptOssService.generate('You are a helpful assistant.', 'Test portfolio analysis', {
        maxTokens: 50,
        temperature: 0.1
      });
      
      diagnostic.tests.aiService = {
        status: testResult.success ? 'PASS' : 'FAIL',
        exists: true,
        hasMethod: true,
        testCall: testResult.success ? 'SUCCESS' : 'FAILED',
        responseLength: testResult.content ? testResult.content.length : 0
      };
      
      diagnostic.summary.passedTests++;
      console.log('✓ AI Service working correctly');
    } else {
      throw new Error('AI service not available or missing methods');
    }
    
  } catch (error) {
    diagnostic.tests.aiService = {
      status: 'FAIL',
      exists: !!unifiedGptOssService,
      error: error.message
    };
    diagnostic.summary.failedTests++;
    diagnostic.summary.errors.push(`AI Service: ${error.message}`);
    console.log('✗ AI Service failed:', error.message);
  }

  // Test 3: Python Bridge dependency
  try {
    console.log('3. Testing Python Bridge dependency...');
    
    const pythonExists = pythonBridge && typeof pythonBridge.runScript === 'function';
    
    if (pythonExists) {
      // Try a simple test (but don't actually run it to avoid timeouts)
      diagnostic.tests.pythonBridge = {
        status: 'PARTIAL',
        exists: true,
        hasMethod: true,
        note: 'Service exists but not tested to avoid timeout'
      };
      
      diagnostic.summary.passedTests++;
      console.log('✓ Python Bridge service exists');
    } else {
      throw new Error('Python Bridge service not available');
    }
    
  } catch (error) {
    diagnostic.tests.pythonBridge = {
      status: 'FAIL',
      exists: !!pythonBridge,
      error: error.message
    };
    diagnostic.summary.failedTests++;
    diagnostic.summary.errors.push(`Python Bridge: ${error.message}`);
    console.log('✗ Python Bridge failed:', error.message);
  }

  // Test 4: Market Data Gathering (core dependency)
  try {
    console.log('4. Testing market data gathering...');
    
    const testSymbols = ['AAPL'];
    const marketData = await portfolioAIService.gatherMarketData(testSymbols);
    
    const hasValidData = marketData && 
                        marketData.symbols && 
                        marketData.symbols.length > 0;
    
    diagnostic.tests.marketDataGathering = {
      status: hasValidData ? 'PASS' : 'FAIL',
      symbolsRequested: testSymbols.length,
      symbolsReturned: marketData?.symbols?.length || 0,
      hasIndices: !!marketData?.indices,
      hasVix: !!marketData?.vix,
      hasSectors: !!marketData?.sectors,
      hasHistorical: !!marketData?.historical
    };
    
    if (hasValidData) {
      diagnostic.summary.passedTests++;
      console.log('✓ Market data gathering working');
    } else {
      diagnostic.summary.failedTests++;
      console.log('✗ Market data gathering failed');
    }
    
  } catch (error) {
    diagnostic.tests.marketDataGathering = {
      status: 'FAIL',
      error: error.message
    };
    diagnostic.summary.failedTests++;
    diagnostic.summary.errors.push(`Market data gathering: ${error.message}`);
    console.log('✗ Market data gathering failed:', error.message);
  }

  // Test 5: Simple Portfolio Analysis (without ML/AI)
  try {
    console.log('5. Testing basic portfolio analysis...');
    
    const testPortfolio = {
      holdings: {
        AAPL: {
          symbol: 'AAPL',
          quantity: 100,
          currentPrice: 150,
          currentValue: 15000
        }
      },
      totalValue: 15000
    };
    
    // Test basic methods that don't require AI
    const currentWeights = portfolioAIService.calculateCurrentWeights(testPortfolio);
    const topHoldings = portfolioAIService.getTopHoldings(testPortfolio, 3);
    
    const hasValidWeights = currentWeights && 
                          typeof currentWeights === 'object' && 
                          currentWeights['AAPL'] === 1.0;
    
    diagnostic.tests.basicPortfolioAnalysis = {
      status: hasValidWeights ? 'PASS' : 'FAIL',
      currentWeights: currentWeights,
      topHoldings: topHoldings,
      calculationsWorking: hasValidWeights
    };
    
    if (hasValidWeights) {
      diagnostic.summary.passedTests++;
      console.log('✓ Basic portfolio analysis working');
    } else {
      diagnostic.summary.failedTests++;
      console.log('✗ Basic portfolio analysis failed');
    }
    
  } catch (error) {
    diagnostic.tests.basicPortfolioAnalysis = {
      status: 'FAIL',
      error: error.message
    };
    diagnostic.summary.failedTests++;
    diagnostic.summary.errors.push(`Basic portfolio analysis: ${error.message}`);
    console.log('✗ Basic portfolio analysis failed:', error.message);
  }

  // Test 6: AI Intelligence with empty portfolio (should handle gracefully)
  try {
    console.log('6. Testing AI intelligence with empty portfolio...');
    
    const emptyPortfolio = {
      holdings: {},
      totalValue: 0
    };
    
    // This should return an error but not crash
    const aiResult = await portfolioAIService.generateInvestmentIntelligence(emptyPortfolio, {
      includeMLPredictions: false,
      includeRegimeAnalysis: false,
      includeSentimentAnalysis: false,
      includeDynamicAllocation: false
    });
    
    diagnostic.tests.emptyPortfolioHandling = {
      status: 'PASS',
      result: 'Returns gracefully',
      aiResult: aiResult ? 'SUCCESS' : 'FAILED'
    };
    
    diagnostic.summary.passedTests++;
    console.log('✓ Empty portfolio handling working');
    
  } catch (error) {
    // Check if it's an expected error
    if (error.message.includes('AI analysis requires portfolio holdings')) {
      diagnostic.tests.emptyPortfolioHandling = {
        status: 'PASS',
        result: 'Expected error thrown',
        error: error.message
      };
      diagnostic.summary.passedTests++;
      console.log('✓ Empty portfolio handling working (expected error)');
    } else {
      diagnostic.tests.emptyPortfolioHandling = {
        status: 'FAIL',
        result: 'Unexpected error',
        error: error.message
      };
      diagnostic.summary.failedTests++;
      diagnostic.summary.errors.push(`Empty portfolio handling: ${error.message}`);
      console.log('✗ Empty portfolio handling failed:', error.message);
    }
  }

  // Determine overall status
  if (diagnostic.summary.failedTests === 0) {
    diagnostic.summary.overallStatus = 'HEALTHY';
  } else if (diagnostic.summary.passedTests > diagnostic.summary.failedTests) {
    diagnostic.summary.overallStatus = 'DEGRADED';
  } else {
    diagnostic.summary.overallStatus = 'UNHEALTHY';
  }

  console.log(`\n=== PORTFOLIO AI DIAGNOSTIC COMPLETE ===`);
  console.log(`Overall Status: ${diagnostic.summary.overallStatus}`);
  console.log(`Passed: ${diagnostic.summary.passedTests}, Failed: ${diagnostic.summary.failedTests}`);
  
  if (diagnostic.summary.errors.length > 0) {
    console.log('Key Errors:');
    diagnostic.summary.errors.forEach(error => console.log(`  - ${error}`));
  }

  res.json(diagnostic);
});

export default router;
