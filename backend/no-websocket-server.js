/**
 * NO-WEBSOCKET PRODUCTION SERVER - Isolate the hanging issue
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

console.log('🚀 NO-WS SERVER: Starting Market Dashboard WITHOUT WebSockets...');

class NoWebSocketServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.startTime = Date.now();
    console.log('✅ NO-WS: Express app created');
  }

  setupMiddleware() {
    console.log('🔧 NO-WS: Setting up middleware...');
    
    this.app.use(helmet({ contentSecurityPolicy: false }));
    this.app.use(compression());
    this.app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'API-Version']
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(morgan('combined', { skip: (req) => req.url === '/health' }));

    console.log('✅ NO-WS: Middleware completed');
  }

  setupRoutes() {
    console.log('🛤️  NO-WS: Setting up routes...');

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy_no_ws',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor((Date.now() - this.startTime) / 1000)}s`,
        websockets: 'disabled'
      });
    });

    this.app.get('/', (req, res) => {
      res.json({
        name: 'Market Dashboard API (No WebSockets)',
        status: 'running',
        websockets: 'disabled_for_testing'
      });
    });

    console.log('✅ NO-WS: Basic routes completed');
  }

  async loadAllRoutes() {
    console.log('📋 NO-WS: Loading all API routes...');

    const routes = [
      { path: '/api/auth', module: './src/routes/auth.js' },
      { path: '/api/market', module: './src/routes/market.js' },
      { path: '/api/portfolio', module: './src/routes/portfolio.js' },
      { path: '/api/batch', module: './src/routes/batch.js' },
      { path: '/api/macroeconomic', module: './src/routes/macroeconomic.js' },
      { path: '/api/insights', module: './src/routes/insightRoutes.js' },
      { path: '/api/risk-positioning', module: './src/routes/riskPositioning.js' }
    ];

    for (const route of routes) {
      try {
        const routeModule = await import(route.module);
        this.app.use(route.path, routeModule.default);
        console.log(`✅ NO-WS: ${route.path} loaded`);
      } catch (error) {
        console.warn(`⚠️  NO-WS: ${route.path} failed:`, error.message);
      }
    }

    console.log('✅ NO-WS: All routes loaded');
  }

  setupErrorHandling() {
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not Found', path: req.path });
    });

    this.app.use((error, req, res, next) => {
      console.error('Error:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }

  async start(port = 5000) {
    try {
      console.log('🏗️  NO-WS: Building server...');
      
      this.setupMiddleware();
      this.setupRoutes();
      await this.loadAllRoutes();
      this.setupErrorHandling();

      console.log('🚀 NO-WS: Calling server.listen()...');
      console.log('⏳ NO-WS: Waiting for listen callback...');
      
      this.server = this.app.listen(port, () => {
        const uptime = Date.now() - this.startTime;
        
        console.log('\n🎉 ===== NO-WEBSOCKET SERVER STARTED! =====');
        console.log(`🌍 Server URL: http://localhost:${port}`);
        console.log(`⚡ Startup time: ${uptime}ms`);
        console.log(`🔌 WebSockets: DISABLED (for testing)`);
        console.log('\n🎯 TEST ENDPOINTS:');
        console.log(`   Health: http://localhost:${port}/health`);
        console.log(`   Market: http://localhost:${port}/api/market/data`);
        console.log(`   Macro:  http://localhost:${port}/api/macroeconomic/all`);
        console.log('=========================================\n');
        
        console.log('✨ NO-WS: Server is ready! Frontend should work now.');
      });

      this.server.on('error', (error) => {
        console.error('💥 NO-WS: Server error:', error);
      });

      console.log('📡 NO-WS: server.listen() called, waiting for callback...');

    } catch (error) {
      console.error('💥 NO-WS: Startup failed:', error);
      process.exit(1);
    }
  }
}

const server = new NoWebSocketServer();
server.start();
