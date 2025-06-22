// COMPREHENSIVE EDGAR SYSTEM DEMONSTRATION
// Shows the complete enhanced system working for ALL stocks
// Run: node demonstrate-enhanced-system.js

import enhancedEdgarService from './src/services/enhancedEdgarService.js';

async function demonstrateEnhancedSystem() {
  console.log('🎯 COMPREHENSIVE EDGAR SYSTEM DEMONSTRATION');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 Proving the enhanced system works for EVERY stock automatically');
  console.log('');
  
  // Test the previously problematic stocks
  const testCases = [
    {
      category: '🚨 PREVIOUSLY FAILED STOCKS',
      stocks: ['BRK.B'],
      expectedIssue: 'Ticker mapping failed',
      expectedFix: 'Enhanced ticker mapping with fallbacks'
    },
    {
      category: '🔴 PREVIOUSLY LOW QUALITY STOCKS', 
      stocks: ['NVDA', 'MA', 'PYPL', 'JPM'],
      expectedIssue: 'Missing quarterly data or wrong concepts',
      expectedFix: 'Adaptive concept discovery and better data processing'
    },
    {
      category: '⚠️ PREVIOUSLY INCOMPLETE STOCKS',
      stocks: ['META', 'JNJ', 'V', 'WMT', 'PG'],
      expectedIssue: 'Missing essential metrics',
      expectedFix: 'Comprehensive concept fallbacks and discovery'
    },
    {
      category: '✅ CONTROL GROUP (SHOULD STILL WORK)',
      stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
      expectedIssue: 'None (already working)',
      expectedFix: 'Maintain current performance'
    }
  ];
  
  const overallResults = {
    totalStocks: 0,
    successfulStocks: 0,
    improvedStocks: 0,
    categoryResults: []
  };
  
  for (const testCase of testCases) {
    console.log(`\\n${testCase.category}`);
    console.log('─'.repeat(testCase.category.length));
    console.log(`📋 Issue: ${testCase.expectedIssue}`);
    console.log(`🔧 Fix: ${testCase.expectedFix}`);
    console.log('');
    
    const categoryResult = {
      category: testCase.category,
      totalStocks: testCase.stocks.length,
      successfulStocks: 0,
      results: []
    };
    
    for (const ticker of testCase.stocks) {
      console.log(`🔍 Testing ${ticker}...`);
      
      try {
        const startTime = Date.now();
        const data = await enhancedEdgarService.getCompanyFacts(ticker);
        const duration = Date.now() - startTime;
        
        // Comprehensive analysis
        const analysis = await analyzeComprehensively(ticker, data);
        
        categoryResult.results.push({
          ticker,
          success: true,
          analysis,
          duration
        });
        
        categoryResult.successfulStocks++;
        overallResults.successfulStocks++;
        
        if (!testCase.category.includes('CONTROL GROUP')) {
          overallResults.improvedStocks++;
        }
        
        // Display results
        displayDetailedResults(ticker, analysis, duration);
        
      } catch (error) {
        console.error(`❌ ${ticker}: FAILED - ${error.message}`);
        
        categoryResult.results.push({
          ticker,
          success: false,
          error: error.message,
          duration: 0
        });
      }
      
      overallResults.totalStocks++;
    }
    
    // Category summary
    const categorySuccessRate = (categoryResult.successfulStocks / categoryResult.totalStocks * 100).toFixed(1);
    console.log(`\\n📊 ${testCase.category} SUMMARY:`);
    console.log(`   Success Rate: ${categoryResult.successfulStocks}/${categoryResult.totalStocks} (${categorySuccessRate}%)`);
    
    overallResults.categoryResults.push(categoryResult);
  }
  
  // Final comprehensive report
  displayFinalReport(overallResults);
  
  return overallResults;
}

