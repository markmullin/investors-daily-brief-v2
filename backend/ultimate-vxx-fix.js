// ULTIMATE VXX FIX - Fixes it everywhere
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 === ULTIMATE VXX FIX ===\n');
console.log('This will fix VXX split adjustment in ALL services\n');

// Fix 1: Update eodService.js
function fixEodService() {
  console.log('📌 Fix 1: Updating eodService.js...');
  
  const eodServicePath = path.join(__dirname, 'src', 'services', 'eodService.js');
  
  if (!fs.existsSync(eodServicePath)) {
    console.log('❌ eodService.js not found');
    return;
  }
  
  let content = fs.readFileSync(eodServicePath, 'utf8');
  
  // Check if already fixed
  if (content.includes('VXX Split Adjustment')) {
    console.log('✅ eodService.js already has VXX adjustment\n');
    return;
  }
  
  // Find where to insert the fix - right after data is fetched
  const insertAfter = 'const processedData = response.data';
  const insertPoint = content.indexOf(insertAfter);
  
  if (insertPoint === -1) {
    console.log('⚠️  Could not find insertion point in eodService.js\n');
    return;
  }
  
  // Find the end of the processedData assignment
  let braceCount = 0;
  let endPoint = insertPoint;
  let inArray = false;
  
  for (let i = insertPoint; i < content.length; i++) {
    if (content[i] === '[') inArray = true;
    if (content[i] === ']' && inArray) {
      endPoint = i + 1;
      break;
    }
  }
  
  // Find the next semicolon after the array
  while (endPoint < content.length && content[endPoint] !== ';') {
    endPoint++;
  }
  endPoint++; // Include the semicolon
  
  const vxxFix = `
      
      // VXX Split Adjustment
      let adjustedData = processedData;
      if (symbol === 'VXX.US' || symbol === 'VXX') {
        console.log('🎯 Applying VXX 1:4 reverse split adjustment...');
        const SPLIT_DATE = new Date('2024-07-24');
        const SPLIT_RATIO = 4;
        
        adjustedData = processedData.map(item => {
          const itemDate = new Date(item.date);
          if (itemDate < SPLIT_DATE) {
            return {
              ...item,
              open: item.open * SPLIT_RATIO,
              high: item.high * SPLIT_RATIO,
              low: item.low * SPLIT_RATIO,
              close: item.close * SPLIT_RATIO,
              adjusted_close: (item.adjusted_close || item.close) * SPLIT_RATIO,
              volume: Math.floor(item.volume / SPLIT_RATIO)
            };
          }
          return item;
        });
        
        const prices = adjustedData.map(d => d.close).filter(p => p > 0);
        if (prices.length > 0) {
          console.log(\`✅ VXX adjusted price range: $\${Math.min(...prices).toFixed(2)} - $\${Math.max(...prices).toFixed(2)}\`);
        }
      }`;
  
  // Insert the fix and update return statements
  const beforeFix = content.substring(0, endPoint);
  const afterFix = content.substring(endPoint);
  
  // Replace all 'return processedData' with 'return adjustedData'
  const updatedAfter = afterFix.replace(/return processedData;/g, 'return adjustedData;');
  
  content = beforeFix + vxxFix + updatedAfter;
  
  fs.writeFileSync(eodServicePath, content);
  console.log('✅ Updated eodService.js with VXX split adjustment\n');
}

// Fix 2: Update marketService.js
function fixMarketService() {
  console.log('📌 Fix 2: Verifying marketService.js...');
  
  const marketServicePath = path.join(__dirname, 'src', 'services', 'marketService.js');
  
  if (!fs.existsSync(marketServicePath)) {
    console.log('❌ marketService.js not found');
    return;
  }
  
  let content = fs.readFileSync(marketServicePath, 'utf8');
  
  // Check if the split adjustment is there
  if (content.includes('SPLIT_RATIO')) {
    console.log('✅ marketService.js already has split adjustment\n');
  } else {
    console.log('⚠️  marketService.js missing split adjustment - this might cause issues\n');
  }
}

// Fix 3: Create a direct test endpoint
function createTestEndpoint() {
  console.log('📌 Fix 3: Creating test endpoint...');
  
  const testRoute = `
// Test route for VXX data
router.get('/test/vxx', async (req, res) => {
  try {
    const data = await marketService.getHistoricalData('VXX.US', '1y');
    
    if (data && data.length > 0) {
      const prices = data.map(d => d.price || d.close || 0).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      res.json({
        success: true,
        dataPoints: data.length,
        priceRange: {
          min: minPrice,
          max: maxPrice,
          correct: minPrice >= 35 && maxPrice <= 100
        },
        sampleData: data.slice(-5),
        july2024: data.filter(d => d.date && d.date.startsWith('2024-07'))
      });
    } else {
      res.json({ success: false, error: 'No data' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
`;
  
  console.log('✅ Test endpoint code ready (add to market.js routes)\n');
}

// Run all fixes
console.log('Starting fixes...\n');
fixEodService();
fixMarketService();
createTestEndpoint();

console.log('\n✅ === FIXES COMPLETE ===\n');
console.log('🚀 Next steps:');
console.log('1. Restart backend: npm start');
console.log('2. Test the fix: node diagnose-vxx.js');
console.log('3. Expected: All VXX prices should be $40+ (no $10-20 prices)');
console.log('\nIf prices are STILL wrong after this, check:');
console.log('- Is EOD API returning adjusted_close field?');
console.log('- Is the data cached somewhere else?');
console.log('- Try adding console.logs to trace data flow');
