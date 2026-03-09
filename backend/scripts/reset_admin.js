const pool = require('../db');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    const email = 'admin@peeraxis.com';
    const password = 'admin123';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password for existing admin or insert if missing (UPSERT-like approach manually)
        const update = await pool.query(
            `UPDATE users SET password = $1 WHERE email = $2 RETURNING *`,
            [hashedPassword, email]
        );

        if (update.rows.length > 0) {
            console.log("✅ Admin password reset to 'admin123'.");
        } else {
            console.log("⚠️ Admin user not found. Creating...");
            // Call the creation logic or let the user run the create script again (but that failed). 
            // I'll just re-insert here to be sure.
            const { v4: uuidv4 } = require('uuid');
            const userId = uuidv4();
            await pool.query(
                `INSERT INTO users (user_id, name, email, password, role, department) 
                  VALUES ($1, 'Admin User', $2, $3, 'admin', 'Administration')`,
                [userId, email, hashedPassword]
            );
            console.log("✅ Admin user created.");
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await pool.end();
    }
}

resetAdminPassword();
