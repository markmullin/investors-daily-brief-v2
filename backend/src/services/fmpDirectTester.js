/**
 * 🧪 FMP API DIRECT TEST - Validate FMP Service Data Quality
 * Chief Software Engineer: Test FMP API directly with different parameters
 * Purpose: Determine if issue is with our API calls or FMP data
 */

import fmpService from '../services/fmpService.js';

class FMPDirectTester {
  constructor() {
    this.baseURL = 'https://financialmodelingprep.com/api';
    this.apiKey = '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1';
  }

  async testCompanyDirectly(symbol) {
    console.log(`\n🔍 [FMP DIRECT TEST] Testing ${symbol} with multiple endpoint variations...`);
    console.log('='.repeat(80));

    try {
      // Test 1: Current quarterly method
      console.log('\n1️⃣ CURRENT QUARTERLY METHOD:');
      const currentQuarterly = await fmpService.getQuarterlyIncomeStatement(symbol, 4);
      if (currentQuarterly && currentQuarterly.length > 0) {
        console.log(`📊 Records returned: ${currentQuarterly.length}`);
        currentQuarterly.slice(0, 2).forEach((record, index) => {
          console.log(`   [${index}] ${record.date} - Revenue: $${(record.revenue/1e9).toFixed(2)}B, Period: ${record.period}`);
        });
      } else {
        console.log('❌ No data returned');
      }

      // Test 2: Annual for comparison
      console.log('\n2️⃣ ANNUAL METHOD (for comparison):');
      const annual = await fmpService.getAnnualIncomeStatement(symbol, 2);
      if (annual && annual.length > 0) {
        console.log(`📊 Records returned: ${annual.length}`);
        annual.forEach((record, index) => {
          console.log(`   [${index}] ${record.date} - Revenue: $${(record.revenue/1e9).toFixed(2)}B, Period: ${record.period}`);
        });
      } else {
        console.log('❌ No data returned');
      }

      // Test 3: Raw API call with different parameters
      console.log('\n3️⃣ RAW API TESTS:');
      const testParams = [
        { period: 'quarter', limit: 4 },
        { period: 'quarter', limit: 8 },
        { limit: 4 }, // No period specified
        { period: 'annual', limit: 2 }
      ];

      for (let i = 0; i < testParams.length; i++) {
        const params = testParams[i];
        console.log(`\n   Test ${i+1}: ${JSON.stringify(params)}`);
        
        try {
          const result = await fmpService.makeRequest(`/v3/income-statement/${symbol}`, params, 0); // No cache
          if (result && result.length > 0) {
            console.log(`   📊 Records: ${result.length}`);
            result.slice(0, 2).forEach((record, idx) => {
              const revenue = record.revenue ? (record.revenue/1e9).toFixed(2) : 'N/A';
              console.log(`      [${idx}] ${record.date} - Revenue: $${revenue}B, Period: ${record.period || 'N/A'}`);
            });
          } else {
            console.log('   ❌ No data');
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }

      return true;

    } catch (error) {
      console.error(`❌ [FMP DIRECT TEST] Error testing ${symbol}:`, error.message);
      return false;
    }
  }

  async runComprehensiveTest() {
    console.log('🧪 FMP API DIRECT VALIDATION TEST');
    console.log('Testing FMP API endpoints directly to validate data quality');
    console.log('Purpose: Determine if issue is with our calls or FMP data');
    console.log('='.repeat(80));

    const testSymbols = ['GS', 'JPM', 'AAPL'];
    
    for (const symbol of testSymbols) {
      await this.testCompanyDirectly(symbol);
      
      // Delay between tests
      if (symbol !== testSymbols[testSymbols.length - 1]) {
        console.log('\n⏱️ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎯 TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('📋 Analysis:');
    console.log('   - Compare quarterly vs annual data for each company');
    console.log('   - Check if different parameters return different results');
    console.log('   - Verify date ranges and periods match expectations');
    console.log('   - Look for Q1 2025 data specifically');
    console.log('\n💡 Next Steps:');
    console.log('   - If data looks wrong across all methods: Contact FMP support');
    console.log('   - If one method works better: Update our service to use that method');
    console.log('   - If dates/periods are off: Adjust our date filtering logic');
  }
}

export default FMPDirectTester;
