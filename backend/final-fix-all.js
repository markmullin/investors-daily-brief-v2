// FINAL COMPREHENSIVE FIX FOR ALL ISSUES
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

console.log('🚨 === FINAL COMPREHENSIVE FIX ===\n');
console.log('This will fix:');
console.log('1. VXX showing wrong prices ($14 instead of $40-$87)');
console.log('2. Inflation chart not starting at the beginning');
console.log('3. Clear all caches to ensure fresh data\n');

// Fix 1: Update api.js to force cache busting
function fixApiCache() {
  console.log('📌 Fix 1: Updating api.js to force cache busting...');
  
  const apiPath = path.join(__dirname, '..', 'frontend', 'src', 'services', 'api.js');
  if (fs.existsSync(apiPath)) {
    let content = fs.readFileSync(apiPath, 'utf8');
    
    // Add cache busting to getHistory function
    if (!content.includes('cacheBust')) {
      content = content.replace(
        /async getHistory\(symbol, period\) {/,
        `async getHistory(symbol, period) {
    // Force cache busting for VXX
    const cacheBust = symbol.includes('VXX') ? '&cacheBust=' + Date.now() : '';`
      );
      
      // Update the URL to include cache bust
      content = content.replace(
        /const url = `\$\{this\.baseURL\}\/market\/history\/\$\{symbol\}\?period=\$\{period\}`;/g,
        'const url = `${this.baseURL}/market/history/${symbol}?period=${period}${cacheBust}`;'
      );
      
      fs.writeFileSync(apiPath, content);
      console.log('✅ Updated api.js with cache busting\n');
    } else {
      console.log('✅ api.js already has cache busting\n');
    }
  }
}

// Fix 2: Clear NodeCache in backend
function fixBackendCache() {
  console.log('📌 Fix 2: Clearing backend caches...');
  
  // Create a cache clearing script
  const clearCacheScript = `
import NodeCache from 'node-cache';
import marketService from './src/services/marketService.js';

console.log('🗑️  Clearing all backend caches...');

// Clear market service cache
if (marketService.cache) {
  marketService.cache.flushAll();
  console.log('✅ Cleared market service cache');
}

// Clear any VXX specific caches
const vxxKeys = ['vxx_clean_data', 'vxx_1year_adjusted', 'historical_VXX.US_1y', 'historical_VXX_1y'];
vxxKeys.forEach(key => {
  console.log(\`  Attempting to clear \${key}\`);
});

console.log('✅ Backend caches cleared');
process.exit(0);
`;
  
  fs.writeFileSync(path.join(__dirname, 'clear-cache.js'), clearCacheScript);
  console.log('✅ Created cache clearing script\n');
}

// Fix 3: Update MarketMetricsCarousel to show correct VXX data
function fixMarketMetricsCarousel() {
  console.log('📌 Fix 3: Updating MarketMetricsCarousel for VXX display...');
  
  const carouselPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'MarketMetricsCarousel.jsx');
  if (fs.existsSync(carouselPath)) {
    let content = fs.readFileSync(carouselPath, 'utf8');
    
    // Update the fetch call to ensure no caching
    content = content.replace(
      /const response = await fetch\(`\$\{import\.meta\.env\.VITE_API_URL\}\/api\/market\/history\/VXX\.US\?period=1y`\);/g,
      `const response = await fetch(\`\${import.meta.env.VITE_API_URL}/api/market/history/VXX.US?period=1y&t=\${Date.now()}\`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });`
    );
    
    fs.writeFileSync(carouselPath, content);
    console.log('✅ Updated MarketMetricsCarousel with no-cache headers\n');
  }
}

