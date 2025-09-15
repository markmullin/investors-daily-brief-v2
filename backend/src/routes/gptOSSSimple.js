/**
 * UNIFIED GPT-OSS Routes - NO FALLBACKS, NO MISTRAL
 * Single source of truth for all GPT-OSS generation
 */

import express from 'express';
import unifiedGptOssService from '../services/unifiedGptOssService.js';

const router = express.Router();

/**
 * Health check
 */
router.get('/health', async (req, res) => {
  const healthResult = await unifiedGptOssService.healthCheck();
  
  res.json({
    status: healthResult.status === 'online' ? 'ready' : 'unavailable',
    service: 'unified-gpt-oss',
    gpu: healthResult.gpu,
    backend: healthResult.server,
    model: healthResult.model,
    fallbacksRemoved: true,
    mistralRemoved: true
  });
});

/**
 * UNIFIED GPT-OSS Market Analysis - NO FALLBACKS
 */
router.post('/market-analysis', async (req, res) => {
  try {
    const { 
      sp500Price = 6481.41, 
      sp500Change = 1.5, 
      nasdaqPrice = 20000, 
      nasdaqChange = 2.0, 
      vix = 16, 
      treasury10y = 4.0,
      marketPhase = 'NEUTRAL',
      analysisType = 'market'
    } = req.body;

    console.log('🚀 UNIFIED GPT-OSS Market Analysis:', { 
      analysisType, 
      marketPhase,
      gpu: 'RTX 5060',
      model: 'GPT-OSS-20B'
    });

    const marketData = {
      sp500Price,
      sp500Change,
      nasdaqPrice,
      nasdaqChange,
      vix,
      treasury10y
    };

    // Use unified service with GPT-OSS for comprehensive AI market analysis
    const result = await unifiedGptOssService.generateIntelligentAnalysis(
      analysisType, 
      marketPhase, 
      marketData,
      { useModel: 'gpt-oss' }  // Force GPT-OSS for comprehensive market analysis
    );

    if (!result.success) {
      console.error('❌ UNIFIED GPT-OSS Market Analysis failed:', result.error);
      return res.status(500).json({
        success: false,
        error: `GPT-OSS generation failed: ${result.error}`,
        realAI: false
      });
    }

    res.json({
      success: true,
      data: {
        analysis: result.content,
        model: result.model,
        gpu: 'RTX 5060 (REAL GPU INFERENCE)',
        source: result.source,
        realAI: true,
        pipeline: 'Unified GPT-OSS Service → RTX 5060 GPU'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unified GPT-OSS market analysis error:', error.message);
    
    // Return error instead of fallback
    res.status(500).json({
      success: false,
      error: `GPT-OSS service failed: ${error.message}`,
      realAI: false
    });
  }
});

/**
 * UNIFIED GPT-OSS Fast Analysis - NO FALLBACKS
 */
router.post('/fast-analysis', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      analysisType = 'market',
      marketPhase = 'NEUTRAL',
      marketData = null
    } = req.body;

    console.log('⚡ UNIFIED GPT-OSS FAST ANALYSIS:', { 
      analysisType, 
      marketPhase,
      hasMarketData: !!marketData,
      timestamp: new Date().toISOString()
    });

    let reasoningSteps = [
      { step: 1, status: 'starting', message: 'Connecting to unified GPT-OSS service...', timestamp: Date.now() }
    ];

    reasoningSteps.push({ 
      step: 2, 
      status: 'processing', 
      message: 'Generating analysis with GPT-OSS-20B on RTX 5060...', 
      timestamp: Date.now() 
    });

    // Use unified service with GPT-OSS for comprehensive AI market analysis
    const result = await unifiedGptOssService.generateIntelligentAnalysis(
      analysisType, 
      marketPhase, 
      marketData,
      { useModel: 'gpt-oss' }  // Force GPT-OSS for comprehensive market analysis
    );

    if (!result.success) {
      console.error('❌ UNIFIED GPT-OSS FAILED:', result.error);
      return res.status(500).json({
        success: false,
        error: `GPT-OSS generation failed: ${result.error}`,
        source: 'GPT-OSS ERROR',
        reasoning: [
          { step: 1, status: 'failed', message: result.error, timestamp: Date.now() }
        ]
      });
    }

    reasoningSteps.push({ 
      step: 3, 
      status: 'success', 
      message: `✅ GPT-OSS generated ${result.content.length} characters`, 
      timestamp: Date.now() 
    });

    const totalTime = Date.now() - startTime;
    
    reasoningSteps.push({ 
      step: 4, 
      status: 'delivered', 
      message: `Analysis completed in ${totalTime}ms`, 
      timestamp: Date.now() 
    });

    res.json({
      success: true,
      data: {
        analysis: result.content,
        source: result.source,
        responseTime: `${totalTime}ms`,
        reasoning: reasoningSteps,
        fallbackUsed: false,
        analysisType: analysisType,
        marketPhase: marketPhase,
        model: result.model,
        tokensGenerated: result.tokensGenerated
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unified GPT-OSS fast analysis error:', error.message);
    
    // Return error instead of fallback
    res.status(500).json({
      success: false,
      error: `GPT-OSS service failed: ${error.message}`,
      source: 'SERVICE ERROR'
    });
  }
});

export default router;
