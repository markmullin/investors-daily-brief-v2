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
import marketEnvironmentScheduler from './src/schedulers/marketEnvironmentScheduler.js';


class FixedMarketDashboardServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.startTime = Date.now();
  }

  setupMiddleware() {
    
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    this.app.use(compression());
    
    // CORS - Essential for frontend
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://www.investorsdailybrief.com', 'https://investorsdailybrief.com'],
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

  }

  setupHealthAndInfo() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: '3.2.0'
      });
    });

    // API info endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Market Dashboard API',
        version: '3.2.0',
        status: 'running'
      });
    });

  }

  async setupAllRoutes() {

    // Disable rate limiting for GPT-OSS endpoints (they take 30-50 seconds)
    this.app.use('/api/gpt-oss', (req, res, next) => {
      req.skipRateLimit = true;
      next();
    });

    const routes = [
      // CORE AI ROUTES (FIXED)
      { path: '/api/ai-analysis', module: './src/routes/streamlinedAiRoutes.js', name: 'Enhanced AI Analysis' },
      { path: '/api/ai', module: './src/routes/aiRoutes.js', name: 'AI Services' },
      
      // CORE MARKET ROUTES (ESSENTIAL)
      { path: '/api/market', module: './src/routes/market.js', name: 'Market Data' },
      { path: '/api/macroeconomic', module: './src/routes/macroeconomic.js', name: 'Macroeconomic' },
      { path: '/api/batch', module: './src/routes/batch.js', name: 'Batch Operations' },
      
      // RESEARCH & ANALYSIS FEATURES
      { path: '/api/research', module: './src/routes/research.js', name: 'Research Hub' },
      { path: '/api/research/earnings', module: './src/routes/earningsRoutes.js', name: 'Earnings Analysis' },
      { path: '/api/themes', module: './src/routes/themeRoutes.js', name: 'Theme Discovery' },
      
      // ENHANCED RESEARCH HUB FEATURES
      { path: '/api/discovery', module: './src/routes/discovery.js', name: 'Discovery API' },
      { path: '/api/watchlist', module: './src/routes/enhanced/watchlistRoutes.js', name: 'Professional Watchlist' },
      { path: '/api/enhanced-discovery', module: './src/routes/enhanced/enhancedDiscoveryRoutes.js', name: 'Enhanced Discovery' },
      
      // ADDITIONAL FEATURES
      { path: '/api/portfolio', module: './src/routes/portfolio.js', name: 'Portfolio Tracking' },
      { path: '/api/market-environment', module: './src/routes/marketEnvironmentRoutes.js', name: 'Market Environment' },
      { path: '/api/market-env', module: './src/routes/marketEnvironmentV2-simple.js', name: 'Market Environment V2' },
      
      // GPT-OSS LOCAL AI MODEL
      { path: '/api/gpt-oss', module: './src/routes/gptOSSRoutes.js', name: 'GPT-OSS Local AI' },
      
      // INTELLIGENT ANALYSIS (Python → GPT-OSS Pipeline)
      
      // QWEN 3 8B ANALYSIS
      { path: '/api/qwen-analysis', module: './src/routes/qwen-analysis.js', name: 'Qwen 3 8B Analysis' },
      { path: '/api/intelligent-analysis', module: './src/routes/intelligentAnalysisRoutes.js', name: 'Intelligent Analysis' }
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const route of routes) {
      try {
        const routeModule = await import(route.module);
        this.app.use(route.path, routeModule.default);
        loadedCount++;
        console.log(`✅ ${route.name} loaded at ${route.path}`);
      } catch (error) {
        console.error(`❌ ${route.name} routes failed:`, error.message);
        failedCount++;
      }
    }

    console.log(`\n📊 Route Loading Summary:`);
    console.log(`   ✅ Loaded: ${loadedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📋 Total: ${routes.length}\n`);

  }

  setupErrorHandling() {

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

  }

  async start(port = process.env.PORT || 5000) {
    // Initialize Market Environment V2 scheduler
    try {
      marketEnvironmentScheduler.init();
      // Check if initial aggregation is needed
      await marketEnvironmentScheduler.scheduleInitialAggregation();
      console.log('✅ Market Environment V2 scheduler started');
    } catch (error) {
      console.error('⚠️ Scheduler initialization failed:', error);
      // Continue anyway - scheduler is not critical for server operation
    }

    try {
      
      // Setup all components
      this.setupMiddleware();
      this.setupHealthAndInfo(); 
      await this.setupAllRoutes();
      this.setupErrorHandling();

      // Start the server
      this.server = this.app.listen(port, () => {
        const uptime = Date.now() - this.startTime;
        
        console.log(`🚀 Market Dashboard Server running on http://localhost:${port}`);
        console.log(`📊 Dashboard: http://localhost:5173`);
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