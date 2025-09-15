import NodeCache from 'node-cache';
import marketEnvironmentService from '../marketEnvironmentService.js';
import relationshipScoring from '../relationshipScoring.js';
import marketInsights from './marketInsights.js';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

const marketAlertService = {
  async initializeMonitoring() {
    try {
      const currentState = await this.getCurrentState();
      cache.set('previous_state', currentState);
      return {
        status: 'initialized',
        data: currentState
      };
    } catch (error) {
      console.error('Error initializing market monitoring:', error);
      throw error;
    }
  },

  async getCurrentState() {
    const [marketScore, relationships, insights] = await Promise.all([
      marketEnvironmentService.calculateMarketScore(),
      marketEnvironmentService.analyzeMarketRelationships(),
      marketInsights.generateMarketInsights()
    ]);

    return {
      marketScore,
      relationships,
      insights,
      timestamp: Date.now()
    };
  },

  async checkForAlerts() {
    try {
      const currentState = await this.getCurrentState();
      const previousState = cache.get('previous_state');

      if (!previousState) {
        cache.set('previous_state', currentState);
        return { alerts: [] };
      }

      const alerts = this.generateAlerts(currentState, previousState);
      cache.set('previous_state', currentState);

      return {
        alerts,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error checking for alerts:', error);
      throw error;
    }
  },

  generateAlerts(currentState, previousState) {
    const alerts = [];

    // Check for significant score changes
    const scoreDiff = currentState.marketScore.score - previousState.marketScore.score;
    if (Math.abs(scoreDiff) >= 5) {
      alerts.push({
        type: 'score_change',
        severity: Math.abs(scoreDiff) >= 10 ? 'high' : 'medium',
        message: `Market environment score has ${scoreDiff > 0 ? 'improved' : 'declined'} by ${Math.abs(scoreDiff).toFixed(1)} points`,
        details: {
          previousScore: previousState.marketScore.score,
          currentScore: currentState.marketScore.score,
          change: scoreDiff
        }
      });
    }

    // Check for relationship changes
    this.checkRelationshipChanges(
      currentState.relationships,
      previousState.relationships,
      alerts
    );

    // Check for regime changes
    this.checkRegimeChanges(
      currentState.marketScore,
      previousState.marketScore,
      alerts
    );

    return alerts;
  },

  checkRelationshipChanges(current, previous, alerts) {
    // Check industry relationships
    Object.entries(current.industry || {}).forEach(([key, currentData]) => {
      const previousData = previous.industry?.[key];
      if (!previousData) return;

      const strengthChange = 
        currentData.performance.trend.strength - 
        previousData.performance.trend.strength;

      if (Math.abs(strengthChange) >= 1.5) {
        alerts.push({
          type: 'relationship_change',
          severity: Math.abs(strengthChange) >= 2.5 ? 'high' : 'medium',
          message: `Significant change in ${key} relationship strength`,
          details: {
            relationship: key,
            type: 'industry',
            previousStrength: previousData.performance.trend.strength,
            currentStrength: currentData.performance.trend.strength,
            change: strengthChange
          }
        });
      }
    });

    // Check macro relationships
    Object.entries(current.macro || {}).forEach(([key, currentData]) => {
      const previousData = previous.macro?.[key];
      if (!previousData) return;

      const avgStrengthChange = this.calculateAverageStrengthChange(
        currentData.performance.trends.strength,
        previousData.performance.trends.strength
      );

      if (Math.abs(avgStrengthChange) >= 1.5) {
        alerts.push({
          type: 'relationship_change',
          severity: Math.abs(avgStrengthChange) >= 2.5 ? 'high' : 'medium',
          message: `Significant change in ${key} macro relationship`,
          details: {
            relationship: key,
            type: 'macro',
            change: avgStrengthChange
          }
        });
      }
    });
  },

  checkRegimeChanges(current, previous, alerts) {
    const currentRegime = this.determineMarketRegime(current);
    const previousRegime = this.determineMarketRegime(previous);

    if (currentRegime !== previousRegime) {
      alerts.push({
        type: 'regime_change',
        severity: 'high',
        message: `Market regime has changed from ${previousRegime} to ${currentRegime}`,
        details: {
          previous: previousRegime,
          current: currentRegime,
          timestamp: Date.now()
        }
      });
    }
  },

  calculateAverageStrengthChange(currentStrength, previousStrength) {
    if (!Array.isArray(currentStrength) || !Array.isArray(previousStrength)) {
      return 0;
    }

    const changes = currentStrength.map((curr, idx) => 
      curr - (previousStrength[idx] || 0)
    );

    return changes.reduce((a, b) => a + b, 0) / changes.length;
  },

  determineMarketRegime(scoreData) {
    const score = scoreData.score;
    const technicalScore = scoreData.components?.technical?.score || 0;
    const breadthScore = scoreData.components?.breadth?.score || 0;

    if (score >= 80 && technicalScore >= 70 && breadthScore >= 70) {
      return 'Strong Bull';
    } else if (score >= 60 && technicalScore >= 50 && breadthScore >= 50) {
      return 'Bull';
    } else if (score >= 40 && technicalScore >= 40 && breadthScore >= 40) {
      return 'Neutral';
    } else if (score >= 20) {
      return 'Bear';
    } else {
      return 'Strong Bear';
    }
  }
};

export default marketAlertService;
