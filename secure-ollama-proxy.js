import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import crypto from 'crypto';

const app = express();

// Generate API key (save this!)
const API_KEY = process.env.API_KEY || crypto.randomBytes(32).toString('hex');
console.log('🔑 API Key:', API_KEY);
console.log('Save this key for Render environment variables!');

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests per minute

app.use((req, res, next) => {
  // Check API key
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Rate limiting
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const key = `${req.ip}-${minute}`;
  
  const count = requestCounts.get(key) || 0;
  if (count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  requestCounts.set(key, count + 1);
  
  // Logging
  console.log(`[${new Date().toISOString()}] ${req.ip} - ${req.method} ${req.path}`);
  
  next();
});

// Proxy to Ollama
app.use('/', createProxyMiddleware({
  target: 'http://localhost:11434',
  changeOrigin: true
}));

app.listen(11435, () => {
  console.log('✅ Secure proxy running on port 11435');
  console.log('📝 Next: Run cloudflared tunnel --url http://localhost:11435');
});
