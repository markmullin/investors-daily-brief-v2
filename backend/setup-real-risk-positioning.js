// Quick Setup Script for Real Risk Positioning System
// Installs dependencies and provides setup instructions

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Setting up REAL Risk Positioning System...\n');

async function setupRealRiskPositioning() {
  try {
    console.log('📦 Installing node-cron dependency...');
    await execAsync('npm install node-cron@^3.0.3');
    console.log('✅ node-cron installed successfully\n');

    console.log('🎯 REAL RISK POSITIONING SYSTEM SETUP COMPLETE!\n');
    
    console.log('📋 WHAT WAS FIXED:');
    console.log('✅ Now uses REAL FRED API for economic data (not fake estimates)');
    console.log('✅ Analyzes ALL 500 S&P companies for fundamentals (not just SPY)');
    console.log('✅ Uses 1 efficient API call per company (not 3 separate calls)');
    console.log('✅ Updates only at 9am & 4:30pm ET (not every 5 minutes)');
    console.log('✅ Spreads API calls over time (respects 750/minute limit)');
    console.log('✅ Focuses on P/E and growth (removed irrelevant dividend yield)');
    console.log('✅ Uses ETF volume for flow analysis (practical approach)');
    console.log('✅ Enhanced Brave + Mistral sentiment (no social media complexity)\n');

    console.log('💰 API USAGE OPTIMIZATION:');
    console.log('📉 OLD: ~1,500 calls every 5 minutes = 432,000 calls/day');
    console.log('📈 NEW: ~500 calls twice/day = 1,000 calls/day');
    console.log('💡 SAVINGS: 99.8% reduction in API usage!\n');

    console.log('🔄 TO START THE SYSTEM:');
    console.log('1. cd backend');
    console.log('2. npm start');
    console.log('3. Watch for "Risk Positioning Scheduler started" message');
    console.log('4. Updates will run automatically at 9am & 4:30pm ET\n');

    console.log('📊 DATA SOURCES NOW USED:');
    console.log('🏢 Fundamentals: FMP API - ALL 500 S&P companies');
    console.log('🏦 Macroeconomic: FRED API - Real GDP, unemployment, inflation');
    console.log('📈 Technical: FMP API - Real price data and indicators');  
    console.log('💭 Sentiment: Brave API + Mistral AI - Real news analysis\n');

    console.log('🎯 MANUAL TESTING:');
    console.log('If you want to trigger a manual update (for testing):');
    console.log('GET http://localhost:5000/api/risk-positioning/trigger-update\n');

    console.log('📈 DASHBOARD IMPROVEMENTS:');
    console.log('The frontend will now show:');
    console.log('✅ Real S&P 500 company count analyzed');
    console.log('✅ Data source transparency');
    console.log('✅ Last update timestamp');
    console.log('✅ Next scheduled update time\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🔧 MANUAL SETUP:');
    console.log('Run: npm install node-cron@^3.0.3');
    console.log('Then restart the backend server');
  }
}

setupRealRiskPositioning();