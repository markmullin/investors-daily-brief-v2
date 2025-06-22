// Clear all frontend caches and force reload
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 === NUCLEAR OPTION: DISABLE ALL CACHING ===\n');

// Update api.js to completely disable caching
const apiPath = path.join(__dirname, '..', 'frontend', 'src', 'services', 'api.js');

if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');
  
  // Add timestamp to EVERY API call
  const noCacheWrapper = `
// TEMPORARY: Force no cache on ALL requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  let url = args[0];
  if (typeof url === 'string' && url.includes('/api/')) {
    const separator = url.includes('?') ? '&' : '?';
    url = url + separator + '_t=' + Date.now();
    args[0] = url;
    
    // Add no-cache headers
    if (!args[1]) args[1] = {};
    if (!args[1].headers) args[1].headers = {};
    args[1].headers['Cache-Control'] = 'no-cache';
    args[1].cache = 'no-store';
  }
  return originalFetch.apply(this, args);
};
`;

  // Add at the top of the file after imports
  const importEnd = content.lastIndexOf('import');
  const lineEnd = content.indexOf('\n', importEnd);
  
  if (!content.includes('Force no cache on ALL requests')) {
    content = content.substring(0, lineEnd + 1) + '\n' + noCacheWrapper + '\n' + content.substring(lineEnd + 1);
    fs.writeFileSync(apiPath, content);
    console.log('✅ Added global no-cache wrapper to api.js');
  }
}

// Also update the main App to disable React Query cache
const appPath = path.join(__dirname, '..', 'frontend', 'src', 'App.jsx');

if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  
  if (content.includes('QueryClient') && !content.includes('cacheTime: 0')) {
    // Update QueryClient config to disable caching
    content = content.replace(
      /const queryClient = new QueryClient\(\);/,
      `const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 0,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  },
});`
    );
    
    fs.writeFileSync(appPath, content);
    console.log('✅ Disabled React Query caching in App.jsx');
  }
}

console.log('\n✅ All caching disabled!');
console.log('\nNow:');
console.log('1. Restart frontend: cd ../frontend && npm run dev');
console.log('2. Hard refresh browser: Ctrl+Shift+R');
console.log('3. VXX should now show correct data');
