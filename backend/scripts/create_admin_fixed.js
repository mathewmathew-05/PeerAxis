const pool = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createAdminFixed() {
    const email = 'admin@peeraxis.com';
    const password = 'admin123';

    try {
        // Check first
        const check = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (check.rows.length > 0) {
            console.log("⚠️ User exists, updating password...");
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
            console.log("✅ Password updated.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Use a valid department from the types list
        const department = 'Computer Science';

        await pool.query(
            `INSERT INTO users (user_id, name, email, password, role, department) 
             VALUES ($1, 'Admin User', $2, $3, 'admin', $4)`,
            [userId, email, hashedPassword, department]
        );

        console.log("✅ Admin user created successfully!");
        console.log("Email:", email);
        console.log("Password:", password);

    } catch (err) {
        console.error("❌ Error creating admin:", err);
    } finally {
        await pool.end();
    }
}

createAdminFixed();
