// Simple test script to check if routes are loading
import 'dotenv/config';

console.log('Testing route imports...\n');

async function testRoutes() {
  try {
    console.log('1. Testing Theme Routes...');
    const themeRoutes = await import('./src/routes/themeRoutes.js');
    console.log('✅ Theme routes loaded successfully');
  } catch (error) {
    console.error('❌ Theme routes failed:', error.message);
  }

  try {
    console.log('\n2. Testing Earnings Routes...');
    const earningsRoutes = await import('./src/routes/earningsRoutes.js');
    console.log('✅ Earnings routes loaded successfully');
  } catch (error) {
    console.error('❌ Earnings routes failed:', error.message);
  }

  try {
    console.log('\n3. Testing FMP Service...');
    const fmpService = await import('./src/services/fmpService.js');
    console.log('✅ FMP service loaded');
    console.log('   Has getEarningsCallTranscripts:', typeof fmpService.default.getEarningsCallTranscripts);
  } catch (error) {
    console.error('❌ FMP service failed:', error.message);
  }

  try {
    console.log('\n4. Testing Theme Extraction Service...');
    const themeService = await import('./src/services/earningsThemeExtractionService.js');
    console.log('✅ Theme extraction service loaded');
  } catch (error) {
    console.error('❌ Theme extraction service failed:', error.message);
  }
}

testRoutes().then(() => {
  console.log('\n✅ Route testing complete');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Testing failed:', error);
  process.exit(1);
});
