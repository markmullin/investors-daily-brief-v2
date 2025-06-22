// FIXED: Improved quarterly/YTD separation with more robust logic
// This addresses the systematic issues causing wrong growth calculations

// ENHANCED: Much more conservative quarterly vs YTD separation 
improvedQuarterlyYTDSeparationFixed(quarterlyFilings, metricName) {
  const quarterly = [];
  const ytd = [];
  
  console.log(`\n🔍 IMPROVED: Analyzing ${quarterlyFilings.length} quarterly filings for ${metricName}`);
  
  // Group by period end date
  const periodGroups = {};
  quarterlyFilings.forEach(value => {
    const date = value.end;
    if (!periodGroups[date]) periodGroups[date] = [];
    periodGroups[date].push(value);
  });

  // FIXED: More conservative approach - prioritize keeping data as quarterly
  Object.entries(periodGroups).forEach(([date, values]) => {
    const month = new Date(date).getMonth() + 1; // 1-based month
    
    if (values.length === 1) {
      const value = values[0];
      
      // CONSERVATIVE: Only filter out obviously cumulative values
      if (month === 3) {
        // Q1 is always quarterly (equals YTD)
        quarterly.push(value);
        console.log(`  ✅ Q1 ${date}: $${(value.val/1e9).toFixed(2)}B (quarterly = YTD)`);
      } else {
        // For Q2, Q3, Q4 - be much more conservative about filtering
        const yearOfDate = new Date(date).getFullYear();
        
        // Look for Q1 value for comparison
        const q1Candidates = Object.keys(periodGroups)
          .filter(d => {
            const dDate = new Date(d);
            return dDate.getFullYear() === yearOfDate && (dDate.getMonth() + 1) === 3;
          })
          .map(d => periodGroups[d][0]);
        
        if (q1Candidates.length > 0) {
          const q1Value = q1Candidates[0].val;
          const ratio = value.val / q1Value;
          
          // MUCH MORE CONSERVATIVE: Only flag as YTD if ratio is very high
          // Changed from 1.5x to 3.0x to reduce false positives
          if (ratio > 3.0 && month >= 6) { // Only for Q2+ and very high ratios
            console.log(`  🚫 ${date}: Likely YTD $${(value.val/1e9).toFixed(2)}B (${ratio.toFixed(1)}x Q1) - FILTERED`);
            ytd.push(value);
          } else {
            console.log(`  ✅ ${date}: Quarterly $${(value.val/1e9).toFixed(2)}B (${ratio.toFixed(1)}x Q1)`);
            quarterly.push(value);
          }
        } else {
          // No Q1 reference - default to quarterly (conservative approach)
          console.log(`  ✅ ${date}: Quarterly $${(value.val/1e9).toFixed(2)}B (no Q1 reference, defaulting to quarterly)`);
          quarterly.push(value);
        }
      }
    } else if (values.length === 2) {
      // Two values for same period - take the more recent filing as quarterly
      values.sort((a, b) => new Date(b.filed) - new Date(a.filed));
      const mostRecent = values[0];
      const older = values[1];
      
      // FIXED: Use more recent filing for quarterly data
      quarterly.push(mostRecent);
      ytd.push(older);
      
      console.log(`  ✅ ${date}: Using most recent filing as quarterly: $${(mostRecent.val/1e9).toFixed(2)}B`);
    } else {
      // Multiple values - take most recent filing as quarterly
      values.sort((a, b) => new Date(b.filed) - new Date(a.filed));
      const mostRecent = values[0];
      quarterly.push(mostRecent);
      
      console.log(`  ✅ ${date}: Multiple values, using most recent as quarterly: $${(mostRecent.val/1e9).toFixed(2)}B`);
    }
  });

  const result = {
    quarterly: quarterly.sort((a, b) => new Date(b.end) - new Date(a.end)),
    ytd: ytd.sort((a, b) => new Date(b.end) - new Date(a.end))
  };
  
  console.log(`  📊 RESULT: ${result.quarterly.length} quarterly, ${result.ytd.length} YTD values`);
  return result;
}

// FIXED: More robust same-quarter matching for growth calculations
findSameQuarterPreviousYearFixed(metric, latestQuarter) {
  const data = this.fiscalData[metric];
  if (!data || !data.quarterly || !latestQuarter) return null;
  
  const latestDate = new Date(latestQuarter.end);
  const latestMonth = latestDate.getMonth() + 1;
  const latestYear = latestDate.getFullYear();
  
  console.log(`🔍 Looking for same quarter as ${latestQuarter.end} (Month ${latestMonth}, Year ${latestYear})`);
  
  // ENHANCED: Look for matching quarter in previous years (try multiple years)
  for (let yearsBack = 1; yearsBack <= 3; yearsBack++) {
    const targetYear = latestYear - yearsBack;
    
    const candidates = data.quarterly.filter(q => {
      const qDate = new Date(q.end);
      const qMonth = qDate.getMonth() + 1;
      const qYear = qDate.getFullYear();
      
      // Match year and quarter (allow 1 month tolerance for quarter alignment)
      return qYear === targetYear && Math.abs(qMonth - latestMonth) <= 1;
    });
    
    if (candidates.length > 0) {
      // Take the closest match by month
      const closest = candidates.reduce((best, current) => {
        const bestDiff = Math.abs(new Date(best.end).getMonth() + 1 - latestMonth);
        const currentDiff = Math.abs(new Date(current.end).getMonth() + 1 - latestMonth);
        return currentDiff < bestDiff ? current : best;
      });
      
      console.log(`  ✅ Found match ${yearsBack} year(s) back: ${closest.end} ($${(closest.val/1e9).toFixed(2)}B)`);
      return closest;
    }
  }
  
  console.log(`  ❌ No matching quarter found for ${latestQuarter.end}`);
  return null;
}

// FIXED: More accurate growth calculations with better error handling
calculateGrowthFixed(current, previous, label) {
  if (!current || !previous || !current.val || !previous.val) {
    console.log(`  ❌ ${label}: Missing data - current: ${!!current?.val}, previous: ${!!previous?.val}`);
    return null;
  }
  
  if (previous.val <= 0) {
    console.log(`  ❌ ${label}: Invalid previous value: ${previous.val}`);
    return null;
  }
  
  const growth = ((current.val - previous.val) / previous.val) * 100;
  
  // Validate reasonable growth range
  if (Math.abs(growth) > 1000) { // Growth > 1000% is suspicious
    console.log(`  ⚠️ ${label}: Suspicious growth rate ${growth.toFixed(1)}% - check data quality`);
  }
  
  console.log(`  ✅ ${label}: ${growth.toFixed(2)}% (${(current.val/1e9).toFixed(2)}B vs ${(previous.val/1e9).toFixed(2)}B)`);
  
  return {
    growth: growth,
    formatted: `${growth.toFixed(2)}%`,
    current: current.val,
    previous: previous.val,
    currentPeriod: current.end,
    previousPeriod: previous.end
  };
}

export { 
  improvedQuarterlyYTDSeparationFixed, 
  findSameQuarterPreviousYearFixed, 
  calculateGrowthFixed 
};