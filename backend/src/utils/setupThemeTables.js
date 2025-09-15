import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Setup database tables for theme extraction
 */
async function setupThemeTables() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'market_dashboard',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  });

  try {
    console.log('🗄️ Setting up theme extraction tables...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../migrations/create_theme_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Theme tables created successfully!');

    // Test the tables
    const testQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('company_themes', 'theme_mappings', 'user_theme_preferences', 'theme_analytics')
    `;
    
    const result = await pool.query(testQuery);
    console.log('📊 Created tables:', result.rows.map(r => r.table_name).join(', '));

  } catch (error) {
    console.error('❌ Error setting up theme tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupThemeTables();
}

export default setupThemeTables;
