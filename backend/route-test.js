/**
 * ROUTE SETUP TEST - Find which route import is hanging
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

// Basic setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

console.log('🔍 ROUTE TEST: Starting route import tests...');

// Test basic routes first
app.get('/health', (req, res) => {
  res.json({ status: 'route_test_ok' });
});

console.log('✅ ROUTE TEST: Basic routes set up');

// Test route imports one by one
async function testRouteImports() {
  try {
    console.log('🔍 ROUTE TEST: Step 1 - Auth routes...');
    const authRoutes = await import('./src/routes/auth.js');
    app.use('/api/auth', authRoutes.default);
    console.log('✅ ROUTE TEST: Auth routes loaded');

    console.log('🔍 ROUTE TEST: Step 2 - Market routes...');
    const marketRoutes = await import('./src/routes/market.js');
    app.use('/api/market', marketRoutes.default);
    console.log('✅ ROUTE TEST: Market routes loaded');

    console.log('🔍 ROUTE TEST: Step 3 - Portfolio routes...');
    const portfolioRoutes = await import('./src/routes/portfolio.js');
    app.use('/api/portfolio', portfolioRoutes.default);
    console.log('✅ ROUTE TEST: Portfolio routes loaded');

    console.log('🔍 ROUTE TEST: Step 4 - Batch routes...');
    const batchRoutes = await import('./src/routes/batch.js');
    app.use('/api/batch', batchRoutes.default);
    console.log('✅ ROUTE TEST: Batch routes loaded');

    console.log('🔍 ROUTE TEST: Step 5 - Macroeconomic routes...');
    const macroRoutes = await import('./src/routes/macroeconomic.js');
    app.use('/api/macroeconomic', macroRoutes.default);
    console.log('✅ ROUTE TEST: Macroeconomic routes loaded');

    console.log('🔍 ROUTE TEST: Step 6 - Insight routes...');
    const insightRoutes = await import('./src/routes/insightRoutes.js');
    app.use('/api/insights', insightRoutes.default);
    console.log('✅ ROUTE TEST: Insight routes loaded');

    console.log('🔍 ROUTE TEST: All critical routes loaded successfully!');
    return true;
  } catch (error) {
    console.log('💥 ROUTE TEST: Failed at route import:', error.message);
    console.log('🎯 This route import is causing the hang!');
    return false;
  }
}

// Test routes then start server
testRouteImports().then((success) => {
  if (success) {
    console.log('🔍 ROUTE TEST: Starting server with all routes...');
    
    app.listen(5000, () => {
      console.log('🎉 ROUTE TEST: Server started successfully!');
      console.log('🔗 Test endpoints:');
      console.log('   Health: http://localhost:5000/health');
      console.log('   Market: http://localhost:5000/api/market/data');
      console.log('   Portfolio: http://localhost:5000/api/portfolio/portfolio_1');
      console.log('   Macro: http://localhost:5000/api/macroeconomic/all');
    });
  } else {
    console.log('❌ ROUTE TEST: Cannot start server due to route import failure');
  }
});
