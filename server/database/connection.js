const { Pool } = require('pg');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const isNeonDatabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

let pool, sql;

if (isNeonDatabase) {
  console.log('Using Neon serverless database');
  sql = neon(process.env.DATABASE_URL);
} else {
  console.log('Using local PostgreSQL database');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'campus_events',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  pool = new Pool(dbConfig);
}

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}

async function testConnection() {
  try {
    if (isNeonDatabase) {
      const result = await sql`SELECT version()`;
      console.log('Neon database connected successfully');
      console.log('Database version:', result[0].version);
      return true;
    } else {
      const client = await pool.connect();
      console.log('PostgreSQL database connected successfully');
      client.release();
      return true;
    }
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

async function query(queryText, queryParams = []) {
  const start = Date.now();
  try {
    let result;
    
    if (isNeonDatabase) {
      if (queryParams && queryParams.length > 0) {
        const neonResult = await sql.query(queryText, queryParams);
        result = {
          rows: Array.isArray(neonResult) ? neonResult : [],
          rowCount: Array.isArray(neonResult) ? neonResult.length : 0,
          command: queryText.trim().split(' ')[0].toUpperCase()
        };
      } else {
        const neonResult = await sql.query(queryText);
        result = {
          rows: Array.isArray(neonResult) ? neonResult : [],
          rowCount: Array.isArray(neonResult) ? neonResult.length : 0,
          command: queryText.trim().split(' ')[0].toUpperCase()
        };
      }
    } else {
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

async function getClient() {
  if (isNeonDatabase) {
    throw new Error('getClient() not supported with Neon serverless. Use query() instead.');
  }
  return await pool.connect();
}

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
