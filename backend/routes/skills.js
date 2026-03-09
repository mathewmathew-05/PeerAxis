const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET all skill exchanges
router.get('/', async (req, res) => {
    try {
        const { type, search } = req.query;
        let query = `
      SELECT se.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role
      FROM skill_exchanges se
      JOIN users u ON se.user_id = u.user_id
      WHERE se.status = 'open'
    `;
        const params = [];

        if (type && type !== 'all') {
            params.push(type);
            query += ` AND se.exchange_type = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (se.skill_name ILIKE $${params.length} OR se.description ILIKE $${params.length})`;
        }

        query += ' ORDER BY se.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create a new exchange
router.post('/', async (req, res) => {
    const { user_id, skill_name, exchange_type, description } = req.body;
    try {
        const exchangeId = uuidv4();
        const result = await pool.query(
            `INSERT INTO skill_exchanges (exchange_id, user_id, skill_name, exchange_type, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [exchangeId, user_id, skill_name, exchange_type, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE my exchange
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM skill_exchanges WHERE exchange_id = $1', [req.params.id]);
        res.json({ message: 'Exchange deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
