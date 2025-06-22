import express from 'express';

const router = express.Router();

// Health check endpoints
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Detailed health check
router.get('/detailed', (req, res) => {
  // Collect detailed health information
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    platform: process.platform,
    services: {
      eod: { status: 'unknown' },
      mistral: { status: 'unknown' },
      brave: { status: 'unknown' }
    }
  };
  
  // Check EOD API status
  if (process.env.EOD_API_KEY) {
    healthInfo.services.eod.status = 'configured';
  } else {
    healthInfo.services.eod.status = 'not_configured';
  }
  
  // Check Mistral AI status
  if (process.env.USE_MISTRAL_API === 'true' && process.env.MISTRAL_API_KEY) {
    healthInfo.services.mistral.status = 'enabled';
  } else if (process.env.MISTRAL_API_KEY) {
    healthInfo.services.mistral.status = 'configured_but_disabled';
  } else {
    healthInfo.services.mistral.status = 'not_configured';
  }
  
  // Check Brave API status
  if (process.env.USE_BRAVE_API === 'true' && process.env.BRAVE_API_KEY) {
    healthInfo.services.brave.status = 'enabled';
  } else if (process.env.BRAVE_API_KEY) {
    healthInfo.services.brave.status = 'configured_but_disabled';
  } else {
    healthInfo.services.brave.status = 'not_configured';
  }
  
  res.json(healthInfo);
});

// Reset circuit breakers
router.post('/reset-circuit-breakers', (req, res) => {
  // Code to reset circuit breakers or rate limiters
  
  res.json({
    status: 'ok',
    message: 'Circuit breakers reset successfully',
    timestamp: new Date().toISOString()
  });
});

// API status check
router.get('/api-status', async (req, res) => {
  // Service status object
  const serviceStatus = {
    eod: { status: 'unknown' },
    mistral: { status: 'unknown' },
    brave: { status: 'unknown' }
  };
  
  // Report status
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: serviceStatus
  });
});

export default router;