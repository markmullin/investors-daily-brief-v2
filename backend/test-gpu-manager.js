// Test file to debug gpuManager import issue
console.log('Starting gpuManager import test...');

try {
  console.log('Attempting to import gpuManager...');
  const gpuManager = await import('./src/services/gpuManager.js');
  console.log('✅ gpuManager imported successfully');
  console.log('gpuManager type:', typeof gpuManager.default);
  console.log('gpuManager initialized?', gpuManager.default?.isInitialized);
} catch (error) {
  console.error('❌ Failed to import gpuManager:');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}

console.log('Test completed successfully');
process.exit(0);