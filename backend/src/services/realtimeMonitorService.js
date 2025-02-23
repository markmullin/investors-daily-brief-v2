import marketMonitorService from './marketMonitorService.js';
import enhancedMarketScore from './enhancedMarketScore.js';
import NodeCache from 'node-cache';
import EventEmitter from 'events';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const realtimeMonitorService = {
  async initializeMonitoring() {
    try {
      // Get initial states
      const monitorData = await marketMonitorService.monitorMarketConditions();
      const baseScore = await enhancedMarketScore.calculateEnhancedScore();
      
      // Store initial states
      cache.set('previous_monitor_state', monitorData);
      cache.set('previous_score_state', baseScore);
      
      return {
        monitoring: monitorData,
        score: baseScore,
        alerts: []
      };
    } catch (error) {
      console.error('Error initializing monitoring:', error);
      throw error;
    }
  },

  async updateMonitoring() {
    try {
      const prevMonitorState = cache.get('previous_monitor_state');
      const prevScoreState = cache.get('previous_score_state');
      
      // Get current states
      const currentMonitor = await marketMonitorService.monitorMarketConditions();
      const currentScore = await enhancedMarketScore.calculateEnhancedScore();
      
      // Generate alerts and adjustments
      const updates = this.analyzeStateChanges(
        currentMonitor,
        prevMonitorState,
        currentScore,
        prevScoreState
      );
      
      // Update cache
      cache.set('previous_monitor_state', currentMonitor);
      cache.set('previous_score_state', currentScore);
      
      return {
        monitoring: currentMonitor,
        score: this.adjustScore(currentScore, updates.adjustments),
        alerts: updates.alerts
      };
    } catch (error) {
      console.error('Error updating monitoring:', error);
      throw error;
    }
  },

  analyzeStateChanges(currentMonitor, prevMonitor, currentScore, prevScore) {
    const alerts = [];
    const adjustments = {
      regime: 0,
      correlation: 0,
      risk: 0
    };

    // Analyze regime changes
    if (currentMonitor.regimeAlerts?.alerts?.length > 0) {
      currentMonitor.regimeAlerts.alerts.forEach(alert => {
        if (alert.severity === 'high') {
          alerts.push({
            type: 'regime_change',
            severity: 'high',
            message: `Significant ${alert.type} change detected: ${alert.from} to ${alert.to}`,
            details: alert
          });
          adjustments.regime += alert.to === 'Risk-Off' ? -5 : 
                               alert.to === 'Risk-On' ? 5 : 0;
        }
      });
    }

    // Analyze correlation breakdowns
    if (currentMonitor.correlationAlerts?.alerts?.length > 0) {
      currentMonitor.correlationAlerts.alerts.forEach(alert => {
        if (alert.severity === 'high') {
          alerts.push({
            type: 'correlation_breakdown',
            severity: 'high',
            message: `Significant correlation change between ${alert.assets.join(' and ')}`,
            details: alert
          });
          adjustments.correlation += 
            Math.abs(alert.change) > 0.5 ? (alert.to < 0 ? 3 : -3) : 0;
        }
      });
    }

    // Analyze risk condition changes
    if (currentMonitor.riskAlerts?.alerts?.length > 0) {
      currentMonitor.riskAlerts.alerts.forEach(alert => {
        if (alert.severity === 'high') {
          alerts.push({
            type: 'risk_change',
            severity: 'high',
            message: `Significant risk level change: ${alert.from} to ${alert.to}`,
            details: alert
          });
          adjustments.risk += this.calculateRiskAdjustment(alert.from, alert.to);
        }
      });
    }

    return { alerts, adjustments };
  },

  calculateRiskAdjustment(fromLevel, toLevel) {
    const riskLevels = ['Low', 'Moderate', 'Elevated', 'High'];
    const fromIndex = riskLevels.indexOf(fromLevel);
    const toIndex = riskLevels.indexOf(toLevel);
    const change = toIndex - fromIndex;
    
    return change * -2.5; // -2.5 points per level of risk increase
  },

  adjustScore(baseScore, adjustments) {
    const totalAdjustment = Object.values(adjustments)
      .reduce((sum, adj) => sum + adj, 0);
    
    const adjustedScore = Math.min(100, Math.max(0, 
      baseScore.score + totalAdjustment
    ));

    return {
      ...baseScore,
      score: adjustedScore,
      adjustments: {
        original: baseScore.score,
        adjustment: totalAdjustment,
        components: adjustments,
        explanation: this.generateAdjustmentExplanation(adjustments)
      }
    };
  },

  generateAdjustmentExplanation(adjustments) {
    const explanations = [];
    
    if (adjustments.regime !== 0) {
      explanations.push(
        `Regime changes contributed ${Math.abs(adjustments.regime)} points ` +
        `${adjustments.regime > 0 ? 'positive' : 'negative'} adjustment`
      );
    }
    
    if (adjustments.correlation !== 0) {
      explanations.push(
        `Correlation changes contributed ${Math.abs(adjustments.correlation)} points ` +
        `${adjustments.correlation > 0 ? 'positive' : 'negative'} adjustment`
      );
    }
    
    if (adjustments.risk !== 0) {
      explanations.push(
        `Risk changes contributed ${Math.abs(adjustments.risk)} points ` +
        `${adjustments.risk > 0 ? 'positive' : 'negative'} adjustment`
      );
    }
    
    return explanations.length > 0 ? 
      explanations.join('. ') : 
      'No score adjustments needed based on current market conditions.';
  },

  getRealtimeInsights() {
    const monitorState = cache.get('previous_monitor_state');
    const scoreState = cache.get('previous_score_state');
    
    if (!monitorState || !scoreState) {
      return {
        status: 'initializing',
        message: 'Real-time monitoring is initializing.'
      };
    }

    return {
      status: 'active',
      lastUpdate: new Date().toISOString(),
      score: scoreState,
      monitoring: {
        regimes: this.summarizeRegimes(monitorState.regimeAlerts),
        correlations: this.summarizeCorrelations(monitorState.correlationAlerts),
        risks: this.summarizeRisks(monitorState.riskAlerts)
      }
    };
  },

  summarizeRegimes(regimeData) {
    if (!regimeData?.current) return null;
    
    return {
      current: regimeData.current[50], // Use 50-day regime as current
      changes: regimeData.changes,
      alerts: regimeData.alerts.length
    };
  },

  summarizeCorrelations(correlationData) {
    if (!correlationData?.current) return null;
    
    return {
      breakdowns: correlationData.breakdowns,
      alerts: correlationData.alerts.length,
      significantChanges: correlationData.alerts.filter(
        alert => alert.severity === 'high'
      ).length
    };
  },

  summarizeRisks(riskData) {
    if (!riskData?.current) return null;
    
    return {
      level: riskData.current.level,
      changes: riskData.changes,
      alerts: riskData.alerts.length
    };
  }
};

class RealTimeMonitor extends EventEmitter {
  constructor() {
    super();
    this.service = realtimeMonitorService;
    this.monitoringInterval = null;
  }

  startMonitoring(interval = 5000) {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const update = await this.service.updateMonitoring();
        this.emit('update', update);
      } catch (error) {
        this.emit('error', error);
      }
    }, interval);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

const monitor = new RealTimeMonitor();
export default monitor;