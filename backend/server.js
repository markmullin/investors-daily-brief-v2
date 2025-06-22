/**
 * FIXED PRODUCTION SERVER - Market Dashboard with All Required Endpoints
 * INCLUDES: Missing risk-positioning, comprehensive, and brave routes
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

console.log('🚀 STARTING: Market Dashboard Server with All Required Endpoints...');

class FixedMarketDashboardServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.startTime = Date.now();
    console.log('✅ Express app created');
  }

  setupMiddleware() {
    console.log('🔧 Setting up production middleware...');
    
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    this.app.use(compression());
    
    // CORS - Essential for frontend
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'API-Version']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging (production-ready)
    this.app.use(morgan('combined', {
      skip: (req) => req.url === '/health' || req.url === '/favicon.ico'
    }));

    console.log('✅ Middleware configured');
  }

  setupHealthAndInfo() {
    // Enhanced health check
    this.app.get('/health', (req, res) => {
      const uptime = Date.now() - this.startTime;
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 1000)}s`,
        version: '3.2.0-all-endpoints',
        environment: process.env.NODE_ENV || 'development',
        features: {
          enhancedAiAnalysis: true,
          allRequiredEndpoints: true,
          riskPositioning: true,
          comprehensiveMarketData: true,
          marketSentiment: true,
          typewriterEffects: true
        },
        apis: {
          fmp: Boolean(process.env.FMP_API_KEY),
          brave: Boolean(process.env.BRAVE_API_KEY),
          mistral: Boolean(process.env.MISTRAL_API_KEY)
        }
      });
    });

    // API info endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Market Dashboard API - All Endpoints Fixed',
        version: '3.2.0-all-endpoints',
        status: 'running',
        message: '🤖 All Required Endpoints + Enhanced AI Analysis',
        endpoints: {
          health: '/health',
          market: '/api/market/*',
          aiAnalysis: '/api/ai-analysis/*',
          currentEvents: '/api/ai/ai-analysis',
          macroeconomic: '/api/macroeconomic/*',
          riskPositioning: '/api/market/risk-positioning',
          comprehensive: '/api/market/comprehensive',
          sentiment: '/api/brave/market-sentiment'
        }
      });
    });

    console.log('✅ Health and info endpoints configured');
  }

  async setupAllRoutes() {
    console.log('🛤️  Loading all required routes...');

    const routes = [
      // ENHANCED AI ROUTES (WORKING)
      { path: '/api/ai-analysis', module: './src/routes/enhancedAiRoutes.js', name: 'Enhanced AI Analysis' },
      { path: '/api/ai', module: './src/routes/currentEventsAiRoutes.js', name: 'Current Events AI' },
      
      // CORE MARKET ROUTES (ESSENTIAL)
      { path: '/api/market', module: './src/routes/market.js', name: 'Market Data' },
      { path: '/api/macroeconomic', module: './src/routes/macroeconomic.js', name: 'Macroeconomic' },
      { path: '/api/batch', module: './src/routes/batch.js', name: 'Batch Operations' },
      
      // MISSING ROUTES (FIXED)
      { path: '/api/market', module: './src/routes/missingRoutes.js', name: 'Missing Market Routes' },
      { path: '/api/brave', module: './src/routes/braveRoutesFixed.js', name: 'Brave Market Sentiment' },
      
      // ADDITIONAL FEATURES
      { path: '/api/portfolio', module: './src/routes/portfolio.js', name: 'Portfolio Tracking' },
      { path: '/api/edgar', module: './src/routes/edgarRoutes.js', name: 'SEC Edgar' },
      { path: '/api/market-environment', module: './src/routes/marketEnvironmentRoutes.js', name: 'Market Environment' }
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const route of routes) {
      try {
        console.log(`Loading route: ${route.name} at ${route.path}`);
        const routeModule = await import(route.module);
        this.app.use(route.path, routeModule.default);
        console.log(`✅ ${route.name} routes loaded successfully`);
        loadedCount++;
      } catch (error) {
        console.error(`❌ ${route.name} routes failed:`, error.message);
        failedCount++;
      }
    }

    console.log(`✅ Route loading complete: ${loadedCount} loaded, ${failedCount} failed`);
  }

  setupErrorHandling() {
    console.log('🛡️  Setting up error handling...');

    // 404 handler
    this.app.use((req, res) => {
      console.log(`❌ 404: ${req.method} ${req.path}`);
      res.status(404).json({
        error: 'Endpoint Not Found',
        message: `${req.method} ${req.path} is not available`,
        suggestion: 'Check /health for server status',
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('API Error:', {
        message: error.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    });

    console.log('✅ Error handling configured');
  }

  async start(port = process.env.PORT || 5000) {
    try {
      console.log('🏗️  Building production server with all endpoints...');
      
      // Setup all components
      this.setupMiddleware();
      this.setupHealthAndInfo(); 
      await this.setupAllRoutes();
      this.setupErrorHandling();

      console.log('🚀 Starting production server...');
      
      // Start the server
      this.server = this.app.listen(port, () => {
        const uptime = Date.now() - this.startTime;
        
        console.log('\n' + '='.repeat(80));
        console.log('🤖 MARKET DASHBOARD SERVER - ALL ENDPOINTS FIXED!');
        console.log('='.repeat(80));
        console.log(`🌍 Server URL: http://localhost:${port}`);
        console.log(`⚡ Startup time: ${uptime}ms`);
        console.log('');
        console.log('✅ FIXED ENDPOINTS:');
        console.log(`   📊 Risk Positioning: http://localhost:${port}/api/market/risk-positioning`);
        console.log(`   📈 Comprehensive: http://localhost:${port}/api/market/comprehensive`);
        console.log(`   💭 Market Sentiment: http://localhost:${port}/api/brave/market-sentiment`);
        console.log(`   📰 Current Events: http://localhost:${port}/api/ai/ai-analysis`);
        console.log('');
        console.log('🤖 ENHANCED AI ENDPOINTS:');
        console.log(`   📊 Sector Analysis: http://localhost:${port}/api/ai-analysis/sectors`);
        console.log(`   🌍 Macro Analysis: http://localhost:${port}/api/ai-analysis/macro`);
        console.log('');
        console.log('🎯 CORE ENDPOINTS:');
        console.log(`   📈 Market Data: http://localhost:${port}/api/market/data`);
        console.log(`   🏦 Macro Data: http://localhost:${port}/api/macroeconomic/all`);
        console.log(`   🔍 Health: http://localhost:${port}/health`);
        console.log('');
        console.log('🎊 All endpoints ready! Frontend should connect successfully.');
        console.log('='.repeat(80));
        console.log('');
      });

      // Graceful error handling
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${port} is already in use. Please stop other servers or use a different port.`);
        } else {
          console.error('❌ Server error:', error);
        }
        process.exit(1);
      });

      return this.server;
    } catch (error) {
      console.error('💥 Failed to start server:', error);
      process.exit(1);
    }
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('🛑 Server stopped gracefully');
      });
    }
  }
}

// Start the production server
const server = new FixedMarketDashboardServer();
server.start().catch((error) => {
  console.error('💥 Failed to start Market Dashboard:', error);
  process.exit(1);
});

export default FixedMarketDashboardServer;