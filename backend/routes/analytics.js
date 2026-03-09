const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET Admin Dashboard Stats
router.get("/admin", async (req, res) => {
    try {
        // 1. Basic Counts
        const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'mentor') as "totalMentors",
        (SELECT COUNT(*) FROM users WHERE role = 'mentee') as "totalMentees",
        (SELECT COUNT(*) FROM sessions WHERE status = 'scheduled') as "activeSessions",
        (SELECT AVG(rating) FROM sessions WHERE rating IS NOT NULL)::NUMERIC(3,1) as "avgRating"
    `;
        const countsResult = await pool.query(countsQuery);

        // 2. Sessions Over Time (Last 6 months)
        const sessionsQuery = `
      SELECT TO_CHAR(scheduled_date, 'Mon') as month, COUNT(*) as sessions
      FROM sessions
      WHERE scheduled_date > NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(scheduled_date, 'Mon'), DATE_TRUNC('month', scheduled_date)
      ORDER BY DATE_TRUNC('month', scheduled_date)
    `;
        const sessionsResult = await pool.query(sessionsQuery);

        // 3. Department Distribution (Mentors)
        const deptQuery = `
      SELECT department as name, COUNT(*) as value
      FROM users
      WHERE role = 'mentor' AND department IS NOT NULL
      GROUP BY department
    `;
        const deptResult = await pool.query(deptQuery);

        res.json({
            stats: countsResult.rows[0],
            sessionsData: sessionsResult.rows,
            departmentData: deptResult.rows
        });
    } catch (err) {
        console.error("Error fetching admin analytics:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET Leaderboard Data
router.get("/leaderboard", async (req, res) => {
    try {
        const query = `
      SELECT 
        u.user_id as id, 
        u.name, 
        u.department, 
        u.avatar, 
        COALESCE(u.rating, 0) as rating,
        COUNT(s.session_id) as "sessionsCompleted",
        (COUNT(s.session_id) * 50 + COALESCE(u.rating, 0) * 20)::int as points
      FROM users u
      LEFT JOIN sessions s ON u.user_id = s.mentor_id AND s.status = 'completed'
      WHERE u.role = 'mentor'
      GROUP BY u.user_id
      ORDER BY points DESC
    `;

        const result = await pool.query(query);

        // Calculate rank and badges
        const leaderboard = result.rows.map((mentor, index) => ({
            ...mentor,
            rank: index + 1,
            badges: Math.floor(mentor.sessionsCompleted / 5) // Simple badge logic: 1 badge per 5 sessions
        }));

        res.json(leaderboard);
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
