const express = require("express");
const router = express.Router();
const pool = require("../db");

// CREATE a new session
router.post("/", async (req, res) => {
  const {
    mentor_id,
    mentee_id,
    topic,
    scheduled_date,
    duration,
    mode,
    location,
  } = req.body;

  if (!mentor_id || !mentee_id || !topic || !scheduled_date) {
    return res.status(400).json({
      error: "Missing required fields: mentor_id, mentee_id, topic, scheduled_date"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (
        mentor_id, mentee_id, topic, scheduled_date, 
        duration, mode, location, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *`,
      [
        mentor_id,
        mentee_id,
        topic,
        scheduled_date,
        duration || 60,
        mode || 'online',
        location || null
      ]
    );

    const session = result.rows[0];

    // Create notifications for both users
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES 
       ($1, 'session_scheduled', 'New Session Scheduled', $3),
       ($2, 'session_scheduled', 'New Session Scheduled', $3)`,
      [
        mentor_id,
        mentee_id,
        `A session "${topic}" has been scheduled for ${new Date(scheduled_date).toLocaleDateString()}`
      ]
    );

    res.status(201).json({
      message: "Session created successfully",
      session
    });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all sessions for a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { status } = req.query;

  try {
    let query = `
      SELECT 
        s.*,
        mentor.name as mentor_name,
        mentor.avatar as mentor_avatar,
        mentor.department as mentor_department,
        mentee.name as mentee_name,
        mentee.avatar as mentee_avatar,
        mentee.department as mentee_department
      FROM sessions s
      JOIN users mentor ON s.mentor_id = mentor.user_id
      JOIN users mentee ON s.mentee_id = mentee.user_id
      WHERE (s.mentor_id = $1 OR s.mentee_id = $1)
    `;

    const params = [userId];

    if (status) {
      query += ` AND s.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY s.scheduled_date DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET session by ID
router.get("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        s.*,
        mentor.name as mentor_name,
        mentor.avatar as mentor_avatar,
        mentor.department as mentor_department,
        mentee.name as mentee_name,
        mentee.avatar as mentee_avatar,
        mentee.department as mentee_department
      FROM sessions s
      JOIN users mentor ON s.mentor_id = mentor.user_id
      JOIN users mentee ON s.mentee_id = mentee.user_id
      WHERE s.session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching session:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE session (for notes, status, etc.)
router.put("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const updates = req.body;

  const allowedFields = [
    'topic', 'scheduled_date', 'duration', 'mode', 'location',
    'status', 'mentor_notes', 'mentee_notes', 'description'
  ];

  const fieldsToUpdate = Object.keys(updates).filter(key => 
    allowedFields.includes(key)
  );

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    const setClause = fieldsToUpdate.map((field, index) => 
      `${field} = $${index + 1}`
    ).join(', ');

    const values = fieldsToUpdate.map(field => updates[field]);
    values.push(sessionId);

    const query = `
      UPDATE sessions
      SET ${setClause}, updated_at = NOW()
      WHERE session_id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      message: "Session updated successfully",
      session: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating session:", err);
    res.status(500).json({ error: err.message });
  }
});

// COMPLETE session and add rating/feedback
router.put("/:sessionId/complete", async (req, res) => {
  const { sessionId } = req.params;
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const result = await pool.query(
      `UPDATE sessions 
       SET status = 'completed', 
           rating = $1, 
           feedback = $2,
           updated_at = NOW()
       WHERE session_id = $3
       RETURNING *`,
      [rating, feedback || null, sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = result.rows[0];

    // Update mentor's average rating
    await pool.query(
      `UPDATE users 
       SET rating = (
         SELECT AVG(rating)::NUMERIC(3,2)
         FROM sessions 
         WHERE mentor_id = $1 AND rating IS NOT NULL
       )
       WHERE user_id = $1`,
      [session.mentor_id]
    );

    res.json({
      message: "Session completed successfully",
      session: result.rows[0]
    });
  } catch (err) {
    console.error("Error completing session:", err);
    res.status(500).json({ error: err.message });
  }
});

// CANCEL a session - FIXED VERSION
router.delete("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  // Support both body and query params
  const reason = req.body?.reason || req.query?.reason || 'Cancelled by user';

  console.log(`🗑️ Cancelling session ${sessionId}, reason: ${reason}`);

  try {
    // First, check if session exists and get current status
    const checkResult = await pool.query(
      `SELECT * FROM sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const existingSession = checkResult.rows[0];

    // Prevent cancelling already cancelled or completed sessions
    if (existingSession.status === 'cancelled') {
      return res.status(400).json({ error: "Session is already cancelled" });
    }

    if (existingSession.status === 'completed') {
      return res.status(400).json({ error: "Cannot cancel a completed session" });
    }

    // Update session status to cancelled - FIXED CONCAT
    const result = await pool.query(
      `UPDATE sessions 
       SET status = 'cancelled', 
           description = CASE 
             WHEN description IS NULL THEN $1
             ELSE description || ' [Cancelled: ' || $1 || ']'
           END,
           updated_at = NOW()
       WHERE session_id = $2
       RETURNING *`,
      [reason, sessionId]
    );

    const session = result.rows[0];

    // Notify both users
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES 
       ($1, 'session_cancelled', 'Session Cancelled', $3),
       ($2, 'session_cancelled', 'Session Cancelled', $3)`,
      [
        session.mentor_id,
        session.mentee_id,
        `The session "${session.topic}" scheduled for ${new Date(session.scheduled_date).toLocaleDateString()} has been cancelled`
      ]
    );

    console.log(`✅ Session ${sessionId} cancelled successfully`);

    res.json({
      message: "Session cancelled successfully",
      session
    });
  } catch (err) {
    console.error("❌ Error cancelling session:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET session statistics for a user
router.get("/user/:userId/stats", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'scheduled') as upcoming_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        AVG(rating) FILTER (WHERE rating IS NOT NULL)::NUMERIC(3,2) as avg_rating,
        COUNT(*) as total_sessions
       FROM sessions
       WHERE mentor_id = $1 OR mentee_id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching session stats:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;