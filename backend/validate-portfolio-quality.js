// PORTFOLIO DATA QUALITY VALIDATOR - Run comprehensive validation on all stocks
// Run with: node validate-portfolio-quality.js

import portfolioDataQualityService from './src/services/portfolioDataQualityService.js';
import fs from 'fs/promises';
import path from 'path';

async function runPortfolioValidation() {
  console.log('🚀 PORTFOLIO DATA QUALITY VALIDATION');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📊 Comprehensive validation of EDGAR data quality for all stocks');
  console.log('');
  
  try {
    // Option 1: Validate specific tickers (modify this list as needed)
    const customTickers = [
      'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'BRK.B', 
      'JNJ', 'V', 'JPM', 'WMT', 'UNH', 'PG', 'HD', 'MA', 'DIS', 'PYPL', 
      'BAC', 'ADBE'
    ];
    
    // Option 2: Auto-detect from sample-portfolio.csv (uncomment to use)
    // const customTickers = [];
    
    console.log('⏳ Starting validation...\n');
    
    // Run comprehensive validation
    const report = await portfolioDataQualityService.validatePortfolioDataQuality(customTickers);
    
    // Display results
    displayValidationResults(report);
    
    // Save detailed report
    await saveDetailedReport(report);
    
    // Display recommendations
    displayRecommendations(report);
    
    console.log('\n✅ Portfolio validation completed successfully!');
    console.log(`📁 Detailed report saved to: ./data/portfolio-quality-report.json`);
    
  } catch (error) {
    console.error('\n❌ Portfolio validation failed:', error.message);
    console.error(error.stack);
  }
}

function displayValidationResults(report) {
  console.log('📈 VALIDATION RESULTS');
  console.log('─'.repeat(50));
  
  // Overall summary
  console.log(`🎯 Overall Health Score: ${report.summary.overallHealthScore}%`);
  console.log(`📊 Total Stocks Validated: ${report.validatedStocks}/${report.totalStocks}`);
  console.log('');
  
  // Quality distribution
  console.log('📊 QUALITY DISTRIBUTION:');
  console.log(`  🟢 HIGH Quality:   ${report.highQuality} stocks (${report.summary.qualityDistribution.HIGH}%)`);
  console.log(`  🟡 MEDIUM Quality: ${report.mediumQuality} stocks (${report.summary.qualityDistribution.MEDIUM}%)`);
  console.log(`  🔴 LOW Quality:    ${report.lowQuality} stocks (${report.summary.qualityDistribution.LOW}%)`);
  console.log(`  💥 FAILED:         ${report.failed} stocks (${report.summary.qualityDistribution.FAILED}%)`);
  console.log('');
  
  // Issues summary
  console.log('⚠️ ISSUES SUMMARY:');
  console.log(`  📅 Data Freshness Issues: ${report.summary.freshnessIssues} stocks`);
  console.log(`  📊 Completeness Issues:   ${report.summary.dataCompletenessIssues} stocks`);
  console.log(`  🔧 Needs Attention:       ${report.summary.stocksNeedingAttention} stocks`);
  console.log('');
  
  // Top performing stocks
  const highQualityStocks = report.stockResults
    .filter(s => s.overallQuality === 'HIGH')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);
  
  if (highQualityStocks.length > 0) {
    console.log('🏆 TOP QUALITY STOCKS:');
    highQualityStocks.forEach(stock => {
      console.log(`  ✅ ${stock.ticker}: ${stock.score}% quality score`);
    });
    console.log('');
  }
  
  // Stocks needing attention
  const problemStocks = report.stockResults
    .filter(s => s.overallQuality === 'LOW' || s.overallQuality === 'FAILED')
    .sort((a, b) => (a.score || 0) - (b.score || 0));
  
  if (problemStocks.length > 0) {
    console.log('🚨 STOCKS NEEDING ATTENTION:');
    problemStocks.forEach(stock => {
      console.log(`  ❌ ${stock.ticker}: ${stock.overallQuality} (${stock.score || 0}% score)`);
      if (stock.issues && stock.issues.length > 0) {
        console.log(`      Issues: ${stock.issues.slice(0, 2).join(', ')}${stock.issues.length > 2 ? '...' : ''}`);
      }
    });
    console.log('');
  }
  
  // Data freshness details
  console.log('📅 DATA FRESHNESS OVERVIEW:');
  const stocksWithFreshness = report.stockResults.filter(s => s.dataFreshness && s.dataFreshness.latestQuarterly);
  if (stocksWithFreshness.length > 0) {
    const avgAge = stocksWithFreshness.reduce((sum, s) => sum + (s.dataFreshness.quarterlyAge || 0), 0) / stocksWithFreshness.length;
    console.log(`  📊 Average Data Age: ${avgAge.toFixed(1)} months`);
    
    const recentStocks = stocksWithFreshness.filter(s => s.dataFreshness.quarterlyAge <= 3).length;
    const staleStocks = stocksWithFreshness.filter(s => s.dataFreshness.quarterlyAge > 6).length;
    
    console.log(`  🟢 Recent Data (≤3 months): ${recentStocks} stocks`);
    console.log(`  🔴 Stale Data (>6 months):   ${staleStocks} stocks`);
  }
  console.log('');
}

