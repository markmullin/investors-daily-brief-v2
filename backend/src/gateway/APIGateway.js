import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import helmet from 'helmet';

import logger, { apiLogger, logApiRequest } from '../utils/logger.js';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from '../middleware/errorHandler.js';
import { 
  generalRateLimit, 
  authRateLimit, 
  marketDataRateLimit,
  securityMiddleware,
  compressionMiddleware,
  corsOptions,
  apiVersioning
} from '../middleware/security.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

// Import route modules
import authRoutes from '../routes/auth.js';

class APIGateway {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGlobalHandlers();
  }

  setupMiddleware() {
    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(securityMiddleware());
    
    // Compression
    this.app.use(compressionMiddleware());

    // CORS
    this.app.use(cors(corsOptions));

    // API versioning
    this.app.use(apiVersioning);

    // Request logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => {
          apiLogger.info(message.trim());
        }
      }
    }));

    // Request/Response timing
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logApiRequest(req, res, responseTime);
      });
      
      next();
    });

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // General rate limiting
    this.app.use(generalRateLimit);

    logger.info('✅ Middleware setup completed');
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Market Dashboard API Gateway is healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'Market Dashboard API Gateway',
        version: req.apiVersion,
        endpoints: {
          authentication: '/api/auth/*',
          marketData: '/api/market/*',
          portfolio: '/api/portfolio/*',
          calculations: '/api/calc/*',
          python: '/api/python/*'
        },
        documentation: '/api/docs',
        health: '/health'
      });
    });

    // Authentication routes
    this.app.use('/api/auth', authRateLimit, authRoutes);

    // Market data routes (require authentication for most endpoints)
    this.app.use('/api/market', marketDataRateLimit, optionalAuth, this.marketDataRoutes());

    // Portfolio routes (require authentication)
    this.app.use('/api/portfolio', authenticateToken, this.portfolioRoutes());

    // Financial calculations routes (require authentication)
    this.app.use('/api/calc', authenticateToken, this.calculationsRoutes());

    // Python microservice proxy
    this.app.use('/api/python', authenticateToken, this.pythonServiceProxy());

    logger.info('✅ Routes setup completed');
  }

  marketDataRoutes() {
    const router = express.Router();

    // Example market data routes - you'll need to implement these controllers
    router.get('/quote/:symbol', (req, res) => {
      res.json({ message: 'Market data quote endpoint', symbol: req.params.symbol });
    });

    router.get('/historical/:symbol', (req, res) => {
      res.json({ message: 'Historical data endpoint', symbol: req.params.symbol });
    });

    router.get('/market-overview', (req, res) => {
      res.json({ message: 'Market overview endpoint' });
    });

    return router;
  }

  portfolioRoutes() {
    const router = express.Router();

    // Example portfolio routes - you'll need to implement these controllers
    router.get('/', (req, res) => {
      res.json({ message: 'Get user portfolios', userId: req.user.id });
    });

    router.post('/', (req, res) => {
      res.json({ message: 'Create portfolio', userId: req.user.id });
    });

    router.get('/:id', (req, res) => {
      res.json({ message: 'Get portfolio details', portfolioId: req.params.id, userId: req.user.id });
    });

    return router;
  }

  calculationsRoutes() {
    const router = express.Router();

    // Example calculation routes - you'll need to implement these controllers
    router.post('/returns', (req, res) => {
      res.json({ message: 'Calculate returns', userId: req.user.id });
    });

    router.post('/risk-metrics', (req, res) => {
      res.json({ message: 'Calculate risk metrics', userId: req.user.id });
    });

    router.post('/dcf', (req, res) => {
      res.json({ message: 'DCF valuation', userId: req.user.id });
    });

    return router;
  }

  pythonServiceProxy() {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    return createProxyMiddleware({
      target: pythonServiceUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/python': '' // Remove /api/python prefix when forwarding
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add user context to Python service requests
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Experience', req.user.investmentExperience);
          proxyReq.setHeader('X-Risk-Profile', req.user.riskProfile);
        }
        
        logger.info('Proxying to Python service:', {
          originalUrl: req.originalUrl,
          targetUrl: `${pythonServiceUrl}${proxyReq.path}`,
          userId: req.user?.id
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.info('Python service response:', {
          statusCode: proxyRes.statusCode,
          originalUrl: req.originalUrl,
          userId: req.user?.id
        });
      },
      onError: (err, req, res) => {
        logger.error('Python service proxy error:', {
          error: err.message,
          originalUrl: req.originalUrl,
          userId: req.user?.id
        });
        
        res.status(502).json({
          success: false,
          message: 'Python calculation service temporarily unavailable',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    logger.info('✅ Error handling setup completed');
  }

  setupGlobalHandlers() {
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    logger.info('✅ Global handlers setup completed');
  }

  // Start the API Gateway
  start(port = process.env.PORT || 5000) {
    this.server = this.app.listen(port, () => {
      logger.info(`🚀 Market Dashboard API Gateway started on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 API Gateway ready to handle requests`);
    });

    return this.server;
  }

  // Stop the API Gateway
  stop() {
    if (this.server) {
      this.server.close();
      logger.info('🛑 API Gateway stopped');
    }
  }

  // Get Express app instance
  getApp() {
    return this.app;
  }
}

export default APIGateway;
