// NVIDIA REVENUE CONCEPT FINDER - Find the exact revenue concepts NVIDIA uses
// Run: node nvidia-revenue-finder.js

import axios from 'axios';

async function findNVIDIARevenueConcepts() {
  console.log('🔍 NVIDIA REVENUE CONCEPT FINDER');
  console.log('=' .repeat(50));
  
  try {
    // Get NVIDIA data
    const tickerResponse = await axios.get(
      'https://www.sec.gov/files/company_tickers.json',
      { headers: { 'User-Agent': 'InvestorsDailyBrief test@example.com' } }
    );
    
    const companies = Object.values(tickerResponse.data);
    const nvidia = companies.find(c => c.ticker.toLowerCase() === 'nvda');
    const cik = String(nvidia.cik_str).padStart(10, '0');
    
    const factsResponse = await axios.get(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { headers: { 'User-Agent': 'InvestorsDailyBrief test@example.com' } }
    );
    
    const facts = factsResponse.data.facts;
    
    console.log('🎯 FINDING NVIDIA\'S REVENUE CONCEPTS...\n');
    
    const revenueConcepts = [];
    
    // Look for concepts that are likely revenue (high values, 10-Q data)
    Object.entries(facts).forEach(([taxonomy, concepts]) => {
      Object.entries(concepts).forEach(([concept, data]) => {
        const units = data.units;
        const unitKey = Object.keys(units)[0];
        const values = units[unitKey] || [];
        
        const tenQFilings = values.filter(v => v.form === '10-Q');
        
        if (tenQFilings.length > 0) {
          // Look for high-value concepts (likely revenue/income)
          const maxValue = Math.max(...tenQFilings.map(v => v.val));
          
          // Revenue should be in billions for NVIDIA
          if (maxValue > 1e9) {
            revenueConcepts.push({
              fullConcept: `${taxonomy}.${concept}`,
              taxonomy,
              concept,
              description: data.description || 'No description',
              tenQCount: tenQFilings.length,
              maxValue,
              maxValueFormatted: `$${(maxValue/1e9).toFixed(2)}B`,
              latestTenQ: tenQFilings.sort((a, b) => new Date(b.end) - new Date(a.end))[0],
              isLikelyRevenue: concept.toLowerCase().includes('revenue') || 
                              concept.toLowerCase().includes('sales') ||
                              concept.toLowerCase().includes('net') ||
                              maxValue > 10e9 // Very high values likely revenue
            });
          }
        }
      });
    });
    
    // Sort by max value (revenue should be highest)
    revenueConcepts.sort((a, b) => b.maxValue - a.maxValue);
    
    console.log(`📊 FOUND ${revenueConcepts.length} HIGH-VALUE CONCEPTS WITH 10-Q DATA:\n`);
    
    // Show top 20 concepts (most likely to contain revenue)
    revenueConcepts.slice(0, 20).forEach((item, index) => {
      const isLikely = item.isLikelyRevenue ? '🎯' : '📈';
      
      console.log(`${isLikely} ${index + 1}. ${item.fullConcept}`);
      console.log(`     Max Value: ${item.maxValueFormatted}`);
      console.log(`     10-Q filings: ${item.tenQCount}`);
      console.log(`     Latest 10-Q: ${item.latestTenQ.end} = $${(item.latestTenQ.val/1e9).toFixed(2)}B`);
      console.log(`     Description: ${item.description}`);
      console.log('');
    });
    
    // Generate the exact fix for edgarService.js
    console.log('🔧 PRODUCTION FIX NEEDED:\n');
    console.log('Add these concepts to the "Revenues" array in edgarService.js:\n');
    
    const topRevenueConcepts = revenueConcepts.slice(0, 10);
    
    console.log("'Revenues': [");
    topRevenueConcepts.forEach(item => {
      console.log(`  ['${item.taxonomy}', '${item.concept}'], // ${item.maxValueFormatted} max`);
    });
    console.log("  // ... existing concepts");
    console.log("],");
    
    // Show current vs new
    console.log('\n💡 COMPARISON:\n');
    console.log('CURRENT (not working for NVIDIA):');
    console.log('  us-gaap.RevenueFromContractWithCustomerExcludingAssessedTax');
    console.log('  us-gaap.Revenues');
    console.log('\nNVIDIA ACTUALLY USES:');
    topRevenueConcepts.slice(0, 3).forEach(item => {
      console.log(`  ${item.fullConcept} (${item.maxValueFormatted})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findNVIDIARevenueConcepts().catch(console.error);