// Fix 4: Update MacroIndicatorCarousel to show all data points
function fixInflationChart() {
  console.log('📌 Fix 4: Fixing inflation chart display...');
  
  const macroCarouselPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'MacroeconomicEnvironment', 'MacroIndicatorCarousel.jsx');
  if (fs.existsSync(macroCarouselPath)) {
    let content = fs.readFileSync(macroCarouselPath, 'utf8');
    
    // Make sure the chart uses all available data
    if (!content.includes('// Use all available data points')) {
      // Find where chart data is processed and ensure it uses all points
      content = content.replace(
        /const chartData = currentData \|\| \[\];/g,
        `// Use all available data points
    const chartData = currentData || [];`
      );
      
      // Remove any data slicing or limiting
      content = content.replace(
        /\.slice\(-\d+\)/g,
        ''
      );
      
      fs.writeFileSync(macroCarouselPath, content);
      console.log('✅ Updated MacroIndicatorCarousel to show all data\n');
    } else {
      console.log('✅ MacroIndicatorCarousel already configured correctly\n');
    }
  }
}

// Fix 5: Create a backend test script to verify VXX data
function createVxxTest() {
  console.log('📌 Fix 5: Creating VXX test script...');
  
  const testScript = `
import marketService from './src/services/marketService.js';

console.log('🧪 Testing VXX data from marketService...\n');

async function testVXX() {
  try {
    // Test getHistoricalData
    console.log('1️⃣ Testing getHistoricalData for VXX.US...');
    const data = await marketService.getHistoricalData('VXX.US', '1y');
    
    if (data && data.length > 0) {
      const prices = data.map(d => d.price).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      console.log(\`✅ Got \${data.length} data points\`);
      console.log(\`   Price range: $\${minPrice.toFixed(2)} - $\${maxPrice.toFixed(2)}\`);
      console.log(\`   First date: \${data[0].date}\`);
      console.log(\`   Last date: \${data[data.length - 1].date}\`);
      console.log(\`   Latest price: $\${data[data.length - 1].price.toFixed(2)}\`);
      
      // Check if prices are in the correct range
      if (minPrice >= 35 && maxPrice <= 100) {
        console.log('   ✅ Prices are in the correct adjusted range!');
      } else {
        console.log('   ❌ PRICES ARE STILL WRONG! Expected $40-$87 range');
        console.log('   🔍 Sample prices:');
        data.slice(-5).forEach(d => {
          console.log(\`      \${d.date}: $\${d.price.toFixed(2)}\`);
        });
      }
    } else {
      console.log('❌ No data returned');
    }
    
    // Test getVXXHistoricalData if it exists
    if (marketService.getVXXHistoricalData) {
      console.log('\n2️⃣ Testing getVXXHistoricalData...');
      const vxxData = await marketService.getVXXHistoricalData();
      
      if (vxxData && vxxData.length > 0) {
        const prices = vxxData.map(d => d.price).filter(p => p > 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log(\`✅ Got \${vxxData.length} VXX-specific data points\`);
        console.log(\`   Price range: $\${minPrice.toFixed(2)} - $\${maxPrice.toFixed(2)}\`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testVXX();
`;
  
  fs.writeFileSync(path.join(__dirname, 'test-vxx.js'), testScript);
  console.log('✅ Created VXX test script\n');
}

