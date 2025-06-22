// MIGRATE TO PERFECT EDGAR SYSTEM
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
        /edgarService\.getCompanyFacts/g,
        'perfectEdgarService.getPerfectFinancialData'
      );
      modified = true;
    }
    
    // Update data access patterns
    if (content.includes('.fiscalData')) {
      content = content.replace(/\.fiscalData/g, '.financials');
      modified = true;
    }
    
    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(chalk.green(`✅ Migrated ${path.basename(filePath)}`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(`❌ Error migrating ${filePath}:`), error.message);
    return false;
  }
}

async function runMigration() {
  console.log(chalk.blue.bold('\n🔄 MIGRATING TO PERFECT EDGAR SYSTEM\n'));
  
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
  
  console.log(chalk.blue(`\n✅ Migration complete! Migrated ${migrated} files.\n`));
}

// Run migration
runMigration();
