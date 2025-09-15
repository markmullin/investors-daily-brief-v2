import cron from 'node-cron';
// Removed import of dataCollector.js since S&P fundamentals carousel has been removed
import { advancedDataQualityCollector } from './advancedDataQualityCollector.js';

class FundamentalScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRunDate = null;
    this.nextRunDate = null;
    this.preferAdvancedCollection = true; // Default to advanced collection
    this.scheduledTask = null; // Store the cron task for stopping
    
    console.log('⏰ [FUNDAMENTAL SCHEDULER] Initialized for weekly Saturday night runs');
    console.log('🧬 [SCHEDULER] Advanced quality collector enabled by default');
  }

  /**
   * Start the scheduler - runs every Saturday at 11 PM with advanced data quality controls
   */
  startScheduler() {
    try {
      // Schedule for every Saturday at 11:00 PM
      // Cron format: second minute hour day-of-month month day-of-week
      // 0 0 23 * * 6 = Every Saturday at 11:00 PM
      const cronExpression = '0 0 23 * * 6';
      
      this.scheduledTask = cron.schedule(cronExpression, async () => {
        await this.runWeeklyCollection();
      }, {
        scheduled: false, // Don't start immediately
        timezone: 'America/New_York' // Adjust timezone as needed
      });
      
      // Start the scheduled task
      this.scheduledTask.start();
      
      this.nextRunDate = this.getNextSaturdayNight();
      
      console.log('✅ [FUNDAMENTAL SCHEDULER] Scheduler started with advanced quality controls');
      console.log(`📅 [SCHEDULER] Next run: ${this.nextRunDate}`);
      console.log(`🧬 [SCHEDULER] Collection method: ${this.preferAdvancedCollection ? 'Advanced Quality Collector' : 'Legacy Enhanced Filtering'}`);
      
      return {
        success: true,
        cronExpression,
        nextRun: this.nextRunDate,
        timezone: 'America/New_York',
        collectionMethod: this.preferAdvancedCollection ? 'advanced_quality' : 'legacy_enhanced',
        features: this.preferAdvancedCollection ? [
          'Machine learning anomaly detection',
          'Statistical quality analysis', 
          'Peer group validation',
          'Data completeness scoring',
          'Multi-method outlier detection',
          'Bulletproof save verification'
        ] : [
          'Enhanced filtering with hard caps',
          'Basic anomaly filtering'
        ]
      };
      
    } catch (error) {
      console.error('❌ [FUNDAMENTAL SCHEDULER] Failed to start scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler properly
   */
  stopScheduler() {
    try {
      if (this.scheduledTask) {
        this.scheduledTask.stop();
        this.scheduledTask = null;
        console.log('✅ [FUNDAMENTAL SCHEDULER] Scheduler stopped successfully');
        return { success: true, message: 'Fundamental scheduler stopped' };
      } else {
        console.log('⚠️ [FUNDAMENTAL SCHEDULER] No active scheduler to stop');
        return { success: true, message: 'No active scheduler found' };
      }
    } catch (error) {
      console.error('❌ [FUNDAMENTAL SCHEDULER] Error stopping scheduler:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run weekly collection with advanced quality controls
   */
  async runWeeklyCollection() {
    if (this.isRunning) {
      console.warn('⚠️ [FUNDAMENTAL SCHEDULER] Collection already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      console.log('🚀 [FUNDAMENTAL SCHEDULER] Starting weekly fundamental data collection...');
      console.log(`🧬 [SCHEDULER] Using Advanced Quality Collector`);
      
      let result;
      
      // Only use advanced quality collector since dataCollector.js has been removed
      console.log('🧬 [SCHEDULER] Running advanced quality collection...');
      try {
        result = await advancedDataQualityCollector.collectWithQualityControls();
        
        console.log('✅ [SCHEDULER] Advanced quality collection completed successfully!');
        console.log(`📊 [SCHEDULER] Quality Analysis: ${result.anomaliesDetected} anomalies detected, quality score: ${result.dataQualityScore}`);
        
      } catch (advancedError) {
        console.error('❌ [SCHEDULER] Advanced collection failed:', advancedError.message);
        throw advancedError; // No fallback since dataCollector.js has been removed
      }
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      this.lastRunDate = startTime;
      this.nextRunDate = this.getNextSaturdayNight();
      
      // Enhanced logging
      console.log('✅ [FUNDAMENTAL SCHEDULER] Weekly collection completed successfully!');
      console.log(`⏱️ [SCHEDULER] Duration: ${Math.round(duration / 1000 / 60)} minutes`);
      console.log(`📊 [SCHEDULER] Companies processed: ${result.companiesProcessed || result.companiesAttempted}`);
      console.log(`📊 [SCHEDULER] Companies successful: ${result.companiesSuccessful || result.companiesSaved}`);
      
      if (result.dataQualityScore) {
        console.log(`🧬 [SCHEDULER] Data Quality Score: ${result.dataQualityScore}/100`);
        console.log(`🧬 [SCHEDULER] Anomalies detected: ${result.anomaliesDetected}`);
      }
      
      console.log(`📅 [SCHEDULER] Next run: ${this.nextRunDate}`);
      
      return {
        success: true,
        duration,
        collectionMethod: 'advanced_quality',
        stats: result,
        nextRun: this.nextRunDate,
        dataQuality: result.dataQualityScore || 'Enhanced Collection',
        methodology: 'Advanced Quality Controls'
      };
      
    } catch (error) {
      console.error('❌ [FUNDAMENTAL SCHEDULER] Weekly collection failed:', error);
      throw error;
      
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual advanced collection trigger
   */
  async runManualAdvancedCollection() {
    console.log('🧬 [SCHEDULER] Running manual advanced quality collection...');
    
    try {
      this.isRunning = true;
      const startTime = new Date();
      
      const result = await advancedDataQualityCollector.collectWithQualityControls();
      
      const duration = new Date() - startTime;
      
      console.log('✅ [SCHEDULER] Manual advanced collection completed');
      console.log(`⏱️ Duration: ${Math.round(duration / 1000 / 60)} minutes`);
      console.log(`🧬 Quality score: ${result.dataQualityScore}/100, anomalies: ${result.anomaliesDetected}`);
      
      return {
        ...result,
        duration,
        manual: true,
        collectionMethod: 'advanced_quality'
      };
      
    } catch (error) {
      console.error('❌ [SCHEDULER] Manual advanced collection failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for collection
   */
  async runManualCollection() {
    console.log(`🔧 [SCHEDULER] Running manual collection...`);
    
    try {
      return await this.runManualAdvancedCollection();
    } catch (error) {
      console.error('❌ [SCHEDULER] Manual collection failed:', error);
      throw error;
    }
  }

  /**
   * Test collection with advanced methods
   */
  async runTestCollection() {
    console.log(`🧪 [SCHEDULER] Running test collection...`);
    
    try {
      // Test advanced collection
      console.log('🧬 [TEST] Testing advanced quality collector...');
      const result = await advancedDataQualityCollector.collectWithQualityControls();
      
      console.log('✅ [TEST] Advanced quality test completed');
      console.log(`📊 [TEST] Quality results: score ${result.dataQualityScore}/100, ${result.anomaliesDetected} anomalies`);
      
      return {
        ...result,
        testMode: true,
        collectionMethod: 'advanced_quality'
      };
      
    } catch (error) {
      console.error('❌ [SCHEDULER] Test collection failed:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status with advanced features
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunDate: this.lastRunDate,
      nextRunDate: this.nextRunDate,
      schedulerActive: !!this.scheduledTask,
      collectionMethod: 'advanced_quality',
      features: {
        advanced_quality: {
          enabled: true,
          description: 'Machine learning and statistical quality analysis',
          benefits: [
            'ML-based anomaly detection',
            'Statistical outlier analysis with multiple methods',
            'Peer group validation and ranking',
            'Data completeness scoring',
            'Bulletproof save verification',
            'Transparent quality scoring'
          ]
        }
      },
      saturday_collection: {
        time: '11:00 PM Eastern',
        next_run: this.nextRunDate,
        description: 'Automatic weekly collection with advanced quality controls'
      }
    };
  }

  /**
   * Calculate next Saturday night (11 PM)
   */
  getNextSaturdayNight() {
    const now = new Date();
    const nextSaturday = new Date(now);
    
    // Calculate days until next Saturday (6 = Saturday)
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(23, 0, 0, 0); // 11:00 PM
    
    return nextSaturday.toISOString();
  }
}

export default FundamentalScheduler;
