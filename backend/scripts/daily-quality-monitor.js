
// Automated Portfolio Data Quality Monitor
// This script runs daily to check for data quality degradation

import portfolioDataQualityService from './src/services/portfolioDataQualityService.js';

async function dailyQualityCheck() {
  try {
    const summary = await portfolioDataQualityService.getPortfolioHealthSummary();
    
    console.log(`${new Date().toISOString()}: Portfolio Health Score: ${summary.overallScore}%`);
    
    if (parseFloat(summary.overallScore) < 75) {
      console.log('⚠️ ALERT: Portfolio data quality below threshold!');
      // Add your alerting logic here (email, Slack, etc.)
    }
    
    if (summary.issuesCount > 5) {
      console.log(`⚠️ ALERT: ${summary.issuesCount} stocks need attention!`);
    }
    
  } catch (error) {
    console.error('❌ Daily quality check failed:', error.message);
  }
}

// Run daily check
dailyQualityCheck();
