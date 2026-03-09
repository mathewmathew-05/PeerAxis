const pool = require('../db');

async function inspectSchema() {
    try {
        console.log("--- Users ---");
        const users = await pool.query("SELECT * FROM users LIMIT 1");
        if (users.rows.length > 0) {
            console.log("Sample User:", JSON.stringify(users.rows[0], null, 2));
        } else {
            console.log("No users found.");
        }

        console.log("--- Constraints ---");
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' AND conrelid = 'users'::regclass
        `);
        console.log(constraints.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

inspectSchema();
