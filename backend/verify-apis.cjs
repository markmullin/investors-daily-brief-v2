// CommonJS version of the verification script
require('dotenv').config();

// Dynamic imports to work with both ESM and CommonJS
async function loadModules() {
  try {
    // First try to load as ESM
    const { default: eodServiceModule } = await import('./src/services/eodService.js');
    const { default: mistralServiceModule } = await import('./src/services/mistralService.js');
    const { default: braveNewsServiceModule } = await import('./src/services/braveNewsService.js');
    
    return { 
      eodService: eodServiceModule, 
      mistralService: mistralServiceModule, 
      braveNewsService: braveNewsServiceModule 
    };
  } catch (error) {
    console.error('Error loading modules as ESM:', error.message);
    
    // If ESM fails, we'll try CommonJS require (though this should not be reached if type:module)
    try {
      const eodService = require('./src/services/eodService.js');
      const mistralService = require('./src/services/mistralService.js');
      const braveNewsService = require('./src/services/braveNewsService.js');
      
      return { eodService, mistralService, braveNewsService };
    } catch (requireError) {
      console.error('Error loading modules as CommonJS:', requireError.message);
      throw new Error('Failed to load service modules');
    }
  }
}

async function verifyApis() {
  console.log('=== Investor\'s Daily Brief API Verification ===\n');
  
  // 1. Check environment variables
  console.log('Environment Configuration:');
  console.log('- EOD_API_KEY:', process.env.EOD_API_KEY ? 'Set (hidden)' : 'Not set');
  console.log('- EOD_API_BASE_URL:', process.env.EOD_API_BASE_URL || 'Not set');
  console.log('- BRAVE_API_KEY:', process.env.BRAVE_API_KEY ? 'Set (hidden)' : 'Not set');
  console.log('- MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Set (hidden)' : 'Not set');
  console.log('- MISTRAL_API_ENDPOINT:', process.env.MISTRAL_API_ENDPOINT || 'Not set');
  
  try {
    // Load service modules
    console.log('\nLoading service modules...');
    const { eodService, mistralService, braveNewsService } = await loadModules();
    console.log('✅ Service modules loaded successfully');
    
    // 2. Verify EOD API
    console.log('\nVerifying EOD API:');
    try {
      const eodSetup = eodService.verifyEnvironmentSetup();
      console.log('EOD environment check:', eodSetup);
      
      console.log('Testing simple EOD API call...');
      const testSymbol = 'AAPL.US';
      const stockData = await eodService.getSingleStockData(testSymbol, 'high');
      console.log('✅ EOD API working! Sample data for', testSymbol, ':', stockData ? 'Data received' : 'No data');
      if (stockData) {
        console.log('  Price:', stockData.price);
        console.log('  Change:', stockData.change, '(', stockData.changePercent, '%)');
      }
    } catch (error) {
      console.error('❌ EOD API test failed:', error.message);
    }

    // 3. Verify Brave News API
    console.log('\nVerifying Brave News API:');
    try {
      console.log('Testing Brave News API call...');
      const braveStatus = await braveNewsService.checkApiStatus();
      console.log('Brave API status:', braveStatus);
      
      if (braveStatus.status === 'active') {
        console.log('Testing market news fetch...');
        const news = await braveNewsService.getMarketNews();
        console.log('✅ Brave News API working! Retrieved', news.length, 'news items');
        if (news.length > 0) {
          console.log('  Sample headline:', news[0].title);
        }
      }
    } catch (error) {
      console.error('❌ Brave News API test failed:', error.message);
    }

    // 4. Verify Mistral API
    console.log('\nVerifying Mistral AI API:');
    try {
      const mistralStatus = mistralService.getStatus();
      console.log('Mistral Client Status:', mistralStatus);
      
      if (mistralStatus.clientInitialized) {
        console.log('Testing simple text generation...');
        const testResponse = await mistralService.generateText('Provide a brief one-sentence summary of current market conditions.');
        console.log('✅ Mistral API working! Response:', testResponse);
      } else {
        console.error('❌ Mistral client not initialized properly');
      }
    } catch (error) {
      console.error('❌ Mistral API test failed:', error.message);
    }
  } catch (error) {
    console.error('❌ Failed to load service modules:', error.message);
  }

  console.log('\n=== Verification Complete ===');
}

// Run verification
verifyApis()
  .catch(error => {
    console.error('Unexpected error during verification:', error);
  });