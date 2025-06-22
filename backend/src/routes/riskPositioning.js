/**
 * Market Risk Positioning API Routes
 * RESTful endpoints for the interactive 0-100 risk gauge system
 */

import express from 'express';
import RiskPositioningController from '../controllers/riskPositioningController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { marketDataRateLimit, calculationRateLimit } from '../middleware/security.js';

const router = express.Router();

/**
 * @route   GET /api/risk-positioning/current
 * @desc    Get current market risk positioning score with interactive gauge data
 * @access  Public (enhanced features with authentication)
 * @query   mode: 'beginner' | 'advanced'
 */
router.get('/current', 
  marketDataRateLimit,
  optionalAuth,
  RiskPositioningController.getCurrentRiskScore
);

/**
 * @route   GET /api/risk-positioning/historical
 * @desc    Get historical risk positioning data for trend analysis
 * @access  Public (personalized insights with authentication)
 * @query   period: '1week' | '1month' | '3months' | '1year'
 */
router.get('/historical',
  marketDataRateLimit,
  optionalAuth,
  RiskPositioningController.getHistoricalRiskData
);

/**
 * @route   GET /api/risk-positioning/simulate/:score
 * @desc    Simulate risk analysis at a specific score level (for interactive gauge)
 * @access  Public
 * @params  score: number (0-100)
 */
router.get('/simulate/:score',
  marketDataRateLimit,
  RiskPositioningController.simulateRiskLevel
);

/**
 * @route   POST /api/risk-positioning/mode
 * @desc    Switch between beginner and advanced analysis modes
 * @access  Public
 * @body    { mode: 'beginner' | 'advanced' }
 */
router.post('/mode',
  marketDataRateLimit,
  RiskPositioningController.switchAnalysisMode
);

/**
 * @route   GET /api/risk-positioning/education/:topic
 * @desc    Get educational content about risk positioning concepts
 * @access  Public
 * @params  topic: 'risk-scoring' | 'cycle-analysis' | 'interactive-gauge'
 */
router.get('/education/:topic',
  marketDataRateLimit,
  RiskPositioningController.getEducationalContent
);

/**
 * @route   GET /api/risk-positioning/personalized
 * @desc    Get personalized risk insights based on user profile
 * @access  Private (requires authentication)
 */
router.get('/personalized',
  marketDataRateLimit,
  authenticateToken,
  async (req, res) => {
    try {
      // Get current risk data
      const riskData = await RiskPositioningController.getCurrentRiskScore(req, res);
      
      // This would be handled in the controller, but showing the pattern
      res.json({
        success: true,
        message: 'Personalized insights require authentication',
        userProfile: {
          riskProfile: req.user.riskProfile,
          experience: req.user.investmentExperience
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get personalized insights'
      });
    }
  }
);

/**
 * @route   POST /api/risk-positioning/alert
 * @desc    Set up alerts for risk score changes
 * @access  Private (requires authentication)
 * @body    { threshold: number, direction: 'above' | 'below', enabled: boolean }
 */
router.post('/alert',
  calculationRateLimit,
  authenticateToken,
  async (req, res) => {
    const { threshold, direction, enabled } = req.body;
    const userId = req.user.id;

    // Validation
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be a number between 0 and 100'
      });
    }

    if (!['above', 'below'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Direction must be "above" or "below"'
      });
    }

    try {
      // Implementation would save alert to database
      // For now, return success response
      
      res.json({
        success: true,
        message: 'Risk score alert configured successfully',
        alert: {
          userId,
          threshold,
          direction,
          enabled,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to configure risk alert'
      });
    }
  }
);

/**
 * @route   GET /api/risk-positioning/components
 * @desc    Get detailed breakdown of risk score components
 * @access  Public (enhanced with authentication)
 */
router.get('/components',
  marketDataRateLimit,
  optionalAuth,
  async (req, res) => {
    try {
      // This would use the risk engine to get component details
      res.json({
        success: true,
        message: 'Risk score component breakdown',
        components: {
          fundamental: {
            name: 'Economic Fundamentals',
            description: 'Corporate earnings, valuations, GDP growth',
            weight: 35,
            currentScore: 68,
            factors: [
              'Earnings growth: +8.5% YoY',
              'S&P 500 P/E: 19.2x (reasonable)',
              'GDP growth: +2.8% (solid)'
            ]
          },
          technical: {
            name: 'Market Technicals', 
            description: 'Price momentum, breadth, volatility',
            weight: 25,
            currentScore: 72,
            factors: [
              'Market above 20-day MA',
              'Advance/decline ratio positive',
              'VIX at manageable levels'
            ]
          },
          sentiment: {
            name: 'Investor Sentiment',
            description: 'Psychology, positioning, flows',
            weight: 20,
            currentScore: 58,
            factors: [
              'Put/call ratio neutral',
              'Fund flows positive',
              'Surveys show optimism'
            ]
          },
          macro: {
            name: 'Macroeconomic Environment',
            description: 'Interest rates, inflation, employment',
            weight: 20,
            currentScore: 65,
            factors: [
              'Fed policy accommodative',
              'Inflation moderating',
              'Employment strong'
            ]
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get component breakdown'
      });
    }
  }
);

export default router;