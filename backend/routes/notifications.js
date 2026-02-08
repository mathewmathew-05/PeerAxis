const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all notifications for a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { unread_only } = req.query;

  try {
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    if (unread_only === 'true') {
      query += ` AND read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await pool.query(query, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: err.message });
  }
});

// MARK notification as read
router.put("/:notificationId/read", async (req, res) => {
  const { notificationId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET read = TRUE
       WHERE notification_id = $1
       RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: err.message });
  }
});

// MARK all notifications as read for a user
router.put("/user/:userId/read-all", async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query(
      `UPDATE notifications 
       SET read = TRUE
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all as read:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a notification
router.delete("/:notificationId", async (req, res) => {
  const { notificationId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM notifications WHERE notification_id = $1 RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET unread count
router.get("/user/:userId/unread-count", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;