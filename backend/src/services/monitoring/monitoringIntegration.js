import enhancedMarketScore from '../enhancedMarketScore.js';
import finalScoreIntegration from '../finalScoreIntegration.js';
import realtimeMonitorService from '../realtimeMonitorService.js';
import EventEmitter from 'events';

class MonitoringIntegration extends EventEmitter {
  constructor() {
    super();
    this.lastUpdate = Date.now();
    this.updateThreshold = 5000; // 5 seconds minimum between updates
    this.significantChangeThreshold = 2; // Score change threshold for notification
  }

  async initialize() {
    try {
      // Get initial scores
      const initialScores = await this.calculateInitialScores();
      this.lastScores = initialScores;

      // Set up real-time monitoring
      realtimeMonitorService.on('update', this.handleRealtimeUpdate.bind(this));
      
      return initialScores;
    } catch (error) {
      console.error('Error initializing monitoring integration:', error);
      throw error;
    }
  }

  async calculateInitialScores() {
    const [enhancedScore, finalScore] = await Promise.all([
      enhancedMarketScore.calculateEnhancedScore(),
      finalScoreIntegration.calculateFinalScore()
    ]);

    return {
      enhanced: enhancedScore,
      final: finalScore,
      timestamp: Date.now()
    };
  }

  async handleRealtimeUpdate(monitoringData) {
    try {
      // Check if enough time has passed since last update
      if (Date.now() - this.lastUpdate < this.updateThreshold) {
        return;
      }

      // Calculate new scores with real-time data
      const newScores = await this.calculateUpdatedScores(monitoringData);
      
      // Check for significant changes
      const changes = this.detectSignificantChanges(this.lastScores, newScores);
      
      if (changes.hasSignificantChanges) {
        this.emit('significantChange', {
          scores: newScores,
          changes: changes.details
        });
      }

      // Update stored scores
      this.lastScores = newScores;
      this.lastUpdate = Date.now();

      // Emit update event
      this.emit('scoresUpdated', newScores);
    } catch (error) {
      console.error('Error handling realtime update:', error);
      this.emit('error', error);
    }
  }

  async calculateUpdatedScores(monitoringData) {
    // Get fresh base scores
    const enhancedScore = await enhancedMarketScore.calculateEnhancedScore();
    
    // Update final score with monitoring data
    const finalScore = await finalScoreIntegration.calculateFinalScore();

    return {
      enhanced: enhancedScore,
      final: finalScore,
      monitoring: monitoringData,
      timestamp: Date.now()
    };
  }

  detectSignificantChanges(oldScores, newScores) {
    if (!oldScores || !newScores) {
      return { hasSignificantChanges: false, details: {} };
    }

    const changes = {
      hasSignificantChanges: false,
      details: {
        enhanced: {
          score: newScores.enhanced.score - oldScores.enhanced.score,
          significant: false
        },
        final: {
          score: newScores.final.score - oldScores.final.score,
          significant: false
        }
      }
    };

    // Check enhanced score changes
    if (Math.abs(changes.details.enhanced.score) >= this.significantChangeThreshold) {
      changes.details.enhanced.significant = true;
      changes.hasSignificantChanges = true;
    }

    // Check final score changes
    if (Math.abs(changes.details.final.score) >= this.significantChangeThreshold) {
      changes.details.final.significant = true;
      changes.hasSignificantChanges = true;
    }

    return changes;
  }

  getLatestScores() {
    return this.lastScores || null;
  }
}

const monitoringIntegration = new MonitoringIntegration();
export default monitoringIntegration;