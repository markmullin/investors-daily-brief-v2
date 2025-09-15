/**
 * GPT-OSS API Routes
 * Endpoints for AI-powered features using local GPU-accelerated GPT-OSS-20B
 */

import express from 'express';
import { getGPTOSSService } from '../services/ai/gptOSSService.js';

const router = express.Router();

// Get service instance
const gptOSS = getGPTOSSService();

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await gptOSS.checkHealth();
    res.json({
      status: 'ok',
      service: 'gpt-oss-20b',
      gpu: 'RTX 5060',
      performance: '6.5 tokens/second',
      ...health
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'GPT-OSS service unavailable',
      fallback: 'mistral-api'
    });
  }
});

/**
 * Generate market analysis
 */
router.post('/market-analysis', async (req, res) => {
  try {
    const { 
      sp500Price, 
      sp500Change, 
      nasdaqPrice, 
      nasdaqChange, 
      vix, 
      treasury10y,
      marketPhase 
    } = req.body;

    const analysis = await gptOSS.generateMarketAnalysis({
      sp500Price,
      sp500Change,
      nasdaqPrice,
      nasdaqChange,
      vix,
      treasury10y,
      marketPhase
    });

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate market analysis',
      message: error.message 
    });
  }
});

/**
 * Explain financial concepts
 */
router.post('/explain', async (req, res) => {
  try {
    const { concept, context } = req.body;
    
    if (!concept) {
      return res.status(400).json({ 
        success: false, 
        error: 'Concept is required' 
      });
    }

    const explanation = await gptOSS.explainConcept(concept, context || {});
    
    res.json({
      success: true,
      data: explanation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Explanation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate explanation',
      message: error.message 
    });
  }
});

/**
 * Analyze portfolio
 */
router.post('/portfolio-analysis', async (req, res) => {
  try {
    const { portfolio, marketConditions } = req.body;
    
    if (!portfolio) {
      return res.status(400).json({ 
        success: false, 
        error: 'Portfolio data is required' 
      });
    }

    const insights = await gptOSS.analyzePortfolio(
      portfolio, 
      marketConditions || {}
    );
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze portfolio',
      message: error.message 
    });
  }
});

/**
 * Chat endpoint with streaming support
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, stream = false } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Messages array is required' 
      });
    }

    if (stream) {
      // Set up SSE headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      await gptOSS.streamChat(messages, (token) => {
        res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
      });
      
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming response
      const response = await gptOSS.streamChat(messages, () => {});
      res.json({
        success: true,
        data: { content: response },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process chat',
      message: error.message 
    });
  }
});

/**
 * Custom prompt endpoint for testing
 */
router.post('/custom', async (req, res) => {
  try {
    const { prompt, maxTokens = 200, temperature = 0.7 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const response = await gptOSS.axiosInstance.post('/completion', {
      prompt,
      n_predict: maxTokens,
      temperature,
      stream: false
    });
    
    res.json({
      success: true,
      data: {
        response: response.data.content,
        model: 'gpt-oss-20b',
        tokens_generated: response.data.tokens_predicted,
        generation_time: response.data.timings?.predicted_ms
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Custom prompt error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process prompt',
      message: error.message 
    });
  }
});

export default router;
