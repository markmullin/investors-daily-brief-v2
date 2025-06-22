// SETUP PERFECT EDGAR SYSTEM
// Automated setup script for the Perfect EDGAR data extraction system

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

console.log(chalk.blue.bold('\n🚀 PERFECT EDGAR SYSTEM SETUP\n'));

async function checkDependencies() {
  console.log(chalk.yellow('📦 Checking dependencies...'));
  
  const requiredPackages = [
    'puppeteer',
    'axios',
    'node-cache',
    'chalk',
    'express',
    'dotenv'
  ];
  
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const installedPackages = Object.keys(packageJson.dependencies || {});
    
    const missingPackages = requiredPackages.filter(pkg => !installedPackages.includes(pkg));
    
    if (missingPackages.length > 0) {
      console.log(chalk.yellow(`\n📥 Installing missing packages: ${missingPackages.join(', ')}`));
      await execAsync(`npm install ${missingPackages.join(' ')}`);
      console.log(chalk.green('✅ Dependencies installed'));
    } else {
      console.log(chalk.green('✅ All dependencies are installed'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error checking dependencies:'), error.message);
    process.exit(1);
  }
}

async function createDataDirectories() {
  console.log(chalk.yellow('\n📁 Creating data directories...'));
  
  const directories = [
    'data/edgar-cache',
    'data/edgar-learning',
    'data/edgar-scraped',
    'data/edgar-ai-analysis'
  ];
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(chalk.green(`✅ Created ${dir}`));
    } catch (error) {
      console.error(chalk.red(`❌ Error creating ${dir}:`), error.message);
    }
  }
}