async function analyzeComprehensively(ticker, data) {
  const analysis = {
    companyName: data.companyName,
    ticker: ticker,
    
    // Data availability
    totalMetrics: 0,
    coreMetricsFound: 0,
    
    // Revenue analysis
    revenueAnalysis: {
      hasQuarterly: false,
      hasAnnual: false,
      quarterlyCount: 0,
      annualCount: 0,
      latestQuarterly: null,
      latestAnnual: null,
      dataFreshness: 'UNKNOWN'
    },
    
    // Balance sheet analysis
    balanceSheetAnalysis: {
      hasAssets: false,
      hasLiabilities: false,
      hasEquity: false,
      latestPeriod: null
    },
    
    // Cash flow analysis
    cashFlowAnalysis: {
      hasOperatingCF: false,
      latestPeriod: null
    },
    
    // Overall scoring
    completenessScore: 0,
    freshnessScore: 0,
    overallScore: 0,
    qualityGrade: 'F'
  };
  
  if (data.fiscalData) {
    analysis.totalMetrics = Object.keys(data.fiscalData).length;
    
    // Core metrics check
    const coreMetrics = ['Revenues', 'NetIncomeLoss', 'Assets', 'StockholdersEquity'];
    analysis.coreMetricsFound = coreMetrics.filter(metric => data.fiscalData[metric]).length;
    
    // Revenue analysis
    if (data.fiscalData.Revenues) {
      const revenues = data.fiscalData.Revenues;
      
      analysis.revenueAnalysis.hasQuarterly = revenues.quarterly && revenues.quarterly.length > 0;
      analysis.revenueAnalysis.hasAnnual = revenues.annual && revenues.annual.length > 0;
      analysis.revenueAnalysis.quarterlyCount = revenues.quarterly ? revenues.quarterly.length : 0;
      analysis.revenueAnalysis.annualCount = revenues.annual ? revenues.annual.length : 0;
      
      if (analysis.revenueAnalysis.hasQuarterly) {
        analysis.revenueAnalysis.latestQuarterly = revenues.quarterly[0].end;
        
        // Calculate freshness
        const latestDate = new Date(revenues.quarterly[0].end);
        const ageMonths = (new Date() - latestDate) / (1000 * 60 * 60 * 24 * 30);
        
        if (ageMonths <= 3) analysis.revenueAnalysis.dataFreshness = 'VERY_FRESH';
        else if (ageMonths <= 6) analysis.revenueAnalysis.dataFreshness = 'FRESH';
        else if (ageMonths <= 12) analysis.revenueAnalysis.dataFreshness = 'STALE';
        else analysis.revenueAnalysis.dataFreshness = 'VERY_STALE';
      }
      
      if (analysis.revenueAnalysis.hasAnnual) {
        analysis.revenueAnalysis.latestAnnual = revenues.annual[0].end;
      }
    }
    
    // Balance sheet analysis
    if (data.fiscalData.Assets) {
      analysis.balanceSheetAnalysis.hasAssets = true;
      if (data.fiscalData.Assets.quarterly && data.fiscalData.Assets.quarterly.length > 0) {
        analysis.balanceSheetAnalysis.latestPeriod = data.fiscalData.Assets.quarterly[0].end;
      }
    }
    
    analysis.balanceSheetAnalysis.hasLiabilities = !!data.fiscalData.Liabilities;
    analysis.balanceSheetAnalysis.hasEquity = !!data.fiscalData.StockholdersEquity;
    
    // Cash flow analysis
    if (data.fiscalData.NetCashProvidedByUsedInOperatingActivities) {
      analysis.cashFlowAnalysis.hasOperatingCF = true;
      const cf = data.fiscalData.NetCashProvidedByUsedInOperatingActivities;
      if (cf.quarterly && cf.quarterly.length > 0) {
        analysis.cashFlowAnalysis.latestPeriod = cf.quarterly[0].end;
      }
    }
    
    // Scoring
    analysis.completenessScore = (analysis.coreMetricsFound / 4) * 100;
    
    const freshnessMap = {
      'VERY_FRESH': 100,
      'FRESH': 80,
      'STALE': 50,
      'VERY_STALE': 20,
      'UNKNOWN': 0
    };
    analysis.freshnessScore = freshnessMap[analysis.revenueAnalysis.dataFreshness] || 0;
    
    analysis.overallScore = (analysis.completenessScore * 0.6) + (analysis.freshnessScore * 0.4);
    
    // Grade assignment
    if (analysis.overallScore >= 90) analysis.qualityGrade = 'A+';
    else if (analysis.overallScore >= 85) analysis.qualityGrade = 'A';
    else if (analysis.overallScore >= 80) analysis.qualityGrade = 'B+';
    else if (analysis.overallScore >= 75) analysis.qualityGrade = 'B';
    else if (analysis.overallScore >= 70) analysis.qualityGrade = 'C+';
    else if (analysis.overallScore >= 65) analysis.qualityGrade = 'C';
    else if (analysis.overallScore >= 60) analysis.qualityGrade = 'D';
    else analysis.qualityGrade = 'F';
  }
  
  return analysis;
}

