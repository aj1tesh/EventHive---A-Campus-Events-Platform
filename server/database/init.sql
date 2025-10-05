-- Database initialization script for Docker
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can add any additional setup here

-- Set timezone
SET timezone = 'UTC';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add any additional database setup here
-- The main table creation is handled by the Node.js application
