const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================================
// GOALS CRUD OPERATIONS
// =====================================================

// CREATE a new goal
router.post("/", async (req, res) => {
  const {
    user_id,
    title,
    description,
    category,
    priority,
    specific,
    measurable,
    achievable,
    relevant,
    time_bound,
    tags
  } = req.body;

  // Validation
  if (!user_id || !title || !category || !time_bound) {
    return res.status(400).json({
      error: "Missing required fields: user_id, title, category, time_bound"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO goals (
        user_id, title, description, category, priority,
        specific, measurable, achievable, relevant, time_bound, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        user_id,
        title,
        description || null,
        category,
        priority || 'medium',
        specific || null,
        measurable || null,
        achievable || null,
        relevant || null,
        time_bound,
        tags || []
      ]
    );

    // Log activity
    await pool.query(
      `INSERT INTO goal_activity (goal_id, user_id, activity_type, description)
       VALUES ($1, $2, 'created', $3)`,
      [result.rows[0].goal_id, user_id, `Created goal: ${title}`]
    );

    res.status(201).json({
      message: "Goal created successfully",
      goal: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating goal:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all goals for a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { status, category } = req.query;

  try {
    let query = `
      SELECT 
        g.*,
        COUNT(gm.milestone_id) as total_milestones,
        COUNT(gm.milestone_id) FILTER (WHERE gm.completed = TRUE) as completed_milestones
      FROM goals g
      LEFT JOIN goal_milestones gm ON g.goal_id = gm.goal_id
      WHERE g.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND g.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category) {
      query += ` AND g.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += `
      GROUP BY g.goal_id
      ORDER BY 
        CASE g.status
          WHEN 'active' THEN 1
          WHEN 'on_hold' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'abandoned' THEN 4
        END,
        g.time_bound ASC
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET single goal by ID with milestones
router.get("/:goalId", async (req, res) => {
  const { goalId } = req.params;

  try {
    // Get goal
    const goalResult = await pool.query(
      `SELECT * FROM goals WHERE goal_id = $1`,
      [goalId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Get milestones
    const milestonesResult = await pool.query(
      `SELECT * FROM goal_milestones 
       WHERE goal_id = $1 
       ORDER BY order_index ASC, created_at ASC`,
      [goalId]
    );

    res.json({
      ...goalResult.rows[0],
      milestones: milestonesResult.rows
    });
  } catch (err) {
    console.error("Error fetching goal:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a goal
router.put("/:goalId", async (req, res) => {
  const { goalId } = req.params;
  const updates = req.body;

  const allowedFields = [
    'title', 'description', 'category', 'priority',
    'specific', 'measurable', 'achievable', 'relevant', 'time_bound',
    'status', 'progress', 'tags'
  ];

  const fieldsToUpdate = Object.keys(updates).filter(key => 
    allowedFields.includes(key)
  );

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Get old values for activity log
    const oldGoal = await pool.query(
      `SELECT * FROM goals WHERE goal_id = $1`,
      [goalId]
    );

    if (oldGoal.rows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Build update query
    const setClause = fieldsToUpdate.map((field, index) => 
      `${field} = $${index + 1}`
    ).join(', ');

    const values = fieldsToUpdate.map(field => updates[field]);
    values.push(goalId);

    const query = `
      UPDATE goals
      SET ${setClause}, updated_at = NOW()
      WHERE goal_id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // Log activity
    await pool.query(
      `INSERT INTO goal_activity (goal_id, user_id, activity_type, description)
       VALUES ($1, $2, 'updated', $3)`,
      [goalId, oldGoal.rows[0].user_id, `Updated goal: ${fieldsToUpdate.join(', ')}`]
    );

    res.json({
      message: "Goal updated successfully",
      goal: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating goal:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a goal
router.delete("/:goalId", async (req, res) => {
  const { goalId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM goals WHERE goal_id = $1 RETURNING *`,
      [goalId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json({
      message: "Goal deleted successfully",
      goal: result.rows[0]
    });
  } catch (err) {
    console.error("Error deleting goal:", err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// MILESTONES OPERATIONS
// =====================================================

// ADD milestone to goal
router.post("/:goalId/milestones", async (req, res) => {
  const { goalId } = req.params;
  const { title, description, due_date, order_index } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO goal_milestones (goal_id, title, description, due_date, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [goalId, title, description || null, due_date || null, order_index || 0]
    );

    res.status(201).json({
      message: "Milestone added successfully",
      milestone: result.rows[0]
    });
  } catch (err) {
    console.error("Error adding milestone:", err);
    res.status(500).json({ error: err.message });
  }
});

// TOGGLE milestone completion
router.put("/milestones/:milestoneId/toggle", async (req, res) => {
  const { milestoneId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE goal_milestones
       SET completed = NOT completed,
           completed_at = CASE 
             WHEN completed = FALSE THEN NOW()
             ELSE NULL
           END
       WHERE milestone_id = $1
       RETURNING *`,
      [milestoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    res.json({
      message: "Milestone updated successfully",
      milestone: result.rows[0]
    });
  } catch (err) {
    console.error("Error toggling milestone:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE milestone
router.put("/milestones/:milestoneId", async (req, res) => {
  const { milestoneId } = req.params;
  const { title, description, due_date, completed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE goal_milestones
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           completed = COALESCE($4, completed),
           completed_at = CASE 
             WHEN $4 = TRUE AND completed = FALSE THEN NOW()
             WHEN $4 = FALSE THEN NULL
             ELSE completed_at
           END,
           updated_at = NOW()
       WHERE milestone_id = $5
       RETURNING *`,
      [title, description, due_date, completed, milestoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    res.json({
      message: "Milestone updated successfully",
      milestone: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating milestone:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE milestone
router.delete("/milestones/:milestoneId", async (req, res) => {
  const { milestoneId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM goal_milestones WHERE milestone_id = $1 RETURNING *`,
      [milestoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    res.json({
      message: "Milestone deleted successfully",
      milestone: result.rows[0]
    });
  } catch (err) {
    console.error("Error deleting milestone:", err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// STATISTICS & ANALYTICS
// =====================================================

// GET goal statistics for user
router.get("/user/:userId/stats", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_goals,
        COUNT(*) FILTER (WHERE status = 'active') as active_goals,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
        COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold_goals,
        AVG(progress) FILTER (WHERE status = 'active')::INTEGER as avg_progress,
        COUNT(*) FILTER (WHERE time_bound < CURRENT_DATE AND status = 'active') as overdue_goals
       FROM goals
       WHERE user_id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching goal stats:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET activity log for a goal
router.get("/:goalId/activity", async (req, res) => {
  const { goalId } = req.params;

  try {
    const result = await pool.query(
      `SELECT ga.*, u.name as user_name
       FROM goal_activity ga
       JOIN users u ON ga.user_id = u.user_id
       WHERE ga.goal_id = $1
       ORDER BY ga.created_at DESC
       LIMIT 50`,
      [goalId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching activity:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;