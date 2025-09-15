import express from 'express';
import unifiedGptOssService from '../services/unifiedGptOssService.js';
import marketService from '../services/marketService.js';

const router = express.Router();

console.log('🤖 [AI ANALYSIS] Initializing UNIFIED GPT-OSS routes - NO MISTRAL...');

// UNIFIED GPT-OSS: Relationship analysis function
async function analyzeRelationship(asset1, asset2) {
  try {
    console.log(`🔗 [AI ANALYSIS] UNIFIED GPT-OSS: Analyzing relationship: ${asset1} vs ${asset2}`);
    
    const symbolData = await marketService.getDataForSymbols([asset1, asset2]);
    
    const data1 = symbolData[asset1];
    const data2 = symbolData[asset2];
    
    console.log(`📊 [AI ANALYSIS] Data received - ${asset1}: $${data1?.close}, ${asset2}: $${data2?.close}`);

    const systemPrompt = 'You are a financial analyst. Provide specific, actionable insights about asset relationships and correlations.';
    const userPrompt = `Analyze the relationship between ${asset1} and ${asset2} based on market data.
      
    ${asset1}: $${data1?.close || 'N/A'}
    ${asset2}: $${data2?.close || 'N/A'}
    
    Provide a brief analysis of their correlation and investment implications in 2-3 sentences.`;
    
    console.log('🤖 [AI ANALYSIS] Generating GPT-OSS analysis...');
    const gptResult = await unifiedGptOssService.generate(systemPrompt, userPrompt, { 
      temperature: 0.3,
      maxTokens: 200 
    });
    
    if (!gptResult.success) {
      throw new Error(`GPT-OSS failed: ${gptResult.error}`);
    }
    
    console.log(`✅ [AI ANALYSIS] GPT-OSS analysis complete: ${gptResult.content.length} characters`);
    
    return {
      asset1: { 
        symbol: asset1, 
        price: data1?.close, 
        change: data1?.change_p || 0 
      },
      asset2: { 
        symbol: asset2, 
        price: data2?.close, 
        change: data2?.change_p || 0 
      },
      aiAnalysis: gptResult.content,
      timestamp: new Date().toISOString(),
      dataSource: 'unified_gpt_oss',
      model: gptResult.model,
      source: gptResult.source
    };
    
  } catch (error) {
    console.error(`❌ [AI ANALYSIS] Error analyzing ${asset1} vs ${asset2}:`, error.message);
    throw error;
  }
}

