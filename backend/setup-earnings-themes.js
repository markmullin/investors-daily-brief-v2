/**
 * Setup script for Earnings Theme Extraction System
 * Run this to initialize the database tables and test the system
 */

import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function setupEarningsThemeSystem() {
  console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════╗
║     Earnings Theme Extraction System Setup                 ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'market_dashboard',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres' // Updated default
  });

  try {
    // Step 1: Test database connection
    console.log(`\n${colors.blue}Step 1: Testing database connection...${colors.reset}`);
    await pool.query('SELECT NOW()');
    console.log(`${colors.green}✓ Database connection successful${colors.reset}`);

    // Step 2: Create theme tables
    console.log(`\n${colors.blue}Step 2: Creating theme extraction tables...${colors.reset}`);
    
    const sqlPath = path.join(__dirname, 'migrations', 'create_theme_tables.sql');
    
    if (!fs.existsSync(sqlPath)) {
      // Create the SQL directly if file doesn't exist
      const createTableSQL = `
        -- Table to store company themes summary
        CREATE TABLE IF NOT EXISTS company_themes (
          id SERIAL PRIMARY KEY,
          symbol VARCHAR(10) UNIQUE NOT NULL,
          themes JSONB NOT NULL,
          recurring_themes JSONB,
          emerging_themes JSONB,
          keywords JSONB,
          theme_categories JSONB,
          transcript_count INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Table for theme-to-company mappings (for discovery)
        CREATE TABLE IF NOT EXISTS theme_mappings (
          id SERIAL PRIMARY KEY,
          theme VARCHAR(100) NOT NULL,
          category VARCHAR(50),
          symbol VARCHAR(10) NOT NULL,
          sentiment VARCHAR(20),
          importance VARCHAR(20),
          quarter VARCHAR(20),
          context TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(theme, symbol, quarter)
        );

        -- Indexes for fast lookups
        CREATE INDEX IF NOT EXISTS idx_company_themes_symbol ON company_themes(symbol);
        CREATE INDEX IF NOT EXISTS idx_theme_mappings_theme ON theme_mappings(theme);
        CREATE INDEX IF NOT EXISTS idx_theme_mappings_symbol ON theme_mappings(symbol);
        CREATE INDEX IF NOT EXISTS idx_theme_mappings_category ON theme_mappings(category);
        CREATE INDEX IF NOT EXISTS idx_theme_mappings_importance ON theme_mappings(importance);
      `;
      
      await pool.query(createTableSQL);
    } else {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
    }
    
    console.log(`${colors.green}✓ Theme tables created successfully${colors.reset}`);

    // Step 3: Verify tables exist
    console.log(`\n${colors.blue}Step 3: Verifying table creation...${colors.reset}`);
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('company_themes', 'theme_mappings')
      ORDER BY table_name;
    `;
    
    const result = await pool.query(verifyQuery);
    
    if (result.rows.length === 2) {
      console.log(`${colors.green}✓ All tables created successfully:${colors.reset}`);
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log(`${colors.yellow}⚠ Some tables may be missing. Found:${colors.reset}`);
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // Step 4: Test theme extraction with sample data
    console.log(`\n${colors.blue}Step 4: Testing theme storage (sample data)...${colors.reset}`);
    
    // Insert sample theme data
    const sampleTheme = {
      symbol: 'TEST',
      themes: JSON.stringify([
        { theme: 'AI expansion', category: 'technology', sentiment: 'positive' },
        { theme: 'Robotics', category: 'technology', sentiment: 'positive' }
      ]),
      recurring_themes: JSON.stringify([]),
      emerging_themes: JSON.stringify([]),
      keywords: JSON.stringify(['artificial intelligence', 'robotics', 'automation']),
      theme_categories: JSON.stringify({ technology: { count: 2 } }),
      transcript_count: 1
    };

    await pool.query(`
      INSERT INTO company_themes (symbol, themes, recurring_themes, emerging_themes, keywords, theme_categories, transcript_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (symbol) DO UPDATE
      SET themes = $2, updated_at = CURRENT_TIMESTAMP
    `, [
      sampleTheme.symbol,
      sampleTheme.themes,
      sampleTheme.recurring_themes,
      sampleTheme.emerging_themes,
      sampleTheme.keywords,
      sampleTheme.theme_categories,
      sampleTheme.transcript_count
    ]);

    console.log(`${colors.green}✓ Sample theme data inserted successfully${colors.reset}`);

    // Step 5: Clear Redis cache for earnings
    console.log(`\n${colors.blue}Step 5: Clearing Redis cache...${colors.reset}`);
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      });

      const keys = await redis.keys('earnings_*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`${colors.green}✓ Cleared ${keys.length} earnings cache entries${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ No earnings cache to clear${colors.reset}`);
      }
      
      await redis.quit();
    } catch (redisError) {
      console.log(`${colors.yellow}⚠ Redis not available (cache clearing skipped)${colors.reset}`);
    }

    // Step 6: Provide instructions
    console.log(`\n${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════╗
║                    Setup Complete! 🎉                      ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

    console.log(`\n${colors.green}${colors.bright}Next Steps:${colors.reset}`);
    console.log(`
1. ${colors.yellow}Restart your backend server:${colors.reset}
   cd backend
   npm run dev

2. ${colors.yellow}The Earnings tab will now:${colors.reset}
   • Show correct quarters (Q4 2024, Q3 2024, etc.)
   • Extract investment themes from transcripts
   • Enable theme-based stock discovery
   • Provide real AI insights

3. ${colors.yellow}Test with a stock:${colors.reset}
   • Go to any stock page (e.g., AAPL, MSFT)
   • Click on the "Earnings" tab
   • Click "Analyze with AI" on any transcript

4. ${colors.yellow}Theme Discovery:${colors.reset}
   • Themes will be extracted automatically
   • Click on any theme to discover similar stocks
   • Use discovery tags to find related companies
    `);

    console.log(`${colors.cyan}${colors.bright}API Endpoints Available:${colors.reset}`);
    console.log(`
• GET  /api/themes/earnings/:symbol/analyze     - Full analysis with themes
• POST /api/themes/earnings/:symbol/analyze-transcript - Analyze specific quarter
• GET  /api/themes/discover/:theme             - Find stocks by theme
• GET  /api/themes/trending                    - Get trending themes
• GET  /api/themes/company/:symbol             - Get company themes
    `);

  } catch (error) {
    console.error(`\n${colors.red}❌ Setup failed:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log(`1. Check your PostgreSQL is running`);
    console.log(`2. Verify your .env file has correct database credentials`);
    console.log(`3. Make sure the database exists: ${process.env.POSTGRES_DB || 'market_dashboard'}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupEarningsThemeSystem().catch(console.error);
