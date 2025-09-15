/**
 * EDUCATION ROUTES - REAL PIPELINE ONLY
 * FMP → Python GPU → Qwen 3 → Educational Text
 * NO SYNTHETIC DATA - REAL ANALYSIS ONLY
 */

import express from 'express';
import gpuManager from '../services/gpuManager.js';

const router = express.Router();

// Store active streams for real-time communication
const activeStreams = new Map();

/**
 * GET /api/education/stream-analysis
 * Real-time Server-Sent Events for chain of thought
 */
router.get('/stream-analysis', async (req, res) => {
  const { context } = req.query;
  const streamId = `${Date.now()}-${Math.random()}`;
  
  // Set up SSE headers with better connection handling and CORS
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://your-frontend-domain.com' 
      : 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'false',
    'X-Accel-Buffering': 'no'  // Disable nginx buffering
  });

  console.log(`📡 Setting up SSE stream ${streamId} for context: ${context}`);

  // Store stream info with health tracking
  const streamInfo = {
    response: res,
    startTime: Date.now(),
    context: context,
    isHealthy: true,
    lastActivity: Date.now()
  };

  // Keep connection alive with health monitoring
  const keepAlive = setInterval(() => {
    try {
      if (!res.destroyed && streamInfo.isHealthy) {
        res.write(`data: {"type":"keepalive","streamId":"${streamId}","timestamp":"${new Date().toISOString()}"}\n\n`);
        streamInfo.lastActivity = Date.now();
        console.log(`💓 Keepalive sent to ${streamId}`);
      } else {
        console.log(`🔌 Stream ${streamId} is destroyed or unhealthy, cleaning up`);
        clearInterval(keepAlive);
        activeStreams.delete(streamId);
      }
    } catch (error) {
      console.log(`❌ Keepalive error for ${streamId}:`, error.message);
      clearInterval(keepAlive);
      activeStreams.delete(streamId);
      streamInfo.isHealthy = false;
    }
  }, 15000); // More frequent keepalives

  streamInfo.keepAlive = keepAlive;

  // Store stream for real-time communication
  activeStreams.set(streamId, streamInfo);

  // Send connection confirmation
  res.write(`data: {"type":"connected","streamId":"${streamId}","context":"${context}"}\n\n`);

  // Handle client disconnect and errors with better cleanup
  req.on('close', () => {
    console.log(`📡 Real analysis stream ${streamId} closed by client`);
    streamInfo.isHealthy = false;
    clearInterval(keepAlive);
    activeStreams.delete(streamId);
    console.log(`🧹 Stream ${streamId} cleaned up on disconnect`);
  });

  req.on('error', (error) => {
    console.log(`❌ Stream ${streamId} request error:`, error.message);
    streamInfo.isHealthy = false;
    clearInterval(keepAlive);
    activeStreams.delete(streamId);
  });

  res.on('error', (error) => {
    console.log(`❌ Stream ${streamId} response error:`, error.message);
    streamInfo.isHealthy = false;
    clearInterval(keepAlive);
    activeStreams.delete(streamId);
  });

  console.log(`📡 Real analysis stream ${streamId} ready for ${context}`);
});

/**
 * POST /api/education/analyze-real
 * REAL PIPELINE: FMP → Python GPU → Qwen 3
 */
