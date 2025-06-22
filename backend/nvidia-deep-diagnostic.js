// DEEP NVIDIA DIAGNOSTIC - Find why 0 quarterly data points
// Run: node nvidia-deep-diagnostic.js

import edgarService from './src/services/edgarService.js';

async function debugNVIDIAQuarterlyIssue() {
  console.log('🔍 DEEP NVIDIA QUARTERLY DATA DIAGNOSTIC');
  console.log('=' .repeat(60));
  
  try {
    // Get the raw company facts data
    console.log('📡 Fetching NVIDIA company facts...');
    const data = await edgarService.getCompanyFacts('NVDA');
    
    console.log('\n🏢 COMPANY INFO:');
    console.log(`   Company: ${data.companyName}`);
    console.log(`   Data Quality Warnings: ${data.dataQualityWarnings?.length || 0}`);
    
    // Check if Revenues data exists
    const revenues = data.fiscalData?.Revenues;
    if (!revenues) {
      console.log('\n❌ CRITICAL: No Revenues data found in fiscalData');
      console.log('Available fiscal data keys:', Object.keys(data.fiscalData || {}));
      return;
    }
    
    console.log('\n📊 REVENUES DATA STRUCTURE:');
    console.log(`   Total data points: ${revenues.all?.length || 0}`);
    console.log(`   Annual points: ${revenues.annual?.length || 0}`);
    console.log(`   Quarterly points: ${revenues.quarterly?.length || 0}`);
    console.log(`   YTD points: ${revenues.ytd?.length || 0}`);
    
    // Analyze the raw 10-Q filings
    const allTenQFilings = revenues.all?.filter(v => v.form === '10-Q') || [];
    console.log(`\n📋 10-Q FILINGS ANALYSIS:`);
    console.log(`   Total 10-Q filings found: ${allTenQFilings.length}`);
    
    if (allTenQFilings.length === 0) {
      console.log('❌ CRITICAL: No 10-Q filings found at all!');
      console.log('This means the problem is in data extraction, not quarterly separation');
      
      // Show what forms we do have
      const formCounts = {};
      revenues.all?.forEach(v => {
        formCounts[v.form] = (formCounts[v.form] || 0) + 1;
      });
      console.log('Available form types:', formCounts);
      return;
    }
    
    // Show sample 10-Q filings
    console.log('\n📄 SAMPLE 10-Q FILINGS (first 10):');
    allTenQFilings.slice(0, 10).forEach((filing, index) => {
      const value = filing.val / 1e9;
      const month = new Date(filing.end).getMonth() + 1;
      console.log(`   ${index + 1}. ${filing.end} (Month ${month}) | $${value.toFixed(2)}B | Filed: ${filing.filed}`);
    });
    
    // Group by period to see what the separation logic is doing
    console.log('\n🔄 PERIOD GROUPING ANALYSIS:');
    const periodGroups = {};
    allTenQFilings.forEach(filing => {
      const date = filing.end;
      if (!periodGroups[date]) periodGroups[date] = [];
      periodGroups[date].push(filing);
    });
    
    console.log(`   Unique periods: ${Object.keys(periodGroups).length}`);
    
    // Show the first few period groups and what happens to them
    Object.entries(periodGroups).slice(0, 5).forEach(([date, filings]) => {
      const month = new Date(date).getMonth() + 1;
      const year = new Date(date).getFullYear();
      
      console.log(`\n   📅 Period: ${date} (Month ${month}, Year ${year})`);
      console.log(`      Filings: ${filings.length}`);
      
      filings.forEach((filing, index) => {
        console.log(`      ${index + 1}. $${(filing.val/1e9).toFixed(2)}B (Filed: ${filing.filed})`);
      });
      
      // Simulate what the separation logic would do
      if (month === 3) {
        console.log(`      ✅ Q1 - Would be classified as QUARTERLY`);
      } else {
        // Look for Q1 in same year
        const q1Key = Object.keys(periodGroups).find(d => {
          const dDate = new Date(d);
          return dDate.getFullYear() === year && (dDate.getMonth() + 1) === 3;
        });
        
        if (q1Key) {
          const q1Value = periodGroups[q1Key][0].val;
          const ratio = filings[0].val / q1Value;
          
          if (ratio >= 8.0 && month === 12) {
            console.log(`      🚫 Would be classified as YTD (${ratio.toFixed(1)}x Q1, Month ${month})`);
          } else {
            console.log(`      ✅ Would be classified as QUARTERLY (${ratio.toFixed(1)}x Q1)`);
          }
        } else {
          console.log(`      ✅ Would be classified as QUARTERLY (no Q1 reference)`);
        }
      }
    });
    
    // Check if the issue is in the ultra-conservative logic
    console.log('\n🧮 SEPARATION LOGIC SIMULATION:');
    let simulatedQuarterly = 0;
    let simulatedYTD = 0;
    
    Object.entries(periodGroups).forEach(([date, filings]) => {
      const month = new Date(date).getMonth() + 1;
      const year = new Date(date).getFullYear();
      
      if (month === 3) {
        simulatedQuarterly++;
      } else {
        const q1Key = Object.keys(periodGroups).find(d => {
          const dDate = new Date(d);
          return dDate.getFullYear() === year && (dDate.getMonth() + 1) === 3;
        });
        
        if (q1Key) {
          const q1Value = periodGroups[q1Key][0].val;
          const ratio = filings[0].val / q1Value;
          
          if (ratio >= 8.0 && month === 12) {
            simulatedYTD++;
          } else {
            simulatedQuarterly++;
          }
        } else {
          simulatedQuarterly++;
        }
      }
    });
    
    console.log(`   Simulated Quarterly: ${simulatedQuarterly}`);
    console.log(`   Simulated YTD: ${simulatedYTD}`);
    console.log(`   Actual Quarterly: ${revenues.quarterly?.length || 0}`);
    console.log(`   Actual YTD: ${revenues.ytd?.length || 0}`);
    
    if (simulatedQuarterly > 0 && (revenues.quarterly?.length || 0) === 0) {
      console.log('\n❌ CRITICAL: Simulation shows quarterly data should exist, but actual result is 0');
      console.log('This indicates a bug in the ultraConservativeQuarterlyYTDSeparation method');
    }
    
    // Check for specific edge cases
    console.log('\n🔍 EDGE CASE ANALYSIS:');
    
    // Check for unusual fiscal year
    const fiscalYearEnds = [...new Set(allTenQFilings.map(f => new Date(f.end).getMonth() + 1))];
    console.log(`   Quarter end months: ${fiscalYearEnds.sort().join(', ')}`);
    
    if (!fiscalYearEnds.includes(3)) {
      console.log('   ⚠️ No March quarter ends found - unusual fiscal year');
    }
    
    // Check for extreme values that might trigger filtering
    const values = allTenQFilings.map(f => f.val / 1e9);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const ratio = maxValue / minValue;
    
    console.log(`   Value range: $${minValue.toFixed(2)}B - $${maxValue.toFixed(2)}B`);
    console.log(`   Max/Min ratio: ${ratio.toFixed(1)}x`);
    
    if (ratio > 100) {
      console.log('   ⚠️ Extreme value ratio detected - might trigger aggressive filtering');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error(error.stack);
  }
}

debugNVIDIAQuarterlyIssue().catch(console.error);