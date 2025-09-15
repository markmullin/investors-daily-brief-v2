/**
 * Test FMP Service Methods
 * Verifies all methods are properly exported
 */

import fmpService from './src/services/fmpService.js';

console.log('🔍 Testing FMP Service Methods...\n');

// List of methods we expect to have
const expectedMethods = [
  // Enhanced service methods
  'getQuote',
  'getQuoteBatch',
  'getHistoricalPrices',
  'getCompanyProfile',
  'getMarketHours',
  'getRealTimePrice',
  'getIncomeStatement',
  'getBalanceSheet',
  'getCashFlowStatement',
  'getKeyMetrics',
  'getFinancialRatios',
  'getInsiderTrading',
  'getSectorPerformance',
  'getMarketIndices',
  'getIntradayChart',
  'getEarningsCalendarForDate',
  'getNews',
  'healthCheck',
  'testConnection',
  
  // Earnings extension methods
  'getEarningsCallTranscripts',
  'getEarningsTranscriptByQuarter',
  'getEarningsCalendar',
  'getComprehensiveEarningsAnalysis'
];

// Check each method
console.log('Method availability check:');
console.log('─'.repeat(50));

let missingMethods = [];
let availableMethods = [];

expectedMethods.forEach(method => {
  const exists = typeof fmpService[method] === 'function';
  if (exists) {
    availableMethods.push(method);
    console.log(`✅ ${method}: Available`);
  } else {
    missingMethods.push(method);
    console.log(`❌ ${method}: MISSING`);
  }
});

console.log('\n' + '─'.repeat(50));
console.log(`\n📊 Summary:`);
console.log(`   Available: ${availableMethods.length}/${expectedMethods.length}`);
console.log(`   Missing: ${missingMethods.length}/${expectedMethods.length}`);

if (missingMethods.length > 0) {
  console.log(`\n⚠️  Missing methods:`, missingMethods);
}

// Also check for any unexpected methods
console.log('\n🔍 All available methods in fmpService:');
console.log('─'.repeat(50));
Object.keys(fmpService)
  .filter(key => typeof fmpService[key] === 'function')
  .forEach(method => {
    console.log(`   - ${method}`);
  });

console.log('\n✅ Test complete!');
process.exit(0);