// TEMPORARY: Minimal test endpoint
router.post('/analyze-real-minimal', async (req, res) => {
  console.log('📍 MINIMAL TEST: /analyze-real-minimal hit');
  try {
    res.json({
      success: true,
      message: 'Minimal endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Even minimal endpoint failed:', error);
    res.status(500).json({ error: 'Minimal test failed' });
  }
});

router.post('/analyze-real', async (req, res) => {
  console.log('📍 /analyze-real endpoint hit - START');
  
  // Set timeout for the entire operation - track completion to prevent conflicts
  let operationCompleted = false;
  const operationTimeout = setTimeout(() => {
    if (!res.headersSent && !operationCompleted) {
      console.log('⏰ Operation timed out after 2 minutes');
      operationCompleted = true;
      res.status(408).json({
        error: 'Analysis timed out',
        message: 'The analysis took too long to complete'
      });
    }
  }, 120000); // 2 minutes for comprehensive analysis
  
  // Wrap EVERYTHING in try-catch to prevent crashes
  try {
    console.log('📍 Inside main try block');
    const { context, data } = req.body;
    
    console.log(`🎓 REAL ANALYSIS PIPELINE: ${context}`);
    console.log('📊 Request data:', JSON.stringify({ context, hasData: !!data }));

    if (!context) {
      return res.status(400).json({
        error: 'Context required for real analysis',
        pipeline: 'FMP → Python GPU → Qwen 3'
      });
    }

    // Find active stream for real-time thoughts
    let targetStream = null;
    
    // Robust stream discovery with health validation
    console.log('🔍 Searching for healthy stream connection...');
    console.log(`📊 Total active streams: ${activeStreams.size}`);
    
    // Give streams a moment to stabilize
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // Search for best available stream with multiple attempts
    for (let attempts = 0; attempts < 5; attempts++) {
      console.log(`🔍 Stream search attempt ${attempts + 1}/5`);
      
      const availableStreams = Array.from(activeStreams.entries());
      console.log(`📋 Available streams:`, availableStreams.map(([id, s]) => ({
        id: id.substring(0, 8) + '...',
        context: s.context,
        healthy: s.isHealthy,
        destroyed: s.response?.destroyed || 'unknown'
      })));
      
      // Priority 1: Exact context match that's healthy
      for (const [id, stream] of availableStreams) {
        if (stream.context === context && 
            stream.isHealthy && 
            !stream.response?.destroyed &&
            stream.response?.writable) {
          targetStream = stream;
          console.log(`✅ Found perfect match - healthy stream for ${context}`);
          break;
        }
      }
      
      // Priority 2: Any healthy stream (for fallback)
      if (!targetStream) {
        const healthyStreams = availableStreams
          .filter(([id, stream]) => stream.isHealthy && 
                                   !stream.response?.destroyed &&
                                   stream.response?.writable)
          .sort(([,a], [,b]) => b.startTime - a.startTime); // Most recent first
        
        if (healthyStreams.length > 0) {
          targetStream = healthyStreams[0][1];
          console.log(`⚡ Using most recent healthy stream (context: ${targetStream.context})`);
          break;
        }
      }
      
      if (targetStream) break;
      
      if (attempts < 4) {
        console.log(`⏳ No healthy stream found, waiting 150ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    console.log('📍 DEBUG: Found targetStream?', !!targetStream);
    console.log('📍 DEBUG: Active streams count:', activeStreams.size);
    console.log('📍 DEBUG: Stream details:', targetStream ? {
      hasResponse: !!targetStream.response,
      context: targetStream.context,
      startTime: targetStream.startTime
    } : 'none');

    // Step 1: Get REAL FMP market data
    console.log('📊 Fetching real FMP market data...');
    let fmpData = null;
    let marketData = {};
    
    try {
      // Import FMP service
      const { default: fmpService } = await import('../services/fmpService.js');
      
      if (data?.relationship?.symbols) {
        const symbols = data.relationship.symbols;
        console.log(`📊 Getting FMP data for: ${symbols.join(', ')}`);
        
        // Get real price data from FMP
        const symbol = symbols[0]; // Use first symbol for education
        const priceResponse = await fmpService.getHistoricalPrices(symbol, '1y');
        const priceHistory = priceResponse?.historical || [];
        
        if (priceHistory && priceHistory.length > 0) {
          fmpData = {
            symbol: symbol,
            prices: priceHistory.map(item => parseFloat(item.close)),
            timestamps: priceHistory.map(item => item.date),
            volume: priceHistory.map(item => parseInt(item.volume))
          };
          console.log(`✅ Got ${fmpData.prices.length} price points for ${symbol}`);
        }
      } else {
        // Map context to appropriate symbol - NO HARDCODED SPY!
        let symbol;
        if (context === 'market_index') {
          symbol = '^GSPC'; // S&P 500 index
          console.log('📊 Market index analysis - using S&P 500 index (^GSPC)');
        } else if (context === 'nasdaq') {
          symbol = '^IXIC'; // NASDAQ Composite  
          console.log('📊 NASDAQ analysis - using NASDAQ Composite (^IXIC)');
        } else {
          symbol = '^GSPC'; // Default to S&P 500 index
          console.log('📊 General market analysis - using S&P 500 index (^GSPC)');
        }
        
        const indexResponse = await fmpService.getHistoricalPrices(symbol, '1y');
        const indexHistory = indexResponse?.historical || [];
        
        if (indexHistory && indexHistory.length > 0) {
          fmpData = {
            symbol: symbol,
            prices: indexHistory.map(item => parseFloat(item.close)),
            timestamps: indexHistory.map(item => item.date),
            volume: indexHistory.map(item => parseInt(item.volume))
          };
          console.log(`✅ Got ${fmpData.prices.length} price points for ${symbol}`);
        }
      }
      
      marketData = fmpData;
    } catch (fmpError) {
      console.error('❌ FMP data fetch failed:', fmpError.message);
      marketData = null;
    }

    // Step 2: REAL Python GPU processing
    console.log('🐍 Calling REAL Python GPU bridge...');
    console.log('📊 Market data status:', {
      hasData: !!marketData,
      pricesLength: marketData?.prices?.length || 0,
      symbol: marketData?.symbol || 'none'
    });
    let pythonResults = null;
    
    if (marketData && marketData.prices && marketData.prices.length > 20) {
      try {
        const { default: pythonGpuBridge } = await import('../services/pythonGpuBridge.js');
        
        // Debug logging
        console.log('🔍 marketData sample:', {
          symbol: marketData?.symbol,
          pricesLength: marketData?.prices?.length,
          firstPrice: marketData?.prices?.[0],
          lastPrice: marketData?.prices?.[marketData?.prices?.length - 1]
        });
        
        pythonResults = await pythonGpuBridge.analyzeForEducation({
          context,
          data: marketData,
          calculationsNeeded: ['rsi', 'macd', 'bollinger_bands', 'ma20', 'ma50', 'ma200']
        });
        
        if (pythonResults.success) {
          console.log('✅ Python GPU analysis completed');
          console.log('📈 Generated insights:', Object.keys(pythonResults.insights).join(', '));
        } else {
          console.error('❌ Python analysis failed:', pythonResults.error);
        }
      } catch (pythonError) {
        console.error('❌ Python bridge error:', pythonError.message);
        pythonResults = null;
      }
    } else {
      console.warn('⚠️ Insufficient market data for Python analysis');
      pythonResults = null;
    }
    
    // Ensure Python analysis succeeded with REAL data
    if (!pythonResults || !pythonResults.success) {
      console.error('🚨 PYTHON ANALYSIS FAILED');
      console.error('Market Data:', marketData ? `${marketData.prices?.length || 0} prices for ${marketData.symbol}` : 'No market data');
      console.error('Python Error:', pythonResults?.error || 'Python bridge returned null');
      
      // Create clear fallback that indicates failure
      pythonResults = {
        success: false,
        insights: {
          system_status: 'analysis_unavailable',
          error_details: pythonResults?.error || 'Technical analysis system offline',
          fallback_mode: true
        }
      };
    }

    // Step 3: Real AI analysis - only model thoughts will be streamed

    // Check if gpuManager is properly initialized
    let isGpuInitialized = false;
    try {
      isGpuInitialized = gpuManager?.isInitialized || false;
      console.log('📍 gpuManager.isInitialized:', isGpuInitialized);
    } catch (accessError) {
      console.error('📍 ERROR accessing gpuManager:', accessError);
      // Continue with fallback mode instead of crashing
      console.log('📍 Continuing without GPU Manager');
    }
    
    // Initialize Qwen 3 if needed (this is slow, only do it once!)
    if (!isGpuInitialized) {
      console.log('🚀 Initializing GPU Manager (this takes a few seconds on first run)...');
      
      // Only model thoughts will be streamed - no hardcoded messages
      
      try {
        console.log('📍 Calling gpuManager.initialize()...');
        
        const initResult = await gpuManager.initialize();
        console.log('📍 gpuManager.initialize() returned:', initResult);
        
        // AI models ready - let the model's thoughts speak for themselves
        
        if (!initResult) {
          console.error('❌ GPU Manager failed to initialize');
          throw new Error('GPU Manager initialization failed');
        }
      } catch (initError) {
        console.error('❌ GPU Manager initialization error:', initError);
        console.error('❌ Error stack:', initError.stack);
        
        return res.status(500).json({
          success: false,
          error: 'AI model initialization failed',
          details: initError.message,
          stack: initError.stack
        });
      }
    }

    // Real Qwen 3 analysis with ACTUAL DATA
    const qwenPrompt = `You are a financial educator with REAL MARKET DATA and PYTHON CALCULATIONS.

📊 REAL MARKET DATA FOR ${marketData?.symbol || 'SYMBOL'}:
- Current Price: $${marketData?.prices?.[marketData.prices.length - 1]?.toFixed(2) || 'N/A'}
- 1-Year Price Range: $${Math.min(...(marketData?.prices || [0]))?.toFixed(2)} - $${Math.max(...(marketData?.prices || [0]))?.toFixed(2)}
- Data Points: ${marketData?.prices?.length || 0} trading days

🐍 PYTHON GPU CALCULATED INDICATORS:
${JSON.stringify(pythonResults.insights, null, 2)}

💭 STEP 1: First, think through what Python calculated:
- What are the specific RSI, MACD, and moving average values?
- What do these numbers tell us about current market conditions?

💭 STEP 2: Think through the technical analysis:
- Are we in overbought/oversold territory?
- What is the trend direction and strength?
- What do volume patterns suggest?

💭 STEP 3: Consider investment implications:
- What does this mean for investors TODAY?
- What are the key risks and opportunities?

🎯 FINAL EDUCATIONAL ANALYSIS:
Provide your final analysis with specific numbers and actionable insights.

Think step by step, then give your final analysis:`;

    console.log('🤖 QWEN 3: Generating educational explanation...');
    
    let qwenResult;
    try {
      console.log('📍 About to call gpuManager.generateEducation');
      
      // Check if gpuManager has the method before calling
      if (!gpuManager || typeof gpuManager.generateEducation !== 'function') {
        throw new Error('GPU Manager not properly initialized or missing generateEducation method');
      }
      
      // The model will stream its own thoughts now
      qwenResult = await gpuManager.generateEducation(context, {
        prompt: qwenPrompt,
        pythonResults,
        marketData
      }, {
        temperature: 0.7,
        maxTokens: 1200,  // More tokens for complete analysis
        timeout: 30000,   // 30 seconds - normal generation time
        streamCallback: targetStream ? (thoughtData) => {
          // Stream the actual model's chain of thought to the client with safety checks
          try {
            if (targetStream.isHealthy && 
                !targetStream.response.destroyed && 
                targetStream.response.writable) {
              
              const streamData = {
                ...thoughtData,
                streamId: Object.keys(activeStreams).find(k => activeStreams.get(k) === targetStream) || 'unknown',
                timestamp: thoughtData.timestamp || new Date().toISOString()
              };
              
              targetStream.response.write(`data: ${JSON.stringify(streamData)}\n\n`);
              targetStream.lastActivity = Date.now();
              console.log(`📡 Streamed ${thoughtData.type || 'data'} to client`);
            } else {
              console.log(`⚠️ Stream unhealthy, skipping: destroyed=${targetStream.response?.destroyed}, writable=${targetStream.response?.writable}`);
            }
          } catch (streamError) {
            console.log(`❌ Stream write error:`, streamError.message);
            targetStream.isHealthy = false;
          }
        } : null
      });
      console.log('📍 generateEducation returned:', qwenResult?.success);
      
      // Model finished its analysis
    } catch (genError) {
      console.error('❌ generateEducation failed:', genError.message);
      console.error('❌ Error stack:', genError.stack);
      
      // Provide a meaningful fallback response
      qwenResult = {
        success: false,
        content: `Educational analysis temporarily unavailable. The AI model encountered an issue: ${genError.message}`,
        error: genError.message,
        fallback: true
      };
    }

    // Step 4: Stream final educational analysis
    if (targetStream) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (qwenResult.success) {
        targetStream.response.write(`data: ${JSON.stringify({
          type: 'analysis',
          content: qwenResult.content,
          model: 'Qwen 3',
          pipeline: 'FMP → Python GPU → Qwen 3',
          timestamp: new Date().toISOString()
        })}\n\n`);
        
        targetStream.response.write(`data: ${JSON.stringify({
          type: 'completed',
          duration: Date.now() - targetStream.startTime
        })}\n\n`);
      } else {
        // Stream error information
        targetStream.response.write(`data: ${JSON.stringify({
          type: 'error',
          content: qwenResult.content || 'Analysis failed',
          error: qwenResult.error,
          timestamp: new Date().toISOString()
        })}\n\n`);
        
        targetStream.response.write(`data: ${JSON.stringify({
          type: 'completed',
          duration: Date.now() - targetStream.startTime,
          status: 'error'
        })}\n\n`);
      }
    }

    // Always send a response (even if failed) - but check for completion first
    if (!operationCompleted && !res.headersSent) {
      operationCompleted = true;
      const responseData = {
        success: qwenResult.success,
        pipeline: 'REAL: FMP → Python GPU → Qwen 3',
        context,
        model: qwenResult.success ? 'Qwen 3' : 'fallback',
        timestamp: new Date().toISOString()
      };

      if (!qwenResult.success) {
        responseData.error = qwenResult.error;
        responseData.content = qwenResult.content;
      }

      res.json(responseData);
    } else {
      console.log('⚠️ Operation already completed or headers sent, skipping response');
    }

  } catch (error) {
    console.error('❌ REAL PIPELINE FAILED:', error);
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Error stack:', error?.stack);
    
    // Always return a response to prevent hanging - but check completion first
    if (!operationCompleted && !res.headersSent) {
      operationCompleted = true;
      res.status(500).json({
        error: 'Real pipeline failed',
        details: error?.message || 'Unknown error',
        type: error?.constructor?.name || 'Unknown',
        pipeline: 'FMP → Python GPU → Qwen 3'
      });
    } else {
      console.log('⚠️ Error handler: Operation already completed or headers sent');
    }
  } finally {
    // Clear the timeout
    clearTimeout(operationTimeout);
  }
});

/**
 * GET /api/education/test
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
  console.log('📍 Test endpoint hit');
  res.json({
    success: true,
    gpuManagerExists: !!gpuManager,
    isInitialized: gpuManager?.isInitialized || false,
    message: 'Test endpoint working'
  });
});

/**
 * GET /api/education/status
 * Check real pipeline status
 */
router.get('/status', (req, res) => {
  try {
    const status = gpuManager.getStatus();
    
    res.json({
      success: true,
      pipeline: 'REAL: FMP → Python GPU → Qwen 3',
      gpu: status,
      activeStreams: activeStreams.size,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Status check failed',
      details: error.message
    });
  }
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  console.log('🧹 Cleaning up real analysis streams...');
  for (const [streamId, stream] of activeStreams) {
    clearInterval(stream.keepAlive);
    stream.response.end();
  }
  activeStreams.clear();
});

export default router;