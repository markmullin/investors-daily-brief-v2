import express from 'express';
import marketAlertService from '../services/insights/marketAlertService.js';
import portfolioAlertService from '../services/alerts/portfolioAlertService.js';

const router = express.Router();

// ========================================
// 📊 MARKET ALERTS (Existing)
// ========================================

router.get('/market-alerts', async (req, res) => {
  try {
    const alerts = await marketAlertService.checkForAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error getting market alerts:', error);
    res.status(500).json({ error: 'Failed to get market alerts' });
  }
});

router.get('/market-state', async (req, res) => {
  try {
    const state = await marketAlertService.getCurrentState();
    res.json(state);
  } catch (error) {
    console.error('Error getting market state:', error);
    res.status(500).json({ error: 'Failed to get market state' });
  }
});

// ========================================
// 🚨 PORTFOLIO ALERTS (New - Phase 6A)
// ========================================

// Initialize portfolio alert monitoring
router.post('/portfolio/initialize', async (req, res) => {
  try {
    console.log('🚨 Initializing Portfolio Alert Service...');
    const result = await portfolioAlertService.initialize();
    res.json({
      status: 'success',
      message: 'Portfolio alert monitoring initialized',
      data: result
    });
  } catch (error) {
    console.error('❌ Error initializing portfolio alerts:', error);
    res.status(500).json({ 
      error: 'Failed to initialize portfolio alert monitoring',
      details: error.message 
    });
  }
});

// Get alerts for a specific portfolio
router.get('/portfolio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const alerts = portfolioAlertService.getAlertHistory(id, limit);
    
    res.json({
      portfolioId: id,
      alerts,
      total: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`❌ Error getting portfolio alerts for ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to get portfolio alerts',
      details: error.message 
    });
  }
});

// Configure alert preferences for a portfolio
router.post('/portfolio/:id/configure', async (req, res) => {
  try {
    const { id } = req.params;
    const preferences = req.body;
    
    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid preferences format' 
      });
    }

    portfolioAlertService.setUserPreferences(id, preferences);
    
    res.json({
      status: 'success',
      message: `Alert preferences updated for portfolio ${id}`,
      portfolioId: id,
      preferences
    });
  } catch (error) {
    console.error(`❌ Error configuring portfolio alerts for ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to configure portfolio alerts',
      details: error.message 
    });
  }
});

// Manually trigger alert check for a portfolio
router.post('/portfolio/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Manual alert check requested for portfolio ${id}`);
    
    await portfolioAlertService.checkPortfolioAlerts(id);
    
    res.json({
      status: 'success',
      message: `Alert check completed for portfolio ${id}`,
      portfolioId: id,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`❌ Error in manual alert check for ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to check portfolio alerts',
      details: error.message 
    });
  }
});

// Get alert history for a user (across all portfolios)
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    // For now, we'll return alerts for the default portfolio
    // In a real implementation, this would query by userId across all their portfolios
    const alerts = portfolioAlertService.getAlertHistory('portfolio_1', limit);
    
    res.json({
      userId,
      alerts,
      total: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`❌ Error getting alert history for user ${req.params.userId}:`, error);
    res.status(500).json({ 
      error: 'Failed to get alert history',
      details: error.message 
    });
  }
});

// Test notification system
router.post('/test', async (req, res) => {
  try {
    const { portfolioId = 'portfolio_1', alertType = 'test' } = req.body;
    
    console.log(`🧪 Testing alert system for portfolio ${portfolioId}`);
    
    // Create a test alert
    const testAlert = {
      type: alertType,
      severity: 'low',
      portfolioId,
      title: '🧪 Test Alert',
      message: 'This is a test notification from the Portfolio Alert System',
      data: {
        test: true,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };
    
    // Send the test alert
    await portfolioAlertService.sendAlerts([testAlert], portfolioId);
    
    res.json({
      status: 'success',
      message: 'Test alert sent successfully',
      testAlert,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error sending test alert:', error);
    res.status(500).json({ 
      error: 'Failed to send test alert',
      details: error.message 
    });
  }
});

// Get alert service statistics and status
router.get('/status', async (req, res) => {
  try {
    const stats = portfolioAlertService.getAlertStats();
    
    res.json({
      status: 'success',
      alertService: {
        ...stats,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Error getting alert service status:', error);
    res.status(500).json({ 
      error: 'Failed to get alert service status',
      details: error.message 
    });
  }
});

// Start portfolio monitoring
router.post('/portfolio/start-monitoring', async (req, res) => {
  try {
    portfolioAlertService.startMonitoring();
    
    res.json({
      status: 'success',
      message: 'Portfolio monitoring started',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error starting portfolio monitoring:', error);
    res.status(500).json({ 
      error: 'Failed to start portfolio monitoring',
      details: error.message 
    });
  }
});

// Stop portfolio monitoring
router.post('/portfolio/stop-monitoring', async (req, res) => {
  try {
    portfolioAlertService.stopMonitoring();
    
    res.json({
      status: 'success',
      message: 'Portfolio monitoring stopped',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error stopping portfolio monitoring:', error);
    res.status(500).json({ 
      error: 'Failed to stop portfolio monitoring',
      details: error.message 
    });
  }
});

// Mark alert as read
router.patch('/alert/:alertId/read', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    // In a real implementation, this would update the database
    // For now, we'll just acknowledge the request
    
    res.json({
      status: 'success',
      message: `Alert ${alertId} marked as read`,
      alertId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`❌ Error marking alert ${req.params.alertId} as read:`, error);
    res.status(500).json({ 
      error: 'Failed to mark alert as read',
      details: error.message 
    });
  }
});

// Acknowledge alert
router.patch('/alert/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    // In a real implementation, this would update the database
    // For now, we'll just acknowledge the request
    
    res.json({
      status: 'success',
      message: `Alert ${alertId} acknowledged`,
      alertId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`❌ Error acknowledging alert ${req.params.alertId}:`, error);
    res.status(500).json({ 
      error: 'Failed to acknowledge alert',
      details: error.message 
    });
  }
});

// ========================================
// 🔧 ALERT CONFIGURATION ENDPOINTS
// ========================================

// Get default alert thresholds
router.get('/defaults', (req, res) => {
  try {
    // Access default thresholds (these would typically be configurable)
    const defaults = {
      portfolioGainLoss: {
        dailyGainPercent: 5.0,
        dailyLossPercent: -3.0,
        totalGainPercent: 20.0,
        totalLossPercent: -10.0
      },
      holdingAlerts: {
        priceChangePercent: 10.0,
        volumeSpikeMultiplier: 3.0
      },
      aiAlerts: {
        regimeChangeConfidence: 0.8,
        predictionConfidence: 0.85,
        sentimentShift: 0.3
      },
      riskAlerts: {
        portfolioRiskIncrease: 0.15,
        concentrationThreshold: 0.4,
        correlationIncrease: 0.8
      }
    };
    
    res.json({
      status: 'success',
      defaults,
      description: 'Default alert threshold configuration'
    });
  } catch (error) {
    console.error('❌ Error getting default alert configuration:', error);
    res.status(500).json({ 
      error: 'Failed to get default alert configuration',
      details: error.message 
    });
  }
});

export default router;
