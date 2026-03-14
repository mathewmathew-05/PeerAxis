// Run this once: node scripts/add_reset_tokens_table.js
const pool = require('../db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ password_reset_tokens table created (or already exists)');

    // Also add mentor_feedback columns to sessions if not present
    await pool.query(`
      ALTER TABLE sessions
        ADD COLUMN IF NOT EXISTS mentor_feedback TEXT,
        ADD COLUMN IF NOT EXISTS mentor_rating   SMALLINT CHECK (mentor_rating BETWEEN 1 AND 5);
    `);
    console.log('✅ mentor_feedback + mentor_rating columns added to sessions');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
