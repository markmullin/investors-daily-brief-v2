#!/usr/bin/env node

/**
 * Portfolio Alert Service
 * Extends existing alert infrastructure for portfolio-specific notifications
 * Uses scheduled polling + WebSocket delivery (no real-time streaming from FMP)
 */

import NodeCache from 'node-cache';
import marketService from '../marketService.js';
import portfolioAIService from '../portfolioAIService.js';
import marketAlertService from '../insights/marketAlertService.js';
import websocketService from '../websocketService.js';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache
const portfolioCache = new NodeCache({ stdTTL: 60 }); // 1 minute cache for frequent checks

class PortfolioAlertService {
  constructor() {
    this.monitoringInterval = null;
    this.isMonitoring = false;
    this.portfolios = new Map(); // Track portfolio states
    this.userPreferences = new Map(); // User alert preferences
    this.alertHistory = []; // Keep alert history in memory (could be database later)
    
    // Default alert thresholds
    this.defaultThresholds = {
      portfolioGainLoss: {
        dailyGainPercent: 5.0,    // Alert on 5%+ daily gain
        dailyLossPercent: -3.0,   // Alert on 3%+ daily loss
        totalGainPercent: 20.0,   // Alert on 20%+ total gain
        totalLossPercent: -10.0   // Alert on 10%+ total loss
      },
      holdingAlerts: {
        priceChangePercent: 10.0, // Alert on 10%+ price change for individual holdings
        volumeSpikeMultiplier: 3.0 // Alert when volume is 3x average
      },
      aiAlerts: {
        regimeChangeConfidence: 0.8, // Only alert on high-confidence regime changes
        predictionConfidence: 0.85,  // Alert on high-confidence predictions
        sentimentShift: 0.3          // Alert on significant sentiment shifts
      },
      riskAlerts: {
        portfolioRiskIncrease: 0.15, // Alert when portfolio risk increases by 15%
        concentrationThreshold: 0.4,  // Alert when single holding exceeds 40%
        correlationIncrease: 0.8     // Alert when correlation becomes too high
      }
    };
  }

  /**
   * Initialize portfolio monitoring
   */
  async initialize() {
    try {
      console.log('🚨 Initializing Portfolio Alert Service...');
      
      // Load existing portfolio states
      await this.loadPortfolioStates();
      
      // Start monitoring if not already running
      if (!this.isMonitoring) {
        this.startMonitoring();
      }
      
      console.log('✅ Portfolio Alert Service initialized');
      return { status: 'initialized', portfolioCount: this.portfolios.size };
      
    } catch (error) {
      console.error('❌ Error initializing Portfolio Alert Service:', error);
      throw error;
    }
  }

