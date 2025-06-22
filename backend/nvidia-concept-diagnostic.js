// NVIDIA EDGAR CONCEPT DIAGNOSTIC - Find what concepts actually exist
// Run: node nvidia-concept-diagnostic.js

import axios from 'axios';

async function debugNVIDIAConcepts() {
  console.log('🔍 NVIDIA EDGAR CONCEPT DIAGNOSTIC');
  console.log('=' .repeat(60));
  
  try {
    // Get CIK for NVIDIA
    console.log('📡 Getting NVIDIA CIK...');
    const tickerResponse = await axios.get(
      'https://www.sec.gov/files/company_tickers.json',
      { headers: { 'User-Agent': 'InvestorsDailyBrief test@example.com' } }
    );
    
    const companies = Object.values(tickerResponse.data);
    const nvidia = companies.find(c => c.ticker.toLowerCase() === 'nvda');
    const cik = String(nvidia.cik_str).padStart(10, '0');
    
    console.log(`✅ NVIDIA CIK: ${cik}`);
    
    // Get raw company facts
    console.log('📡 Fetching raw NVIDIA company facts...');
    const factsResponse = await axios.get(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { headers: { 'User-Agent': 'InvestorsDailyBrief test@example.com' } }
    );
    
    const facts = factsResponse.data.facts;
    
    console.log('\n🏢 COMPANY INFO:');
    console.log(`   Entity Name: ${factsResponse.data.entityName}`);
    console.log(`   CIK: ${factsResponse.data.cik}`);
    
    // Analyze available taxonomies
    console.log('\n📚 AVAILABLE TAXONOMIES:');
    Object.keys(facts).forEach(taxonomy => {
      const conceptCount = Object.keys(facts[taxonomy]).length;
      console.log(`   ${taxonomy}: ${conceptCount} concepts`);
    });
    
    // Look for ALL revenue-related concepts
    console.log('\n💰 REVENUE-RELATED CONCEPTS:');
    Object.entries(facts).forEach(([taxonomy, concepts]) => {
      Object.entries(concepts).forEach(([concept, data]) => {
        if (concept.toLowerCase().includes('revenue') || 
            concept.toLowerCase().includes('sales') ||
            concept.toLowerCase().includes('income')) {
          
          const units = data.units;
          const unitKey = Object.keys(units)[0];
          const values = units[unitKey] || [];
          
          // Count by form type
          const formCounts = {};
          values.forEach(v => {
            formCounts[v.form] = (formCounts[v.form] || 0) + 1;
          });
          
          console.log(`\n   ${taxonomy}.${concept}:`);
          console.log(`      Description: ${data.description || 'No description'}`);
          console.log(`      Total values: ${values.length}`);
          console.log(`      Form breakdown: ${JSON.stringify(formCounts)}`);
          
          // Show recent values if any
          if (values.length > 0) {
            const recent = values
              .sort((a, b) => new Date(b.end) - new Date(a.end))
              .slice(0, 3);
            
            console.log(`      Recent values:`);
            recent.forEach(v => {
              console.log(`        ${v.end} (${v.form}): $${(v.val/1e9).toFixed(2)}B`);
            });
          }
        }
      });
    });
    
    // Look specifically for 10-Q filings across ALL concepts
    console.log('\n📋 10-Q FILING ANALYSIS ACROSS ALL CONCEPTS:');
    let total10QFilings = 0;
    let conceptsWith10Q = [];
    
    Object.entries(facts).forEach(([taxonomy, concepts]) => {
      Object.entries(concepts).forEach(([concept, data]) => {
        const units = data.units;
        const unitKey = Object.keys(units)[0];
        const values = units[unitKey] || [];
        
        const tenQFilings = values.filter(v => v.form === '10-Q');
        if (tenQFilings.length > 0) {
          total10QFilings += tenQFilings.length;
          conceptsWith10Q.push({
            concept: `${taxonomy}.${concept}`,
            count: tenQFilings.length,
            description: data.description || 'No description',
            recentValue: tenQFilings[0]
          });
        }
      });
    });
    
    console.log(`   Total 10-Q filings across all concepts: ${total10QFilings}`);
    console.log(`   Concepts with 10-Q data: ${conceptsWith10Q.length}`);
    
    if (conceptsWith10Q.length > 0) {
      console.log('\n📊 CONCEPTS WITH 10-Q DATA:');
      conceptsWith10Q.forEach((item, index) => {
        console.log(`\n   ${index + 1}. ${item.concept}`);
        console.log(`      Description: ${item.description}`);
        console.log(`      10-Q filings: ${item.count}`);
        console.log(`      Latest 10-Q: ${item.recentValue.end} = $${(item.recentValue.val/1e9).toFixed(2)}B`);
      });
      
      console.log('\n💡 SOLUTION:');
      console.log('   NVIDIA has 10-Q data, but under different concepts than we\'re checking!');
      console.log('   We need to add these concepts to our extraction logic.');
      
    } else {
      console.log('\n❌ NO 10-Q FILINGS FOUND IN ANY CONCEPT');
      console.log('   This suggests NVIDIA might have unusual filing patterns or timing');
      
      // Check for recent 10-K filings to see if data is current
      console.log('\n📅 RECENT 10-K FILINGS FOR CONTEXT:');
      Object.entries(facts).forEach(([taxonomy, concepts]) => {
        Object.entries(concepts).forEach(([concept, data]) => {
          if (concept.toLowerCase().includes('revenue')) {
            const units = data.units;
            const unitKey = Object.keys(units)[0];
            const values = units[unitKey] || [];
            
            const recent10K = values
              .filter(v => v.form === '10-K')
              .sort((a, b) => new Date(b.end) - new Date(a.end))
              .slice(0, 3);
            
            if (recent10K.length > 0) {
              console.log(`\n   ${concept} (${taxonomy}):`);
              recent10K.forEach(v => {
                console.log(`      ${v.end} (${v.form}): $${(v.val/1e9).toFixed(2)}B`);
              });
            }
          }
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error(error.stack);
  }
}

debugNVIDIAConcepts().catch(console.error);