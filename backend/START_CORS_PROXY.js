import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = 8080;

// Enable unrestricted CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: '*',
  credentials: true
}));

// Proxy all requests to the backend
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  logLevel: 'info',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[CORS Proxy] ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[CORS Proxy Error]:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

app.listen(port, () => {
  console.log(`\n🚀 CORS Proxy Server is running at http://localhost:${port}`);
  console.log(`📡 Proxying requests to http://localhost:5000`);
  console.log(`✅ Frontend should connect to http://localhost:${port}/api`);
  console.log(`\nTo use this proxy, ensure your frontend connects to:`);
  console.log(`http://localhost:${port}/api instead of http://localhost:5000/api`);
});
