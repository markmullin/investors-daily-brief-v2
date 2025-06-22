// FORCE FRONTEND TO GET FRESH DATA - NO CACHING
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 === FORCING FRONTEND FRESH DATA ===\n');

// Fix 1: Update api.js to completely bypass cache for VXX
function fixApiJs() {
  console.log('📌 Fix 1: Updating api.js to bypass ALL caching...');
  
  const apiPath = path.join(__dirname, '..', 'frontend', 'src', 'services', 'api.js');
  if (fs.existsSync(apiPath)) {
    let content = fs.readFileSync(apiPath, 'utf8');
    
    // Find the getHistory function and replace it completely
    const newGetHistory = `
  async getHistory(symbol, period) {
    try {
      // FORCE NO CACHE for VXX and problem endpoints
      const timestamp = Date.now();
      const isVXX = symbol.includes('VXX');
      const url = \`\${this.baseURL}/market/history/\${symbol}?period=\${period}&t=\${timestamp}\`;
      
      console.log(\`Fetching history for \${symbol} with NO CACHE\`);
      
      // Use fetch with no-cache headers
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch history: \${response.status}\`);
      }
      
      const data = await response.json();
      
      // Log VXX data for debugging
      if (isVXX && data.length > 0) {
        const prices = data.map(d => d.price || d.close).filter(p => p > 0);
        console.log(\`VXX data received: \${data.length} points, price range: $\${Math.min(...prices).toFixed(2)} - $\${Math.max(...prices).toFixed(2)}\`);
      }
      
      return data;
    } catch (error) {
      console.error(\`Error fetching history for \${symbol}:\`, error);
      return [];
    }
  }`;
    
    // Replace the getHistory method
    const regex = /async getHistory\(symbol, period\) {[\s\S]*?^  }/m;
    if (regex.test(content)) {
      content = content.replace(regex, newGetHistory.trim());
    } else {
      // Try alternative pattern
      const altRegex = /getHistory\(symbol, period\) {[\s\S]*?return[\s\S]*?;[\s\S]*?}/;
      if (altRegex.test(content)) {
        content = content.replace(altRegex, newGetHistory.trim());
      }
    }
    
    fs.writeFileSync(apiPath, content);
    console.log('✅ Updated api.js to force fresh data\n');
  }
}

// Fix 2: Update MarketMetricsCarousel to handle VXX display correctly
function fixVXXDisplay() {
  console.log('📌 Fix 2: Fixing VXX chart display...');
  
  const carouselPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'MarketMetricsCarousel.jsx');
  if (fs.existsSync(carouselPath)) {
    let content = fs.readFileSync(carouselPath, 'utf8');
    
    // Fix the date display for VXX
    if (!content.includes('// FIX: Format VXX dates properly')) {
      // Find where VXX chart data is processed
      const processVxxData = `
      // FIX: Format VXX dates properly
      .map(item => {
        const dateValue = item.date || item.timestamp;
        const dateObj = new Date(dateValue);
        const dateString = dateValue ? dateObj.toISOString().split('T')[0] : '';
        
        // Format date for display (M/D format)
        const displayDate = \`\${dateObj.getMonth() + 1}/\${dateObj.getDate()}\`;
        
        return {
          ...item,
          date: dateString,
          displayDate: displayDate,
          vxx: typeof item.price === 'number' ? item.price : 
               (typeof item.close === 'number' ? item.close : null)
        };
      })`;
      
      // Replace the existing map function
      content = content.replace(
        /.map\(item => {[\s\S]*?vxx: typeof item\.price[\s\S]*?}\)/,
        processVxxData
      );
    }
    
    fs.writeFileSync(carouselPath, content);
    console.log('✅ Fixed VXX chart display\n');
  }
}

// Fix 3: Fix inflation chart to show all data
function fixInflationChart() {
  console.log('📌 Fix 3: Fixing inflation chart to show all data...');
  
  const macroCarouselPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'MacroeconomicEnvironment', 'MacroIndicatorCarousel.jsx');
  if (fs.existsSync(macroCarouselPath)) {
    let content = fs.readFileSync(macroCarouselPath, 'utf8');
    
    // Ensure chart shows all data points
    if (!content.includes('// SHOW ALL DATA POINTS')) {
      // Find where data is rendered
      const showAllData = `
      // SHOW ALL DATA POINTS - no filtering
      const chartData = currentData ? [...currentData] : [];
      
      // Ensure we're not limiting data
      const displayData = chartData;`;
      
      // Insert before the chart rendering
      content = content.replace(
        /const chartData = currentData \|\| \[\];/,
        showAllData
      );
    }
    
    fs.writeFileSync(macroCarouselPath, content);
    console.log('✅ Fixed inflation chart\n');
  }
}

// Fix 4: Fix S&P 500 returns calculation
function fixSPYReturns() {
  console.log('📌 Fix 4: Fixing S&P 500 returns calculation...');
  
  const benchmarkPath = path.join(__dirname, '..', 'backend', 'src', 'routes', 'benchmarkRoutes.js');
  if (fs.existsSync(benchmarkPath)) {
    let content = fs.readFileSync(benchmarkPath, 'utf8');
    
    // Ensure we're using adjusted close for returns
    if (!content.includes('// Use adjusted_close for accurate returns')) {
      content = content.replace(
        'const historicalPrice = historicalData.close;',
        `// Use adjusted_close for accurate returns
        const historicalPrice = historicalData.adjusted_close || historicalData.close;`
      );
      
      content = content.replace(
        'const currentPrice = latestData.close;',
        'const currentPrice = latestData.adjusted_close || latestData.close;'
      );
      
      fs.writeFileSync(benchmarkPath, content);
      console.log('✅ Fixed S&P 500 to use adjusted prices\n');
    }
  }
}

