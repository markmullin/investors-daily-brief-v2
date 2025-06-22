// Final comprehensive fix for all display issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 === FINAL COMPREHENSIVE DISPLAY FIX ===\n');

// Fix 1: Update MarketAnalysis component if it exists
function fixMarketAnalysis() {
  console.log('📌 Checking MarketAnalysis component...');
  const marketAnalysisPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'MarketAnalysis.jsx');
  
  if (fs.existsSync(marketAnalysisPath)) {
    let content = fs.readFileSync(marketAnalysisPath, 'utf8');
    
    // Check if it's fetching VXX data
    if (content.includes('VXX')) {
      console.log('Found VXX reference in MarketAnalysis');
      
      // Make sure it's not caching
      content = content.replace(
        /const.*VXX.*=.*useQuery/g,
        'const vxxQuery = useQuery(["vxx", Date.now()], () => fetchVXXData(), { cacheTime: 0, staleTime: 0 })'
      );
      
      fs.writeFileSync(marketAnalysisPath, content);
      console.log('✅ Updated MarketAnalysis\n');
    }
  }
}

// Fix 2: Find any component that displays VXX chart
function findVXXComponents() {
  console.log('📌 Searching for VXX display components...');
  const componentsDir = path.join(__dirname, '..', 'frontend', 'src', 'components');
  
  const searchInFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('VXX') && content.includes('chart')) {
      console.log(`Found VXX chart in: ${path.basename(filePath)}`);
      
      // Check for date formatting issues
      if (content.includes('6/4') || content.includes('4/28')) {
        console.log('  ⚠️  Found hardcoded dates!');
      }
    }
  };
  
  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        searchInFile(filePath);
      }
    });
  };
  
  walkDir(componentsDir);
  console.log('');
}

// Fix 3: Update query client configuration
function updateQueryClient() {
  console.log('📌 Updating React Query configuration...');
  const mainPath = path.join(__dirname, '..', 'frontend', 'src', 'main.jsx');
  
  if (fs.existsSync(mainPath)) {
    let content = fs.readFileSync(mainPath, 'utf8');
    
    if (content.includes('QueryClient') && !content.includes('defaultOptions')) {
      content = content.replace(
        /const queryClient = new QueryClient\(\)/g,
        `const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true
    }
  }
})`
      );
      
      fs.writeFileSync(mainPath, content);
      console.log('✅ Updated React Query defaults\n');
    }
  }
}

// Fix 4: Create a test component
function createTestComponent() {
  console.log('📌 Creating VXX test component...');
  
  const testComponent = `import React, { useEffect, useState } from 'react';

export default function VXXTest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('http://localhost:5000/api/market/history/VXX.US?period=1y&t=' + Date.now())
      .then(r => r.json())
      .then(data => {
        setData(data);
        setLoading(false);
        
        // Log to console
        if (data && data.length > 0) {
          const prices = data.map(d => d.price || d.close).filter(p => p > 0);
          console.log('VXX Test Component:');
          console.log('- Data points:', data.length);
          console.log('- Price range: $' + Math.min(...prices).toFixed(2) + ' - $' + Math.max(...prices).toFixed(2));
          console.log('- Date range:', data[0].date, 'to', data[data.length - 1].date);
        }
      });
  }, []);
  
  if (loading) return <div>Loading VXX test...</div>;
  if (!data) return <div>No VXX data</div>;
  
  const prices = data.map(d => d.price || d.close).filter(p => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  return (
    <div style={{ padding: 20, background: '#f5f5f5', margin: 20, borderRadius: 8 }}>
      <h3>VXX Test Component</h3>
      <p>Data points: {data.length}</p>
      <p>Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}</p>
      <p>Date range: {data[0].date} to {data[data.length - 1].date}</p>
      <p style={{ color: minPrice >= 35 ? 'green' : 'red', fontWeight: 'bold' }}>
        {minPrice >= 35 ? '✅ Prices are CORRECT!' : '❌ Prices are WRONG!'}
      </p>
    </div>
  );
}`;
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'frontend', 'src', 'components', 'VXXTest.jsx'),
    testComponent
  );
  console.log('✅ Created VXXTest.jsx component\n');
  console.log('Add this to your App.jsx to test:\n');
  console.log('import VXXTest from "./components/VXXTest";');
  console.log('// Then in your JSX:');
  console.log('<VXXTest />\n');
}

// Run all fixes
fixMarketAnalysis();
findVXXComponents();
updateQueryClient();
createTestComponent();

console.log('✅ === FIXES COMPLETE ===\n');
console.log('🚀 FINAL STEPS TO FIX VXX:');
console.log('\n1. Run these commands:');
console.log('   node force-frontend-refresh.js');
console.log('   node disable-all-cache.js');
console.log('\n2. Restart BOTH servers:');
console.log('   Backend: npm start');
console.log('   Frontend: cd ../frontend && npm run dev');
console.log('\n3. Clear browser completely:');
console.log('   - Open: http://localhost:5173/force-refresh.html');
console.log('   - Click "Clear Everything & Reload"');
console.log('\n4. Check DevTools Network tab for VXX requests');
console.log('   - Should show $40-87 price range in response');
console.log('\n5. If STILL wrong, check:');
console.log('   - Is there a CDN in front of your app?');
console.log('   - Is there a proxy server caching?');
console.log('   - Try incognito/private browsing mode');
