/**
 * Initialize Database for Investors Daily Brief
 * This script creates the database if it doesn't exist
 */

import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function initializeDatabase() {
  // First connect to postgres database to create market_dashboard if needed
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: 'postgres', // Connect to default postgres database first
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbName = process.env.POSTGRES_DB || 'market_dashboard';
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    
    const result = await client.query(checkDbQuery, [dbName]);
    
    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      console.log(`📦 Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure PostgreSQL is running and credentials are correct:');
    console.log('  Host:', process.env.POSTGRES_HOST || 'localhost');
    console.log('  Port:', process.env.POSTGRES_PORT || 5432);
    console.log('  User:', process.env.POSTGRES_USER || 'postgres');
    console.log('  Password:', process.env.POSTGRES_PASSWORD ? '***' : 'postgres');
    process.exit(1);
  } finally {
    await client.end();
  }
  
  console.log('\n✅ Database initialization complete!');
  console.log('You can now run: node setup-earnings-themes.js');
}

// Run the initialization
initializeDatabase().catch(console.error);
