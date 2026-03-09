const pool = require('../db');

const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('diagnosis_log.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) { //
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

async function diagnose() {
    try {
        console.log("🔍 Starting diagnosis...");

        // 1. Fetch recent sessions
        const sessionsRes = await pool.query(`SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5`);
        const sessions = sessionsRes.rows;

        console.log(`📊 Found ${sessions.length} recent sessions.`);

        for (const session of sessions) {
            console.log(`\n--------------------------------------------------`);
            console.log(`🧩 Session ID: ${session.session_id}`);
            console.log(`   Mentor: ${session.mentor_id}`);
            console.log(`   Mentee: ${session.mentee_id}`);
            console.log(`   Status: ${session.status}`);

            // Check connection visibility for Mentee (looking for Mentor)
            await checkVisibility(session.mentee_id, session.mentor_id, 'Mentee');

            // Check connection visibility for Mentor (looking for Mentee)
            await checkVisibility(session.mentor_id, session.mentee_id, 'Mentor');
        }

    } catch (err) {
        console.log(`❌ Diagnosis failed: ${err.message}`);
    } finally {
        await pool.end();
    }
}

async function checkVisibility(viewerId, targetId, role) {
    console.log(`   👀 Checking if ${role} (${viewerId}) can see ${targetId}...`);

    const query = `
      WITH connections AS (
        -- Mentoring Requests (Accepted)
        SELECT mentor_id as other_id FROM mentoring_requests WHERE mentee_id = $1 AND status = 'accepted'
        UNION
        SELECT mentee_id as other_id FROM mentoring_requests WHERE mentor_id = $1 AND status = 'accepted'
        UNION
        -- Sessions (Scheduled/Completed)
        SELECT mentor_id as other_id FROM sessions WHERE mentee_id = $1
        UNION
        SELECT mentee_id as other_id FROM sessions WHERE mentor_id = $1
        UNION
        -- Existing Messages
        SELECT sender_id as other_id FROM messages WHERE receiver_id = $1
        UNION
        SELECT receiver_id as other_id FROM messages WHERE sender_id = $1
      )
      SELECT other_id FROM connections WHERE other_id = $2
    `;

    try {
        const res = await pool.query(query, [viewerId, targetId]);
        if (res.rows.length > 0) {
            console.log(`      ✅ YES! Found in connections list.`);
        } else {
            console.log(`      ❌ NO! NOT found in connections list.`);
            // Deep dive why
            await deepDive(viewerId, targetId);
        }
    } catch (err) {
        console.error(`      ❌ Error checking visibility: ${err.message}`);
    }
}

async function deepDive(viewerId, targetId) {
    console.log(`      🕵️ Deep dive for viewer ${viewerId}:`);

    // Check sessions directly
    const sessionRes = await pool.query(`
        SELECT * FROM sessions WHERE (mentee_id = $1 AND mentor_id = $2) OR (mentee_id = $2 AND mentor_id = $1)
    `, [viewerId, targetId]);
    console.log(`         Sessions found: ${sessionRes.rows.length}`);
    sessionRes.rows.forEach(s => console.log(`           - ${s.session_id} [${s.status}]`));

    // Check requests directly
    const requestRes = await pool.query(`
        SELECT * FROM mentoring_requests WHERE (mentee_id = $1 AND mentor_id = $2) OR (mentee_id = $2 AND mentor_id = $1)
    `, [viewerId, targetId]);
    console.log(`         Requests found: ${requestRes.rows.length}`);
    requestRes.rows.forEach(r => console.log(`           - ${r.request_id} [${r.status}]`));
}

diagnose();
