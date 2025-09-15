// Frontend M2 Data Debug Test
import axios from 'axios';

async function testM2Data() {
  console.log('=== M2 FRONTEND DATA TEST ===\n');
  
  try {
    // Test macroeconomic API endpoint
    console.log('🧪 Testing macroeconomic/simple endpoint...');
    const response = await axios.get('http://localhost:5173/api/macroeconomic/simple');
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.data) {
      const data = response.data;
      console.log(`📊 Response keys: ${Object.keys(data).join(', ')}`);
      
      if (data.growthInflation) {
        console.log('\n💰 GROWTH & INFLATION DATA ANALYSIS:');
        console.log(`📊 Has data: ${!!data.growthInflation.data}`);
        console.log(`📊 Has latest: ${!!data.growthInflation.latest}`);
        
        if (data.growthInflation.data) {
          const dataKeys = Object.keys(data.growthInflation.data);
          console.log(`📊 Data keys: ${dataKeys.join(', ')}`);
          
          // Check M2 specifically
          const m2Data = data.growthInflation.data.M2SL;
          const m2YoYData = data.growthInflation.data.M2_YOY;
          
          console.log(`\n💰 M2SL data:`, m2Data ? `${m2Data.length} points` : 'NOT FOUND');
          console.log(`💰 M2_YOY data:`, m2YoYData ? `${m2YoYData.length} points` : 'NOT FOUND');
          
          if (m2Data && m2Data.length > 0) {
            const latest = m2Data[m2Data.length - 1];
            console.log(`💰 Latest M2: $${(latest.value / 1000).toFixed(1)}T on ${latest.date}`);
          }
          
          if (m2YoYData && m2YoYData.length > 0) {
            const latest = m2YoYData[m2YoYData.length - 1];
            console.log(`💰 Latest M2 Growth: ${latest.value.toFixed(2)}% on ${latest.date}`);
          }
        }
        
        if (data.growthInflation.latest) {
          const latest = data.growthInflation.latest;
          console.log(`\n📊 Latest keys: ${Object.keys(latest).join(', ')}`);
          
          console.log(`💰 Latest M2 Supply:`, latest.m2MoneySupply ? `$${(latest.m2MoneySupply.value / 1000).toFixed(1)}T` : 'NOT FOUND');
          console.log(`💰 Latest M2 Growth:`, latest.m2Growth ? `${latest.m2Growth.value.toFixed(2)}%` : 'NOT FOUND');
        }
        
        // Test data processing like the component does
        console.log('\n🔧 TESTING DATA PROCESSING...');
        
        if (data.growthInflation.data) {
          const { data: macroData } = data.growthInflation;
          const gdp = macroData.A191RL1Q225SBEA || [];
          const cpi = macroData.CPI_YOY || [];
          const pce = macroData.PCE_YOY || [];
          const m2 = macroData.M2SL || [];
          const m2YoY = macroData.M2_YOY || [];
          
          console.log(`📊 GDP data points: ${gdp.length}`);
          console.log(`📊 CPI data points: ${cpi.length}`);
          console.log(`📊 PCE data points: ${pce.length}`);
          console.log(`📊 M2 data points: ${m2.length}`);
          console.log(`📊 M2 YoY data points: ${m2YoY.length}`);
          
          // Get all dates
          const allDates = new Set([
            ...gdp.map(d => d.date),
            ...cpi.map(d => d.date),
            ...pce.map(d => d.date),
            ...m2.map(d => d.date),
            ...m2YoY.map(d => d.date)
          ]);
          
          const sortedDates = Array.from(allDates).sort();
          console.log(`📅 Total unique dates: ${sortedDates.length}`);
          console.log(`📅 Date range: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`);
          
          // Filter to last 2 years like component does
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          const filteredDates = sortedDates.filter(date => new Date(date) >= twoYearsAgo);
          
          console.log(`📅 Filtered dates (2 years): ${filteredDates.length}`);
          
          // Process data points
          const processedData = filteredDates.map(date => {
            const gdpPoint = gdp.find(d => d.date === date);
            const cpiPoint = cpi.find(d => d.date === date);
            const pcePoint = pce.find(d => d.date === date);
            const m2Point = m2.find(d => d.date === date);
            const m2YoYPoint = m2YoY.find(d => d.date === date);
            
            return {
              date,
              gdpGrowth: gdpPoint?.value || null,
              cpi: cpiPoint?.value || null,
              pce: pcePoint?.value || null,
              m2Supply: m2Point?.value || null,
              m2Growth: m2YoYPoint?.value || null
            };
          }).filter(d => d.gdpGrowth !== null || d.cpi !== null || d.pce !== null || d.m2Supply !== null || d.m2Growth !== null);
          
          console.log(`📊 Final processed data points: ${processedData.length}`);
          
          // Check M2 data in processed results
          const m2SupplyPoints = processedData.filter(d => d.m2Supply !== null);
          const m2GrowthPoints = processedData.filter(d => d.m2Growth !== null);
          
          console.log(`💰 M2 Supply points in processed data: ${m2SupplyPoints.length}`);
          console.log(`💰 M2 Growth points in processed data: ${m2GrowthPoints.length}`);
          
          if (m2SupplyPoints.length > 0) {
            const latest = m2SupplyPoints[m2SupplyPoints.length - 1];
            console.log(`💰 Latest processed M2 Supply: $${(latest.m2Supply / 1000).toFixed(1)}T on ${latest.date}`);
          }
          
          if (m2GrowthPoints.length > 0) {
            const latest = m2GrowthPoints[m2GrowthPoints.length - 1];
            console.log(`💰 Latest processed M2 Growth: ${latest.m2Growth.toFixed(2)}% on ${latest.date}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ M2 test failed:', error.message);
    if (error.response) {
      console.log(`HTTP Status: ${error.response.status}`);
      console.log(`Response:`, error.response.data);
    }
  }
  
  console.log('\n=== M2 TEST COMPLETE ===');
}

// Export for use in browser console
window.testM2Data = testM2Data;

console.log('M2 test loaded. Run testM2Data() in console to debug M2 data flow.');