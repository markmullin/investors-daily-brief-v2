// quickDiagnostic.js - Test each AI service individually
import 'dotenv/config';

console.log('🔍 QUICK AI DIAGNOSTIC');
console.log('='.repeat(50));

// Test 1: Environment Variables
console.log('\n1️⃣ ENVIRONMENT CHECK:');
console.log(`   MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   BRAVE_API_KEY: ${process.env.BRAVE_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   USE_MISTRAL_API: ${process.env.USE_MISTRAL_API || 'not set'}`);

// Test 2: Mistral Service Import
console.log('\n2️⃣ MISTRAL SERVICE TEST:');
try {
  const mistralService = await import('./src/services/mistralService.js');
  console.log('   ✅ Mistral service import successful');
  
  const status = mistralService.default.getStatus();
  console.log(`   Status:`, status);
  
  // Try to initialize
  console.log('   🔄 Attempting Mistral initialization...');
  const initResult = await mistralService.default.initialize();
  console.log(`   Initialization: ${initResult ? '✅ Success' : '❌ Failed'}`);
  
} catch (error) {
  console.log(`   ❌ Mistral service error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
}

// Test 3: News Service Import
console.log('\n3️⃣ NEWS SERVICE TEST:');
try {
  const newsService = await import('./src/services/premiumNewsService.js');
  console.log('   ✅ News service import successful');
  
  const status = newsService.default.getStatus();
  console.log(`   Status:`, status);
  
} catch (error) {
  console.log(`   ❌ News service error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
}

// Test 4: AI Analysis Service Import
console.log('\n4️⃣ AI ANALYSIS SERVICE TEST:');
try {
  const aiService = await import('./src/services/realAiAnalysisService.js');
  console.log('   ✅ AI analysis service import successful');
  
  const status = aiService.default.getStatus();
  console.log(`   Status:`, status);
  
} catch (error) {
  console.log(`   ❌ AI analysis service error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
}

// Test 5: Simple HTTP Request
console.log('\n5️⃣ NETWORK TEST:');
try {
  const axios = await import('axios');
  console.log('   ✅ Axios import successful');
  
  const response = await axios.default.get('https://httpbin.org/get', { timeout: 5000 });
  console.log(`   ✅ HTTP request successful: ${response.status}`);
  
} catch (error) {
  console.log(`   ❌ Network error: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
console.log('🏁 DIAGNOSTIC COMPLETE');
