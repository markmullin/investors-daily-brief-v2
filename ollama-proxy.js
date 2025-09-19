/**
 * SECURE Ollama Proxy - Protects your GPU with authentication
 * Run this on YOUR GPU machine alongside Ollama
 */
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

// Configuration
const OLLAMA_PORT = 11434;
const PROXY_PORT = 11435;
const API_KEY = process.env.API_KEY || crypto.randomBytes(32).toString('hex');

console.log('🔐 Your API Key:', API_KEY);
console.log('⚠️  Save this key and set it as OLLAMA_API_KEY in Render!');

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Only allow specific endpoints
const allowedPaths = [
  '/v1/chat/completions',
  '/api/generate',
  '/api/chat'
];

const pathFilter = (req, res, next) => {
  if (!allowedPaths.some(path => req.path.startsWith(path))) {
    return res.status(403).json({ error: 'Forbidden endpoint' });
  }
  next();
};

// Apply middleware
app.use(limiter);
app.use(authenticate);
app.use(pathFilter);

// Log requests (for monitoring)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.ip} -> ${req.method} ${req.path}`);
  next();
});

// Proxy to Ollama
app.use('/', createProxyMiddleware({
  target: `http://localhost:${OLLAMA_PORT}`,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}));

app.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`✅ Secure Ollama proxy running on port ${PROXY_PORT}`);
  console.log(`📡 Expose port ${PROXY_PORT} with ngrok instead of ${OLLAMA_PORT}`);
  console.log(`🔒 Protected with API key authentication`);
});

/*
TO USE:
1. npm install express http-proxy-middleware express-rate-limit
2. node ollama-proxy.js
3. ngrok http 11435
4. Set in Render environment:
   - OLLAMA_URL = https://your-ngrok-url.ngrok-free.app
   - OLLAMA_API_KEY = your_generated_api_key
*/
