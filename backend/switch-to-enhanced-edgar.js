// SWITCH TO ENHANCED EDGAR SERVICE - Replace original with enhanced version
// Run: node switch-to-enhanced-edgar.js

import fs from 'fs/promises';
import path from 'path';

async function switchToEnhancedEdgar() {
  console.log('🔄 SWITCHING TO ENHANCED EDGAR SERVICE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  try {
    const originalPath = path.join(process.cwd(), 'src', 'services', 'edgarService.js');
    const enhancedPath = path.join(process.cwd(), 'src', 'services', 'enhancedEdgarService.js');
    const backupPath = path.join(process.cwd(), 'src', 'services', 'edgarService.backup.js');
    
    // Check if enhanced service exists
    try {
      await fs.access(enhancedPath);
      console.log('✅ Enhanced EDGAR service found');
    } catch (error) {
      throw new Error('Enhanced EDGAR service not found. Please ensure enhancedEdgarService.js exists.');
    }
    
    // Check if original service exists
    let originalExists = true;
    try {
      await fs.access(originalPath);
      console.log('✅ Original EDGAR service found');
    } catch (error) {
      originalExists = false;
      console.log('ℹ️ Original EDGAR service not found - will create new one');
    }
    
    // Backup original if it exists
    if (originalExists) {
      console.log('💾 Creating backup of original edgarService.js...');
      const originalContent = await fs.readFile(originalPath, 'utf-8');
      await fs.writeFile(backupPath, originalContent);
      console.log(`✅ Original backed up to: ${path.basename(backupPath)}`);
    }
    
    // Read enhanced service
    console.log('📋 Reading enhanced EDGAR service...');
    const enhancedContent = await fs.readFile(enhancedPath, 'utf-8');
    
    // Replace export to match original interface
    const modifiedContent = enhancedContent.replace(
      'export default new EnhancedEDGARService();',
      'export default new EnhancedEDGARService();'
    );
    
    // Write enhanced service as the main service
    console.log('🔄 Replacing edgarService.js with enhanced version...');
    await fs.writeFile(originalPath, modifiedContent);
    
    console.log('✅ SWITCH COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📊 WHAT CHANGED:');
    console.log('  ✅ Enhanced ticker mapping (fixes BRK.B issue)');
    console.log('  ✅ Adaptive concept discovery (finds best revenue concepts)');
    console.log('  ✅ Intelligent quarterly/YTD separation');
    console.log('  ✅ Balance sheet vs income statement logic');
    console.log('  ✅ Comprehensive fallback mechanisms');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('  1. Test with problematic stocks: node test-enhanced-edgar.js');
    console.log('  2. Run portfolio validation: node validate-portfolio-quality.js');
    console.log('  3. Restart your backend server to use enhanced service');
    console.log('');
    console.log('🔄 TO REVERT IF NEEDED:');
    console.log(`  Copy ${path.basename(backupPath)} back to edgarService.js`);
    
    // Update portfolio quality service import
    await updatePortfolioQualityService();
    
  } catch (error) {
    console.error('❌ Switch failed:', error.message);
    console.error('');
    console.error('🔧 MANUAL STEPS:');
    console.error('1. Copy enhancedEdgarService.js to edgarService.js');
    console.error('2. Update any import statements if needed');
    console.error('3. Restart your backend server');
  }
}

async function updatePortfolioQualityService() {
  try {
    console.log('🔄 Updating portfolio quality service...');
    
    const portfolioServicePath = path.join(process.cwd(), 'src', 'services', 'portfolioDataQualityService.js');
    
    // Check if portfolio quality service exists
    try {
      await fs.access(portfolioServicePath);
    } catch (error) {
      console.log('ℹ️ Portfolio quality service not found - skipping update');
      return;
    }
    
    // Read current content
    const content = await fs.readFile(portfolioServicePath, 'utf-8');
    
    // Update import statement (if needed)
    let updatedContent = content;
    
    // Check if import needs updating
    if (!updatedContent.includes("import edgarService from './edgarService.js';")) {
      // Try to find and replace existing import
      updatedContent = updatedContent.replace(
        /import\s+edgarService\s+from\s+['"]\.[\/\\]enhancedEdgarService\.js['"];?/g,
        "import edgarService from './edgarService.js';"
      );
    }
    
    // Write updated content
    await fs.writeFile(portfolioServicePath, updatedContent);
    console.log('✅ Portfolio quality service updated');
    
  } catch (error) {
    console.log('⚠️ Could not update portfolio quality service automatically');
    console.log('   Manual update may be needed if imports are incorrect');
  }
}

// Create a validation script for the switch
async function createPostSwitchValidator() {
  const validatorScript = `// POST-SWITCH VALIDATOR - Verify enhanced EDGAR service is working
// Run: node validate-enhanced-switch.js

import edgarService from './src/services/edgarService.js';

async function validateSwitch() {
  console.log('🧪 VALIDATING ENHANCED EDGAR SERVICE SWITCH');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const testStocks = ['AAPL', 'BRK.B', 'NVDA'];
  
  for (const ticker of testStocks) {
    try {
      console.log(\`\\n🔍 Testing \${ticker}...\`);
      const data = await edgarService.getCompanyFacts(ticker);
      
      if (data && data.fiscalData) {
        const metrics = Object.keys(data.fiscalData).length;
        console.log(\`✅ \${ticker}: \${metrics} metrics found\`);
        
        if (data.fiscalData.Revenues) {
          const quarterly = data.fiscalData.Revenues.quarterly?.length || 0;
          const annual = data.fiscalData.Revenues.annual?.length || 0;
          console.log(\`   📊 Revenue data: \${quarterly} quarterly, \${annual} annual\`);
        }
      } else {
        console.log(\`⚠️ \${ticker}: No fiscal data\`);
      }
      
    } catch (error) {
      console.error(\`❌ \${ticker}: \${error.message}\`);
    }
  }
  
  console.log('\\n✅ Enhanced EDGAR service validation complete!');
}

validateSwitch().catch(console.error);`;

  const validatorPath = path.join(process.cwd(), 'validate-enhanced-switch.js');
  await fs.writeFile(validatorPath, validatorScript);
  console.log(`✅ Created post-switch validator: ${path.basename(validatorPath)}`);
}

switchToEnhancedEdgar()
  .then(() => createPostSwitchValidator())
  .catch(console.error);