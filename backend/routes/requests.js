const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");

// CREATE a mentoring request
router.post("/", async (req, res) => {
  const { mentee_id, mentor_id, message } = req.body;

  if (!mentee_id || !mentor_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if request already exists
    const existingRequest = await pool.query(
      `SELECT * FROM mentoring_requests 
       WHERE mentee_id = $1 AND mentor_id = $2 AND status = 'pending'`,
      [mentee_id, mentor_id]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ 
        error: "You already have a pending request with this mentor" 
      });
    }

    // Create the request
    const result = await pool.query(
      `INSERT INTO mentoring_requests (mentee_id, mentor_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [mentee_id, mentor_id, message]
    );

    // Create notification for mentor
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        mentor_id,
        'request_received',
        'New Mentoring Request',
        `You have a new mentoring request`,
        `/requests/${result.rows[0].request_id}`
      ]
    );

    res.status(201).json({
      message: "Mentoring request sent successfully",
      request: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all requests for a user (both sent and received)
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Get received requests (where user is the mentor)
    const receivedRequests = await pool.query(
      `SELECT 
        r.*,
        u.name as mentee_name,
        u.email as mentee_email,
        u.avatar as mentee_avatar,
        u.department as mentee_department
       FROM mentoring_requests r
       JOIN users u ON r.mentee_id = u.user_id
       WHERE r.mentor_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Get sent requests (where user is the mentee)
    const sentRequests = await pool.query(
      `SELECT 
        r.*,
        u.name as mentor_name,
        u.email as mentor_email,
        u.avatar as mentor_avatar,
        u.department as mentor_department
       FROM mentoring_requests r
       JOIN users u ON r.mentor_id = u.user_id
       WHERE r.mentee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({
      received: receivedRequests.rows,
      sent: sentRequests.rows
    });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE request status (accept/decline)
router.put("/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body; // 'accepted' or 'declined'

  if (!['accepted', 'declined', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await pool.query(
      `UPDATE mentoring_requests 
       SET status = $1, updated_at = NOW()
       WHERE request_id = $2
       RETURNING *`,
      [status, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = result.rows[0];

    // Create notification for mentee
    const notificationMessage = status === 'accepted' 
      ? 'Your mentoring request has been accepted!'
      : 'Your mentoring request was declined';

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        request.mentee_id,
        `request_${status}`,
        status === 'accepted' ? 'Request Accepted' : 'Request Declined',
        notificationMessage,
        status === 'accepted' ? `/sessions/new?mentor=${request.mentor_id}` : null
      ]
    );

    res.json({
      message: `Request ${status} successfully`,
      request: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE/CANCEL a request
router.delete("/:requestId", async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM mentoring_requests WHERE request_id = $1 RETURNING *`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ 
      message: "Request cancelled successfully",
      request: result.rows[0]
    });
  } catch (err) {
    console.error("Error deleting request:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;