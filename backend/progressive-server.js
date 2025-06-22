/**
 * STEP-BY-STEP SERVER - Add complexity gradually to find the hang
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

console.log('🔍 STEP-BY-STEP: Starting progressive server build...');

class ProgressiveServer {
  constructor() {
    this.app = express();
    this.server = null;
    console.log('✅ STEP 1: Express app created');
  }

  async step2_BasicMiddleware() {
    console.log('🔍 STEP 2: Adding basic middleware...');
    
    this.app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true
    }));
    this.app.use(express.json());
    
    console.log('✅ STEP 2: Basic middleware completed');
  }

  async step3_SecurityMiddleware() {
    console.log('🔍 STEP 3: Adding security middleware...');
    
    try {
      // These might be causing the hang
      const compression = (await import('compression')).default;
      console.log('✅ STEP 3a: Compression imported');
      
      const helmet = (await import('helmet')).default;
      console.log('✅ STEP 3b: Helmet imported');
      
      const morgan = (await import('morgan')).default;
      console.log('✅ STEP 3c: Morgan imported');
      
      // Apply them
      this.app.use(compression());
      console.log('✅ STEP 3d: Compression applied');
      
      this.app.use(helmet());
      console.log('✅ STEP 3e: Helmet applied');
      
      this.app.use(morgan('combined'));
      console.log('✅ STEP 3f: Morgan applied');
      
      console.log('✅ STEP 3: Security middleware completed');
    } catch (error) {
      console.log('❌ STEP 3: Security middleware failed:', error.message);
      throw error;
    }
  }

  async step4_RateLimiting() {
    console.log('🔍 STEP 4: Adding rate limiting...');
    
    try {
      const { generalRateLimit } = await import('./src/middleware/security.js');
      console.log('✅ STEP 4a: Rate limiting imported');
      
      this.app.use('/api/', generalRateLimit);
      console.log('✅ STEP 4b: Rate limiting applied');
      
      console.log('✅ STEP 4: Rate limiting completed');
    } catch (error) {
      console.log('❌ STEP 4: Rate limiting failed:', error.message);
      throw error;
    }
  }

  async step5_BasicRoutes() {
    console.log('🔍 STEP 5: Adding basic routes...');
    
    this.app.get('/health', (req, res) => {
      res.json({ status: 'progressive_ok', step: 5 });
    });
    
    this.app.get('/api/market/data', (req, res) => {
      res.json({ message: 'Progressive server step 5' });
    });
    
    console.log('✅ STEP 5: Basic routes completed');
  }

  async step6_AllRoutes() {
    console.log('🔍 STEP 6: Adding ALL routes...');
    
    try {
      // Import all routes one by one to find the problematic one
      console.log('🔍 STEP 6a: Auth routes...');
      const authRoutes = await import('./src/routes/auth.js');
      this.app.use('/api/auth', authRoutes.default);
      
      console.log('🔍 STEP 6b: Market routes...');
      const marketRoutes = await import('./src/routes/market.js');
      this.app.use('/api/market', marketRoutes.default);
      
      console.log('🔍 STEP 6c: Portfolio routes...');
      const portfolioRoutes = await import('./src/routes/portfolio.js');
      this.app.use('/api/portfolio', portfolioRoutes.default);
      
      console.log('🔍 STEP 6d: Risk positioning routes...');
      const riskRoutes = await import('./src/routes/riskPositioning.js');
      this.app.use('/api/risk-positioning', riskRoutes.default);
      
      console.log('🔍 STEP 6e: Benchmark routes...');
      const benchmarkRoutes = await import('./src/routes/benchmarkRoutes.js');
      this.app.use('/api/benchmark', benchmarkRoutes.default);
      
      console.log('🔍 STEP 6f: Edgar routes...');
      const edgarRoutes = await import('./src/routes/edgarRoutes.js');
      this.app.use('/api/edgar', edgarRoutes.default);
      
      console.log('🔍 STEP 6g: Market environment routes...');
      const marketEnvRoutes = await import('./src/routes/marketEnvironmentRoutes.js');
      this.app.use('/api/market-environment', marketEnvRoutes.default);
      
      console.log('🔍 STEP 6h: Industry analysis routes...');
      const industryRoutes = await import('./src/routes/industryAnalysis.js');
      this.app.use('/api/industry-analysis', industryRoutes.default);
      
      console.log('🔍 STEP 6i: Macro analysis routes...');
      const macroAnalysisRoutes = await import('./src/routes/macroAnalysisRoutes.js');
      this.app.use('/api/macro-analysis', macroAnalysisRoutes.default);
      
      console.log('🔍 STEP 6j: Macroeconomic routes...');
      const macroeconomicRoutes = await import('./src/routes/macroeconomic.js');
      this.app.use('/api/macroeconomic', macroeconomicRoutes.default);
      
      console.log('✅ STEP 6: All routes completed');
    } catch (error) {
      console.log('❌ STEP 6: Route import failed:', error.message);
      throw error;
    }
  }

  async step7_WebSockets() {
    console.log('🔍 STEP 7: Adding WebSocket service...');
    
    try {
      const websocketService = await import('./src/services/websocketService.js');
      console.log('✅ STEP 7a: WebSocket service imported');
      
      // Don't initialize yet, just import
      console.log('✅ STEP 7: WebSocket service ready (not initialized)');
    } catch (error) {
      console.log('❌ STEP 7: WebSocket service failed:', error.message);
      throw error;
    }
  }

  async step8_StartServer() {
    console.log('🔍 STEP 8: Starting server...');
    
    this.server = this.app.listen(5000, () => {
      console.log('🎉 PROGRESSIVE SERVER: All steps completed!');
      console.log('🚀 Server running on port 5000');
      console.log('🔍 If this works, the issue is in a specific part we skipped');
    });
  }

  async start() {
    try {
      await this.step2_BasicMiddleware();
      await this.step3_SecurityMiddleware();
      await this.step4_RateLimiting();
      await this.step5_BasicRoutes();
      await this.step6_AllRoutes();
      await this.step7_WebSockets();
      await this.step8_StartServer();
    } catch (error) {
      console.log('💥 PROGRESSIVE SERVER: Failed at step:', error.message);
      console.log('🎯 This is where the main server hangs!');
    }
  }
}

const progressiveServer = new ProgressiveServer();
progressiveServer.start();
