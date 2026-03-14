const pool = require('../db');
require('dotenv').config();

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    // Set all existing users to active by default
    await pool.query(`UPDATE users SET is_active = true WHERE is_active IS NULL`);
    console.log('✅ is_active column added to users table');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