async function initializeLearningDatabase() {
  console.log(chalk.yellow('\n🧠 Initializing learning database...'));
  
  const learningDbPath = path.join('data', 'edgar-learning.json');
  
  try {
    await fs.access(learningDbPath);
    console.log(chalk.green('✅ Learning database already exists'));
  } catch (error) {
    // Create initial learning database
    const initialData = {
      conceptMappings: {
        revenue: ['total revenue', 'net revenue', 'sales', 'total sales'],
        costOfRevenue: ['cost of revenue', 'cost of sales', 'cost of goods sold'],
        netIncome: ['net income', 'net earnings', 'net profit'],
        operatingCashFlow: ['net cash from operating activities', 'operating cash flow'],
        capitalExpenditures: ['capital expenditures', 'capex', 'property and equipment']
      },
      companyPatterns: {},
      successfulExtractions: 0,
      failedExtractions: 0,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(learningDbPath, JSON.stringify(initialData, null, 2));
    console.log(chalk.green('✅ Created learning database'));
  }
}

async function updateEnvironmentFile() {
  console.log(chalk.yellow('\n🔧 Checking environment configuration...'));
  
  const envPath = '.env';
  
  try {
    const envContent = await fs.readFile(envPath, 'utf8');
    
    // Check for required API keys
    const requiredKeys = {
      'MISTRAL_API_KEY': 'mistral-8NPkpT6Z9SWnQAKVJk3j7NnJMDJlEbZC',
      'EOD_API_KEY': '678aec6f82cd71.08686199',
      'BRAVE_API_KEY': 'BSAFHHikdsv2YXSYODQSPES2tTMILHI'
    };
    
    let updated = false;
    let newEnvContent = envContent;
    
    for (const [key, defaultValue] of Object.entries(requiredKeys)) {
      if (!envContent.includes(key)) {
        newEnvContent += `\n${key}=${defaultValue}`;
        updated = true;
        console.log(chalk.yellow(`📝 Added ${key} to .env`));
      }
    }
    
    if (updated) {
      await fs.writeFile(envPath, newEnvContent);
      console.log(chalk.green('✅ Updated .env file'));
    } else {
      console.log(chalk.green('✅ Environment configuration is complete'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error updating .env:'), error.message);
  }
}

async function testPuppeteer() {
  console.log(chalk.yellow('\n🌐 Testing Puppeteer installation...'));
  
  try {
    const { default: puppeteer } = await import('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    await browser.close();
    console.log(chalk.green('✅ Puppeteer is working correctly'));
  } catch (error) {
    console.error(chalk.red('❌ Puppeteer test failed:'), error.message);
    console.log(chalk.yellow('\n💡 Try running: npx puppeteer browsers install chrome'));
  }
}

async function createTestEndpoint() {
  console.log(chalk.yellow('\n🔌 Creating test endpoint...'));
  
  const testEndpointCode = `// TEST PERFECT EDGAR ENDPOINT
import perfectEdgarService from './src/services/edgarPerfect/perfectEdgarService.js';

export async function testPerfectEdgar(ticker = 'MSFT') {
  console.log(\`\\n🧪 Testing Perfect EDGAR for \${ticker}...\\n\`);
  
  try {
    const data = await perfectEdgarService.getPerfectFinancialData(ticker);
    
    console.log('✅ Success!');
    console.log(\`Company: \${data.companyName}\`);
    console.log(\`Quality Score: \${(data.dataQuality.overallScore * 100).toFixed(1)}%\`);
    console.log(\`Fields Extracted: \${Object.keys(data.financials).length}\`);
    
    // Show sample metrics
    console.log('\\nSample Metrics:');
    if (data.financials.revenue) {
      console.log(\`  Revenue: $\${(data.financials.revenue.value / 1e9).toFixed(2)}B\`);
    }
    if (data.financials.grossMargin) {
      console.log(\`  Gross Margin: \${data.financials.grossMargin.value.toFixed(1)}%\`);
    }
    if (data.financials.netMargin) {
      console.log(\`  Net Margin: \${data.financials.netMargin.value.toFixed(1)}%\`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run test if called directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const ticker = process.argv[2] || 'MSFT';
  testPerfectEdgar(ticker);
}
`;

  await fs.writeFile('test-perfect-endpoint.js', testEndpointCode);
  console.log(chalk.green('✅ Created test-perfect-endpoint.js'));
}

async function generateMigrationScript() {
  console.log(chalk.yellow('\n📝 Creating migration script...'));
  
  const migrationScript = `// MIGRATE TO PERFECT EDGAR SYSTEM
// Updates all references from old EDGAR services to Perfect EDGAR

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

async function migrateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Replace old service imports
    if (content.includes("from '../services/edgarService.js'")) {
      content = content.replace(
        "from '../services/edgarService.js'",
        "from '../services/edgarPerfect/perfectEdgarService.js'"
      );
      modified = true;
    }
    
    // Replace old method calls
    if (content.includes('edgarService.getCompanyFacts')) {
      content = content.replace(
        /edgarService\\.getCompanyFacts/g,
        'perfectEdgarService.getPerfectFinancialData'
      );
      modified = true;
    }
    
    // Update data access patterns
    if (content.includes('.fiscalData')) {
      content = content.replace(/\\.fiscalData/g, '.financials');
      modified = true;
    }
    
    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(chalk.green(\`✅ Migrated \${path.basename(filePath)}\`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(\`❌ Error migrating \${filePath}:\`), error.message);
    return false;
  }
}

async function runMigration() {
  console.log(chalk.blue.bold('\\n🔄 MIGRATING TO PERFECT EDGAR SYSTEM\\n'));
  
  const filesToMigrate = [
    'src/routes/edgarRoutes.js',
    'src/routes/marketRoutes.js',
    'src/services/stockService.js',
    'src/services/analysisService.js'
  ];
  
  let migrated = 0;
  
  for (const file of filesToMigrate) {
    if (await migrateFile(file)) {
      migrated++;
    }
  }
  
  console.log(chalk.blue(\`\\n✅ Migration complete! Migrated \${migrated} files.\\n\`));
}

// Run migration
runMigration();
`;

  await fs.writeFile('migrate-to-perfect-edgar.js', migrationScript);
  console.log(chalk.green('✅ Created migrate-to-perfect-edgar.js'));
}

async function runSetup() {
  try {
    await checkDependencies();
    await createDataDirectories();
    await initializeLearningDatabase();
    await updateEnvironmentFile();
    await testPuppeteer();
    await createTestEndpoint();
    await generateMigrationScript();
    
    console.log(chalk.green.bold('\n✅ PERFECT EDGAR SYSTEM SETUP COMPLETE!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log('1. Test the system: node test-perfect-endpoint.js AAPL');
    console.log('2. Run full test suite: node test-perfect-edgar.js');
    console.log('3. Migrate existing code: node migrate-to-perfect-edgar.js');
    console.log('4. Start using the new endpoints: /api/edgar/perfect/:symbol\n');
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Setup failed:'), error.message);
    process.exit(1);
  }
}

// Run setup
runSetup();
