// testAiRoute.js - Step-by-step AI testing
import express from 'express';

const router = express.Router();

/**
 * Step 1: Test basic route
 */
router.get('/test-basic', (req, res) => {
  console.log('✅ Basic test route working');
  res.json({
    status: 'success',
    message: 'Basic AI route working',
    timestamp: new Date().toISOString()
  });
});

/**
 * Step 2: Test Mistral import only
 */
router.get('/test-mistral-import', async (req, res) => {
  try {
    console.log('🔄 Testing Mistral import...');
    const mistralService = await import('../services/mistralService.js');
    console.log('✅ Mistral import successful');
    
    const status = mistralService.default.getStatus();
    
    res.json({
      status: 'success',
      message: 'Mistral import successful',
      mistralStatus: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Mistral import failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Mistral import failed',
      details: error.message,
      stack: error.stack
    });
  }
});

/**
 * Step 3: Test Mistral initialization
 */
router.get('/test-mistral-init', async (req, res) => {
  try {
    console.log('🔄 Testing Mistral initialization...');
    const mistralService = await import('../services/mistralService.js');
    
    const initResult = await mistralService.default.initialize();
    console.log(`Mistral init result: ${initResult}`);
    
    res.json({
      status: 'success',
      message: 'Mistral initialization test complete',
      initialized: initResult,
      mistralStatus: mistralService.default.getStatus(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Mistral initialization failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Mistral initialization failed',
      details: error.message,
      stack: error.stack
    });
  }
});

/**
 * Step 4: Test news service import
 */
router.get('/test-news-import', async (req, res) => {
  try {
    console.log('🔄 Testing news service import...');
    const newsService = await import('../services/premiumNewsService.js');
    console.log('✅ News service import successful');
    
    const status = newsService.default.getStatus();
    
    res.json({
      status: 'success',
      message: 'News service import successful',
      newsStatus: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ News service import failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'News service import failed',
      details: error.message,
      stack: error.stack
    });
  }
});

/**
 * Step 5: Test simple text generation
 */
router.get('/test-simple-ai', async (req, res) => {
  try {
    console.log('🔄 Testing simple AI text generation...');
    const mistralService = await import('../services/mistralService.js');
    
    await mistralService.default.initialize();
    
    const simplePrompt = "Write a one sentence summary of current market conditions.";
    const result = await mistralService.default.generateText(simplePrompt, {
      temperature: 0.5,
      maxTokens: 100
    });
    
    res.json({
      status: 'success',
      message: 'Simple AI generation successful',
      generatedText: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple AI generation failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Simple AI generation failed',
      details: error.message,
      stack: error.stack
    });
  }
});

export default router;
