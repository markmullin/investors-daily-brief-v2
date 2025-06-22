// NVIDIA PIPELINE DEBUGGER - Track exactly where 160 10-Q filings get lost
// Run: node nvidia-pipeline-debugger.js

import edgarService from './src/services/edgarService.js';
import axios from 'axios';

async function debugNVIDIAPipeline() {
  console.log('🔍 NVIDIA DATA PROCESSING PIPELINE DEBUGGER');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Get raw NVIDIA facts directly
    console.log('\n📡 STEP 1: RAW EDGAR DATA');
    const cik = '0001045810'; // NVIDIA CIK
    
    const response = await axios.get(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { headers: { 'User-Agent': 'InvestorsDailyBrief test@example.com' } }
    );
    
    const rawFacts = response.data.facts;
    
    // Check us-gaap.Revenues specifically
    const revenuesData = rawFacts['us-gaap']['Revenues'];
    const revenuesUnits = revenuesData.units;
    const unitKey = Object.keys(revenuesUnits)[0];
    const rawValues = revenuesUnits[unitKey];
    
    console.log(`✅ Raw us-gaap.Revenues found: ${rawValues.length} total values`);
    
    // Count by form type
    const formCounts = {};
    rawValues.forEach(v => {
      formCounts[v.form] = (formCounts[v.form] || 0) + 1;
    });
    console.log(`   Form breakdown: ${JSON.stringify(formCounts)}`);
    
    const raw10QFilings = rawValues.filter(v => v.form === '10-Q');
    console.log(`   Raw 10-Q filings: ${raw10QFilings.length}`);
    
    // Show sample raw 10-Q data
    console.log('\n📋 SAMPLE RAW 10-Q DATA:');
    raw10QFilings.slice(0, 5).forEach((v, index) => {
      console.log(`   ${index + 1}. ${v.end} = $${(v.val/1e9).toFixed(2)}B (Filed: ${v.filed})`);
    });
    
    // Step 2: Test our organizePeriodDataImproved method
    console.log('\n🔄 STEP 2: OUR PROCESSING PIPELINE');
    
    // Simulate our filtering
    const validValues = rawValues
      .filter(v => v.val && typeof v.val === 'number' && v.val !== 0)
      .sort((a, b) => new Date(b.end) - new Date(a.end));
    
    console.log(`✅ After basic filtering: ${validValues.length} values`);
    
    const quarterlyFilings = validValues.filter(v => v.form === '10-Q');
    console.log(`✅ 10-Q filings for quarterly separation: ${quarterlyFilings.length}`);
    
    if (quarterlyFilings.length === 0) {
      console.log('❌ CRITICAL: No 10-Q filings after basic filtering!');
      console.log('This means our basic filter is removing them');
      
      // Debug the basic filter
      console.log('\n🔍 DEBUGGING BASIC FILTER:');
      const filtered = [];
      rawValues.forEach(v => {
        if (!v.val) {
          console.log(`   Filtered: No value - ${v.end}`);
        } else if (typeof v.val !== 'number') {
          console.log(`   Filtered: Not number - ${v.end} = ${typeof v.val}`);
        } else if (v.val === 0) {
          console.log(`   Filtered: Zero value - ${v.end} = ${v.val}`);
        } else {
          filtered.push(v);
        }
      });
      console.log(`   Passed basic filter: ${filtered.length}`);
      return;
    }
    
    // Step 3: Test quarterly separation logic
    console.log('\n🔄 STEP 3: QUARTERLY/YTD SEPARATION');
    
    // Group by period end date (like our actual logic)
    const periodGroups = {};
    quarterlyFilings.forEach(value => {
      const date = value.end;
      if (!periodGroups[date]) periodGroups[date] = [];
      periodGroups[date].push(value);
    });
    
    console.log(`✅ Period groups: ${Object.keys(periodGroups).length}`);
    
    // Simulate our ultra-conservative separation
    let simulatedQuarterly = [];
    let simulatedYTD = [];
    
    Object.entries(periodGroups).forEach(([date, values]) => {
      const month = new Date(date).getMonth() + 1;
      
      if (values.length === 1) {
        const value = values[0];
        
        if (month === 3) {
          simulatedQuarterly.push(value);
          console.log(`   Q1 ${date}: QUARTERLY ($${(value.val/1e9).toFixed(2)}B)`);
        } else {
          const yearOfDate = new Date(date).getFullYear();
          
          // Look for Q1 reference
          const q1Key = Object.keys(periodGroups).find(d => {
            const dDate = new Date(d);
            return dDate.getFullYear() === yearOfDate && (dDate.getMonth() + 1) === 3;
          });
          
          if (q1Key) {
            const q1Value = periodGroups[q1Key][0].val;
            const ratio = value.val / q1Value;
            
            if (ratio >= 8.0 && month === 12) {
              simulatedYTD.push(value);
              console.log(`   ${date}: YTD (${ratio.toFixed(1)}x Q1, Month ${month}) ($${(value.val/1e9).toFixed(2)}B)`);
            } else {
              simulatedQuarterly.push(value);
              console.log(`   ${date}: QUARTERLY (${ratio.toFixed(1)}x Q1) ($${(value.val/1e9).toFixed(2)}B)`);
            }
          } else {
            simulatedQuarterly.push(value);
            console.log(`   ${date}: QUARTERLY (no Q1 ref) ($${(value.val/1e9).toFixed(2)}B)`);
          }
        }
      } else {
        values.sort((a, b) => new Date(b.filed) - new Date(a.filed));
        const mostRecent = values[0];
        simulatedQuarterly.push(mostRecent);
        console.log(`   ${date}: QUARTERLY (most recent) ($${(mostRecent.val/1e9).toFixed(2)}B)`);
      }
    });
    
    console.log(`\n✅ Simulation Results:`);
    console.log(`   Quarterly: ${simulatedQuarterly.length}`);
    console.log(`   YTD: ${simulatedYTD.length}`);
    
    // Step 4: Compare with actual edgarService results
    console.log('\n🔄 STEP 4: ACTUAL EDGARSERVICE RESULTS');
    const edgarResult = await edgarService.getCompanyFacts('NVDA');
    const actualRevenues = edgarResult.fiscalData?.Revenues;
    
    if (actualRevenues) {
      console.log(`✅ Actual quarterly: ${actualRevenues.quarterly?.length || 0}`);
      console.log(`✅ Actual YTD: ${actualRevenues.ytd?.length || 0}`);
      console.log(`✅ Actual all: ${actualRevenues.all?.length || 0}`);
    } else {
      console.log(`❌ No Revenues in fiscalData!`);
      console.log(`Available: ${Object.keys(edgarResult.fiscalData || {})}`);
    }
    
    // Find the discrepancy
    if (simulatedQuarterly.length > 0 && (!actualRevenues?.quarterly || actualRevenues.quarterly.length === 0)) {
      console.log('\n❌ CRITICAL BUG FOUND:');
      console.log(`   Simulation shows ${simulatedQuarterly.length} quarterly values`);
      console.log(`   But actual result shows ${actualRevenues?.quarterly?.length || 0} quarterly values`);
      console.log('   There is a bug in our ultraConservativeQuarterlyYTDSeparation method!');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

debugNVIDIAPipeline().catch(console.error);