  /**
   * Start monitoring portfolios for alert conditions
   * Uses scheduled polling since FMP is REST-only
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Portfolio monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('📡 Starting portfolio monitoring (every 60 seconds)');

    // Monitor portfolios every minute (FMP rate limits prevent more frequent calls)
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAllPortfolios();
      } catch (error) {
        console.error('❌ Error in portfolio monitoring cycle:', error);
        // Don't stop monitoring on error, just log it
      }
    }, 60000); // 60 seconds - respects FMP rate limits
  }

  /**
   * Stop monitoring portfolios
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('⏹️ Portfolio monitoring stopped');
    }
  }

  /**
   * Load portfolio states for monitoring
   */
  async loadPortfolioStates() {
    // In a real implementation, this would load from database
    // For now, we'll track the default portfolio
    const defaultPortfolioId = 'portfolio_1';
    
    try {
      // Get current portfolio state
      const portfolioState = await this.getPortfolioState(defaultPortfolioId);
      if (portfolioState) {
        this.portfolios.set(defaultPortfolioId, portfolioState);
        console.log(`📊 Loaded portfolio state for ${defaultPortfolioId}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load portfolio ${defaultPortfolioId}:`, error.message);
    }
  }

  /**
   * Get current portfolio state including live prices and AI analysis
   */
  async getPortfolioState(portfolioId) {
    try {
      // Check cache first
      const cacheKey = `portfolio_state_${portfolioId}`;
      const cached = portfolioCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      console.log(`📊 Fetching portfolio state for ${portfolioId}...`);

      // Get portfolio data (this would typically come from your portfolio storage)
      const portfolioResponse = await fetch(`http://localhost:5000/api/portfolio/${portfolioId}`);
      if (!portfolioResponse.ok) {
        throw new Error(`Portfolio API error: ${portfolioResponse.status}`);
      }
      
      const portfolio = await portfolioResponse.json();
      
      if (!portfolio.holdings || Object.keys(portfolio.holdings).length === 0) {
        console.log(`📝 Portfolio ${portfolioId} has no holdings to monitor`);
        return null;
      }

      // Get AI analysis for the portfolio
      let aiAnalysis = null;
      try {
        const aiResponse = await fetch(`http://localhost:5000/api/portfolio/${portfolioId}/ai-intelligence`);
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiAnalysis = aiData.aiIntelligence;
        }
      } catch (aiError) {
        console.warn('⚠️ Could not fetch AI analysis:', aiError.message);
      }

      const portfolioState = {
        id: portfolioId,
        timestamp: Date.now(),
        totalValue: portfolio.summary?.totalValue || 0,
        totalCost: portfolio.summary?.totalCost || 0,
        totalGain: portfolio.summary?.totalGain || 0,
        totalGainPercent: portfolio.summary?.totalGainPercent || 0,
        dayChange: portfolio.summary?.dayChange || 0,
        dayChangePercent: portfolio.summary?.dayChangePercent || 0,
        holdings: portfolio.holdings || {},
        holdingCount: Object.keys(portfolio.holdings || {}).length,
        aiAnalysis: aiAnalysis,
        lastUpdated: new Date().toISOString()
      };

      // Cache the state
      portfolioCache.set(cacheKey, portfolioState, 60); // Cache for 1 minute
      
      console.log(`✅ Portfolio state loaded: $${portfolioState.totalValue.toFixed(2)} (${portfolioState.holdingCount} holdings)`);
      return portfolioState;

    } catch (error) {
      console.error(`❌ Error getting portfolio state for ${portfolioId}:`, error);
      return null;
    }
  }

  /**
   * Check all portfolios for alert conditions
   */
  async checkAllPortfolios() {
    console.log('🔍 Checking portfolios for alert conditions...');
    
    const portfolioIds = Array.from(this.portfolios.keys());
    if (portfolioIds.length === 0) {
      // Try to load the default portfolio
      await this.loadPortfolioStates();
      return;
    }

    for (const portfolioId of portfolioIds) {
      try {
        await this.checkPortfolioAlerts(portfolioId);
      } catch (error) {
        console.error(`❌ Error checking alerts for portfolio ${portfolioId}:`, error);
      }
    }
  }

  /**
   * Check a specific portfolio for alert conditions
   */
  async checkPortfolioAlerts(portfolioId) {
    const previousState = this.portfolios.get(portfolioId);
    const currentState = await this.getPortfolioState(portfolioId);
    
    if (!currentState) {
      console.log(`⚠️ Could not get current state for portfolio ${portfolioId}`);
      return;
    }

    const alerts = [];

    // Check portfolio performance alerts
    if (previousState) {
      alerts.push(...this.checkPortfolioPerformanceAlerts(currentState, previousState, portfolioId));
      alerts.push(...this.checkHoldingAlerts(currentState, previousState, portfolioId));
      alerts.push(...this.checkRiskAlerts(currentState, previousState, portfolioId));
    }

    // Check AI-powered alerts
    alerts.push(...this.checkAIAlerts(currentState, portfolioId));

    // Update stored state
    this.portfolios.set(portfolioId, currentState);

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(alerts, portfolioId);
    }

