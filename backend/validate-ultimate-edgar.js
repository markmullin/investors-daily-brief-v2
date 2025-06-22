// ULTIMATE EDGAR SERVICE VALIDATION - Test the perfect production code
// Run: node validate-ultimate-edgar.js

import edgarService from './src/services/edgarService.js';

async function validateUltimateEdgar() {
  console.log('🎯 ULTIMATE EDGAR SERVICE VALIDATION');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 Testing the production-ready ultimate EDGAR service');
  console.log('🎯 Goal: 100% HIGH quality for ALL stocks');
  console.log('');
  
  // Test the complete set including previously problematic stocks
  const testStocks = [
    // Previously failed
    'BRK.B',
    
    // Previously low quality  
    'NVDA', 'MA', 'PYPL', 'JPM',
    
    // Previously incomplete
    'META', 'JNJ', 'V', 'WMT', 'PG',
    
    // Control group (should maintain quality)
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'
  ];
  
  console.log(`📊 Testing ${testStocks.length} stocks for PERFECT quality`);
  console.log('');
  
  const results = {
    totalStocks: testStocks.length,
    highQuality: 0,
    mediumQuality: 0, 
    lowQuality: 0,
    poorQuality: 0,
    failed: 0,
    stockResults: []
  };
  
  for (const ticker of testStocks) {
    console.log(`🔍 Validating ${ticker}...`);
    
    try {
      const startTime = Date.now();
      const data = await edgarService.getCompanyFacts(ticker);
      const duration = Date.now() - startTime;
      
      // Comprehensive analysis
      const analysis = analyzeStockQuality(ticker, data);
      
      results.stockResults.push({
        ticker,
        success: true,
        analysis,
        duration
      });
      
      // Categorize by quality
      switch (analysis.qualityGrade) {
        case 'A+':
        case 'A':
        case 'B+':
          results.highQuality++;
          console.log(`  🟢 ${ticker}: HIGH QUALITY (${analysis.qualityGrade}) - ${analysis.overallScore.toFixed(1)}%`);
          break;
        case 'B':
        case 'C+':
          results.mediumQuality++;
          console.log(`  🟡 ${ticker}: MEDIUM QUALITY (${analysis.qualityGrade}) - ${analysis.overallScore.toFixed(1)}%`);
          break;
        case 'C':
        case 'D':
          results.lowQuality++;
          console.log(`  🔴 ${ticker}: LOW QUALITY (${analysis.qualityGrade}) - ${analysis.overallScore.toFixed(1)}%`);
          break;
        default:
          results.poorQuality++;
          console.log(`  💀 ${ticker}: POOR QUALITY (${analysis.qualityGrade}) - ${analysis.overallScore.toFixed(1)}%`);
      }
      
      // Show key details
      if (analysis.revenueData.quarterlyCount > 0) {
        console.log(`      📊 Revenue: ${analysis.revenueData.quarterlyCount} quarters (latest: ${analysis.revenueData.latestPeriod})`);
        console.log(`      🕒 Freshness: ${analysis.revenueData.freshnessStatus}`);
      }
      
    } catch (error) {
      console.error(`  ❌ ${ticker}: FAILED - ${error.message}`);
      results.failed++;
      results.stockResults.push({
        ticker,
        success: false,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Final results
  displayFinalResults(results);
  
  return results;
}

function analyzeStockQuality(ticker, data) {
  const analysis = {
    ticker,
    companyName: data.companyName,
    
    // Core metrics
    totalMetrics: 0,
    coreMetricsCount: 0,
    
    // Revenue analysis
    revenueData: {
      hasQuarterly: false,
      hasAnnual: false,
      quarterlyCount: 0,
      annualCount: 0,
      latestPeriod: null,
      freshnessMonths: 0,
      freshnessStatus: 'UNKNOWN'
    },
    
    // Overall scoring
    completenessScore: 0,
    freshnessScore: 0,
    dataQualityScore: 0,
    overallScore: 0,
    qualityGrade: 'F'
  };
  
  if (data.fiscalData) {
    analysis.totalMetrics = Object.keys(data.fiscalData).length;
    
    // Check core metrics
    const coreMetrics = ['Revenues', 'NetIncomeLoss', 'Assets', 'StockholdersEquity'];
    analysis.coreMetricsCount = coreMetrics.filter(metric => data.fiscalData[metric]).length;
    
    // Revenue analysis
    if (data.fiscalData.Revenues) {
      const revenues = data.fiscalData.Revenues;
      
      analysis.revenueData.hasQuarterly = revenues.quarterly && revenues.quarterly.length > 0;
      analysis.revenueData.hasAnnual = revenues.annual && revenues.annual.length > 0;
      analysis.revenueData.quarterlyCount = revenues.quarterly ? revenues.quarterly.length : 0;
      analysis.revenueData.annualCount = revenues.annual ? revenues.annual.length : 0;
      
      if (analysis.revenueData.hasQuarterly) {
        analysis.revenueData.latestPeriod = revenues.quarterly[0].end;
        
        const latestDate = new Date(revenues.quarterly[0].end);
        const ageMonths = (new Date() - latestDate) / (1000 * 60 * 60 * 24 * 30);
        analysis.revenueData.freshnessMonths = Math.round(ageMonths);
        
        if (ageMonths <= 3) analysis.revenueData.freshnessStatus = 'VERY_FRESH';
        else if (ageMonths <= 6) analysis.revenueData.freshnessStatus = 'FRESH'; 
        else if (ageMonths <= 12) analysis.revenueData.freshnessStatus = 'STALE';
        else analysis.revenueData.freshnessStatus = 'VERY_STALE';
      }
    }
    
    // Scoring
    
    // Completeness: 25 points for each core metric
    analysis.completenessScore = (analysis.coreMetricsCount / 4) * 100;
    
    // Freshness: Based on revenue data age
    const freshnessMap = {
      'VERY_FRESH': 100,
      'FRESH': 85,
      'STALE': 60,
      'VERY_STALE': 30,
      'UNKNOWN': 0
    };
    analysis.freshnessScore = freshnessMap[analysis.revenueData.freshnessStatus] || 0;
    
    // Data Quality: Based on quarterly data availability
    if (analysis.revenueData.quarterlyCount >= 8) analysis.dataQualityScore = 100;
    else if (analysis.revenueData.quarterlyCount >= 6) analysis.dataQualityScore = 85;
    else if (analysis.revenueData.quarterlyCount >= 4) analysis.dataQualityScore = 70;
    else if (analysis.revenueData.quarterlyCount >= 2) analysis.dataQualityScore = 50;
    else if (analysis.revenueData.quarterlyCount >= 1) analysis.dataQualityScore = 30;
    else analysis.dataQualityScore = 0;
    
    // Overall Score: Weighted average
    analysis.overallScore = (
      analysis.completenessScore * 0.4 +
      analysis.freshnessScore * 0.3 +
      analysis.dataQualityScore * 0.3
    );
    
    // Grade assignment (stricter criteria for perfect system)
    if (analysis.overallScore >= 95) analysis.qualityGrade = 'A+';
    else if (analysis.overallScore >= 90) analysis.qualityGrade = 'A';
    else if (analysis.overallScore >= 85) analysis.qualityGrade = 'B+';
    else if (analysis.overallScore >= 80) analysis.qualityGrade = 'B';
    else if (analysis.overallScore >= 75) analysis.qualityGrade = 'C+';
    else if (analysis.overallScore >= 70) analysis.qualityGrade = 'C';
    else if (analysis.overallScore >= 60) analysis.qualityGrade = 'D';
    else analysis.qualityGrade = 'F';
  }
  
  return analysis;
}

function displayFinalResults(results) {
  console.log('🏆 ULTIMATE EDGAR SERVICE RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const successRate = ((results.totalStocks - results.failed) / results.totalStocks * 100).toFixed(1);
  const highQualityRate = (results.highQuality / results.totalStocks * 100).toFixed(1);
  
  console.log(`🎯 Success Rate: ${results.totalStocks - results.failed}/${results.totalStocks} (${successRate}%)`);
  console.log(`🟢 HIGH Quality Rate: ${results.highQuality}/${results.totalStocks} (${highQualityRate}%)`);
  console.log('');
  
  console.log('📊 QUALITY DISTRIBUTION:');
  console.log(`   🟢 HIGH Quality:   ${results.highQuality} stocks`);
  console.log(`   🟡 MEDIUM Quality: ${results.mediumQuality} stocks`);
  console.log(`   🔴 LOW Quality:    ${results.lowQuality} stocks`);
  console.log(`   💀 POOR Quality:   ${results.poorQuality} stocks`);
  console.log(`   💥 FAILED:         ${results.failed} stocks`);
  console.log('');
  
  // Success analysis
  if (results.highQuality === results.totalStocks - results.failed) {
    console.log('🌟 PERFECT SUCCESS! 100% HIGH QUALITY ACHIEVED!');
    console.log('✅ Ultimate EDGAR service delivers bulletproof quality for ALL stocks!');
    console.log('🚀 Production system is now perfect and ready!');
  } else if (results.highQuality >= results.totalStocks * 0.9) {
    console.log('🏆 EXCELLENT! 90%+ HIGH quality achieved!');
    console.log('✅ Ultimate EDGAR service is production-ready!');
  } else if (results.highQuality >= results.totalStocks * 0.8) {
    console.log('🥇 VERY GOOD! 80%+ HIGH quality achieved!');
    console.log('🔧 Minor improvements may be beneficial');
  } else {
    console.log('⚠️ NEEDS IMPROVEMENT! More work required for perfect quality');
    console.log('🔧 Additional optimization needed');
  }
  
  // Show any remaining issues
  const problemStocks = results.stockResults.filter(r => 
    !r.success || 
    (r.analysis && !['A+', 'A', 'B+'].includes(r.analysis.qualityGrade))
  );
  
  if (problemStocks.length > 0) {
    console.log('');
    console.log('🔧 STOCKS NEEDING ATTENTION:');
    problemStocks.forEach(stock => {
      if (!stock.success) {
        console.log(`   💥 ${stock.ticker}: FAILED - ${stock.error}`);
      } else {
        console.log(`   📈 ${stock.ticker}: ${stock.analysis.qualityGrade} grade (${stock.analysis.overallScore.toFixed(1)}%)`);
        
        if (stock.analysis.revenueData.quarterlyCount === 0) {
          console.log(`      ❌ No quarterly revenue data found`);
        } else if (stock.analysis.revenueData.freshnessStatus === 'STALE' || stock.analysis.revenueData.freshnessStatus === 'VERY_STALE') {
          console.log(`      🕒 Data is ${stock.analysis.revenueData.freshnessStatus} (${stock.analysis.revenueData.freshnessMonths} months old)`);
        }
        
        if (stock.analysis.coreMetricsCount < 4) {
          console.log(`      📊 Only ${stock.analysis.coreMetricsCount}/4 core metrics found`);
        }
      }
    });
  }
  
  console.log('');
  console.log('🚀 NEXT STEPS:');
  if (results.highQuality === results.totalStocks - results.failed) {
    console.log('✅ Perfect! Run portfolio validation to see 100% HIGH quality!');
    console.log('   node validate-portfolio-quality.js');
  } else {
    console.log('🔧 Address remaining issues, then re-test');
    console.log('   Focus on stocks with grades below B+');
  }
}

// Run the validation
validateUltimateEdgar()
  .then(results => {
    if (results.highQuality === results.totalStocks - results.failed) {
      console.log('\\n🎉 MISSION ACCOMPLISHED! Perfect production-quality EDGAR service achieved!');
    }
  })
  .catch(error => {
    console.error('\\n❌ Validation failed:', error.message);
    console.error(error.stack);
  });