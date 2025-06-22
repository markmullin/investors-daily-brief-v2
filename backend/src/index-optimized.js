import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import http from 'http';
import marketRoutes from './routes/market.js';
import errorTracker from './utils/errorTracker.js';
import marketEnvironmentRoutes from './routes/marketEnvironmentRoutes.js';
import industryAnalysisRoutes from './routes/industryAnalysis.js';
import macroAnalysisRoutes from './routes/macroAnalysisRoutes.js';
import macroeconomicRoutes from './routes/macroeconomic.js';
import insightRoutes from './routes/insightRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import enhancedMarketRoutes from './routes/enhancedMarketRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import relationshipRoutes from './routes/relationshipRoutes.js';
import websocketService from './services/websocketService.js';
import batchRoutes from './routes/batch.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Performance optimization: Compression middleware (MUST be first)
app.use(compression({
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Compress everything except server-sent events
    if (res.getHeader('Content-Type') === 'text/event-stream') {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Enhanced CORS middleware with credentials support
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins in production, all in development
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [
      'https://market-dashboard.onrender.com',
      'https://investors-daily-brief.com'
    ];
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced cache control middleware with ETag support
app.use((req, res, next) => {
  // Enable keep-alive
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5');
  
  // Set cache headers for API responses
  if (req.path.startsWith('/api/')) {
    // Market data should have short cache
    if (req.path.includes('/market/data') || req.path.includes('/quote/')) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    }
    // Historical data can have longer cache
    else if (req.path.includes('/history/')) {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }
    // Batch endpoints
    else if (req.path.includes('/batch/')) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
    // Macro and sector data can have medium cache
    else if (req.path.includes('/macro') || req.path.includes('/sector')) {
      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
    }
    // Default cache for other API endpoints
    else {
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');
    }
    
    // Add performance hints
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
  
  // Add timing header
  res.setHeader('X-Response-Time', Date.now());
  
  // Calculate response time on finish
  res.on('finish', () => {
    const responseTime = Date.now() - parseInt(res.getHeader('X-Response-Time'));
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }
  });
  
  next();
});

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Routes with error handling
app.use('/api/batch', batchRoutes); // Batch endpoints for performance
app.use('/api/market', marketRoutes);
app.use('/api/market-environment', marketEnvironmentRoutes);
app.use('/api/industry-analysis', industryAnalysisRoutes);
app.use('/api/macro-analysis', macroAnalysisRoutes);
app.use('/api/macroeconomic', macroeconomicRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/enhanced-market', enhancedMarketRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/relationships', relationshipRoutes);

// Health check with performance metrics
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    apis: {
      eod: Boolean(process.env.EOD_API_KEY),
      brave: Boolean(process.env.BRAVE_API_KEY),
      fred: Boolean(process.env.FRED_API_KEY || 'dca5bb7524d0b194a9963b449e69c655')
    },
    version: '3.1.0',
    timestamp: Date.now(),
    performance: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      responseTime: Date.now() - req.startTime + 'ms'
    },
    cache: {
      nodeCache: 'active',
      httpCache: 'active',
      compressionLevel: 6
    }
  };
  
  res.header('Access-Control-Allow-Origin', '*');
  res.json(healthData);
});

// Root endpoint for basic API info
app.get('/', (req, res) => {
  res.json({
    name: 'Market Dashboard API',
    version: '3.1.0',
    status: 'running',
    performance: 'optimized',
    endpoints: [
      '/api/batch',
      '/api/market',
      '/api/market-environment',
      '/api/industry-analysis',
      '/api/macro-analysis',
      '/api/macroeconomic',
      '/api/insights',
      '/health'
    ],
    optimizations: [
      'HTTP Keep-Alive enabled',
      'Compression active',
      'Batch endpoints available',
      'Cache headers configured',
      'Response time tracking'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    timestamp: Date.now()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const responseTime = Date.now() - req.startTime;
  
  console.error('Error:', err.message);
  console.error('Request:', `${req.method} ${req.path}`);
  console.error('Response time:', responseTime + 'ms');
  
  errorTracker.track(err, `${req.method} ${req.path}`);
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    timestamp: Date.now(),
    responseTime: responseTime + 'ms'
  });
});

// Create HTTP server with keep-alive
const server = http.createServer(app);

// Configure server timeouts
server.keepAliveTimeout = 30000; // 30 seconds
server.headersTimeout = 31000; // Slightly higher than keepAliveTimeout

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     Market Dashboard API - Optimized       ║
╠════════════════════════════════════════════╣
║ Port: ${PORT}                              ║
║ Environment: ${process.env.NODE_ENV || 'development'}              ║
║ Compression: Enabled (Level 6)             ║
║ Keep-Alive: 30s                            ║
║ Cache: Stale-While-Revalidate             ║
║ Batch Endpoints: Active                    ║
╚════════════════════════════════════════════╝
  `);
  
  console.log(`API available at: http://localhost:${PORT}`);
  console.log('Performance optimizations active ✓');
});

// Initialize WebSocket
websocketService.initialize(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
