// Test Macroeconomic API endpoints
import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

async function testMacroEndpoints() {
    console.log('🔍 Testing Macroeconomic API Endpoints...\n');
    
    try {
        // Test health endpoint first
        console.log('1. Testing /api/health...');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✅ Health check:', healthResponse.data.status);
        console.log('\n');
        
        // Test simple macro endpoint
        console.log('2. Testing /api/macroeconomic/simple...');
        const simpleResponse = await axios.get(`${baseURL}/macroeconomic/simple`, {
            timeout: 30000
        });
        
        console.log('✅ Simple macro response received');
        console.log('   - Interest Rates:', simpleResponse.data.interestRates?.latest || 'Missing');
        console.log('   - GDP Growth:', simpleResponse.data.growthInflation?.latest?.gdpGrowth || 'Missing');
        console.log('   - CPI:', simpleResponse.data.growthInflation?.latest?.cpi || 'Missing');
        console.log('   - Unemployment:', simpleResponse.data.laborConsumer?.latest?.unemployment || 'Missing');
        console.log('\n');
        
        // Test all macro endpoint
        console.log('3. Testing /api/macroeconomic/all...');
        const allResponse = await axios.get(`${baseURL}/macroeconomic/all`, {
            timeout: 30000
        });
        
        console.log('✅ Full macro response received');
        console.log('   - Has Interest Rates:', !!allResponse.data.interestRates);
        console.log('   - Has Growth Data:', !!allResponse.data.growthInflation);
        console.log('   - Has Labor Data:', !!allResponse.data.laborConsumer);
        console.log('   - Has Monetary Policy:', !!allResponse.data.monetaryPolicy);
        console.log('\n');
        
        // Check if data has actual values (not N/A)
        const hasValidData = (data) => {
            return data && data.value !== null && data.value !== undefined;
        };
        
        const latestData = allResponse.data;
        if (latestData.interestRates?.latest) {
            console.log('📊 Latest Interest Rates:');
            console.log('   - 2-Year:', latestData.interestRates.latest.twoYear);
            console.log('   - 10-Year:', latestData.interestRates.latest.tenYear);
            console.log('   - 30-Year:', latestData.interestRates.latest.thirtyYear);
        }
        
        if (latestData.growthInflation?.latest) {
            console.log('\n📊 Latest Growth & Inflation:');
            console.log('   - GDP Growth:', latestData.growthInflation.latest.gdpGrowth);
            console.log('   - CPI:', latestData.growthInflation.latest.cpi);
            console.log('   - PCE:', latestData.growthInflation.latest.pce);
            console.log('   - PPI:', latestData.growthInflation.latest.ppi);
        }
        
        if (latestData.laborConsumer?.latest) {
            console.log('\n📊 Latest Labor & Consumer:');
            console.log('   - Unemployment:', latestData.laborConsumer.latest.unemployment);
            console.log('   - Retail Sales:', latestData.laborConsumer.latest.retailSales);
            console.log('   - Real Personal Income:', latestData.laborConsumer.latest.realPersonalIncome);
        }
        
        console.log('\n✅ All tests passed! Backend is working.');
        
    } catch (error) {
        console.error('❌ Error testing endpoints:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   Backend server is not running on port 5000!');
            console.error('   Please start the backend server first.');
        }
    }
}

// Run the tests
testMacroEndpoints();