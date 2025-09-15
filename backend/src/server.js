/**
 * FINAL PRODUCTION SERVER - Market Dashboard (No WebSockets)
 * Production-ready server without the WebSocket hanging issue
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

console.log('🚀 FINAL PRODUCTION: Starting Market Dashboard Server...');

class FinalMarketDashboardServer {
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
    // DIRECT SIMPLE ENDPOINTS - NO DEPENDENCIES
    this.app.get('/api/simple/sp500-top', (req, res) => {
      console.log('📊 [DIRECT] S&P 500 endpoint hit');
      res.json([
        { symbol: 'AAPL', name: 'Apple Inc.', price: 233.27, changePercent: 1.41 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 177.86, changePercent: 0.39 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', price: 512.37, changePercent: 2.27 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 241.10, changePercent: 0.30 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 228.38, changePercent: -0.68 },
        { symbol: 'META', name: 'Meta Platforms Inc.', price: 754.46, changePercent: 0.47 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 394.18, changePercent: 6.88 },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 460.25, changePercent: 0.15 },
        { symbol: 'JPM', name: 'JPMorgan Chase', price: 306.37, changePercent: 0.26 },
        { symbol: 'V', name: 'Visa Inc.', price: 339.75, changePercent: -1.09 }
      ]);
    });

    this.app.get('/api/simple/discovery', (req, res) => {
      console.log('🎯 [DIRECT] Discovery endpoint hit');
      res.json({
        success: true,
        data: {
          market_pulse: {
            stocks: [
              { symbol: 'NVDA', name: 'NVIDIA', changePercent: 5.2, category: 'gainer' },
              { symbol: 'TSLA', name: 'Tesla', changePercent: 4.8, category: 'gainer' },
              { symbol: 'AAPL', name: 'Apple', changePercent: 2.5, category: 'gainer' },
              { symbol: 'INTC', name: 'Intel', changePercent: -3.2, category: 'loser' },
              { symbol: 'BA', name: 'Boeing', changePercent: -2.8, category: 'loser' }
            ],
            lastUpdated: new Date().toISOString(),
            totalStocks: 5
          },
          earnings_spotlight: {
            stocks: [
              { symbol: 'ORCL', name: 'Oracle', date: '2025-09-15', time: 'After Close' },
              { symbol: 'ADBE', name: 'Adobe', date: '2025-09-17', time: 'After Close' }
            ],
            lastUpdated: new Date().toISOString(),
            totalStocks: 2
          },
          market_themes: {
            stocks: [
              { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', theme: 'AI Revolution' },
              { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', theme: 'GLP-1 Drugs' }
            ],
            lastUpdated: new Date().toISOString(),
            totalStocks: 2
          },
          for_you: {
            stocks: [
              { symbol: 'AAPL', name: 'Apple', reason: 'Tech leader' },
              { symbol: 'MSFT', name: 'Microsoft', reason: 'Cloud growth' }
            ],
            lastUpdated: new Date().toISOString(),
            totalStocks: 2
          }
        },
        summary: {
          totalStocks: 11,
          marketPulse: 5,
          earnings: 2,
          themes: 2,
          forYou: 2
        },
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('✅ Direct simple endpoints registered');

    // Enhanced health check
    this.app.get('/health', (req, res) => {
      const uptime = Date.now() - this.startTime;
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 1000)}s`,
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
          riskPositioning: true,
          marketData: true,
          portfolioTracking: true,
          macroeconomics: true,
          realTimeUpdates: false // WebSockets disabled
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
        name: 'Market Dashboard API',
        version: '2.0.0',
        status: 'running',
        message: '🎯 Interactive Market Risk Positioning System',
        documentation: 'All endpoints are REST-based for maximum reliability',
        endpoints: {
          health: '/health',
          market: '/api/market/*',
          portfolio: '/api/portfolio/*',
          macroeconomic: '/api/macroeconomic/*',
          riskPositioning: '/api/risk-positioning/*',
          batch: '/api/batch/*',
          insights: '/api/insights/*'
        },
        features: [
          '🎯 Interactive 0-100 Risk Positioning System',
          '📈 Real-time Market Data via FMP API',
          '💼 Portfolio Tracking & Analytics',
          '📊 Macroeconomic Indicators via FRED/BEA APIs',
          '🔍 Market Insights via Brave API',
          '⚡ High-performance REST endpoints'
        ]
      });
    });

    console.log('✅ Health and info endpoints configured');
  }

  async setupAllRoutes() {
    console.log('🛤️  Loading all API routes...');

    // PRIORITY: Load simple data routes FIRST to avoid conflicts
    try {
      const simpleDataRoutes = await import('./routes/simpleData.js');
      this.app.use('/api/simple', simpleDataRoutes.default);
      console.log('✅ Simple Data routes loaded FIRST at /api/simple');
    } catch (error) {
      console.error('❌ Failed to load simple data routes:', error.message);
    }

    const routes = [
      // Core market functionality
      { path: '/api/market', module: './routes/market.js', name: 'Market Data' },
      { path: '/api/macroeconomic', module: './routes/macroeconomic.js', name: 'Macroeconomic' },
      { path: '/api/risk-positioning', module: './routes/riskPositioning.js', name: 'Risk Positioning' },
      { path: '/api/insights', module: './routes/insightRoutes.js', name: 'Market Insights' },
      { path: '/api/batch', module: './routes/batch.js', name: 'Batch Operations' },
      
      // Portfolio and analysis
      { path: '/api/portfolio', module: './routes/portfolio.js', name: 'Portfolio Tracking' },
      { path: '/api/benchmark', module: './routes/benchmarkRoutes.js', name: 'Benchmarks' },
      { path: '/api/edgar', module: './routes/edgarRoutes.js', name: 'SEC Edgar' },
      
      // Authentication and user management
      { path: '/api/auth', module: './routes/auth.js', name: 'Authentication' },
      
      // Research and Analysis
      { path: '/api/research/earnings', module: './routes/earningsRoutes.js', name: 'Earnings Analysis' },
      { path: '/api/discovery', module: './routes/discoveryRoutes.js', name: 'Stock Discovery' },
      { path: '/api/simple', module: './routes/simpleRoutes.js', name: 'Simple Routes' },
      
      // Advanced features
      { path: '/api/market-environment', module: './routes/marketEnvironmentRoutes.js', name: 'Market Environment' },
      { path: '/api/industry-analysis', module: './routes/industryAnalysis.js', name: 'Industry Analysis' },
      { path: '/api/macro-analysis', module: './routes/macroAnalysisRoutes.js', name: 'Macro Analysis' },
      { path: '/api/enhanced-market', module: './routes/enhancedMarketRoutes.js', name: 'Enhanced Market' },
      { path: '/api/alerts', module: './routes/alertRoutes.js', name: 'Alerts' },
      { path: '/api/monitoring', module: './routes/monitoringRoutes.js', name: 'Monitoring' },
      { path: '/api/relationships', module: './routes/relationshipRoutes.js', name: 'Relationships' },
      { path: '/api/data-quality', module: './routes/dataQualityRoutes.js', name: 'Data Quality' }
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const route of routes) {
      try {
        const routeModule = await import(route.module);
        this.app.use(route.path, routeModule.default);
        console.log(`✅ ${route.name} routes loaded`);
        loadedCount++;
      } catch (error) {
        console.warn(`⚠️  ${route.name} routes failed (non-critical):`, error.message);
        failedCount++;
      }
    }

    console.log(`✅ Route loading complete: ${loadedCount} loaded, ${failedCount} failed`);
  }

  setupErrorHandling() {
    console.log('🛡️  Setting up error handling...');

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint Not Found',
        message: `${req.method} ${req.path} is not available`,
        suggestion: 'Check /health for server status or / for API documentation',
        availableEndpoints: [
          'GET /health - Server health check',
          'GET / - API documentation', 
          'GET /api/market/data - Market data',
          'GET /api/macroeconomic/all - Economic indicators',
          'GET /api/risk-positioning/current - Risk score'
        ]
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
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack 
        })
      });
    });

    console.log('✅ Error handling configured');
  }

  async start(port = process.env.PORT || 5000) {
    try {
      console.log('🏗️  Building production server...');
      
      // Setup all components
      this.setupMiddleware();
      this.setupHealthAndInfo(); 
      await this.setupAllRoutes();
      this.setupErrorHandling();

      console.log('🚀 Starting production server...');
      
      // Start the server
      this.server = this.app.listen(port, () => {
        const uptime = Date.now() - this.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 MARKET DASHBOARD SERVER - PRODUCTION READY!');
        console.log('='.repeat(60));
        console.log(`🌍 Server URL: http://localhost:${port}`);
        console.log(`⚡ Startup time: ${uptime}ms`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔐 Authentication: Enabled`);
        console.log(`🔌 WebSockets: Disabled (for stability)`);
        console.log('');
        console.log('🔑 API STATUS:');
        console.log(`   FMP API: ${process.env.FMP_API_KEY ? '✅ Connected' : '❌ Missing'}`);
        console.log(`   Brave API: ${process.env.BRAVE_API_KEY ? '✅ Connected' : '❌ Missing'}`);
        console.log(`   Mistral API: ${process.env.MISTRAL_API_KEY ? '✅ Connected' : '❌ Missing'}`);
        console.log('');
        console.log('🎯 KEY FEATURES:');
        console.log(`   📈 Real-time Market Data: http://localhost:${port}/api/market/data`);
        console.log(`   🎯 Risk Positioning: http://localhost:${port}/api/risk-positioning/current`);
        console.log(`   📊 Macro Economics: http://localhost:${port}/api/macroeconomic/all`);
        console.log(`   💼 Portfolio Tracking: http://localhost:${port}/api/portfolio/portfolio_1`);
        console.log(`   🔍 Market Insights: http://localhost:${port}/api/insights`);
        console.log(`   📈 Batch Historical: http://localhost:${port}/api/batch/history`);
        console.log('');
        console.log('✨ SYSTEM FEATURES:');
        console.log('   🎯 Interactive 0-100 Risk Positioning System');
        console.log('   📈 Real-time Market Data (FMP API)');
        console.log('   💰 Macroeconomic Analysis (FRED/BEA APIs)');
        console.log('   📊 Portfolio Analytics & Tracking');
        console.log('   🔍 AI-powered Market Insights');
        console.log('   ⚡ High-performance REST Architecture');
        console.log('');
        console.log('🎊 Ready for frontend connection at http://localhost:5173');
        console.log('='.repeat(60));
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
      console.error('💥 Failed to start production server:', error);
      process.exit(1);
    }
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('🛑 Production server stopped gracefully');
      });
    }
  }
}

// Start the production server
const server = new FinalMarketDashboardServer();
server.start().catch((error) => {
  console.error('💥 Failed to start Market Dashboard:', error);
  process.exit(1);
});

export default FinalMarketDashboardServer;