function displayRecommendations(report) {
  console.log('💡 RECOMMENDATIONS');
  console.log('─'.repeat(50));
  
  if (report.recommendations.length === 0) {
    console.log('🎉 No major issues detected! Your portfolio data quality is excellent.');
    return;
  }
  
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  console.log('');
  
  // Specific action items
  console.log('🔧 SUGGESTED ACTIONS:');
  
  const failedStocks = report.stockResults.filter(s => s.overallQuality === 'FAILED');
  if (failedStocks.length > 0) {
    console.log(`  1. Investigate ${failedStocks.length} failed stocks: ${failedStocks.map(s => s.ticker).join(', ')}`);
  }
  
  const staleStocks = report.stockResults.filter(s => 
    s.dataFreshness && s.dataFreshness.quarterlyAge > 6
  );
  if (staleStocks.length > 0) {
    console.log(`  2. Check for recent 10-Q filings for: ${staleStocks.map(s => s.ticker).join(', ')}`);
  }
  
  const incompleteStocks = report.stockResults.filter(s => 
    s.completeness && s.completeness.missing.length > 0
  );
  if (incompleteStocks.length > 0) {
    console.log(`  3. Review EDGAR concept mappings for: ${incompleteStocks.map(s => s.ticker).join(', ')}`);
  }
  
  if (parseFloat(report.summary.overallHealthScore) < 80) {
    console.log('  4. Consider running data quality validation weekly to monitor improvements');
  }
  
  console.log('  5. Use the detailed JSON report for specific stock-level remediation');
}

async function saveDetailedReport(report) {
  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save main report
    const reportPath = path.join(dataDir, 'portfolio-quality-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Create a summary CSV for easy viewing
    const csvPath = path.join(dataDir, 'portfolio-quality-summary.csv');
    const csvContent = createSummaryCsv(report);
    await fs.writeFile(csvPath, csvContent);
    
    console.log(`📁 Reports saved:`);
    console.log(`   📊 Detailed: ${reportPath}`);
    console.log(`   📋 Summary:  ${csvPath}`);
    
  } catch (error) {
    console.error('❌ Failed to save reports:', error.message);
  }
}

function createSummaryCsv(report) {
  const headers = [
    'Ticker', 'Quality', 'Score', 'Quarterly_Count', 'Annual_Count', 
    'Latest_Quarterly', 'Data_Age_Months', 'Issues_Count', 'Top_Issue'
  ];
  
  const rows = report.stockResults.map(stock => {
    const quarterlyCount = stock.completeness?.details?.Revenues?.quarterly || 0;
    const annualCount = stock.completeness?.details?.Revenues?.annual || 0;
    const latestQuarterly = stock.dataFreshness?.latestQuarterly || 'N/A';
    const dataAge = stock.dataFreshness?.quarterlyAge || 'N/A';
    const issuesCount = stock.issues?.length || 0;
    const topIssue = stock.issues?.[0] || 'None';
    
    return [
      stock.ticker,
      stock.overallQuality,
      stock.score || 0,
      quarterlyCount,
      annualCount,
      latestQuarterly,
      dataAge,
      issuesCount,
      `"${topIssue.substring(0, 50)}${topIssue.length > 50 ? '...' : ''}"`
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

// Add real-time monitoring capabilities
async function setupContinuousMonitoring() {
  console.log('\n🔄 CONTINUOUS MONITORING SETUP');
  console.log('─'.repeat(50));
  console.log('Setting up automated data quality monitoring...');
  
  // Create monitoring script
  const monitoringScript = `
// Automated Portfolio Data Quality Monitor
// This script runs daily to check for data quality degradation

import portfolioDataQualityService from './src/services/portfolioDataQualityService.js';

async function dailyQualityCheck() {
  try {
    const summary = await portfolioDataQualityService.getPortfolioHealthSummary();
    
    console.log(\`\${new Date().toISOString()}: Portfolio Health Score: \${summary.overallScore}%\`);
    
    if (parseFloat(summary.overallScore) < 75) {
      console.log('⚠️ ALERT: Portfolio data quality below threshold!');
      // Add your alerting logic here (email, Slack, etc.)
    }
    
    if (summary.issuesCount > 5) {
      console.log(\`⚠️ ALERT: \${summary.issuesCount} stocks need attention!\`);
    }
    
  } catch (error) {
    console.error('❌ Daily quality check failed:', error.message);
  }
}

// Run daily check
dailyQualityCheck();
`;
  
  const monitoringPath = path.join(process.cwd(), 'scripts', 'daily-quality-monitor.js');
  await fs.mkdir(path.dirname(monitoringPath), { recursive: true });
  await fs.writeFile(monitoringPath, monitoringScript);
  
  console.log(`✅ Monitoring script created: ${monitoringPath}`);
  console.log('💡 Schedule this script to run daily using Windows Task Scheduler');
}

// Run the validation
runPortfolioValidation()
  .then(() => setupContinuousMonitoring())
  .catch(console.error);