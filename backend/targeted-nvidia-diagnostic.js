// TARGETED NVIDIA DIAGNOSTIC - Run with: node targeted-nvidia-diagnostic.js
// This will help us understand exactly where the 160 10-Q filings are getting lost

import axios from 'axios';

// Mock the EDGARService processing methods for testing
class DiagnosticEDGARService {
  
  // Copy of the organizePeriodDataImproved method from edgarService.js
  organizePeriodDataImproved(values, metricName) {
    console.log(`\n🔍 DIAGNOSTIC: organizePeriodDataImproved called for ${metricName}`);
    console.log(`   Input values: ${values.length}`);
    
    // Filter valid values
    const validValues = values
      .filter(v => v.val && typeof v.val === 'number' && v.val !== 0)
      .sort((a, b) => new Date(b.end) - new Date(a.end));

    console.log(`   After basic filtering: ${validValues.length} values`);

    // FIXED: Better annual data deduplication
    let annualValues = validValues.filter(v => v.form === '10-K');
    console.log(`   Annual (10-K) values: ${annualValues.length}`);
    
    // Remove duplicate years in annual data
    const seenYears = new Set();
    annualValues = annualValues.filter(v => {
      const year = new Date(v.end).getFullYear();
      if (seenYears.has(year)) {
        console.log(`    🚫 Removing duplicate annual data for year ${year}: $${(v.val/1e9).toFixed(1)}B`);
        return false;
      }
      seenYears.add(year);
      return true;
    });
    
    const quarterlyFilings = validValues.filter(v => v.form === '10-Q');
    console.log(`   Quarterly (10-Q) filings for separation: ${quarterlyFilings.length}`);

    // ENHANCED: Better quarterly vs YTD detection with value-based logic
    const { quarterly, ytd } = this.ultraConservativeQuarterlyYTDSeparation(quarterlyFilings, metricName);

    console.log(`    📈 Final Annual: ${annualValues.length} values (deduplicated)`);
    console.log(`    📊 Final Quarterly: ${quarterly.length} values`);
    console.log(`    📅 Final YTD: ${ytd.length} values`);

    return {
      all: validValues,
      annual: annualValues,
      quarterly: quarterly,
      ytd: ytd,
      concept: values[0]?.concept || 'Unknown'
    };
  }

  // Copy of the ultraConservativeQuarterlyYTDSeparation method
  ultraConservativeQuarterlyYTDSeparation(quarterlyFilings, metricName) {
    const quarterly = [];
    const ytd = [];
    
    console.log(`\n🔍 DIAGNOSTIC: ultraConservativeQuarterlyYTDSeparation for ${metricName}`);
    console.log(`   Input quarterly filings: ${quarterlyFilings.length}`);
    
    // Group by period end date
    const periodGroups = {};
    quarterlyFilings.forEach(value => {
      const date = value.end;
      if (!periodGroups[date]) periodGroups[date] = [];
      periodGroups[date].push(value);
    });

    console.log(`   Period groups created: ${Object.keys(periodGroups).length}`);

    // ULTRA-CONSERVATIVE: Default everything to quarterly unless EXTREMELY obvious YTD
    Object.entries(periodGroups).forEach(([date, values]) => {
      const month = new Date(date).getMonth() + 1; // 1-based month
      
      if (values.length === 1) {
        const value = values[0];
        
        // Q1 is ALWAYS quarterly (equals YTD anyway)
        if (month === 3) {
          quarterly.push(value);
          console.log(`    ✅ Q1 ${date}: $${(value.val/1e9).toFixed(2)}B (quarterly = YTD)`);
          return;
        }
        
        // For other quarters: ONLY filter if EXTREMELY obvious YTD pattern
        const yearOfDate = new Date(date).getFullYear();
        
        // Look for Q1 reference
        const q1Candidates = Object.keys(periodGroups)
          .filter(d => {
            const dDate = new Date(d);
            return dDate.getFullYear() === yearOfDate && (dDate.getMonth() + 1) === 3;
          })
          .map(d => periodGroups[d][0]);
        
        if (q1Candidates.length > 0) {
          const q1Value = q1Candidates[0].val;
          const ratio = value.val / q1Value;
          
          // ULTRA-CONSERVATIVE: Only filter if ratio is EXTREME (8x+) AND it's Q4
          if (ratio >= 8.0 && month === 12) {
            console.log(`    🚫 ${date}: Likely YTD $${(value.val/1e9).toFixed(2)}B (${ratio.toFixed(1)}x Q1) - FILTERED`);
            ytd.push(value);
          } else {
            // DEFAULT TO QUARTERLY - ultra-conservative
            console.log(`    ✅ ${date}: Quarterly $${(value.val/1e9).toFixed(2)}B (${ratio.toFixed(1)}x Q1)`);
            quarterly.push(value);
          }
        } else {
          // No Q1 reference - ALWAYS default to quarterly
          console.log(`    ✅ ${date}: Quarterly $${(value.val/1e9).toFixed(2)}B (no Q1 reference, defaulting to quarterly)`);
          quarterly.push(value);
        }
      } else {
        // Multiple values - always use most recent as quarterly
        values.sort((a, b) => new Date(b.filed) - new Date(a.filed));
        const mostRecent = values[0];
        quarterly.push(mostRecent);
        console.log(`    ✅ ${date}: Multiple values, using most recent as quarterly: $${(mostRecent.val/1e9).toFixed(2)}B`);
      }
    });

    const result = {
      quarterly: quarterly.sort((a, b) => new Date(b.end) - new Date(a.end)),
      ytd: ytd.sort((a, b) => new Date(b.end) - new Date(a.end))
    };
    
    console.log(`    📊 FINAL SEPARATION RESULT: ${result.quarterly.length} quarterly, ${result.ytd.length} YTD values`);
    return result;
  }
}

