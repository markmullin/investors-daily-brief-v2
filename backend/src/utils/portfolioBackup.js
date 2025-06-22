import fs from 'fs/promises';

// Save current portfolio state to a JSON file
export async function savePortfolioBackup(portfolio) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `portfolio_backup_${timestamp}.json`;
  const filepath = `./data/exports/${filename}`;
  
  try {
    await fs.writeFile(filepath, JSON.stringify(portfolio, null, 2));
    console.log(`Portfolio backup saved to ${filename}`);
    return filename;
  } catch (error) {
    console.error('Error saving portfolio backup:', error);
    throw error;
  }
}

// Load portfolio from backup
export async function loadPortfolioBackup(filename) {
  const filepath = `./data/exports/${filename}`;
  
  try {
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading portfolio backup:', error);
    throw error;
  }
}

// Get list of available backups
export async function listPortfolioBackups() {
  const exportDir = './data/exports';
  
  try {
    const files = await fs.readdir(exportDir);
    const backups = files
      .filter(file => file.startsWith('portfolio_backup_') && file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)); // Most recent first
    
    return backups;
  } catch (error) {
    console.error('Error listing portfolio backups:', error);
    return [];
  }
}
