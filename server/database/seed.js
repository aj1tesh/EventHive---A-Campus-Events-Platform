/**
 * Database seeding script
 * Populates database with sample data for development
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'campus_events',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');

    // Clear existing data
    await pool.query('DELETE FROM registrations');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM users');

    // Reset sequences
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE events_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE registrations_id_seq RESTART WITH 1');

    // Hash password for sample users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Insert sample users
    const usersResult = await pool.query(`
      INSERT INTO users (username, email, password_hash, role) VALUES
      ('admin', 'admin@campus.edu', $1, 'admin'),
      ('organizer1', 'organizer1@campus.edu', $1, 'organizer'),
      ('organizer2', 'organizer2@campus.edu', $1, 'organizer'),
      ('student1', 'student1@campus.edu', $1, 'student'),
      ('student2', 'student2@campus.edu', $1, 'student'),
      ('student3', 'student3@campus.edu', $1, 'student'),
      ('student4', 'student4@campus.edu', $1, 'student')
      RETURNING id, username, role
    `, [hashedPassword]);

    console.log('Sample users created:', usersResult.rows);

    // Insert sample events
    const eventsResult = await pool.query(`
      INSERT INTO events (title, description, date, location, max_attendees, created_by) VALUES
      ('Tech Conference 2024', 'Annual technology conference featuring the latest innovations in AI, web development, and cybersecurity.', '2024-03-15 09:00:00', 'Main Auditorium', 200, 2),
      ('Career Fair', 'Connect with top companies and explore career opportunities in various fields.', '2024-03-20 10:00:00', 'Student Center', 500, 2),
      ('Hackathon', '48-hour coding competition with prizes for the best projects.', '2024-03-25 18:00:00', 'Computer Lab', 50, 3),
      ('Art Exhibition', 'Student artwork showcase featuring paintings, sculptures, and digital art.', '2024-03-28 14:00:00', 'Art Gallery', 100, 3),
      ('Sports Tournament', 'Annual inter-college sports tournament featuring basketball, football, and volleyball.', '2024-04-01 08:00:00', 'Sports Complex', 300, 2)
      RETURNING id, title
    `);

    console.log('Sample events created:', eventsResult.rows);

    // Insert sample registrations
    await pool.query(`
      INSERT INTO registrations (event_id, user_id, status) VALUES
      (1, 4, 'approved'),
      (1, 5, 'approved'),
      (1, 6, 'pending'),
      (2, 4, 'approved'),
      (2, 5, 'approved'),
      (2, 6, 'approved'),
      (2, 7, 'pending'),
      (3, 4, 'approved'),
      (3, 5, 'pending'),
      (4, 6, 'approved'),
      (4, 7, 'approved'),
      (5, 4, 'pending'),
      (5, 5, 'approved'),
      (5, 6, 'approved'),
      (5, 7, 'approved')
    `);

    console.log('Sample registrations created');

    // Display summary
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const eventCount = await pool.query('SELECT COUNT(*) FROM events');
    const registrationCount = await pool.query('SELECT COUNT(*) FROM registrations');

    console.log('\n=== Database Seeding Complete ===');
    console.log(`Users: ${userCount.rows[0].count}`);
    console.log(`Events: ${eventCount.rows[0].count}`);
    console.log(`Registrations: ${registrationCount.rows[0].count}`);
    console.log('\nDefault login credentials:');
    console.log('Admin: admin / password123');
    console.log('Organizer: organizer1 / password123');
    console.log('Student: student1 / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
