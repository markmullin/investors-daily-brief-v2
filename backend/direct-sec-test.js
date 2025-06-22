import axios from 'axios';

// Direct test of SEC EDGAR API to see what Apple actually has
async function directSECTest() {
  try {
    console.log('🔍 Direct SEC API test for Apple...\n');
    
    // Get Apple's CIK
    const tickersResponse = await axios.get('https://www.sec.gov/files/company_tickers.json', {
      headers: {
        'User-Agent': 'InvestorsDailyBrief test@example.com',
        'Accept': 'application/json'
      }
    });
    
    const tickers = tickersResponse.data;
    const apple = Object.values(tickers).find(c => c.ticker === 'AAPL');
    const cik = String(apple.cik_str).padStart(10, '0');
    
    console.log(`✅ Apple CIK: ${cik}`);
    
    // Get Apple's company facts
    const factsResponse = await axios.get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
      headers: {
        'User-Agent': 'InvestorsDailyBrief test@example.com',
        'Accept': 'application/json'
      }
    });
    
    const facts = factsResponse.data.facts;
    
    if (facts['us-gaap']) {
      const concepts = Object.keys(facts['us-gaap']);
      console.log(`📊 Total US-GAAP concepts: ${concepts.length}\n`);
      
      // Test our specific concepts
      const testConcepts = [
        'Revenues',
        'NetIncomeLoss', 
        'CostOfGoodsAndServicesSold',
        'CostOfRevenue',
        'CostOfGoodsSold',
        'NetCashProvidedByUsedInOperatingActivities',
        'PaymentsToAcquirePropertyPlantAndEquipment'
      ];
      
      console.log('🎯 Testing specific concepts:');
      testConcepts.forEach(concept => {
        if (facts['us-gaap'][concept]) {
          const data = facts['us-gaap'][concept];
          const usdData = data.units?.USD || [];
          const quarterlyData = usdData.filter(d => d.form === '10-Q');
          
          console.log(`✅ ${concept}:`);
          console.log(`   - Total USD data points: ${usdData.length}`);
          console.log(`   - Quarterly (10-Q) data points: ${quarterlyData.length}`);
          
          if (quarterlyData.length > 0) {
            const recent = quarterlyData.slice(-3);
            console.log(`   - Recent quarters:`, recent.map(d => ({
              period: d.end,
              value: (d.val / 1e9).toFixed(2) + 'B',
              form: d.form
            })));
          }
        } else {
          console.log(`❌ ${concept}: Not found`);
        }
      });
      
      // Search for cost-related concepts that DO exist
      console.log('\n💰 Available cost-related concepts:');
      const availableCostConcepts = concepts.filter(c => 
        c.toLowerCase().includes('cost') && 
        facts['us-gaap'][c].units?.USD?.length > 0
      ).slice(0, 10);
      
      availableCostConcepts.forEach(concept => {
        const quarterlyData = facts['us-gaap'][concept].units.USD.filter(d => d.form === '10-Q');
        console.log(`  ✅ ${concept} (${quarterlyData.length} quarterly points)`);
      });
      
      // Search for cash flow concepts that DO exist
      console.log('\n💧 Available cash flow concepts:');
      const availableCashConcepts = concepts.filter(c => 
        (c.toLowerCase().includes('cash') || c.toLowerCase().includes('operating')) && 
        facts['us-gaap'][c].units?.USD?.length > 0
      ).slice(0, 10);
      
      availableCashConcepts.forEach(concept => {
        const quarterlyData = facts['us-gaap'][concept].units.USD.filter(d => d.form === '10-Q');
        console.log(`  ✅ ${concept} (${quarterlyData.length} quarterly points)`);
      });
      
      // Search for capex concepts that DO exist
      console.log('\n🏗️ Available capex-related concepts:');
      const availableCapexConcepts = concepts.filter(c => 
        (c.toLowerCase().includes('property') || 
         c.toLowerCase().includes('equipment') || 
         c.toLowerCase().includes('capital') ||
         c.toLowerCase().includes('acquisition')) && 
        facts['us-gaap'][c].units?.USD?.length > 0
      ).slice(0, 10);
      
      availableCapexConcepts.forEach(concept => {
        const quarterlyData = facts['us-gaap'][concept].units.USD.filter(d => d.form === '10-Q');
        console.log(`  ✅ ${concept} (${quarterlyData.length} quarterly points)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

directSECTest();