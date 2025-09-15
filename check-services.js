/**
 * Check which Market Environment V2 service is failing
 */

console.log('🔍 Checking Market Environment V2 services...\n');

const services = [
  { name: 'marketPhaseServiceV2', path: './backend/src/services/marketEnvironment/marketPhaseServiceV2.js' },
  { name: 'breadthServiceV2', path: './backend/src/services/marketEnvironment/breadthServiceV2.js' },
  { name: 'sentimentServiceV2', path: './backend/src/services/marketEnvironment/sentimentServiceV2.js' },
  { name: 'sp500AggregationServiceV2', path: './backend/src/services/marketEnvironment/sp500AggregationServiceV2.js' },
  { name: 'marketSynthesisServiceV2', path: './backend/src/services/marketEnvironment/marketSynthesisServiceV2.js' }
];

for (const service of services) {
  try {
    console.log(`Testing ${service.name}...`);
    const module = await import(service.path);
    console.log(`✅ ${service.name} loaded successfully`);
    
    // Check if it has the expected methods
    if (module.default) {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(module.default));
      console.log(`   Methods: ${methods.slice(0, 5).join(', ')}...`);
    }
  } catch (error) {
    console.log(`❌ ${service.name} failed:`, error.message);
    if (error.message.includes('Cannot find module')) {
      const missingModule = error.message.match(/Cannot find module '(.+?)'/)?.[1];
      if (missingModule) {
        console.log(`   Missing dependency: ${missingModule}`);
      }
    }
  }
  console.log('');
}

// Now test the main route file
console.log('Testing main route file...');
try {
  const routeModule = await import('./backend/src/routes/marketEnvironmentV2.js');
  console.log('✅ Route file loaded successfully');
} catch (error) {
  console.log('❌ Route file failed:', error.message);
}

process.exit(0);
