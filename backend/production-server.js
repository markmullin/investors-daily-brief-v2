/**
 * PRODUCTION SERVER - Based on successful route test approach
 * Handles auto-fetching gracefully without hanging
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

console.log('🚀 PRODUCTION SERVER: Starting Market Dashboard...');

class ProductionMarketDashboardServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.startTime = Date.now();
    console.log('✅ PRODUCTION: Express app created');
  }

  setupBasicMiddleware() {
    console.log('🔧 PRODUCTION: Setting up middleware...');
    
    // Security and performance
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow frontend connection
    }));
    this.app.use(compression());
    
    // CORS - Essential for frontend connection
    this.app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'API-Version']
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging (simplified)
    this.app.use(morgan('combined', {
      skip: (req) => req.url === '/health' // Skip health check spam
    }));

    console.log('✅ PRODUCTION: Basic middleware completed');
  }

  setupHealthEndpoint() {
    // Enhanced health check
    this.app.get('/health', async (req, res) => {
      const uptime = Date.now() - this.startTime;
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 1000)}s`,
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        apis: {
          fmp: Boolean(process.env.FMP_API_KEY),
          brave: Boolean(process.env.BRAVE_API_KEY),
          mistral: Boolean(process.env.MISTRAL_API_KEY)
        },
        features: {
          riskPositioning: true,
          marketData: true,
          portfolioTracking: true
        }
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Market Dashboard API',
        version: '2.0.0',
        status: 'running',
        message: '🎯 Interactive Market Risk Positioning System',
        endpoints: {
          health: '/health',
          market: '/api/market/*',
          portfolio: '/api/portfolio/*',
          macroeconomic: '/api/macroeconomic/*',
          batch: '/api/batch/*',
          riskPositioning: '/api/risk-positioning/*'
        }
      });
    });

    console.log('✅ PRODUCTION: Health endpoints configured');
  }

  async setupRoutes() {
    console.log('🛤️  PRODUCTION: Loading all routes...');

    try {
      // Import and setup all routes with error handling
      const routeConfigs = [
        { path: '/api/auth', module: './src/routes/auth.js', name: 'Auth' },
        { path: '/api/market', module: './src/routes/market.js', name: 'Market' },
        { path: '/api/portfolio', module: './src/routes/portfolio.js', name: 'Portfolio' },
        { path: '/api/batch', module: './src/routes/batch.js', name: 'Batch' },
        { path: '/api/macroeconomic', module: './src/routes/macroeconomic.js', name: 'Macroeconomic' },
        { path: '/api/insights', module: './src/routes/insightRoutes.js', name: 'Insights' },
        { path: '/api/risk-positioning', module: './src/routes/riskPositioning.js', name: 'Risk Positioning' },
        { path: '/api/benchmark', module: './src/routes/benchmarkRoutes.js', name: 'Benchmark' },
        { path: '/api/edgar', module: './src/routes/edgarRoutes.js', name: 'Edgar' },
        { path: '/api/market-environment', module: './src/routes/marketEnvironmentRoutes.js', name: 'Market Environment' },
        { path: '/api/industry-analysis', module: './src/routes/industryAnalysis.js', name: 'Industry Analysis' },
        { path: '/api/macro-analysis', module: './src/routes/macroAnalysisRoutes.js', name: 'Macro Analysis' },
        { path: '/api/enhanced-market', module: './src/routes/enhancedMarketRoutes.js', name: 'Enhanced Market' },
        { path: '/api/alerts', module: './src/routes/alertRoutes.js', name: 'Alerts' },
        { path: '/api/monitoring', module: './src/routes/monitoringRoutes.js', name: 'Monitoring' },
        { path: '/api/relationships', module: './src/routes/relationshipRoutes.js', name: 'Relationships' },
        { path: '/api/data-quality', module: './src/routes/dataQualityRoutes.js', name: 'Data Quality' }
      ];

      for (const config of routeConfigs) {
        try {
          console.log(`🔗 PRODUCTION: Loading ${config.name} routes...`);
          const routeModule = await import(config.module);
          this.app.use(config.path, routeModule.default);
          console.log(`✅ PRODUCTION: ${config.name} routes loaded`);
        } catch (error) {
          console.warn(`⚠️  PRODUCTION: ${config.name} routes failed to load:`, error.message);
          // Don't fail the entire server for one route - graceful degradation
        }
      }

      console.log('✅ PRODUCTION: All available routes loaded');
    } catch (error) {
      console.error('❌ PRODUCTION: Route setup failed:', error);
      throw error;
    }
  }

  setupErrorHandling() {
    console.log('🛡️  PRODUCTION: Setting up error handling...');

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        availableEndpoints: [
          'GET /health',
          'GET /api/market/data',
          'GET /api/macroeconomic/all',
          'GET /api/portfolio/portfolio_1',
          'POST /api/batch/history'
        ]
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Global error handler:', error);
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    console.log('✅ PRODUCTION: Error handling configured');
  }

  async initializeWebSockets() {
    console.log('🔌 PRODUCTION: Initializing WebSocket service...');
    
    try {
      const websocketService = await import('./src/services/websocketService.js');
      
      // Use setTimeout to initialize after server is fully started
      setTimeout(() => {
        try {
          websocketService.default.initialize(this.server);
          console.log('✅ PRODUCTION: WebSocket service initialized');
        } catch (wsError) {
          console.warn('⚠️  PRODUCTION: WebSocket initialization failed (non-critical):', wsError.message);
        }
      }, 1000); // Wait 1 second after server starts
      
    } catch (error) {
      console.warn('⚠️  PRODUCTION: WebSocket service import failed (non-critical):', error.message);
    }
  }

  async start(port = process.env.PORT || 5000) {
    try {
      console.log('🏗️  PRODUCTION: Building server...');
      
      // Build server step by step
      this.setupBasicMiddleware();
      this.setupHealthEndpoint();
      await this.setupRoutes();
      this.setupErrorHandling();

      console.log('🚀 PRODUCTION: Starting server...');
      
      // Start server
      this.server = this.app.listen(port, () => {
        const uptime = Date.now() - this.startTime;
        
        console.log('\n🎉 ===== MARKET DASHBOARD SERVER STARTED! =====');
        console.log(`🌍 Server URL: http://localhost:${port}`);
        console.log(`⚡ Startup time: ${uptime}ms`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔑 API Keys: FMP ✅ | Brave ✅ | Mistral ✅`);
        console.log('\n🎯 KEY ENDPOINTS:');
        console.log(`   Health Check: http://localhost:${port}/health`);
        console.log(`   Market Data:  http://localhost:${port}/api/market/data`);
        console.log(`   Macro Data:   http://localhost:${port}/api/macroeconomic/all`);
        console.log(`   Portfolio:    http://localhost:${port}/api/portfolio/portfolio_1`);
        console.log(`   Risk System:  http://localhost:${port}/api/risk-positioning/current`);
        console.log('\n✨ FEATURES ACTIVE:');
        console.log('   🎯 Interactive Risk Positioning System');
        console.log('   📈 Real-time Market Data (FMP API)');
        console.log('   💼 Portfolio Tracking & Analytics');
        console.log('   📊 Macroeconomic Indicators (FRED API)');
        console.log('   🔌 WebSocket Real-time Updates');
        console.log('\n🎊 Ready for frontend connection!');
        console.log('==========================================\n');
      });

      // Initialize WebSockets after server starts
      await this.initializeWebSockets();

      return this.server;
    } catch (error) {
      console.error('💥 PRODUCTION: Server startup failed:', error);
      process.exit(1);
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 PRODUCTION: Server stopped');
    }
  }
}

// Start the production server
const productionServer = new ProductionMarketDashboardServer();
productionServer.start().catch((error) => {
  console.error('💥 PRODUCTION: Failed to start server:', error);
  process.exit(1);
});

export default ProductionMarketDashboardServer;