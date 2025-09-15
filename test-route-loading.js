/**
 * Test if server can load routes
 */

console.log('Testing route loading...\n');

// Test importing the simple route directly
try {
  const simpleRoute = await import('./backend/src/routes/marketEnvironmentV2-simple.js');
  console.log('✅ Simple route imported:', typeof simpleRoute.default);
} catch (error) {
  console.log('❌ Simple route failed:', error.message);
}

// Test the server's route loading
console.log('\nSimulating server route loading...');

const routes = [
  { path: '/api/market-env', module: './backend/src/routes/marketEnvironmentV2-simple.js', name: 'Market Environment V2' }
];

for (const route of routes) {
  try {
    console.log(`Loading ${route.name}...`);
    const routeModule = await import(route.module);
    console.log(`✅ Loaded successfully`);
    console.log(`   Type: ${typeof routeModule.default}`);
    console.log(`   Has default export: ${!!routeModule.default}`);
  } catch (error) {
    console.log(`❌ Failed:`, error.message);
  }
}

process.exit(0);
