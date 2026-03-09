const pool = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
    const email = 'admin@peeraxis.com';
    const password = 'admin123'; // Simple password for testing
    const name = 'Admin User';

    try {
        // Check if admin already exists
        const check = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (check.rows.length > 0) {
            console.log("⚠️ Admin user already exists with email:", email);
            console.log("Password is likely 'admin123' if you created it with this script previously.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        await pool.query(
            `INSERT INTO users (user_id, name, email, password, role, department) 
             VALUES ($1, $2, $3, $4, 'admin', 'Administration')`,
            [userId, name, email, hashedPassword]
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

createAdmin();