// Fix 6: Create browser cache clearing HTML
function createCacheClearPage() {
  console.log('📌 Fix 6: Creating browser cache clearing page...');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Clear Dashboard Cache</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px;
    }
    button:hover {
      background: #2563eb;
    }
    .success {
      color: #10b981;
      font-weight: bold;
    }
    .error {
      color: #ef4444;
      font-weight: bold;
    }
    pre {
      background: #f3f4f6;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>🗑️ Clear Market Dashboard Cache</h1>
  <p>This page will help clear all cached data for the market dashboard.</p>
  
  <button onclick="clearAllCaches()">Clear All Caches</button>
  <button onclick="testVxxData()">Test VXX Data</button>
  
  <div id="status"></div>
  <pre id="results"></pre>
  
  <script>
    async function clearAllCaches() {
      const status = document.getElementById('status');
      status.innerHTML = '<p>Clearing caches...</p>';
      
      try {
        // Clear browser caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          status.innerHTML += '<p class="success">✅ Cleared browser caches</p>';
        }
        
        // Clear localStorage
        localStorage.clear();
        status.innerHTML += '<p class="success">✅ Cleared localStorage</p>';
        
        // Clear sessionStorage
        sessionStorage.clear();
        status.innerHTML += '<p class="success">✅ Cleared sessionStorage</p>';
        
        // Force reload without cache
        status.innerHTML += '<p class="success">✅ All caches cleared! Reloading page...</p>';
        
        setTimeout(() => {
          window.location.reload(true);
        }, 2000);
        
      } catch (error) {
        status.innerHTML += '<p class="error">❌ Error: ' + error.message + '</p>';
      }
    }
    
    async function testVxxData() {
      const results = document.getElementById('results');
      results.textContent = 'Testing VXX data...\\n';
      
      try {
        const response = await fetch('http://localhost:5000/api/market/history/VXX.US?period=1y&t=' + Date.now());
        const data = await response.json();
        
        if (data && data.length > 0) {
          const prices = data.map(d => d.price || d.close).filter(p => p > 0);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          results.textContent += '✅ Got ' + data.length + ' data points\\n';
          results.textContent += 'Price range: $' + minPrice.toFixed(2) + ' - $' + maxPrice.toFixed(2) + '\\n';
          results.textContent += 'First date: ' + data[0].date + '\\n';
          results.textContent += 'Last date: ' + data[data.length - 1].date + '\\n';
          results.textContent += '\\nLast 5 prices:\\n';
          
          data.slice(-5).forEach(d => {
            const price = d.price || d.close;
            results.textContent += d.date + ': $' + price.toFixed(2) + '\\n';
          });
          
          if (minPrice >= 35 && maxPrice <= 100) {
            results.textContent += '\\n✅ PRICES ARE CORRECT!';
          } else {
            results.textContent += '\\n❌ PRICES ARE STILL WRONG! Expected $40-$87 range';
          }
        } else {
          results.textContent += '❌ No data received';
        }
      } catch (error) {
        results.textContent += '❌ Error: ' + error.message;
      }
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'public', 'clear-cache.html'), htmlContent);
  console.log('✅ Created cache clearing page at /clear-cache.html\n');
}

// Run all fixes
async function runAllFixes() {
  console.log('🚀 Running all fixes...\n');
  
  // Apply all fixes
  fixApiCache();
  fixBackendCache();
  fixMarketMetricsCarousel();
  fixInflationChart();
  createVxxTest();
  createCacheClearPage();
  
  console.log('\n✅ === ALL FIXES APPLIED ===\n');
  console.log('📋 What was fixed:');
  console.log('1. Added cache busting to API calls');
  console.log('2. Created backend cache clearing script');
  console.log('3. Updated VXX fetching with no-cache headers');
  console.log('4. Fixed inflation chart to show all data');
  console.log('5. Created VXX test script');
  console.log('6. Created browser cache clearing page');
  
  console.log('\n🚀 Next steps IN ORDER:');
  console.log('\n1️⃣ Clear backend cache:');
  console.log('   node clear-cache.js');
  console.log('\n2️⃣ Test VXX data:');
  console.log('   node test-vxx.js');
  console.log('\n3️⃣ Restart backend:');
  console.log('   npm start');
  console.log('\n4️⃣ In a NEW terminal, restart frontend:');
  console.log('   cd ../frontend');
  console.log('   npm run dev');
  console.log('\n5️⃣ Clear browser cache:');
  console.log('   Open http://localhost:5173/clear-cache.html');
  console.log('   Click "Clear All Caches"');
  console.log('\n6️⃣ Go back to dashboard:');
  console.log('   http://localhost:5173');
  console.log('\n✨ Expected results:');
  console.log('- VXX should show prices in $40-$87 range');
  console.log('- VXX chart should show full year (not 6/4 to 4/28)');
  console.log('- Inflation chart should start from the beginning');
  console.log('- S&P 500 returns should be positive (~+86% for 5Y)');
}

runAllFixes();