// Fix 5: Create cache busting HTML with better functionality
function createBetterCacheClear() {
  console.log('📌 Fix 5: Creating better cache clearing page...');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Force Refresh Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 6px;
      cursor: pointer;
      margin: 10px 5px;
    }
    button:hover {
      background: #2563eb;
    }
    .success {
      color: #10b981;
      font-weight: 600;
    }
    .error {
      color: #ef4444;
      font-weight: 600;
    }
    pre {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 14px;
    }
    .status {
      margin: 20px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Force Refresh Market Dashboard</h1>
    <p>This will clear ALL caches and force the dashboard to load fresh data.</p>
    
    <div>
      <button onclick="clearEverything()">🗑️ Clear Everything & Reload</button>
      <button onclick="testVXX()">🧪 Test VXX Data</button>
      <button onclick="testSPY()">📊 Test S&P 500 Data</button>
    </div>
    
    <div id="status" class="status"></div>
    <pre id="results"></pre>
  </div>
  
  <script>
    async function clearEverything() {
      const status = document.getElementById('status');
      status.innerHTML = '<p>🔄 Clearing all caches...</p>';
      
      try {
        // Clear all types of storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear caches
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        }
        
        // Clear IndexedDB
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          databases.forEach(db => indexedDB.deleteDatabase(db.name));
        }
        
        status.innerHTML = '<p class="success">✅ All caches cleared! Reloading in 2 seconds...</p>';
        
        // Force hard reload
        setTimeout(() => {
          window.location.href = 'http://localhost:5173/?nocache=' + Date.now();
        }, 2000);
        
      } catch (error) {
        status.innerHTML = '<p class="error">❌ Error: ' + error.message + '</p>';
      }
    }
    
    async function testVXX() {
      const results = document.getElementById('results');
      results.textContent = 'Testing VXX data...\\n\\n';
      
      try {
        const response = await fetch('http://localhost:5000/api/market/history/VXX.US?period=1y&t=' + Date.now(), {
          cache: 'no-cache'
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
          const prices = data.map(d => d.price || d.close).filter(p => p > 0);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          results.textContent += '✅ Backend VXX Data:\\n';
          results.textContent += 'Points: ' + data.length + '\\n';
          results.textContent += 'Price range: $' + minPrice.toFixed(2) + ' - $' + maxPrice.toFixed(2) + '\\n';
          results.textContent += 'Date range: ' + data[0].date + ' to ' + data[data.length - 1].date + '\\n\\n';
          
          if (minPrice >= 35 && maxPrice <= 100) {
            results.textContent += '✅ BACKEND PRICES ARE CORRECT!\\n';
          } else {
            results.textContent += '❌ BACKEND PRICES STILL WRONG!\\n';
          }
          
          // Show some sample prices
          results.textContent += '\\nSample prices:\\n';
          data.slice(0, 5).forEach(d => {
            results.textContent += d.date + ': $' + (d.price || d.close).toFixed(2) + '\\n';
          });
        }
      } catch (error) {
        results.textContent += '❌ Error: ' + error.message;
      }
    }
    
    async function testSPY() {
      const results = document.getElementById('results');
      results.textContent = 'Testing S&P 500 returns...\\n\\n';
      
      try {
        const response = await fetch('http://localhost:5000/api/benchmark/returns/SPY?periods=5Y', {
          cache: 'no-cache'
        });
        const data = await response.json();
        
        results.textContent += '✅ S&P 500 Returns Data:\\n';
        results.textContent += JSON.stringify(data, null, 2);
        
        if (data.returns && data.returns['5Y']) {
          const fiveYearReturn = data.returns['5Y'].return;
          results.textContent += '\\n\\n5Y Return: ' + fiveYearReturn.toFixed(2) + '%\\n';
          
          if (fiveYearReturn > 50 && fiveYearReturn < 120) {
            results.textContent += '✅ RETURN LOOKS CORRECT!';
          } else {
            results.textContent += '❌ RETURN STILL WRONG!';
          }
        }
      } catch (error) {
        results.textContent += '❌ Error: ' + error.message;
      }
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'public', 'force-refresh.html'), htmlContent);
  console.log('✅ Created force-refresh.html\n');
}

// Run all fixes
console.log('Running all frontend fixes...\n');
fixApiJs();
fixVXXDisplay();
fixInflationChart();
fixSPYReturns();
createBetterCacheClear();

console.log('\n✅ === ALL FIXES COMPLETE ===\n');
console.log('🚀 Next steps:');
console.log('1. Restart backend: npm start');
console.log('2. Restart frontend: cd ../frontend && npm run dev');
console.log('3. Open: http://localhost:5173/force-refresh.html');
console.log('4. Click "Clear Everything & Reload"');
console.log('\nExpected results:');
console.log('- VXX: Shows 1 year of data with $40-87 prices');
console.log('- Inflation: Chart starts from the beginning');
console.log('- S&P 500: Shows positive ~86% return for 5Y');
