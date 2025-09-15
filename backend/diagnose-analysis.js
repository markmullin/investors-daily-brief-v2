/**
 * Diagnostic Tool for Intelligent Analysis Issues
 * Identifies exactly what's going wrong with the AI analysis
 */

const axios = require('axios');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function diagnoseIssues() {
  console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════╗
║     INTELLIGENT ANALYSIS DIAGNOSTIC TOOL v2.0         ║
║     Identifying why numbers are still wrong           ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Step 1: Check if Python service is running
  console.log(`\n${colors.yellow}STEP 1: Checking Python Accuracy Service...${colors.reset}`);
  try {
    const healthResponse = await axios.get('http://localhost:8000/health');
    console.log(`${colors.green}✅ Python service is running${colors.reset}`);
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Accuracy: ${healthResponse.data.accuracy}`);
  } catch (error) {
    console.log(`${colors.red}❌ Python service NOT running!${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    console.log(`\n${colors.yellow}📌 FIX: Run this command in a new terminal:${colors.reset}`);
    console.log(`   cd backend`);
    console.log(`   npm run analysis:start`);
    return false;
  }

  // Step 2: Test Python calculations with real data
  console.log(`\n${colors.yellow}STEP 2: Testing Python Calculations...${colors.reset}`);
  try {
    const marketPhaseResponse = await axios.post('http://localhost:8000/analyze', {
      type: 'marketPhase',
      data: {}
    });
    
    const data = marketPhaseResponse.data;
    console.log(`${colors.green}✅ Python calculations working${colors.reset}`);
    console.log(`   VIX: ${data.vix} (should NOT be 16.5)`);
    console.log(`   S&P Change: ${data.sp500Change}%`);
    console.log(`   NASDAQ Change: ${data.nasdaqChange}%`);
    
    if (data.vix === 16.5 || data.sp500Change === 0.15) {
      console.log(`${colors.red}⚠️  WARNING: Data appears to be hardcoded!${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Python calculations failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }

  // Step 3: Check if backend is properly routing to Python
  console.log(`\n${colors.yellow}STEP 3: Testing Backend Integration...${colors.reset}`);
  try {
    const analysisResponse = await axios.get('http://localhost:5000/api/intelligent-analysis/market-phase');
    
    if (analysisResponse.data.success) {
      const calc = analysisResponse.data.calculations;
      console.log(`${colors.green}✅ Backend integration working${colors.reset}`);
      console.log(`   Has calculations: ${calc ? 'YES' : 'NO'}`);
      console.log(`   Has insight: ${analysisResponse.data.insight ? 'YES' : 'NO'}`);
      
      if (calc) {
        console.log(`   Market Phase: ${calc.phase}`);
        console.log(`   VIX Value: ${calc.vix}`);
      }
    } else {
      console.log(`${colors.yellow}⚠️  Backend using fallback${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Backend integration failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
  }

  // Step 4: Test correlation pair routing
  console.log(`\n${colors.yellow}STEP 4: Testing Correlation Pair Routing...${colors.reset}`);
  
  const testPairs = [
    'spy-vs-eem-vs-efa',  // The one shown in your screenshot
    'spy-vs-tlt',
    'ibit-vs-gld'
  ];
  
  for (const pair of testPairs) {
    try {
      const response = await axios.get(`http://localhost:5000/api/intelligent-analysis/correlations/${pair}`);
      
      if (response.data.calculations) {
        const calc = response.data.calculations;
        console.log(`\n   ${pair}:`);
        console.log(`   ${colors.green}✓${colors.reset} Asset1: ${calc.asset1} (${calc.asset1Performance}%)`);
        console.log(`     Asset2: ${calc.asset2} (${calc.asset2Performance}%)`);
        
        // Check if it's analyzing the right pair
        if (pair === 'spy-vs-eem-vs-efa' && calc.asset1 === 'SPY' && calc.asset2 === 'TLT') {
          console.log(`   ${colors.red}❌ WRONG PAIR! Should be SPY/EEM/EFA, not SPY/TLT${colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`   ${colors.red}✗ ${pair}: Failed${colors.reset}`);
    }
  }

  // Step 5: Test sector rotation accuracy
  console.log(`\n${colors.yellow}STEP 5: Testing Sector Rotation...${colors.reset}`);
  try {
    const sectorResponse = await axios.post('http://localhost:8000/analyze', {
      type: 'sectorRotation',
      data: {}
    });
    
    const data = sectorResponse.data;
    console.log(`${colors.green}✅ Sector data retrieved${colors.reset}`);
    console.log(`   Top Sector: ${data.leader} (+${data.leaderGain}%)`);
    console.log(`   Worst Sector: ${data.laggard} (${data.laggardLoss}%)`);
    
    // Compare with what you see in the UI
    console.log(`\n   ${colors.cyan}Compare with your UI:${colors.reset}`);
    console.log(`   Does Energy show as top performer? (Should be ~+2.45%)`);
    console.log(`   Does Utilities show as worst? (Should be ~-1.10%)`);
  } catch (error) {
    console.log(`${colors.red}❌ Sector analysis failed${colors.reset}`);
  }

  // Step 6: Check if Qwen/GPT-OSS is running
  console.log(`\n${colors.yellow}STEP 6: Checking AI Models...${colors.reset}`);
  try {
    // Check if Ollama is running
    const ollamaResponse = await axios.get('http://localhost:11434/api/tags');
    const models = ollamaResponse.data.models || [];
    
    const hasQwen = models.some(m => m.name.includes('qwen'));
    const hasGptOss = models.some(m => m.name.includes('gpt-oss'));
    
    console.log(`${colors.green}✅ Ollama is running${colors.reset}`);
    console.log(`   Qwen 2.5 installed: ${hasQwen ? 'YES' : 'NO'}`);
    console.log(`   GPT-OSS installed: ${hasGptOss ? 'YES' : 'NO'}`);
    
    if (!hasQwen) {
      console.log(`\n${colors.yellow}📌 FIX: Install Qwen model:${colors.reset}`);
      console.log(`   ollama pull qwen3:8b`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Ollama not running or not accessible${colors.reset}`);
    console.log(`\n${colors.yellow}📌 FIX: Start Ollama:${colors.reset}`);
    console.log(`   ollama serve`);
  }

  // Final diagnosis
  console.log(`\n${colors.bright}${colors.magenta}
╔════════════════════════════════════════════════════════╗
║                    DIAGNOSIS COMPLETE                  ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.cyan}IDENTIFIED ISSUES:${colors.reset}`);
  console.log(`1. Python service may not be running or returning wrong data`);
  console.log(`2. Correlation pairs not mapping correctly (spy-vs-eem-vs-efa → SPY/TLT)`);
  console.log(`3. AI model may be hallucinating instead of using provided data`);
  console.log(`4. Frontend may not be passing correct data to backend`);
  
  console.log(`\n${colors.cyan}RECOMMENDED FIXES:${colors.reset}`);
  console.log(`1. Ensure Python service is running: npm run analysis:start`);
  console.log(`2. Restart backend to reload routes: npm run dev`);
  console.log(`3. Clear browser cache and reload dashboard`);
  console.log(`4. Check browser console for JavaScript errors`);
}

// Run diagnostic
diagnoseIssues().catch(error => {
  console.error(`${colors.red}Diagnostic failed:${colors.reset}`, error.message);
});
