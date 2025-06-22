// Script to ensure frontend's localStorage is cleared
import fs from 'fs';
import path from 'path';

// Get frontend service worker file
const frontendDir = path.resolve(process.cwd(), '../frontend');
const apiFile = path.join(frontendDir, 'src', 'services', 'api.js');

// Read current file
let content = fs.readFileSync(apiFile, 'utf8');

// Modify cache duration to 0 temporarily (for testing)
content = content.replace(
  /fetchWithCaching = async \(endpoint, cacheDuration = (.*?)\)/,
  'fetchWithCaching = async (endpoint, cacheDuration = 0)'
);

// Add cache-busting log
if (!content.includes('CACHE_BUSTING_ENABLED')) {
  const insertPoint = content.indexOf('export const fetchWithCaching');
  const cacheCode = `
// CACHE_BUSTING_ENABLED
console.log('===== CACHE BUSTING ENABLED =====');
// Clear localStorage on startup
if (typeof window !== 'undefined') {
  console.log('Clearing localStorage cache...');
  Object.keys(localStorage)
    .filter(key => key.startsWith('market_dashboard_cache_'))
    .forEach(key => localStorage.removeItem(key));
}
`;
  content = content.slice(0, insertPoint) + cacheCode + content.slice(insertPoint);
}

// Write updated file
fs.writeFileSync(apiFile, content);

console.log('Frontend cache busting enabled. Restart frontend to apply changes.');
console.log('\nTo run the complete test:');
console.log('1. In one terminal:');
console.log('   cd c:\\Users\\win10user\\Documents\\financial-software\\investors-daily-brief\\backend');
console.log('   npm start');
console.log('2. In another terminal:');
console.log('   cd c:\\Users\\win10user\\Documents\\financial-software\\investors-daily-brief\\frontend');
console.log('   npm run dev');
console.log('3. In a third terminal:');
console.log('   cd c:\\Users\\win10user\\Documents\\financial-software\\investors-daily-brief\\backend');
console.log('   node test-indicators-direct.js');
console.log('\nOnce verified, restart both frontend and backend to use normal caching.');