async function diagnoseFull() {
  console.log('🚨 TARGETED NVIDIA DIAGNOSTIC STARTING...');
  console.log('=' .repeat(70));
  
  try {
    // Step 1: Get raw NVIDIA facts directly from SEC
    console.log('\n📡 STEP 1: FETCHING RAW NVIDIA DATA FROM SEC...');
    const cik = '0001045810'; // NVIDIA CIK
    
    const response = await axios.get(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { headers: { 'User-Agent': 'InvestorsDailyBrief test@example.com' } }
    );
    
    const rawFacts = response.data.facts;
    console.log('✅ Raw NVIDIA data fetched successfully');
    
    // Step 2: Examine the us-gaap.Revenues concept specifically
    console.log('\n📊 STEP 2: EXAMINING us-gaap.Revenues CONCEPT...');
    
    if (!rawFacts['us-gaap'] || !rawFacts['us-gaap']['Revenues']) {
      console.log('❌ CRITICAL: us-gaap.Revenues not found in NVIDIA data!');
      console.log('Available us-gaap concepts:', Object.keys(rawFacts['us-gaap'] || {}));
      return;
    }
    
    const revenuesData = rawFacts['us-gaap']['Revenues'];
    const revenuesUnits = revenuesData.units;
    const unitKey = Object.keys(revenuesUnits)[0];
    const rawValues = revenuesUnits[unitKey];
    
    console.log(`✅ us-gaap.Revenues found with ${rawValues.length} total values`);
    
    // Count by form type
    const formCounts = {};
    rawValues.forEach(v => {
      formCounts[v.form] = (formCounts[v.form] || 0) + 1;
    });
    console.log(`📋 Form type breakdown:`, formCounts);
    
    const raw10QFilings = rawValues.filter(v => v.form === '10-Q');
    console.log(`📊 Raw 10-Q filings: ${raw10QFilings.length}`);
    
    // Show sample raw 10-Q data
    console.log('\n📋 SAMPLE RAW 10-Q DATA (latest 5):');
    raw10QFilings
      .sort((a, b) => new Date(b.end) - new Date(a.end))
      .slice(0, 5)
      .forEach((v, index) => {
        console.log(`   ${index + 1}. ${v.end} = $${(v.val/1e9).toFixed(2)}B (Filed: ${v.filed})`);
      });
    
    // Step 3: Test our processing pipeline
    console.log('\n🔄 STEP 3: TESTING OUR PROCESSING PIPELINE...');
    
    const diagnosticService = new DiagnosticEDGARService();
    const processedData = diagnosticService.organizePeriodDataImproved(rawValues, 'Revenues');
    
    // Step 4: Compare results
    console.log('\n📈 STEP 4: FINAL COMPARISON...');
    console.log(`🔍 Raw 10-Q filings: ${raw10QFilings.length}`);
    console.log(`📊 Processed quarterly: ${processedData.quarterly.length}`);
    console.log(`📅 Processed YTD: ${processedData.ytd.length}`);
    console.log(`📈 Processed annual: ${processedData.annual.length}`);
    console.log(`🌐 Processed all: ${processedData.all.length}`);
    
    // Step 5: Identify the problem
    if (raw10QFilings.length > 0 && processedData.quarterly.length === 0) {
      console.log('\n❌ CRITICAL BUG IDENTIFIED:');
      console.log(`   📊 Raw data shows ${raw10QFilings.length} 10-Q filings`);
      console.log(`   🔄 But processed data shows ${processedData.quarterly.length} quarterly values`);
      console.log('   🚨 The processing pipeline is filtering out ALL quarterly data!');
      
      // Debug the basic filter
      console.log('\n🔍 DEBUGGING BASIC FILTER...');
      const filterResults = {
        noValue: 0,
        notNumber: 0,
        zeroValue: 0,
        passed: 0
      };
      
      rawValues.forEach(v => {
        if (!v.val) {
          filterResults.noValue++;
        } else if (typeof v.val !== 'number') {
          filterResults.notNumber++;
        } else if (v.val === 0) {
          filterResults.zeroValue++;
        } else {
          filterResults.passed++;
        }
      });
      
      console.log('📊 Basic filter results:');
      console.log(`   ❌ No value: ${filterResults.noValue}`);
      console.log(`   ❌ Not number: ${filterResults.notNumber}`);
      console.log(`   ❌ Zero value: ${filterResults.zeroValue}`);
      console.log(`   ✅ Passed filter: ${filterResults.passed}`);
      
      if (filterResults.passed === 0) {
        console.log('\n🚨 ROOT CAUSE: Basic filter is removing ALL data!');
        console.log('   Check the data structure and filter conditions');
        
        // Show sample raw data structure
        console.log('\n📋 SAMPLE RAW DATA STRUCTURE:');
        console.log(JSON.stringify(rawValues[0], null, 2));
      }
    } else if (processedData.quarterly.length > 0) {
      console.log('\n✅ SUCCESS: Processing pipeline working correctly');
      console.log(`   📊 ${processedData.quarterly.length} quarterly values processed successfully`);
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error(error.stack);
  }
}

diagnoseFull().catch(console.error);