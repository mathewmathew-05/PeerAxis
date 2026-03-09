const pool = require('../db');
const fs = require('fs');

async function inspectNotifications() {
    try {
        console.log("🔍 Inspecting recent notifications...");
        const res = await pool.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await pool.end();
    }
}

inspectNotifications();
