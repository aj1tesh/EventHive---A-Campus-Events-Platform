// Database connection configuration - supports both traditional PostgreSQL and Neon serverless
const { Pool } = require('pg');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Check if using Neon database
const isNeonDatabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

let pool, sql;

if (isNeonDatabase) {
  // Use Neon serverless connection
  console.log('🌐 Using Neon serverless database');
  sql = neon(process.env.DATABASE_URL);
} else {
  // Use traditional PostgreSQL connection
  console.log('🏠 Using local PostgreSQL database');
  
  // Database connection configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'campus_events',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  };

  // Create connection pool
  pool = new Pool(dbConfig);
}

// Handle pool errors (only for traditional PostgreSQL)
if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}

// Test database connection
async function testConnection() {
  try {
    if (isNeonDatabase) {
      // Test Neon connection
      const result = await sql`SELECT version()`;
      console.log('✅ Neon database connected successfully');
      console.log('📊 Database version:', result[0].version);
      return true;
    } else {
      // Test traditional PostgreSQL connection
      const client = await pool.connect();
      console.log('✅ PostgreSQL database connected successfully');
      client.release();
      return true;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Execute database query with error handling
async function query(queryText, queryParams = []) {
  const start = Date.now();
  try {
    let result;
    
    if (isNeonDatabase) {
      // Use Neon serverless query
      if (queryParams && queryParams.length > 0) {
        // Use sql.query for parameterized queries
        const neonResult = await sql.query(queryText, queryParams);
        result = {
          rows: Array.isArray(neonResult) ? neonResult : [],
          rowCount: Array.isArray(neonResult) ? neonResult.length : 0,
          command: queryText.trim().split(' ')[0].toUpperCase()
        };
      } else {
        // Use sql.query for simple queries without parameters
        const neonResult = await sql.query(queryText);
        result = {
          rows: Array.isArray(neonResult) ? neonResult : [],
          rowCount: Array.isArray(neonResult) ? neonResult.length : 0,
          command: queryText.trim().split(' ')[0].toUpperCase()
        };
      }
    } else {
      // Use traditional PostgreSQL query
      result = await pool.query(queryText, queryParams);
    }
    
    const duration = Date.now() - start;
    console.log('Executed query', { text: queryText.substring(0, 100) + '...', duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get a client from the pool for transactions (only for traditional PostgreSQL)
async function getClient() {
  if (isNeonDatabase) {
    throw new Error('getClient() not supported with Neon serverless. Use query() instead.');
  }
  return await pool.connect();
}

// Close the connection pool (only for traditional PostgreSQL)
async function closePool() {
  if (pool) {
    await pool.end();
    console.log('Database connection pool closed');
  } else {
    console.log('No connection pool to close (using Neon serverless)');
  }
}

module.exports = {
  pool,
  sql,
  query,
  getClient,
  testConnection,
  closePool,
  isNeonDatabase
};
