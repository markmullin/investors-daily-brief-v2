import { pgPool, redis, influx, checkDatabaseHealth } from '../src/config/database.js';
import User from '../src/models/User.js';
import chalk from 'chalk';

// Database setup and migration script
class DatabaseMigration {
  constructor() {
    this.migrations = [];
  }

  // Add migration
  addMigration(name, up, down) {
    this.migrations.push({ name, up, down });
  }

  // Run all migrations
  async runMigrations() {
    console.log(chalk.blue('🔧 Starting database migrations...'));

    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get completed migrations
      const completedMigrations = await this.getCompletedMigrations();

      // Run pending migrations
      for (const migration of this.migrations) {
        if (!completedMigrations.includes(migration.name)) {
          console.log(chalk.yellow(`⏳ Running migration: ${migration.name}`));
          await migration.up();
          await this.recordMigration(migration.name);
          console.log(chalk.green(`✅ Migration completed: ${migration.name}`));
        } else {
          console.log(chalk.gray(`⏩ Migration already completed: ${migration.name}`));
        }
      }

      console.log(chalk.green('🎉 All migrations completed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Migration failed:'), error);
      throw error;
    }
  }

  // Create migrations tracking table
  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await pgPool.query(query);
  }

  // Get completed migrations
  async getCompletedMigrations() {
    try {
      const result = await pgPool.query('SELECT name FROM migrations ORDER BY executed_at');
      return result.rows.map(row => row.name);
    } catch (error) {
      return [];
    }
  }

  // Record completed migration
  async recordMigration(name) {
    await pgPool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
  }
}

// Initialize migration system
const migration = new DatabaseMigration();

// Migration 1: Create users table
migration.addMigration(
  'create_users_table',
  async () => {
    await User.createTable();
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS users CASCADE');
  }
);

// Migration 2: Create portfolios table
migration.addMigration(
  'create_portfolios_table',
  async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        is_simulation BOOLEAN DEFAULT FALSE,
        benchmark_symbol VARCHAR(10) DEFAULT 'SPY',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        settings JSONB DEFAULT '{}',
        UNIQUE(user_id, name)
      );

      CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
      CREATE INDEX IF NOT EXISTS idx_portfolios_default ON portfolios(user_id, is_default);
    `;
    await pgPool.query(query);
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS portfolios CASCADE');
  }
);

// Migration 3: Create portfolio holdings table
migration.addMigration(
  'create_portfolio_holdings_table',
  async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS portfolio_holdings (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        quantity DECIMAL(15, 8) NOT NULL DEFAULT 0,
        average_cost DECIMAL(15, 4) DEFAULT 0,
        purchase_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(portfolio_id, symbol)
      );

      CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON portfolio_holdings(portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON portfolio_holdings(symbol);
    `;
    await pgPool.query(query);
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS portfolio_holdings CASCADE');
  }
);

// Migration 4: Create transactions table
migration.addMigration(
  'create_transactions_table',
  async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'split', 'deposit', 'withdrawal')),
        quantity DECIMAL(15, 8) NOT NULL,
        price DECIMAL(15, 4),
        total_amount DECIMAL(15, 4) NOT NULL,
        fees DECIMAL(15, 4) DEFAULT 0,
        transaction_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        external_id VARCHAR(255),
        source VARCHAR(50) DEFAULT 'manual'
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON transactions(portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
    `;
    await pgPool.query(query);
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS transactions CASCADE');
  }
);

// Migration 5: Create watchlists table
migration.addMigration(
  'create_watchlists_table',
  async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS watchlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, name)
      );

      CREATE TABLE IF NOT EXISTS watchlist_items (
        id SERIAL PRIMARY KEY,
        watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        added_at TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        target_price DECIMAL(15, 4),
        UNIQUE(watchlist_id, symbol)
      );

      CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
      CREATE INDEX IF NOT EXISTS idx_watchlist_items_list ON watchlist_items(watchlist_id);
      CREATE INDEX IF NOT EXISTS idx_watchlist_items_symbol ON watchlist_items(symbol);
    `;
    await pgPool.query(query);
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS watchlist_items CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS watchlists CASCADE');
  }
);

// Migration 6: Create alerts table
migration.addMigration(
  'create_alerts_table',
  async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20),
        alert_type VARCHAR(50) NOT NULL,
        condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('above', 'below', 'change_percent', 'volume')),
        threshold_value DECIMAL(15, 4) NOT NULL,
        current_value DECIMAL(15, 4),
        is_active BOOLEAN DEFAULT TRUE,
        is_triggered BOOLEAN DEFAULT FALSE,
        triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        notification_method VARCHAR(20) DEFAULT 'email',
        message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);
      CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);
    `;
    await pgPool.query(query);
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS alerts CASCADE');
  }
);

// Migration 7: Create market sessions table
migration.addMigration(
  'create_sessions_table',
  async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        device_info JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active, expires_at);
    `;
    await pgPool.query(query);
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS user_sessions CASCADE');
  }
);

