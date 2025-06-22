import http from 'http';
import https from 'https';
import url from 'url';

class CorsProxyService {
  constructor() {
    this.proxyServer = null;
    this.port = 8080;
    this.targetBaseUrl = 'http://localhost:5000';
  }

  start() {
    if (this.proxyServer) {
      console.log('CORS proxy server is already running');
      return;
    }

    this.proxyServer = http.createServer((req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Handle preflight request
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Parse the URL
      const parsedUrl = url.parse(req.url);

      // Build the target URL
      const targetUrl = `${this.targetBaseUrl}${parsedUrl.path}`;
      
      // Parse the target URL to determine if we need http or https
      const targetUrlParsed = url.parse(targetUrl);
      const isHttps = targetUrlParsed.protocol === 'https:';
      const transport = isHttps ? https : http;

      // Options for the proxy request
      const options = {
        hostname: targetUrlParsed.hostname,
        port: targetUrlParsed.port || (isHttps ? 443 : 80),
        path: targetUrlParsed.path,
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrlParsed.host
        }
      };

      // Create the proxy request
      const proxyReq = transport.request(options, (proxyRes) => {
        // Set response headers
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });

        // Ensure CORS headers are always set
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Set the status code
        res.writeHead(proxyRes.statusCode);

        // Pipe the response
        proxyRes.pipe(res, { end: true });
      });

      // Handle errors
      proxyReq.on('error', (err) => {
        console.error(`Proxy request error: ${err.message}`);
        res.writeHead(500);
        res.end(`Proxy Error: ${err.message}`);
      });

      // Pipe the request body for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.pipe(proxyReq, { end: true });
      } else {
        proxyReq.end();
      }
    });

    this.proxyServer.listen(this.port, () => {
      console.log(`CORS Proxy server running at http://localhost:${this.port}`);
      console.log('Frontend should use http://localhost:8080 as the API base URL');
    });

    // Handle server errors
    this.proxyServer.on('error', (err) => {
      console.error('CORS proxy server error:', err);
    });
  }

  stop() {
    if (this.proxyServer) {
      this.proxyServer.close(() => {
        console.log('CORS proxy server stopped');
      });
      this.proxyServer = null;
    }
  }
}

export default new CorsProxyService();