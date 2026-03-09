const pool = require('../db');

async function checkAdmin() {
    const email = 'admin@peeraxis.com';
    try {
        const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log("Count:", res.rows.length);
        if (res.rows.length > 0) {
            console.log("User:", JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("User not found.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}
checkAdmin();
