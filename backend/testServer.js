// testServer.js - Minimal server for AI testing
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(cors({ 
  origin: 'http://localhost:5173',
  credentials: true 
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'test-server-running', 
    timestamp: new Date().toISOString() 
  });
});

// Load test AI routes
try {
  const testAiRoutes = await import('./src/routes/testAiRoute.js');
  app.use('/api/ai', testAiRoutes.default);
  console.log('✅ Test AI routes loaded');
} catch (error) {
  console.error('❌ Failed to load test AI routes:', error);
}

// Simple fallback route
app.get('/api/ai/working', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test server AI route working',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(5000, () => {
  console.log('🧪 TEST SERVER running on port 5000');
  console.log('🔗 Test routes:');
  console.log('   http://localhost:5000/api/ai/test-basic');
  console.log('   http://localhost:5000/api/ai/test-mistral-import');
  console.log('   http://localhost:5000/api/ai/test-mistral-init');
  console.log('   http://localhost:5000/api/ai/test-news-import');
  console.log('   http://localhost:5000/api/ai/test-simple-ai');
});
