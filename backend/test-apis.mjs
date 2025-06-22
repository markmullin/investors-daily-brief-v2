// Explicit .mjs extension to ensure ES module mode
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get directory path for this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadServices() {
  console.log('Loading service modules...');
  try {
    // Try dynamic imports
    console.log('Importing eodService...');
    const eodServiceModule = await import('./src/services/eodService.js');
    
    console.log('Importing mistralService...');
    const mistralServiceModule = await import('./src/services/mistralService.js');
    
    console.log('Importing braveNewsService...');
    const braveNewsServiceModule = await import('./src/services/braveNewsService.js');
    
    console.log('All service imports successful!');
    
    return {
      eodService: eodServiceModule.default || eodServiceModule,
      mistralService: mistralServiceModule.default || mistralServiceModule,
      braveNewsService: braveNewsServiceModule.default || braveNewsServiceModule
    };
  } catch (error) {
    console.error('Error importing service modules:', error);
    throw error;
  }
}

async function verifyApis() {
  console.log('=== Investor\'s Daily Brief API Verification ===\n');
  
  // 1. Verify environment variables
  console.log('Environment Configuration:');
  console.log('- EOD_API_KEY:', process.env.EOD_API_KEY ? 'Set (hidden)' : 'Not set');
  console.log('- EOD_API_BASE_URL:', process.env.EOD_API_BASE_URL || 'Not set');
  console.log('- BRAVE_API_KEY:', process.env.BRAVE_API_KEY ? 'Set (hidden)' : 'Not set');
  console.log('- MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Set (hidden)' : 'Not set');
  console.log('- MISTRAL_API_ENDPOINT:', process.env.MISTRAL_API_ENDPOINT || 'Not set');
  
  try {
    // Load services
    const services = await loadServices();
    
    // 2. Verify EOD API
    console.log('\nVerifying EOD API:');
    try {
      const eodSetup = services.eodService.verifyEnvironmentSetup();
      console.log('EOD environment check:', eodSetup);
      
      console.log('Testing simple EOD API call...');
      const testSymbol = 'AAPL.US';
      const stockData = await services.eodService.getSingleStockData(testSymbol, 'high');
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
      const braveStatus = await services.braveNewsService.checkApiStatus();
      console.log('Brave API status:', braveStatus);
      
      if (braveStatus.status === 'active') {
        console.log('Testing market news fetch...');
        const news = await services.braveNewsService.getMarketNews();
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
      const mistralStatus = services.mistralService.getStatus();
      console.log('Mistral Client Status:', mistralStatus);
      
      if (mistralStatus.clientInitialized) {
        console.log('Testing simple text generation...');
        const testResponse = await services.mistralService.generateText('Provide a brief one-sentence summary of current market conditions.');
        console.log('✅ Mistral API working! Response:', testResponse);
      } else {
        console.error('❌ Mistral client not initialized properly');
      }
    } catch (error) {
      console.error('❌ Mistral API test failed:', error.message);
    }
  } catch (error) {
    console.error('Error loading or using service modules:', error);
  }

  console.log('\n=== Verification Complete ===');
}

// Run verification
verifyApis()
  .catch(error => {
    console.error('Unexpected error during verification:', error);
  });