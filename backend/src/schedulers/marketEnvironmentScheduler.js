/**
 * Scheduler for Market Environment V2 Services
 * Handles nightly S&P 500 aggregation and periodic updates
 */

import cron from 'node-cron';
import sp500AggregationServiceV2 from '../services/marketEnvironment/sp500AggregationServiceV2.js';
import marketPhaseServiceV2 from '../services/marketEnvironment/marketPhaseServiceV2.js';
import breadthServiceV2 from '../services/marketEnvironment/breadthServiceV2.js';
import sentimentServiceV2 from '../services/marketEnvironment/sentimentServiceV2.js';

class MarketEnvironmentScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initialize all scheduled jobs
   */
  init() {
    console.log('🕐 Initializing Market Environment V2 scheduler...');

    // Nightly S&P 500 aggregation at 3 AM ET
    this.scheduleNightlyAggregation();

    // Periodic updates during market hours
    this.scheduleMarketHourUpdates();

    console.log('✅ Market Environment V2 scheduler initialized');
  }

  /**
   * Schedule nightly S&P 500 fundamentals aggregation
   * Runs at 3 AM ET every day
   */
  scheduleNightlyAggregation() {
    const job = cron.schedule('0 3 * * *', async () => {
      console.log('🌙 Starting scheduled S&P 500 aggregation at', new Date().toISOString());
      
      try {
        const result = await sp500AggregationServiceV2.runNightlyAggregation();
        console.log('✅ Nightly aggregation completed successfully');
        console.log(`📊 Analyzed ${result.dataQuality.companiesAnalyzed} companies`);
      } catch (error) {
        console.error('❌ Nightly aggregation failed:', error);
        // TODO: Send alert to monitoring system
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.push(job);
    console.log('📅 Scheduled: Nightly S&P 500 aggregation at 3 AM ET');
  }

  /**
   * Schedule updates during market hours
   * Runs every 15 minutes from 9:30 AM to 4:00 PM ET on weekdays
   */
  scheduleMarketHourUpdates() {
    // Every 15 minutes during market hours
    const job = cron.schedule('*/15 9-16 * * 1-5', async () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Skip if before 9:30 AM or after 4:00 PM ET
      if (hour === 9 && minute < 30) return;
      if (hour === 16 && minute > 0) return;
      
      console.log('📊 Updating market environment data at', now.toISOString());
      
      try {
        // Update phase, breadth, and sentiment in parallel
        // These have their own caching, so won't hit APIs unnecessarily
        await Promise.all([
          marketPhaseServiceV2.detectPhase(),
          breadthServiceV2.calculateBreadth(),
          sentimentServiceV2.analyzeSentiment()
        ]);
        
        console.log('✅ Market hour update completed');
      } catch (error) {
        console.error('❌ Market hour update failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.push(job);
    console.log('📅 Scheduled: Market hour updates every 15 minutes (9:30 AM - 4:00 PM ET)');
  }

  /**
   * Schedule a one-time aggregation for initial setup
   * Runs 1 minute after server start if no data exists
   */
  async scheduleInitialAggregation() {
    console.log('🔍 Checking if initial aggregation is needed...');
    
    try {
      const existingData = await sp500AggregationServiceV2.getLatestAggregation();
      
      if (existingData.dataQuality?.status === 'STALE' || 
          existingData.dataQuality?.status === 'DEFAULT') {
        console.log('⚠️ S&P 500 data is stale or missing. Scheduling initial aggregation...');
        
        // Schedule for 1 minute from now
        setTimeout(async () => {
          console.log('🚀 Running initial S&P 500 aggregation...');
          try {
            await sp500AggregationServiceV2.runNightlyAggregation();
            console.log('✅ Initial aggregation completed');
          } catch (error) {
            console.error('❌ Initial aggregation failed:', error);
          }
        }, 60000); // 1 minute delay
      } else {
        console.log('✅ S&P 500 data is current. No initial aggregation needed.');
      }
    } catch (error) {
      console.error('Error checking data status:', error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('🛑 Stopping Market Environment V2 scheduler...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('✅ Scheduler stopped');
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus() {
    return {
      jobCount: this.jobs.length,
      jobs: this.jobs.map((job, index) => ({
        index,
        running: job.running !== undefined ? job.running : 'unknown'
      }))
    };
  }
}

// Create singleton instance
const scheduler = new MarketEnvironmentScheduler();

// Export for use in server
export default scheduler;

// Auto-initialize if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  scheduler.init();
  scheduler.scheduleInitialAggregation();
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n⏹️ Shutting down scheduler...');
    scheduler.stop();
    process.exit(0);
  });
}
