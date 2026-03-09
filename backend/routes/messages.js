const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const authenticateToken = require('../middleware/authMiddleware');

// Get conversations for a user
router.get('/conversations/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
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
        u.role as other_user_role,
        u.avatar as other_user_avatar, 
        m.content, 
        m.created_at, 
        m.read,
        m.sender_id
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
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get messages between two users
router.get('/:otherUserId', authenticateToken, async (req, res) => {
    const userId = req.user.user_id;
    const { otherUserId } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM messages
        WHERE(sender_id = $1 AND receiver_id = $2)
        OR(sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
            [userId, otherUserId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send a message
router.post('/', authenticateToken, async (req, res) => {
    const { receiver_id, content } = req.body;
    const sender_id = req.user.user_id;

    try {
        const messageId = uuidv4();
        const result = await pool.query(
            `INSERT INTO messages(message_id, sender_id, receiver_id, content)
        VALUES($1, $2, $3, $4) RETURNING * `,
            [messageId, sender_id, receiver_id, content]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
