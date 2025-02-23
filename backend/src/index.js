import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import marketRoutes from './routes/marketRoutes.js';
import errorTracker from './utils/errorTracker.js';
import marketEnvironmentRoutes from './routes/marketEnvironmentRoutes.js';
import industryAnalysisRoutes from './routes/industryAnalysis.js';
import macroAnalysisRoutes from './routes/macroAnalysisRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import enhancedMarketRoutes from './routes/enhancedMarketRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import relationshipRoutes from './routes/relationshipRoutes.js';
import { setupWebSocket } from './services/websocketService.js';

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'https://market-dashboard-frontend.onrender.com',
    'https://market-dashboard-api.onrender.com',
    'http://localhost:5173',
    'http://localhost:5000'
  ],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API validation middleware
app.use((req, res, next) => {
  const requiredApis = {
    'EOD API': process.env.EOD_API_KEY,
    'BRAVE API': process.env.BRAVE_API_KEY
  };

  const missingApis = Object.entries(requiredApis)
    .filter(([_, key]) => !key)
    .map(([name]) => name);

  if (missingApis.length > 0) {
    const error = new Error(`Missing API keys: ${missingApis.join(', ')}`);
    errorTracker.track(error, 'API Validation');
    next(error);
  } else {
    next();
  }
});

// Routes
app.use('/api/market', marketRoutes);
app.use('/api/market-environment', marketEnvironmentRoutes);
app.use('/api/industry-analysis', industryAnalysisRoutes);
app.use('/api/macro-analysis', macroAnalysisRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/enhanced-market', enhancedMarketRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/relationships', relationshipRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    apis: {
      eod: Boolean(process.env.EOD_API_KEY),
      brave: Boolean(process.env.BRAVE_API_KEY)
    },
    version: '2.0.0',
    timestamp: Date.now()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  errorTracker.track(err, `${req.method} ${req.path}`);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    timestamp: Date.now()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: PORT,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
});

// Setup WebSocket
setupWebSocket(server);