// Migration 8: Create market data cache table
migration.addMigration(
  'create_market_cache_table',
  async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS market_data_cache (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(symbol, data_type, source)
      );

      CREATE INDEX IF NOT EXISTS idx_market_cache_symbol ON market_data_cache(symbol);
      CREATE INDEX IF NOT EXISTS idx_market_cache_type ON market_data_cache(data_type);
      CREATE INDEX IF NOT EXISTS idx_market_cache_expires ON market_data_cache(expires_at);
    `;
    await pgPool.query(query);
  },
  async () => {
    await pgPool.query('DROP TABLE IF EXISTS market_data_cache CASCADE');
  }
);

// Setup InfluxDB databases and retention policies
async function setupInfluxDB() {
  console.log(chalk.blue('🔧 Setting up InfluxDB...'));

  try {
    // Create database if it doesn't exist
    const databases = await influx.getDatabaseNames();
    const dbName = process.env.INFLUX_DB || 'market_data';

    if (!databases.includes(dbName)) {
      await influx.createDatabase(dbName);
      console.log(chalk.green(`✅ Created InfluxDB database: ${dbName}`));
    } else {
      console.log(chalk.gray(`⏩ InfluxDB database already exists: ${dbName}`));
    }

    // Create retention policies
    const retentionPolicies = [
      {
        name: 'realtime',
        duration: '7d',
        replication: 1,
        isDefault: false
      },
      {
        name: 'daily',
        duration: '365d',
        replication: 1,
        isDefault: true
      },
      {
        name: 'historical',
        duration: '0s', // Infinite
        replication: 1,
        isDefault: false
      }
    ];

    for (const policy of retentionPolicies) {
      try {
        await influx.createRetentionPolicy(policy.name, {
          database: dbName,
          duration: policy.duration,
          replication: policy.replication,
          isDefault: policy.isDefault
        });
        console.log(chalk.green(`✅ Created retention policy: ${policy.name}`));
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(chalk.gray(`⏩ Retention policy already exists: ${policy.name}`));
        } else {
          console.error(chalk.yellow(`⚠️  Warning creating retention policy ${policy.name}:`, error.message));
        }
      }
    }

    console.log(chalk.green('✅ InfluxDB setup completed'));
  } catch (error) {
    console.error(chalk.red('❌ InfluxDB setup failed:'), error);
    throw error;
  }
}

// Setup Redis keyspace notifications and configuration
async function setupRedis() {
  console.log(chalk.blue('🔧 Setting up Redis...'));

  try {
    // Test Redis connection
    await redis.ping();

    // Set up keyspace notifications for expiring keys
    await redis.config('SET', 'notify-keyspace-events', 'Ex');

    // Set up some basic configuration
    await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');

    console.log(chalk.green('✅ Redis setup completed'));
  } catch (error) {
    console.error(chalk.red('❌ Redis setup failed:'), error);
    throw error;
  }
}

// Main setup function
export async function setupDatabases() {
  console.log(chalk.blue.bold('🚀 Starting Market Dashboard Database Setup...'));

  try {
    // Check database health
    console.log(chalk.blue('🔍 Checking database connections...'));
    const health = await checkDatabaseHealth();
    
    console.log(chalk.blue('Database Health Status:'));
    console.log(`PostgreSQL: ${health.postgres ? chalk.green('✅ Connected') : chalk.red('❌ Failed')}`);
    console.log(`Redis: ${health.redis ? chalk.green('✅ Connected') : chalk.red('❌ Failed')}`);
    console.log(`InfluxDB: ${health.influx ? chalk.green('✅ Connected') : chalk.red('❌ Failed')}`);

    if (!health.postgres) {
      throw new Error('PostgreSQL connection failed. Please check your database configuration.');
    }

    // Run PostgreSQL migrations
    await migration.runMigrations();

    // Setup Redis if connected
    if (health.redis) {
      await setupRedis();
    } else {
      console.log(chalk.yellow('⚠️  Redis not connected, skipping Redis setup'));
    }

    // Setup InfluxDB if connected
    if (health.influx) {
      await setupInfluxDB();
    } else {
      console.log(chalk.yellow('⚠️  InfluxDB not connected, skipping InfluxDB setup'));
    }

    console.log(chalk.green.bold('🎉 Database setup completed successfully!'));
    console.log(chalk.blue('💡 Your market dashboard database is ready for production!'));

  } catch (error) {
    console.error(chalk.red.bold('❌ Database setup failed:'), error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabases()
    .then(() => {
      console.log(chalk.green('Setup completed. Exiting...'));
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('Setup failed:'), error);
      process.exit(1);
    });
}

export default { setupDatabases, DatabaseMigration };