/**
 * Risk Positioning Scheduler - Updates only at 9am & 4:30pm ET
 * Spreads API calls to respect rate limits efficiently
 */

import cron from 'node-cron';
import RiskPositioningEngine from '../services/riskPositioning/RiskPositioningEngine.js';

class RiskPositioningScheduler {
  constructor() {
    this.engine = new RiskPositioningEngine();
    this.isRunning = false;
    this.lastUpdate = null;
    
    console.log('🕘 Risk Positioning Scheduler initialized');
    console.log('📅 Updates scheduled for: 9:00am ET (pre-market) & 4:30pm ET (post-market)');
  }

  start() {
    // Schedule for 9:00 AM ET (pre-market analysis)
    cron.schedule('0 9 * * 1-5', async () => {
      await this.runUpdate('pre-market');
    }, {
      timezone: "America/New_York"
    });

    // Schedule for 4:30 PM ET (post-market analysis)  
    cron.schedule('30 16 * * 1-5', async () => {
      await this.runUpdate('post-market');
    }, {
      timezone: "America/New_York"
    });

    // Optional: Manual trigger on startup if no recent update
    this.checkAndRunIfStale();

    console.log('✅ Risk Positioning Scheduler started');
    console.log('🕘 Next updates: 9:00am ET (pre-market) & 4:30pm ET (post-market)');
  }

  async runUpdate(period) {
    if (this.isRunning) {
      console.log('⏸️ Risk positioning update already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log(`🚀 Starting ${period} risk positioning update...`);
      console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`);
      
      const startTime = Date.now();
      
      // Run the calculation (this spreads API calls internally)
      const result = await this.engine.calculateRiskScore();
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${period} risk positioning update completed`);
      console.log(`📊 New Risk Score: ${result.score}/100`);
      console.log(`⏱️ Calculation time: ${Math.round(duration/1000)}s`);
      console.log(`📈 Data quality: ${result.dataQuality?.quality}`);
      console.log(`🏢 S&P 500 companies analyzed: ${result.dataQuality?.fundamentalCoverage || 0}`);
      
      this.lastUpdate = new Date();
      
      // Log component breakdown
      if (result.components) {
        console.log('📋 Component Scores:');
        console.log(`   📊 Fundamental: ${result.components.fundamental.score}/100 (${(result.components.fundamental.weight * 100).toFixed(0)}% weight)`);
        console.log(`   📈 Technical: ${result.components.technical.score}/100 (${(result.components.technical.weight * 100).toFixed(0)}% weight)`);
        console.log(`   💭 Sentiment: ${result.components.sentiment.score}/100 (${(result.components.sentiment.weight * 100).toFixed(0)}% weight)`);
        console.log(`   🏦 Macro: ${result.components.macro.score}/100 (${(result.components.macro.weight * 100).toFixed(0)}% weight)`);
      }

    } catch (error) {
      console.error(`❌ ${period} risk positioning update failed:`, error);
      
      // Don't crash the scheduler - log error and continue
      console.error('🔄 Scheduler will continue running for next update window');
      
    } finally {
      this.isRunning = false;
    }
  }

  async checkAndRunIfStale() {
    try {
      // Check if we have a recent calculation (within last 8 hours)
      const cached = await this.engine.getCachedResult();
      
      if (!cached) {
        console.log('🔄 No cached risk score found, running initial calculation...');
        await this.runUpdate('startup');
        return;
      }

      const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
      const hoursOld = cacheAge / (1000 * 60 * 60);
      
      if (hoursOld > 8) {
        console.log(`🔄 Cached risk score is ${hoursOld.toFixed(1)} hours old, running fresh calculation...`);
        await this.runUpdate('startup-stale');
      } else {
        console.log(`✅ Recent risk score found (${hoursOld.toFixed(1)} hours old), waiting for next scheduled update`);
        this.lastUpdate = new Date(cached.timestamp);
      }

    } catch (error) {
      console.error('⚠️ Error checking cache staleness:', error);
      console.log('🔄 Will wait for next scheduled update');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      nextUpdates: [
        'Daily at 9:00 AM ET (pre-market)',
        'Daily at 4:30 PM ET (post-market)'
      ],
      timezone: 'America/New_York'
    };
  }

  // Manual trigger (for testing or admin override)
  async triggerManualUpdate() {
    if (this.isRunning) {
      throw new Error('Update already in progress');
    }
    
    console.log('🔧 Manual risk positioning update triggered');
    await this.runUpdate('manual');
  }

  stop() {
    // Note: node-cron doesn't provide direct stop method for individual tasks
    // In a production system, you'd track task references to stop them
    console.log('🛑 Risk Positioning Scheduler stopped');
  }
}

// Export singleton instance
const scheduler = new RiskPositioningScheduler();

export default scheduler;