/**
 * Diagnose why Market Environment V2 routes aren't loading
 * Run from backend directory: cd backend && node ../diagnose-routes.js
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Starting Market Environment V2 Route Diagnostic...\n');
console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);

// Test 1: Can we import the simple route file?
console.log('\nTest 1: Importing simple route file...');
try {
  const routeModule = await import('./backend/src/routes/marketEnvironmentV2-simple.js');
  console.log('✅ Simple route file imported successfully');
  console.log('   Type:', typeof routeModule.default);
  console.log('   Is Express Router?', routeModule.default && routeModule.default.stack ? 'Yes' : 'No');
} catch (error) {
  console.log('❌ Failed to import simple route file');
  console.log('   Error:', error.message);
}

// Test 2: Can we import the full route file?
console.log('\nTest 2: Importing full route file...');
try {
  const routeModule = await import('./backend/src/routes/marketEnvironmentV2.js');
  console.log('✅ Full route file imported successfully');
} catch (error) {
  console.log('❌ Failed to import full route file');
  console.log('   Error:', error.message);
  console.log('\n   This is likely the problem! The error above shows why the route isn\'t loading.');
}

// Test 3: Check each service individually
console.log('\nTest 3: Testing individual service imports...');
const services = [
  'marketPhaseServiceV2',
  'breadthServiceV2', 
  'sentimentServiceV2',
  'sp500AggregationServiceV2',
  'marketSynthesisServiceV2'
];

for (const service of services) {
  try {
    const path = `./backend/src/services/marketEnvironment/${service}.js`;
    await import(path);
    console.log(`✅ ${service} imported successfully`);
  } catch (error) {
    console.log(`❌ ${service} failed:`, error.message);
    if (error.message.includes('fredService')) {
      console.log('   → Missing fredService import! This service needs fredService.');
    }
  }
}

console.log('\n📋 Diagnostic complete!');
process.exit(0);