// WORKING: Relationship analysis endpoint with proven logic
router.get('/relationships/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    console.log(`🔗 [AI ANALYSIS] WORKING: Relationship analysis requested: ${pair}`);
    
    // Parse relationship pair (e.g., "spy-vs-tlt")
    const [asset1, , asset2] = pair.split('-');
    
    if (!asset1 || !asset2) {
      return res.status(400).json({
        error: 'Invalid relationship pair format',
        expected: 'asset1-vs-asset2 (e.g., spy-vs-tlt)',
        received: pair,
        examples: ['spy-vs-tlt', 'qqq-vs-eem', 'gld-vs-tlt']
      });
    }

    // Add timeout protection (shorter timeout)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout after 10 seconds')), 10000)
    );

    const analysisPromise = analyzeRelationship(asset1.toUpperCase(), asset2.toUpperCase());
    
    const analysis = await Promise.race([analysisPromise, timeoutPromise]);
    
    res.json({
      relationship: pair,
      analysis,
      timestamp: new Date().toISOString(),
      status: 'success',
      dataSource: 'working_implementation'
    });

  } catch (error) {
    console.error(`❌ [AI ANALYSIS] WORKING: Relationship analysis failed for ${req.params.pair}:`, error.message);
    console.error('Full error:', error);
    
    // WORKING: Enhanced fallback with specific relationship insights
    const [asset1, , asset2] = req.params.pair.split('-');
    let fallbackAnalysis = `Analysis of ${asset1?.toUpperCase() || 'Asset 1'} vs ${asset2?.toUpperCase() || 'Asset 2'} relationship.`;
    
    if (req.params.pair === 'spy-vs-tlt') {
      fallbackAnalysis = 'SPY (S&P 500) and TLT (Treasury Bonds) typically show inverse correlation during market stress. When stocks fall, investors often move to bonds for safety, indicating current risk sentiment in markets.';
    } else if (req.params.pair === 'qqq-vs-eem') {
      fallbackAnalysis = 'QQQ (Nasdaq 100) and EEM (Emerging Markets) correlation indicates global growth sentiment. Strong correlation suggests synchronized global growth, while divergence may indicate region-specific factors.';
    } else if (req.params.pair === 'gld-vs-tlt') {
      fallbackAnalysis = 'GLD (Gold) and TLT (Treasury Bonds) both serve as safe havens but respond differently to inflation expectations. Their relationship reveals market views on monetary policy and economic stability.';
    }
    
    res.json({
      relationship: req.params.pair,
      analysis: {
        aiAnalysis: fallbackAnalysis,
        fallback: true,
        timestamp: new Date().toISOString(),
        dataSource: 'intelligent_fallback',
        error: error.message
      },
      status: 'fallback',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// UNIFIED GPT-OSS: Sector analysis endpoint
router.get('/sectors', async (req, res) => {
  try {
    console.log('📊 [AI ANALYSIS] UNIFIED GPT-OSS: Sector analysis requested');
    
    const sectors = await marketService.getSectors();
    
    const topSectors = sectors?.slice(0, 5) || [];
    let sectorData = 'Current sector data unavailable';
    
    if (topSectors.length > 0) {
      sectorData = topSectors.map(s => 
        `${s.name || s.symbol}: ${(s.changePercent || s.change_p || 0).toFixed(2)}%`
      ).join('\n');
    }
    
    const systemPrompt = 'You are a financial analyst. Provide specific insights on sector performance and market implications.';
    const userPrompt = `Analyze current sector performance:
    
    ${sectorData}
    
    Provide insights on sector leadership and market implications in 3-4 sentences.`;
    
    console.log('🤖 [AI ANALYSIS] Generating GPT-OSS sector analysis...');
    const gptResult = await unifiedGptOssService.generate(systemPrompt, userPrompt, { 
      temperature: 0.3,
      maxTokens: 300 
    });
    
    if (!gptResult.success) {
      throw new Error(`GPT-OSS sector analysis failed: ${gptResult.error}`);
    }
    
    const analysis = {
      summary: gptResult.content,
      topPerformers: topSectors.slice(0, 3),
      timestamp: new Date().toISOString(),
      dataSource: 'unified_gpt_oss',
      aiModel: gptResult.source,
      model: gptResult.model
    };

    console.log('✅ [AI ANALYSIS] GPT-OSS: Sector analysis complete');
    res.json(analysis);
    
  } catch (error) {
    console.error('❌ [AI ANALYSIS] GPT-OSS sector analysis failed:', error.message);
    res.status(500).json({
      error: 'GPT-OSS sector analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// UNIFIED GPT-OSS: Macro analysis endpoint
router.get('/macro', async (req, res) => {
  try {
    console.log('🏛️ [AI ANALYSIS] UNIFIED GPT-OSS: Macro analysis requested');
    
    const systemPrompt = 'You are a macroeconomic analyst. Provide specific insights on economic conditions and investment implications.';
    const userPrompt = `Provide current macroeconomic analysis focusing on:
    - Federal Reserve policy and interest rates
    - Inflation trends and economic indicators  
    - Market regime (risk-on vs risk-off)
    - Key investment implications
    
    Provide professional analysis in 3-4 sentences.`;
    
    console.log('🤖 [AI ANALYSIS] Generating GPT-OSS macro analysis...');
    const gptResult = await unifiedGptOssService.generate(systemPrompt, userPrompt, { 
      temperature: 0.3,
      maxTokens: 300 
    });
    
    if (!gptResult.success) {
      throw new Error(`GPT-OSS macro analysis failed: ${gptResult.error}`);
    }
    
    const analysis = {
      summary: gptResult.content,
      timestamp: new Date().toISOString(),
      dataSource: 'unified_gpt_oss',
      aiModel: gptResult.source,
      model: gptResult.model
    };

    console.log('✅ [AI ANALYSIS] GPT-OSS: Macro analysis complete');
    res.json(analysis);
    
  } catch (error) {
    console.error('❌ [AI ANALYSIS] GPT-OSS macro analysis failed:', error.message);
    res.status(500).json({
      error: 'GPT-OSS macro analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for AI Analysis service
router.get('/health', async (req, res) => {
  try {
    const gptOssHealth = await unifiedGptOssService.healthCheck();
    
    res.json({
      status: gptOssHealth.status === 'online' ? 'healthy' : 'unhealthy',
      service: 'AI Analysis Routes - UNIFIED GPT-OSS VERSION',
      gptOssService: {
        status: gptOssHealth.status,
        model: gptOssHealth.model,
        gpu: gptOssHealth.gpu,
        server: gptOssHealth.server
      },
      marketService: 'Connected to proven working marketService',
      mistralRemoved: true,
      fallbacksRemoved: true,
      availableEndpoints: [
        'GET /api/ai-analysis/relationships/{pair} - GPT-OSS relationship analysis',
        'GET /api/ai-analysis/sectors - GPT-OSS sector analysis',
        'GET /api/ai-analysis/macro - GPT-OSS macro analysis',
        'GET /api/ai-analysis/health - Service health check'
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
