import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import marketRoutes from './routes/marketRoutes.js';
import websocketService from './services/websocketService.js';
import errorTracker from './utils/errorTracker.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Add both localhost and 127.0.0.1
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API validation middleware
app.use((req, res, next) => {
  const requiredApis = {
    'EOD API': process.env.EOD_API_KEY,
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

// Debug middleware to log all routes
app.use((req, res, next) => {
  console.log('Available routes:', 
    app._router.stack
      .filter(r => r.route)
      .map(r => `${Object.keys(r.route.methods)} ${r.route.path}`)
  );
  next();
});

// Routes
console.log('Mounting market routes at /api/market');
app.use('/api/market', marketRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    apis: {
      eod: Boolean(process.env.EOD_API_KEY)
    },
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

// Initialize WebSocket
websocketService.initialize(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: PORT,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
});