// Force clear VXX cache and test
import axios from 'axios';

const EOD_API_KEY = '678aec6f82cd71.08686199';

async function forceTestVXX() {
  console.log('=== FORCE VXX TEST ===\n');
  
  try {
    // Test 1: Check what the route is actually returning
    console.log('🧪 Testing /api/market/history/VXX.US?period=1y...');
    const routeResponse = await axios.get('http://localhost:5000/api/market/history/VXX.US', {
      params: { period: '1y' }
    });
    
    console.log(`📊 Route Response: ${routeResponse.data.length} data points`);
    
    if (routeResponse.data.length > 0) {
      const prices = routeResponse.data.map(d => d.price || d.close).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const dates = routeResponse.data.map(d => d.date).filter(d => d);
      const earliestDate = dates[dates.length - 1];
      const latestDate = dates[0];
      
      console.log(`📈 Route Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
      console.log(`📅 Route Date range: ${earliestDate} to ${latestDate}`);
      
      // Check for July 22-23 data
      const july22 = routeResponse.data.find(d => d.date === '2024-07-22');
      const july23 = routeResponse.data.find(d => d.date === '2024-07-23');
      console.log(`🗓️ July 22 present: ${!!july22} ${july22 ? `($${july22.price || july22.close})` : ''}`);
      console.log(`🗓️ July 23 present: ${!!july23} ${july23 ? `($${july23.price || july23.close})` : ''}`);
      
      if (minPrice < 20) {
        console.log('❌ ROUTE STILL RETURNING BAD DATA!');
      } else {
        console.log('✅ Route data looks good');
      }
    }
    
    // Test 2: Force fetch 1-year VXX with date constraints
    console.log('\n🔧 Testing forced 1-year VXX fetch...');
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    console.log(`📅 Forced date range: ${startDateStr} to ${endDate}`);
    
    const forcedResponse = await axios.get(`https://eodhd.com/api/eod/VXX.US`, {
      params: {
        api_token: EOD_API_KEY,
        period: 'd',
        order: 'd',
        fmt: 'json',
        from: startDateStr,
        to: endDate
      }
    });
    
    console.log(`📊 Forced API: ${forcedResponse.data.length} data points`);
    
    if (forcedResponse.data.length > 0) {
      // Filter the bad data manually
      const filteredData = forcedResponse.data.filter(item => {
        const itemDate = item.date;
        const price = item.adjusted_close || item.close;
        
        // Remove July 22-23, 2024
        if (itemDate === '2024-07-22' || itemDate === '2024-07-23') {
          console.log(`🗑️ Would filter: ${itemDate} ($${price})`);
          return false;
        }
        
        // Remove extreme outliers
        if (price < 15 || price > 200) {
          console.log(`🗑️ Would filter outlier: ${itemDate} ($${price})`);
          return false;
        }
        
        return true;
      });
      
      console.log(`📊 After manual filtering: ${filteredData.length} data points`);
      
      const filteredPrices = filteredData.map(d => d.adjusted_close || d.close);
      const filteredMin = Math.min(...filteredPrices);
      const filteredMax = Math.max(...filteredPrices);
      
      console.log(`📈 Filtered price range: $${filteredMin.toFixed(2)} - $${filteredMax.toFixed(2)}`);
      
      if (filteredMin >= 20) {
        console.log('✅ Manual filtering works - data looks correct!');
      }
    }
    
  } catch (error) {
    console.error('❌ VXX test failed:', error.message);
  }
  
  console.log('\n=== VXX TEST COMPLETE ===');
}

// Run the test
forceTestVXX();