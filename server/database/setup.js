const { query, isNeonDatabase } = require('./connection');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    console.log(`Using ${isNeonDatabase ? 'Neon serverless' : 'traditional PostgreSQL'} database`);

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'organizer', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        location VARCHAR(200),
        max_attendees INTEGER DEFAULT 100,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
    `);

    console.log('Database tables created successfully');
    console.log('Run "npm run db:seed" to populate with sample data');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