    console.log(`✅ Portfolio ${portfolioId} checked: ${alerts.length} alerts generated`);
  }

  /**
   * Check portfolio-level performance alerts
   */
  checkPortfolioPerformanceAlerts(current, previous, portfolioId) {
    const alerts = [];
    const thresholds = this.getUserThresholds(portfolioId);

    // Daily gain/loss alerts
    const dayChangePercent = current.dayChangePercent;
    if (dayChangePercent >= thresholds.portfolioGainLoss.dailyGainPercent) {
      alerts.push({
        type: 'portfolio_daily_gain',
        severity: 'medium',
        portfolioId,
        title: `📈 Portfolio Daily Gain Alert`,
        message: `Your portfolio is up ${dayChangePercent.toFixed(2)}% today (+$${current.dayChange.toFixed(2)})`,
        data: {
          changePercent: dayChangePercent,
          changeAmount: current.dayChange,
          currentValue: current.totalValue
        },
        timestamp: Date.now()
      });
    } else if (dayChangePercent <= thresholds.portfolioGainLoss.dailyLossPercent) {
      alerts.push({
        type: 'portfolio_daily_loss',
        severity: 'high',
        portfolioId,
        title: `📉 Portfolio Daily Loss Alert`,
        message: `Your portfolio is down ${Math.abs(dayChangePercent).toFixed(2)}% today (-$${Math.abs(current.dayChange).toFixed(2)})`,
        data: {
          changePercent: dayChangePercent,
          changeAmount: current.dayChange,
          currentValue: current.totalValue
        },
        timestamp: Date.now()
      });
    }

    // Total gain/loss threshold alerts
    const totalGainPercent = current.totalGainPercent;
    if (totalGainPercent >= thresholds.portfolioGainLoss.totalGainPercent && 
        previous.totalGainPercent < thresholds.portfolioGainLoss.totalGainPercent) {
      alerts.push({
        type: 'portfolio_milestone_gain',
        severity: 'low',
        portfolioId,
        title: `🎉 Portfolio Milestone Alert`,
        message: `Congratulations! Your portfolio has reached ${totalGainPercent.toFixed(1)}% total gain (+$${current.totalGain.toFixed(2)})`,
        data: {
          totalGainPercent,
          totalGainAmount: current.totalGain,
          currentValue: current.totalValue
        },
        timestamp: Date.now()
      });
    }

    // Significant value changes
    const valueChangePercent = ((current.totalValue - previous.totalValue) / previous.totalValue) * 100;
    if (Math.abs(valueChangePercent) >= 5.0) {
      alerts.push({
        type: 'portfolio_value_change',
        severity: Math.abs(valueChangePercent) >= 10 ? 'high' : 'medium',
        portfolioId,
        title: `💰 Portfolio Value Alert`,
        message: `Portfolio value changed by ${valueChangePercent.toFixed(2)}% since last check`,
        data: {
          previousValue: previous.totalValue,
          currentValue: current.totalValue,
          changePercent: valueChangePercent,
          changeAmount: current.totalValue - previous.totalValue
        },
        timestamp: Date.now()
      });
    }

    return alerts;
  }

  /**
   * Check individual holding alerts
   */
  checkHoldingAlerts(current, previous, portfolioId) {
    const alerts = [];
    const thresholds = this.getUserThresholds(portfolioId);

    Object.entries(current.holdings).forEach(([symbol, holding]) => {
      const previousHolding = previous.holdings[symbol];
      if (!previousHolding) return;

      // Price change alerts
      const priceChangePercent = ((holding.currentPrice - previousHolding.currentPrice) / previousHolding.currentPrice) * 100;
      if (Math.abs(priceChangePercent) >= thresholds.holdingAlerts.priceChangePercent) {
        alerts.push({
          type: 'holding_price_change',
          severity: Math.abs(priceChangePercent) >= 15 ? 'high' : 'medium',
          portfolioId,
          symbol,
          title: `📊 ${symbol} Price Alert`,
          message: `${symbol} is ${priceChangePercent > 0 ? 'up' : 'down'} ${Math.abs(priceChangePercent).toFixed(2)}% since last check`,
          data: {
            symbol,
            previousPrice: previousHolding.currentPrice,
            currentPrice: holding.currentPrice,
            changePercent: priceChangePercent,
            position: {
              quantity: holding.quantity,
              currentValue: holding.currentValue,
              gainLoss: holding.currentValue - holding.costBasis
            }
          },
          timestamp: Date.now()
        });
      }

      // Holding value impact on portfolio
      const holdingValueChange = holding.currentValue - previousHolding.currentValue;
      const portfolioImpactPercent = (holdingValueChange / current.totalValue) * 100;
      if (Math.abs(portfolioImpactPercent) >= 2.0) {
        alerts.push({
          type: 'holding_portfolio_impact',
          severity: Math.abs(portfolioImpactPercent) >= 5 ? 'high' : 'medium',
          portfolioId,
          symbol,
          title: `🎯 ${symbol} Portfolio Impact`,
          message: `${symbol} contributed ${portfolioImpactPercent > 0 ? '+' : ''}${portfolioImpactPercent.toFixed(2)}% to your portfolio performance`,
          data: {
            symbol,
            valueChange: holdingValueChange,
            portfolioImpactPercent,
            newWeight: (holding.currentValue / current.totalValue) * 100
          },
          timestamp: Date.now()
        });
      }
    });

    return alerts;
  }

  /**
   * Check risk-based alerts
   */
  checkRiskAlerts(current, previous, portfolioId) {
    const alerts = [];
    const thresholds = this.getUserThresholds(portfolioId);

    // Concentration risk alert
    Object.entries(current.holdings).forEach(([symbol, holding]) => {
      const weight = holding.currentValue / current.totalValue;
      if (weight >= thresholds.riskAlerts.concentrationThreshold) {
        alerts.push({
          type: 'concentration_risk',
          severity: weight >= 0.5 ? 'high' : 'medium',
          portfolioId,
          symbol,
          title: `⚠️ Concentration Risk Alert`,
          message: `${symbol} represents ${(weight * 100).toFixed(1)}% of your portfolio. Consider rebalancing.`,
          data: {
            symbol,
            weight: weight * 100,
            value: holding.currentValue,
            threshold: thresholds.riskAlerts.concentrationThreshold * 100
          },
          timestamp: Date.now()
        });
      }
    });

    return alerts;
  }

  /**
   * Check AI-powered alerts using existing AI analysis
   */
  checkAIAlerts(current, portfolioId) {
    const alerts = [];
    
    if (!current.aiAnalysis) {
      return alerts;
    }

    const ai = current.aiAnalysis;
    const thresholds = this.getUserThresholds(portfolioId);

    // Market regime change alerts
    if (ai.marketRegime && ai.marketRegime.confidence >= thresholds.aiAlerts.regimeChangeConfidence) {
      const regime = ai.marketRegime.currentRegime;
      if (this.shouldAlertOnRegime(regime, portfolioId)) {
        alerts.push({
          type: 'ai_regime_change',
          severity: regime === 'Bear' || regime === 'Strong Bear' ? 'high' : 'medium',
          portfolioId,
          title: `🤖 AI Market Regime Alert`,
          message: `AI detected ${regime} market regime with ${(ai.marketRegime.confidence * 100).toFixed(1)}% confidence`,
          data: {
            regime,
            confidence: ai.marketRegime.confidence,
            interpretation: ai.marketRegime.interpretation,
            expectedDuration: ai.marketRegime.expectedDuration
          },
          timestamp: Date.now()
        });
      }
    }

    // High-confidence ML predictions
    if (ai.mlPredictions && ai.mlPredictions.predictions) {
      Object.entries(ai.mlPredictions.predictions).forEach(([horizon, predictions]) => {
        Object.entries(predictions).forEach(([symbol, prediction]) => {
          if (prediction.confidence >= thresholds.aiAlerts.predictionConfidence) {
            alerts.push({
              type: 'ai_prediction_alert',
              severity: 'medium',
              portfolioId,
              symbol,
              title: `🔮 AI Prediction Alert - ${symbol}`,
              message: `High-confidence ${horizon} prediction: ${prediction.direction} (${(prediction.confidence * 100).toFixed(1)}% confidence)`,
              data: {
                symbol,
                horizon,
                direction: prediction.direction,
                confidence: prediction.confidence,
                expectedReturn: prediction.expected_return_percent
              },
              timestamp: Date.now()
            });
          }
        });
      });
    }

    // Sentiment shift alerts
    if (ai.sentimentAnalysis && ai.sentimentAnalysis.overallSentiment !== undefined) {
      const sentimentChange = this.getSentimentChange(ai.sentimentAnalysis.overallSentiment, portfolioId);
      if (Math.abs(sentimentChange) >= thresholds.aiAlerts.sentimentShift) {
        alerts.push({
          type: 'ai_sentiment_shift',
          severity: 'medium',
          portfolioId,
          title: `💭 AI Sentiment Alert`,
          message: `Market sentiment shifted ${sentimentChange > 0 ? 'positive' : 'negative'}ly by ${Math.abs(sentimentChange * 100).toFixed(1)}%`,
          data: {
            currentSentiment: ai.sentimentAnalysis.overallSentiment,
            sentimentChange,
            trend: ai.sentimentAnalysis.trend
          },
          timestamp: Date.now()
        });
      }
    }

    // Dynamic allocation recommendations
    if (ai.dynamicAllocation && ai.dynamicAllocation.tradeRecommendations) {
      const highPriorityTrades = ai.dynamicAllocation.tradeRecommendations.filter(trade => 
        Math.abs(trade.percentChange || 0) >= 5.0
      );

      if (highPriorityTrades.length > 0) {
        alerts.push({
          type: 'ai_rebalancing_alert',
          severity: 'medium',
          portfolioId,
          title: `⚖️ AI Rebalancing Alert`,
          message: `AI recommends ${highPriorityTrades.length} significant allocation changes`,
          data: {
            recommendations: highPriorityTrades,
            totalRecommendations: ai.dynamicAllocation.tradeRecommendations.length
          },
          timestamp: Date.now()
        });
      }
    }

    return alerts;
  }

  /**
   * Send alerts via WebSocket and store in history
   */
  async sendAlerts(alerts, portfolioId) {
    try {
      console.log(`📤 Sending ${alerts.length} alerts for portfolio ${portfolioId}`);

      // Add to alert history
      alerts.forEach(alert => {
        this.alertHistory.push({
          ...alert,
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          read: false,
          acknowledged: false
        });
      });

      // Keep only last 1000 alerts in memory
      if (this.alertHistory.length > 1000) {
        this.alertHistory = this.alertHistory.slice(-1000);
      }

      // Send via WebSocket to all connected clients
      const alertPayload = {
        type: 'portfolio_alerts',
        portfolioId,
        alerts,
        timestamp: Date.now()
      };

      // Use existing WebSocket service to broadcast
      websocketService.broadcast(alertPayload);

      console.log(`✅ Alerts sent via WebSocket for portfolio ${portfolioId}`);

    } catch (error) {
      console.error('❌ Error sending alerts:', error);
    }
  }

  /**
   * Get user alert thresholds (with defaults)
   */
  getUserThresholds(portfolioId) {
    // In real implementation, this would load from user preferences database
    const userPrefs = this.userPreferences.get(portfolioId) || {};
    return {
      ...this.defaultThresholds,
      ...userPrefs
    };
  }

  /**
   * Configure user alert preferences
   */
  setUserPreferences(portfolioId, preferences) {
    this.userPreferences.set(portfolioId, preferences);
    console.log(`✅ Alert preferences updated for portfolio ${portfolioId}`);
  }

  /**
   * Helper: Check if we should alert on regime change
   */
  shouldAlertOnRegime(regime, portfolioId) {
    const lastRegimeKey = `last_regime_${portfolioId}`;
    const lastRegime = cache.get(lastRegimeKey);
    
    if (lastRegime !== regime) {
      cache.set(lastRegimeKey, regime);
      return true;
    }
    return false;
  }

  /**
   * Helper: Get sentiment change since last check
   */
  getSentimentChange(currentSentiment, portfolioId) {
    const lastSentimentKey = `last_sentiment_${portfolioId}`;
    const lastSentiment = cache.get(lastSentimentKey) || currentSentiment;
    
    cache.set(lastSentimentKey, currentSentiment);
    return currentSentiment - lastSentiment;
  }

  /**
   * Get alert history for a portfolio
   */
  getAlertHistory(portfolioId, limit = 50) {
    return this.alertHistory
      .filter(alert => alert.portfolioId === portfolioId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const today = this.alertHistory.filter(alert => 
      now - alert.timestamp < dayMs
    );

    const byType = {};
    const bySeverity = {};
    
    today.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    return {
      total: this.alertHistory.length,
      today: today.length,
      byType,
      bySeverity,
      isMonitoring: this.isMonitoring,
      portfoliosTracked: this.portfolios.size
    };
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('🛑 Shutting down Portfolio Alert Service...');
    this.stopMonitoring();
    this.portfolios.clear();
    this.userPreferences.clear();
    console.log('✅ Portfolio Alert Service shutdown complete');
  }
}

// Export singleton instance
export default new PortfolioAlertService();
