// QUICK SETUP FOR PERFECT EDGAR (PRODUCTION)
// Minimal setup for the working EDGAR system

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import chalk from 'chalk';

const execAsync = promisify(exec);

console.log(chalk.blue.bold('\n🚀 PERFECT EDGAR QUICK SETUP\n'));

async function setup() {
  try {
    // 1. Install minimal dependencies
    console.log(chalk.yellow('📦 Installing dependencies...'));
    
    const dependencies = ['axios', 'node-cache', 'chalk'];
    await execAsync(`npm install ${dependencies.join(' ')}`);
    console.log(chalk.green('✅ Dependencies installed'));
    
    // 2. Create data directory
    console.log(chalk.yellow('\n📁 Creating data directory...'));
    await fs.mkdir('data', { recursive: true });
    console.log(chalk.green('✅ Data directory created'));
    
    // 3. Test the system
    console.log(chalk.yellow('\n🧪 Testing Perfect EDGAR...'));
    const { default: service } = await import('./src/services/edgarPerfect/productionPerfectEdgarService.js');
    
    const testData = await service.getPerfectFinancialData('AAPL');
    console.log(chalk.green('✅ Test successful!'));
    console.log(chalk.gray(`   Company: ${testData.companyName}`));
    console.log(chalk.gray(`   Quality: ${(testData.dataQuality.overallScore * 100).toFixed(1)}%`));
    
    if (testData.financials.revenue) {
      console.log(chalk.gray(`   Revenue: $${(testData.financials.revenue.value / 1e9).toFixed(2)}B`));
    }
    if (testData.financials.netMargin) {
      console.log(chalk.gray(`   Net Margin: ${testData.financials.netMargin.value.toFixed(1)}%`));
    }
    
    console.log(chalk.green.bold('\n✅ PERFECT EDGAR SETUP COMPLETE!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log('1. Start backend: npm start');
    console.log('2. Start frontend: npm run dev');
    console.log('3. EDGAR data will work automatically!\n');
    
  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error.message);
  }
}

setup();
