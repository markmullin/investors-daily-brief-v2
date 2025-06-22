/**
 * CORS Proxy Service
 * Manages starting and monitoring the CORS proxy from within the backend application
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

// Convert ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CORS_PROXY_PORT = process.env.CORS_PROXY_PORT || 8080;
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_DELAY = 3000; // 3 seconds
const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

// Track proxy state
let proxyProcess = null;
let restartAttempts = 0;
let isShuttingDown = false;
let healthCheckTimer = null;
let proxyStartTime = null;

// Find the improved-cors-proxy.js file
const findProxyScript = () => {
  // Start from the current directory and go up to find the improved-cors-proxy.js
  let currentDir = __dirname;
  const rootDirs = ['backend', 'src', 'services', 'corsProxyService'];
  
  // Go up to the project root
  for (let i = 0; i < rootDirs.length + 2; i++) {
    currentDir = path.dirname(currentDir);
  }
  
  // Check if improved-cors-proxy.js exists at the project root
  const proxyPath = path.join(currentDir, 'improved-cors-proxy.js');
  if (fs.existsSync(proxyPath)) {
    return proxyPath;
  }
  
  // Alternative locations
  const altPaths = [
    path.join(currentDir, 'cors-proxy.js'),
    path.join(currentDir, 'backend', 'improved-cors-proxy.js'),
    path.join(currentDir, 'backend', 'cors-proxy.js')
  ];
  
  for (const altPath of altPaths) {
    if (fs.existsSync(altPath)) {
      return altPath;
    }
  }
  
  console.error('Could not find CORS proxy script in expected locations');
  return null;
};

/**
 * Check if the CORS proxy is already running
 */
const isProxyRunning = async (port = CORS_PROXY_PORT) => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/cors-proxy-health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve(health && health.status === 'ok');
        } catch (e) {
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
};

/**
 * Start the CORS proxy if it's not already running
 */
const startCorsProxy = async () => {
  if (isShuttingDown) return;
  
  // Check if proxy is already running
  const running = await isProxyRunning();
  if (running) {
    console.log('CORS proxy is already running on port', CORS_PROXY_PORT);
    startHealthCheck();
    return true;
  }
  
  // Find the proxy script path
  const proxyScriptPath = findProxyScript();
  if (!proxyScriptPath) {
    console.error('Failed to find CORS proxy script');
    return false;
  }
  
  console.log(`Starting CORS proxy from: ${proxyScriptPath}`);
  
  try {
    // Set environment variables for the proxy
    const env = {
      ...process.env,
      CORS_PROXY_PORT: CORS_PROXY_PORT.toString(),
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    // Spawn the process
    proxyProcess = spawn('node', [proxyScriptPath], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });
    
    proxyStartTime = Date.now();
    console.log(`CORS proxy process started with PID: ${proxyProcess.pid}`);
    
    // Handle process output
    proxyProcess.stdout.on('data', (data) => {
      console.log(`[CORS Proxy] ${data.toString().trim()}`);
    });
    
    proxyProcess.stderr.on('data', (data) => {
      console.error(`[CORS Proxy Error] ${data.toString().trim()}`);
    });
    
    // Handle process exit
    proxyProcess.on('exit', (code, signal) => {
      const uptime = proxyStartTime ? Math.round((Date.now() - proxyStartTime) / 1000) : 0;
      console.log(`CORS proxy process exited with code ${code}, signal ${signal}, uptime: ${uptime}s`);
      proxyProcess = null;
      
      // Don't restart if we're shutting down
      if (isShuttingDown) return;
      
      // Restart the proxy if it crashes
      if (restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        console.log(`Attempting to restart CORS proxy (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`);
        
        setTimeout(() => {
          startCorsProxy().catch(err => {
            console.error('Failed to restart CORS proxy:', err.message);
          });
        }, RESTART_DELAY);
      } else {
        console.error(`Exceeded maximum restart attempts (${MAX_RESTART_ATTEMPTS}). CORS proxy will not be restarted.`);
      }
    });
    
    // Wait for the proxy to start up
    let attempts = 0;
    const maxAttempts = 10;
    let proxyStarted = false;
    
    while (!proxyStarted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      proxyStarted = await isProxyRunning();
      attempts++;
    }
    
    if (proxyStarted) {
      console.log(`CORS proxy successfully started on port ${CORS_PROXY_PORT}`);
      restartAttempts = 0; // Reset restart attempts on successful start
      startHealthCheck();
      return true;
    } else {
      console.error(`CORS proxy failed to start after ${attempts} attempts`);
      return false;
    }
  } catch (error) {
    console.error('Error starting CORS proxy:', error.message);
    return false;
  }
};

/**
 * Start the health check for the CORS proxy
 */
const startHealthCheck = () => {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }
  
  healthCheckTimer = setInterval(async () => {
    if (isShuttingDown) return;
    
    const running = await isProxyRunning();
    if (!running) {
      console.log('CORS proxy health check failed, attempting to restart...');
      
      // Try to restart the proxy
      await startCorsProxy();
    }
  }, HEALTH_CHECK_INTERVAL);
};

/**
 * Stop the CORS proxy
 */
const stopCorsProxy = () => {
  isShuttingDown = true;
  
  // Clear health check
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
  
  // Kill the proxy process if it's running
  if (proxyProcess) {
    console.log(`Stopping CORS proxy (PID: ${proxyProcess.pid})...`);
    
    // Try to kill gracefully
    proxyProcess.kill('SIGTERM');
    
    // Force kill after a timeout
    setTimeout(() => {
      try {
        if (proxyProcess) {
          console.log(`Force killing CORS proxy (PID: ${proxyProcess.pid})...`);
          proxyProcess.kill('SIGKILL');
        }
      } catch (e) {
        // Ignore errors
      }
    }, 5000);
  }
};

/**
 * Get the status of the CORS proxy
 */
const getStatus = async () => {
  const running = await isProxyRunning();
  return {
    running,
    pid: proxyProcess ? proxyProcess.pid : null,
    port: CORS_PROXY_PORT,
    uptime: proxyStartTime ? Math.round((Date.now() - proxyStartTime) / 1000) : 0,
    restartAttempts
  };
};

/**
 * Initialize the CORS proxy service
 */
const initialize = async () => {
  console.log('Initializing CORS proxy service...');
  return startCorsProxy();
};

export default {
  initialize,
  startCorsProxy,
  stopCorsProxy,
  isProxyRunning,
  getStatus
};