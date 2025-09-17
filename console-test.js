// Test script to run in browser console on investorsdailybrief.com
// Copy and paste this entire block into the browser console

console.log('Testing API endpoints from production site...\n');

const endpoints = [
    '/api/research/financial-statements/balance-sheet/AAPL?limit=1',
    '/api/research/financial-statements/income-statement/AAPL?limit=1', 
    '/api/research/financial-statements/cash-flow/AAPL?limit=1',
    '/api/research/analyst-ratings/AAPL',
    '/api/research/fundamentals/AAPL',
    '/api/market/quote/AAPL',
    '/health'
];

async function testEndpoint(path) {
    try {
        const response = await fetch(path);
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ ${path} - STATUS: ${response.status}`);
            return true;
        } else {
            console.error(`❌ ${path} - STATUS: ${response.status}`, data);
            return false;
        }
    } catch (error) {
        console.error(`💥 ${path} - ERROR:`, error.message);
        return false;
    }
}

(async () => {
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
    }
    console.log('\nTest complete. Check results above.');
})();
