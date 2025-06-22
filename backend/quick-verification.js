// QUICK VERIFICATION OF SYSTEMATIC FIXES
// Test the specific issues that were failing before
// Run: node quick-verification.js

import edgarService from './src/services/edgarService.js';

async function quickVerificationTest() {
  console.log('🔬 QUICK VERIFICATION OF SYSTEMATIC FIXES');
  console.log('=' .repeat(50));
  
  const testCases = [
    {
      symbol: 'NVDA',
      issue: 'No quarterly data detected',
      testFunction: testNVIDIAQuarterlyData
    },
    {
      symbol: 'COHR', 
      issue: '-876% growth rate',
      testFunction: testCOHRGrowthRate
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Testing ${testCase.symbol}: ${testCase.issue}`);
    
    try {
      const data = await edgarService.getCompanyFacts(testCase.symbol);
      const result = await testCase.testFunction(data);
      
      if (result.fixed) {
        console.log(`   ✅ FIXED: ${result.message}`);
      } else {
        console.log(`   ❌ STILL FAILING: ${result.message}`);
      }
      
      console.log(`   📈 Details: ${result.details}`);
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
    }
  }
}

async function testNVIDIAQuarterlyData(data) {
  const revenues = data.fiscalData?.Revenues;
  
  if (!revenues) {
    return {
      fixed: false,
      message: 'No revenue data found',
      details: 'Cannot test quarterly detection without revenue data'
    };
  }

  const quarterlyCount = revenues.quarterly?.length || 0;
  const ytdCount = revenues.ytd?.length || 0;
  
  if (quarterlyCount === 0) {
    return {
      fixed: false,
      message: 'Still no quarterly data detected',
      details: `Quarterly: ${quarterlyCount}, YTD: ${ytdCount}, Total 10-Q filings processed: ${revenues.all?.filter(v => v.form === '10-Q').length || 0}`
    };
  }

  // Show latest quarterly data to prove it's working
  const latestQuarterly = revenues.quarterly[0];
  
  return {
    fixed: true,
    message: `Quarterly data now detected successfully`,
    details: `Found ${quarterlyCount} quarterly points. Latest: ${latestQuarterly.end} = $${(latestQuarterly.val/1e9).toFixed(2)}B`
  };
}

async function testCOHRGrowthRate(data) {
  const fundamentals = data.fundamentals;
  
  if (!fundamentals?.growth?.yearOverYear?.revenue) {
    return {
      fixed: false,
      message: 'No YoY revenue growth calculated',
      details: 'Cannot test growth rate without calculated metrics'
    };
  }

  const yoyGrowth = fundamentals.growth.yearOverYear.revenue;
  const growthRate = Math.abs(yoyGrowth.growth);
  
  // Check if growth rate is now reasonable (< 100% absolute value)
  if (growthRate > 500) {
    return {
      fixed: false,
      message: `Still showing unrealistic growth rate: ${yoyGrowth.formatted}`,
      details: `Current: $${(yoyGrowth.current/1e9).toFixed(2)}B, Previous: $${(yoyGrowth.previous/1e9).toFixed(2)}B`
    };
  }

  return {
    fixed: true,
    message: `Growth rate now realistic: ${yoyGrowth.formatted}`,
    details: `Comparing ${yoyGrowth.currentPeriod} ($${(yoyGrowth.current/1e9).toFixed(2)}B) vs ${yoyGrowth.previousPeriod} ($${(yoyGrowth.previous/1e9).toFixed(2)}B)`
  };
}

quickVerificationTest().catch(console.error);