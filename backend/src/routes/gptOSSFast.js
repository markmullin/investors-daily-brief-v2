/**
 * UNIFIED GPT-OSS FAST ANALYSIS ROUTES
 * NO MISTRAL, NO FALLBACKS - GPT-OSS ONLY
 */

import express from 'express';
import unifiedGptOssService from '../services/unifiedGptOssService.js';

const router = express.Router();

/**
 * UNIFIED GPT-OSS FAST ANALYSIS - NO FALLBACKS
 */
router.post('/fast-analysis', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      analysisType = 'market',
      marketPhase = 'NEUTRAL',
      marketData = null
    } = req.body;

    console.log('⚡ UNIFIED GPT-OSS ANALYSIS:', { 
      analysisType, 
      marketPhase,
      hasMarketData: !!marketData,
      timestamp: new Date().toISOString()
    });

    let reasoningSteps = [
      { step: 1, status: 'starting', message: 'Connecting to GPT-OSS-20B on RTX 5060...', timestamp: Date.now() }
    ];

    reasoningSteps.push({ 
      step: 2, 
      status: 'processing', 
      message: 'Generating analysis with unified GPT-OSS service...', 
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
      // Return error instead of fallback
      return res.status(500).json({
        success: false,
        error: result.error,
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
    console.error('❌ Unified GPT-OSS analysis error:', error.message);
    
    // Return error instead of fallback
    res.status(500).json({
      success: false,
      error: `GPT-OSS service failed: ${error.message}`,
      source: 'SERVICE ERROR'
    });
  }
});

/**
 * UNIFIED GPT-OSS HEALTH CHECK
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  const healthResult = await unifiedGptOssService.healthCheck();
  
  res.json({
    status: healthResult.status === 'online' ? 'ready' : 'unavailable',
    service: 'unified-gpt-oss',
    gpu: {
      status: healthResult.status,
      model: healthResult.model,
      hardware: healthResult.gpu,
      server: healthResult.server
    },
    performance: {
      fallbackEnabled: false,
      mistralRemoved: true,
      unifiedService: true
    },
    healthCheckTime: `${Date.now() - startTime}ms`,
    timestamp: new Date().toISOString(),
    error: healthResult.error || null
  });
});

export default router;
