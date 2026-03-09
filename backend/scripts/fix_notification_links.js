const pool = require('../db');

async function fixNotificationLinks() {
    try {
        console.log("🛠️ Fixing existing notification links...");

        // 1. Fix 'request_received' links (were /requests/:id -> now /requests)
        const res1 = await pool.query(`
            UPDATE notifications 
            SET link = '/requests' 
            WHERE type = 'request_received' AND link LIKE '/requests/%'
        `);
        console.log(`✅ Fixed ${res1.rowCount} 'request_received' links.`);

        // 2. Fix 'request_accepted' links (were /sessions/new... -> now /sessions)
        const res2 = await pool.query(`
            UPDATE notifications 
            SET link = '/sessions' 
            WHERE type LIKE 'request_%' AND (link LIKE '/sessions/new%' OR link IS NULL)
        `);
        console.log(`✅ Fixed ${res2.rowCount} 'request_accepted/other' links.`);

        // 3. Fix 'session_scheduled' links (were NULL -> can't easily fix to point to specific session without join, but at least safe)
        // Actually, if they are NULL, they do nothing, which is safe. 
        // We could try to link to /sessions if we wanted.
        const res3 = await pool.query(`
            UPDATE notifications 
            SET link = '/sessions' 
            WHERE type = 'session_scheduled' AND link IS NULL
        `);
        console.log(`✅ Updated ${res3.rowCount} 'session_scheduled' links to generic /sessions list.`);

    } catch (err) {
        console.error("❌ Error fixing links:", err);
    } finally {
        await pool.end();
    }
}

fixNotificationLinks();
