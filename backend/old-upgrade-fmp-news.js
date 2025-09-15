/**
 * UPGRADE FMP NEWS SERVICE SCRIPT
 * Safely replaces current FMP service with enhanced version
 */
import fs from 'fs';
import path from 'path';

const backupPath = './src/services/fmpNewsService.backup.js';
const currentPath = './src/services/fmpNewsService.js';
const enhancedPath = './src/services/enhancedFmpNewsService.js';

console.log('🔄 Upgrading FMP News Service to Enhanced Version...');

try {
  // Backup current service
  console.log('💾 Creating backup of current service...');
  fs.copyFileSync(currentPath, backupPath);
  console.log('✅ Backup created at:', backupPath);
  
  // Replace with enhanced version
  console.log('🚀 Installing enhanced FMP news service...');
  fs.copyFileSync(enhancedPath, currentPath);
  console.log('✅ Enhanced service installed');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Restart your backend server');
  console.log('2. Test the dashboard news sources');
  console.log('3. You should see more Reuters, Bloomberg, Barrons sources');
  console.log('\n💡 If any issues, restore backup with:');
  console.log(`   copy "${backupPath}" "${currentPath}"`);
  
} catch (error) {
  console.error('❌ Upgrade failed:', error.message);
  process.exit(1);
}

console.log('\n✅ FMP News Service upgrade complete!');