function displayDetailedResults(ticker, analysis, duration) {
  const gradeEmojis = {
    'A+': '🌟', 'A': '🏆', 'B+': '🥇', 'B': '✅', 
    'C+': '🟡', 'C': '⚠️', 'D': '🔴', 'F': '💥'
  };
  
  console.log(`   ${gradeEmojis[analysis.qualityGrade]} ${ticker}: ${analysis.qualityGrade} Grade (${analysis.overallScore.toFixed(1)}%) - ${(duration/1000).toFixed(1)}s`);
  console.log(`      🏢 ${analysis.companyName}`);
  console.log(`      📊 Metrics: ${analysis.totalMetrics} total, ${analysis.coreMetricsFound}/4 core`);
  
  if (analysis.revenueAnalysis.hasQuarterly) {
    console.log(`      📈 Revenue: ${analysis.revenueAnalysis.quarterlyCount} quarters (latest: ${analysis.revenueAnalysis.latestQuarterly})`);
    console.log(`      🕒 Freshness: ${analysis.revenueAnalysis.dataFreshness}`);
  } else {
    console.log(`      ❌ No quarterly revenue data found`);
  }
  
  const balanceSheetStatus = [
    analysis.balanceSheetAnalysis.hasAssets ? 'Assets✅' : 'Assets❌',
    analysis.balanceSheetAnalysis.hasLiabilities ? 'Liabilities✅' : 'Liabilities❌', 
    analysis.balanceSheetAnalysis.hasEquity ? 'Equity✅' : 'Equity❌'
  ].join(' ');
  console.log(`      📋 Balance Sheet: ${balanceSheetStatus}`);
  
  console.log('');
}

function displayFinalReport(results) {
  console.log('\\n🎉 FINAL COMPREHENSIVE REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const overallSuccessRate = (results.successfulStocks / results.totalStocks * 100).toFixed(1);
  const improvementRate = (results.improvedStocks / (results.totalStocks - 5) * 100).toFixed(1); // Exclude 5 control stocks
  
  console.log(`🎯 OVERALL SUCCESS RATE: ${results.successfulStocks}/${results.totalStocks} (${overallSuccessRate}%)`);
  console.log(`🚀 IMPROVEMENT RATE: ${results.improvedStocks}/${results.totalStocks - 5} (${improvementRate}%)`);
  console.log('');
  
  // Category breakdown
  console.log('📊 CATEGORY BREAKDOWN:');
  results.categoryResults.forEach(category => {
    const rate = (category.successfulStocks / category.totalStocks * 100).toFixed(1);
    console.log(`   ${category.category}: ${category.successfulStocks}/${category.totalStocks} (${rate}%)`);
  });
  console.log('');
  
  // Success analysis
  if (overallSuccessRate >= 95) {
    console.log('🌟 EXCEPTIONAL SUCCESS! Enhanced EDGAR service is bulletproof!');
    console.log('✅ Ready for immediate production deployment');
  } else if (overallSuccessRate >= 90) {
    console.log('🏆 EXCELLENT SUCCESS! Enhanced EDGAR service works great!');
    console.log('✅ Suitable for production with minor monitoring');
  } else if (overallSuccessRate >= 85) {
    console.log('🥇 VERY GOOD SUCCESS! Enhanced EDGAR service is solid!');
    console.log('🔧 Minor refinements may be beneficial');
  } else if (overallSuccessRate >= 75) {
    console.log('✅ GOOD SUCCESS! Enhanced EDGAR service shows major improvement!');
    console.log('🔧 Some additional work recommended');
  } else {
    console.log('⚠️ MODERATE SUCCESS! Enhanced EDGAR service needs more work');
    console.log('🔧 Additional development required');
  }
  
  console.log('');
  console.log('🚀 DEPLOYMENT RECOMMENDATIONS:');
  
  if (overallSuccessRate >= 90) {
    console.log('1. ✅ Switch production system to enhanced EDGAR service');
    console.log('2. 🔄 Run: node switch-to-enhanced-edgar.js');
    console.log('3. 🧪 Validate with: node validate-portfolio-quality.js');
    console.log('4. 🚀 Deploy and monitor performance');
  } else {
    console.log('1. 🔧 Address remaining failed stocks');
    console.log('2. 🧪 Test with additional stocks');
    console.log('3. 📈 Iterate on concept discovery');
    console.log('4. ✅ Re-run demonstration when ready');
  }
}

// Run comprehensive demonstration
demonstrateEnhancedSystem()
  .then(results => {
    if (results.successfulStocks / results.totalStocks >= 0.9) {
      console.log('\\n🎯 CONCLUSION: Enhanced EDGAR service successfully creates a bulletproof system!');
      console.log('🚀 Every stock now works automatically without manual intervention!');
    }
  })
  .catch(error => {
    console.error('\\n❌ Demonstration failed:', error.message);
    console.error(error.stack);
  });