const pool = require('../db');
const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('verification_log.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

async function verify() {
    try {
        console.log("🔍 Starting verification...");

        // 1. Get a distinct user who has sessions
        const userRes = await pool.query(`SELECT DISTINCT mentor_id as user_id FROM sessions LIMIT 1`);
        if (userRes.rows.length === 0) {
            console.log("❌ No sessions found to test with.");
            return;
        }
        const userId = userRes.rows[0].user_id;
        console.log(`👤 Testing with User ID: ${userId}`);

        // 2. Run the NEW query
        const query = `
      WITH connections AS (
        -- Mentoring Requests (Accepted)
        SELECT mentor_id as other_id, COALESCE(updated_at, created_at) as interaction_at 
        FROM mentoring_requests 
        WHERE mentee_id = $1 AND status = 'accepted'
        UNION
        SELECT mentee_id as other_id, COALESCE(updated_at, created_at) as interaction_at 
        FROM mentoring_requests 
        WHERE mentor_id = $1 AND status = 'accepted'
        UNION
        -- Sessions (Scheduled/Completed/Cancelled)
        SELECT mentor_id as other_id, created_at as interaction_at 
        FROM sessions 
        WHERE mentee_id = $1
        UNION
        SELECT mentee_id as other_id, created_at as interaction_at 
        FROM sessions 
        WHERE mentor_id = $1
        UNION
        -- Existing Messages
        SELECT sender_id as other_id, created_at as interaction_at 
        FROM messages 
        WHERE receiver_id = $1
        UNION
        SELECT receiver_id as other_id, created_at as interaction_at 
        FROM messages 
        WHERE sender_id = $1
      ),
      unique_connections AS (
        SELECT other_id, MAX(interaction_at) as last_interaction
        FROM connections
        GROUP BY other_id
      )
      SELECT 
        u.user_id as other_user_id, 
        u.name as other_user_name, 
        m.created_at as message_at,
        c.last_interaction,
        COALESCE(m.created_at, c.last_interaction) as sort_time
      FROM unique_connections c
      JOIN users u ON u.user_id = c.other_id
      LEFT JOIN LATERAL (
        SELECT * FROM messages 
        WHERE (sender_id = $1 AND receiver_id = c.other_id) 
           OR (sender_id = c.other_id AND receiver_id = $1)
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      ORDER BY COALESCE(m.created_at, c.last_interaction) DESC;
    `;

        const result = await pool.query(query, [userId]);

        console.log(`📊 Found ${result.rows.length} conversation items.`);

        let prevTime = null;
        let isSorted = true;

        result.rows.forEach((row, index) => {
            const sortTime = new Date(row.sort_time).getTime();
            console.log(`   ${index + 1}. ${row.other_user_name} | Msg: ${row.message_at ? 'YES' : 'NO'} | Interaction: ${row.last_interaction} | Sort: ${row.sort_time}`);

            if (prevTime !== null && sortTime > prevTime) {
                isSorted = false;
                console.log(`      ⚠️ Order violation! Previous: ${prevTime}, Current: ${sortTime}`);
            }
            prevTime = sortTime;
        });

        if (isSorted) {
            console.log("✅ Results are correctly sorted by latest interaction!");
        } else {
            console.log("❌ Sorting order is incorrect.");
        }

    } catch (err) {
        console.log(`❌ Verification failed: ${err.message}`);
    } finally {
        await pool.end();
    }
}

verify();
