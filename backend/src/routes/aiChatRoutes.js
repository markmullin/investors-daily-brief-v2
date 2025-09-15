import express from 'express';
import unifiedGptOssService from '../services/unifiedGptOssService.js';
import { marketService } from '../services/apiServices.js';

const router = express.Router();

/**
 * AI Chat endpoint for the Command Center
 * Integrates Mistral AI with real-time FMP market data context
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required',
        success: false
      });
    }
    
    console.log(`🤖 AI Chat request: "${message.substring(0, 100)}..." (context: ${context || 'none'})`);
    
    // AI service auto-initializes, no need for manual initialization
    
    // Get current market data for context
    let marketContext = '';
    try {
      console.log('📊 Fetching current market data for AI context...');
      const marketData = await marketService.getData();
      
      if (marketData && Object.keys(marketData).length > 0) {
        const marketSummary = Object.entries(marketData)
          .map(([symbol, data]) => {
            const cleanSymbol = symbol.replace('.US', '');
            const price = data.close || data.price || 0;
            const change = data.change_p || 0;
            return `${cleanSymbol}: $${price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`;
          })
          .join(', ');
        
        marketContext = `\nCurrent Market Data: ${marketSummary}`;
        console.log('✅ Market context added to AI prompt');
      }
    } catch (marketError) {
      console.warn('⚠️ Could not fetch market data for context:', marketError.message);
      marketContext = '\nNote: Market data temporarily unavailable.';
    }
    
    // Detect if user is asking for navigation
    const lowerMessage = message.toLowerCase();
    const isNavigationRequest = lowerMessage.includes('navigate') || 
                               lowerMessage.includes('go to') || 
                               lowerMessage.includes('portfolio') || 
                               lowerMessage.includes('research') || 
                               lowerMessage.includes('market');
    
    // Build context-aware prompt
    let systemPrompt = `You are an expert AI financial assistant for the Investor's Daily Brief platform. You provide intelligent, actionable financial insights.

Current Context: User is on ${context || 'the main dashboard'}.${marketContext}

Guidelines:
- Provide concise, helpful financial analysis
- Use current market data when relevant
- If asked about navigation, ask for permission before suggesting page changes
- Explain complex concepts in simple terms
- Always be professional but conversational
- Reference real market data when available

User Query: ${message}`;

    if (isNavigationRequest) {
      systemPrompt += `\n\nNote: This appears to be a navigation request. If appropriate, ask the user if they'd like to navigate to a specific section of the dashboard.`;
    }
    
    console.log('🧠 Sending prompt to Mistral AI...');
    
    // Generate AI response
    const aiResult = await unifiedGptOssService.generate('You are a helpful assistant.', systemPrompt, {
      temperature: 0.4,
      maxTokens: 512,
      timeout: 25000
    });
    
    const aiResponse = aiResult.success ? aiResult.content : 'Sorry, I encountered an issue processing your request.';
    
    console.log(`✅ AI response generated (${aiResponse.length} characters)`);
    
    // Determine if this response should include navigation actions
    const includeNavigation = isNavigationRequest && (
      aiResponse.toLowerCase().includes('would you like') ||
      aiResponse.toLowerCase().includes('navigate') ||
      aiResponse.toLowerCase().includes('go to')
    );
    
    res.json({
      response: aiResponse,
      hasNavigationSuggestion: includeNavigation,
      context: context,
      marketDataIncluded: marketContext.length > 0,
      success: true
    });
    
  } catch (error) {
    console.error('❌ AI Chat error:', error.message);
    
    // Provide helpful error messages based on error type
    if (error.message.includes('timeout') || error.message.includes('API timeout')) {
      res.status(504).json({
        error: 'AI response timeout - please try again',
        success: false,
        retryable: true
      });
    } else if (error.message.includes('authentication') || error.message.includes('401')) {
      res.status(500).json({
        error: 'AI service authentication error',
        success: false,
        retryable: false
      });
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      res.status(429).json({
        error: 'AI service rate limit reached - please wait a moment',
        success: false,
        retryable: true
      });
    } else {
      res.status(500).json({
        error: 'AI service temporarily unavailable',
        details: error.message,
        success: false,
        retryable: true
      });
    }
  }
});

/**
 * AI Service status endpoint for health checks
 */
router.get('/status', async (req, res) => {
  try {
    const status = await unifiedGptOssService.healthCheck();
    
    res.json({
      ready: status.status === 'online',
      initialized: status.status === 'online',
      apiKeyConfigured: true,
      lastError: status.error || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test endpoint for AI service
 */
router.post('/test', async (req, res) => {
  try {
    const testMessage = req.body.message || 'What are the current market conditions?';
    
    console.log('🧪 Testing AI service with message:', testMessage);
    
    // AI service auto-initializes
    
    const result = await unifiedGptOssService.generate(
      'You are a financial AI assistant.', 
      `Answer this briefly: ${testMessage}`,
      { temperature: 0.3, maxTokens: 200 }
    );
    
    const response = result.success ? result.content : 'Test failed';
    
    res.json({
      success: true,
      testMessage,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
