import express from 'express';
import fredService from '../services/fredService.js';
import fmpService from '../services/fmpService.js';
import pythonBridge from '../services/PythonBridge.js';
import unifiedGptOssService from '../services/unifiedGptOssService.js';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 1800 }); // Cache for 30 minutes

console.log('🏛️ ENHANCED MACROECONOMIC: Initializing with Python + Mistral analysis...');

// Helper function to get macro asset data from FMP
async function getMacroAssetData() {
  try {
    console.log('📊 ENHANCED MACRO: Fetching macro asset data from FMP...');
    
    // Key macro assets for cross-asset analysis
    const macroSymbols = ['TLT', 'UUP', 'GLD', 'VIX', 'USO', 'EEM', 'IBIT', 'JNK'];
    
    const assetData = [];
    
    for (const symbol of macroSymbols) {
      try {
        const quote = await fmpService.getQuote(symbol);
        if (quote && quote.length > 0) {
          const data = quote[0];
          assetData.push({
            symbol: data.symbol,
            price: data.price,
            change_percent: data.changesPercentage,
            dayChange: data.change,
            volume: data.volume,
            marketCap: data.marketCap
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch ${symbol}:`, error.message);
      }
    }
    
    console.log(`✅ ENHANCED MACRO: Fetched ${assetData.length} macro assets`);
    return assetData;
    
  } catch (error) {
    console.error('❌ ENHANCED MACRO: Failed to fetch macro asset data:', error.message);
    return [];
  }
}

// Helper function to get basic economic indicators
async function getBasicEconomicData() {
  try {
    console.log('📊 ENHANCED MACRO: Fetching REAL economic data from FRED/BEA...');
    
    // Get REAL data from FRED service - NO FALLBACK
    const data = await fredService.getAllMacroData();
    
    console.log('✅ ENHANCED MACRO: REAL FRED/BEA data fetched successfully');
    return data;
    
  } catch (error) {
    console.error('❌ ENHANCED MACRO: FRED/BEA data failed:', error.message);
    // Throw error instead of returning fake data
    throw new Error(`Failed to fetch real economic data: ${error.message}`);
  }
}

// Enhanced macroeconomic analysis with Python + Mistral
router.get('/all', async (req, res) => {
  try {
    console.log('🏛️ ENHANCED MACRO: Starting comprehensive analysis...');
    
    const cacheKey = 'enhanced_macro_all';
    // TEMPORARILY DISABLED FOR MMF_YOY TESTING
    // const cached = cache.get(cacheKey);
    // if (cached) {
    //   console.log('📦 ENHANCED MACRO: Returning cached data');
    //   return res.json(cached);
    // }
    
    // Step 1: Get basic economic data (FRED or fallback)
    const economicData = await getBasicEconomicData();
    
    // Step 2: Get macro asset data for cross-asset analysis
    const macroAssets = await getMacroAssetData();
    
    // Step 3: Perform Python analysis
    console.log('🐍 ENHANCED MACRO: Starting Python cross-asset analysis...');
    let pythonAnalysis = null;
    
    try {
      pythonAnalysis = await pythonBridge.performMacroAnalysis({
        macro_data: macroAssets,
        economic_indicators: economicData,
        analysis_type: 'comprehensive'
      });
      
      console.log('✅ ENHANCED MACRO: Python analysis completed');
      console.log('📊 Python analysis result:', {
        riskLevel: pythonAnalysis.overall_risk_level,
        regime: pythonAnalysis.market_regime,
        confidence: pythonAnalysis.regime_confidence,
        signalCount: pythonAnalysis.risk_signals?.length || 0
      });
      
    } catch (pythonError) {
      console.error('❌ ENHANCED MACRO: Python analysis failed:', pythonError.message);
      pythonAnalysis = {
        overall_risk_level: 5,
        market_regime: 'Unknown',
        risk_signals: ['Python analysis unavailable'],
        actionable_insights: ['Basic analysis only - Python service unavailable'],
        error: pythonError.message
      };
    }
    
    // Step 4: Generate Mistral AI educational explanation
    console.log('🤖 ENHANCED MACRO: Generating Mistral AI explanation...');
    let mistralAnalysis = null;
    
    try {
      // GPU service will auto-initialize
      
      const regime = pythonAnalysis.market_regime || 'Unknown';
      const riskLevel = pythonAnalysis.overall_risk_level || 5;
      const insights = pythonAnalysis.actionable_insights || [];
      
      const mistralPrompt = `Explain the current macroeconomic environment for beginner investors:

Market Regime: ${regime}
Risk Level: ${riskLevel}/10
Key Insights: ${insights.slice(0, 3).join('; ')}

Economic Data:
- GDP Growth: ${economicData.growthInflation?.latest?.gdpGrowth?.value || 'N/A'}%
- Inflation (PCE): ${economicData.growthInflation?.latest?.pce?.value || 'N/A'}%
- Unemployment: ${economicData.laborConsumer?.latest?.unemployment?.value || 'N/A'}%
- 10Y Treasury: ${economicData.interestRates?.latest?.tenYear?.value || 'N/A'}%

Provide a 3-4 sentence explanation in simple terms about what this means for investors and portfolio positioning.`;

      const analysisResult = await unifiedGptOssService.generate(
        'You are a macroeconomic analyst. Provide clear, actionable insights.',
        mistralPrompt, {
        temperature: 0.3,
        maxTokens: 300
      });
      
      mistralAnalysis = analysisResult.success ? analysisResult.content : null;
      
      console.log('✅ ENHANCED MACRO: Mistral explanation generated');
      
    } catch (mistralError) {
      console.error('❌ ENHANCED MACRO: Mistral analysis failed:', mistralError.message);
      mistralAnalysis = `Current macroeconomic environment shows ${pythonAnalysis.market_regime || 'mixed'} conditions with risk level ${pythonAnalysis.overall_risk_level || 5}/10. Key considerations for investors include monitoring interest rate trends, inflation developments, and cross-asset relationships for portfolio positioning signals.`;
    }
    
    // Step 5: Combine all analysis
    const enhancedAnalysis = {
      ...economicData,
      leadingIndicators: economicData.leadingIndicators, // Ensure leading indicators are included
      pythonAnalysis: pythonAnalysis,
      mistralEducation: mistralAnalysis,
      macroAssets: macroAssets,
      enhancedMetadata: {
        title: 'Enhanced Macroeconomic Environment Analysis',
        description: 'Comprehensive macro analysis with Python cross-asset relationships and AI explanations',
        lastUpdated: new Date().toISOString(),
        dataSource: 'FRED + FMP + Python + Mistral AI',
        riskLevel: pythonAnalysis.overall_risk_level,
        marketRegime: pythonAnalysis.market_regime,
        confidence: pythonAnalysis.regime_confidence
      }
    };
    
    console.log('✅ ENHANCED MACRO: Complete analysis ready');
    
    // Cache the result
    cache.set(cacheKey, enhancedAnalysis);
    
    res.json(enhancedAnalysis);
    
  } catch (error) {
    console.error('❌ ENHANCED MACRO: Complete failure:', error.message);
    res.status(500).json({
      error: 'Enhanced macroeconomic analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Python-only analysis endpoint for testing
router.get('/python-analysis', async (req, res) => {
  try {
    console.log('🐍 ENHANCED MACRO: Python-only analysis requested...');
    
    const macroAssets = await getMacroAssetData();
    
    const pythonAnalysis = await pythonBridge.performMacroAnalysis({
      macro_data: macroAssets,
      analysis_type: 'python_only'
    });
    
    res.json({
      pythonAnalysis,
      macroAssets,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ENHANCED MACRO: Python analysis failed:', error.message);
    res.status(500).json({
      error: 'Python macro analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple, fast endpoint for dashboard with REAL FRED DATA ONLY
router.get('/simple', async (req, res) => {
  try {
    const cacheKey = 'macroeconomic_simple_real';
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    console.log('🏛️ SIMPLE MACRO: Fetching REAL FRED/BEA data (NO SYNTHETIC DATA)...');
    
    // Get REAL data from FRED service
    const realData = await fredService.getAllMacroData();
    
    console.log('✅ FRED data received, structuring response...');
    
    // Structure the response using REAL data
    const result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      interestRates: realData.interestRates,
      growthInflation: realData.growthInflation,
      laborConsumer: realData.laborConsumer,
      monetaryPolicy: realData.monetaryPolicy,
      leadingIndicators: realData.leadingIndicators,  // Leading indicators
      housing: realData.housing,  // NEW: Housing indicators
      analysis: 'Real-time economic data from Federal Reserve Economic Data (FRED) and Bureau of Economic Analysis (BEA).',
      processingTime: 'real-time',
      dataSource: 'FRED/BEA APIs'
    };
    
    cache.set(cacheKey, result, 900); // Cache for 15 minutes
    console.log('✅ SIMPLE MACRO: Real FRED/BEA data delivered');
    res.json(result);
    
  } catch (error) {
    console.error('❌ SIMPLE MACRO ERROR:', error);
    res.status(500).json({ 
      error: 'Simple macroeconomic analysis failed', 
      message: error.message 
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const pythonStatus = await pythonBridge.testConnection();
    const aiStatus = await unifiedGptOssService.healthCheck();
    
    res.json({
      status: 'healthy',
      services: {
        fredService: 'configured',
        fmpService: 'configured',
        pythonBridge: pythonStatus ? 'connected' : 'disconnected',
        ai: aiStatus.status || 'unknown'
      },
      endpoints: [
        'GET /api/macroeconomic/all - Enhanced macro analysis',
        'GET /api/macroeconomic/python-analysis - Python-only analysis',
        'GET /api/macroeconomic/health - Health check'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
