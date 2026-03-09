const pool = require('../db');

async function updateRoleConstraint() {
    try {
        console.log("🔍 Checking constraints on users table...");
        const res = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid) as def
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' AND conrelid = 'users'::regclass
        `);

        const roleConstraint = res.rows.find(r => r.def.includes('role') && r.def.includes('CHECK'));

        if (roleConstraint) {
            console.log(`⚠️ Found role constraint: ${roleConstraint.conname}`);
            console.log(`Definition: ${roleConstraint.def}`);

            // Drop it
            console.log("🗑️ Dropping constraint...");
            await pool.query(`ALTER TABLE users DROP CONSTRAINT "${roleConstraint.conname}"`);

            // Add new one
            console.log("✨ Adding updated constraint...");
            await pool.query(`
                ALTER TABLE users 
                ADD CONSTRAINT users_role_check 
                CHECK (role IN ('mentee', 'mentor', 'admin'))
            `);
            console.log("✅ Constraint updated successfully!");
        } else {
            console.log("ℹ️ No CHECK constraint found on 'role'. Checking if it's an ENUM...");
            // If it's not a check constraint, maybe it's just fine? 
            // But previous insertion failed. 
            // If no constraint found, maybe I missed it.
            // Let's just try to add the constraint anyway to be safe? 
            // No, that might fail if data is bad (unlikely).

            // Let's assume if no check constraint, maybe it's okay? 
            // Or maybe column type is enum?
            const col = await pool.query(`
                SELECT data_type, udt_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'role'
             `);
            console.log("Column type:", col.rows[0]);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await pool.end();
    }
}

updateRoleConstraint();
