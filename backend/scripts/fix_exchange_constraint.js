const pool = require('../db');
require('dotenv').config();

async function fix() {
  try {
    // Drop the old constraint and add a new one accepting both old and new values
    await pool.query(`
      ALTER TABLE skill_exchanges
        DROP CONSTRAINT IF EXISTS skill_exchanges_exchange_type_check;
    `);
    await pool.query(`
      ALTER TABLE skill_exchanges
        ADD CONSTRAINT skill_exchanges_exchange_type_check
        CHECK (exchange_type IN ('offering', 'wanting', 'teach', 'learn'));
    `);
    console.log('✅ Constraint updated — now accepts: offering, wanting, teach, learn');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

fix();
