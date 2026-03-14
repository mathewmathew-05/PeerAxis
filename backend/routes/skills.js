const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET all skill exchanges
router.get('/', async (req, res) => {
    try {
        const { type, search, user_id } = req.query;
        let query = `
      SELECT se.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role
      FROM skill_exchanges se
      JOIN users u ON se.user_id = u.user_id
      WHERE se.status = 'open'
    `;
        const params = [];

        if (user_id) {
            params.push(user_id);
            query += ` AND se.user_id = $${params.length}`;
        }

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

// GET mutual skill exchange matches for a user
// TRUE match = other user offers what I want AND wants what I offer
router.get('/matches/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Get current user's offerings and wantings
        const myExchanges = await pool.query(
            `SELECT skill_name, exchange_type FROM skill_exchanges
             WHERE user_id = $1 AND status = 'open'`,
            [userId]
        );

        const myOffering = myExchanges.rows.filter(e => e.exchange_type === 'offering').map(e => e.skill_name.toLowerCase());
        const myWanting  = myExchanges.rows.filter(e => e.exchange_type === 'wanting').map(e => e.skill_name.toLowerCase());

        if (myOffering.length === 0 || myWanting.length === 0) {
            return res.json({
                matches: [],
                message: myOffering.length === 0
                    ? 'Post at least one skill you are OFFERING to find mutual matches'
                    : 'Post at least one skill you are WANTING to find mutual matches'
            });
        }

        // Find users who:
        //   (A) have an 'offering' matching one of my 'wanting' skills
        //   AND (B) have a 'wanting' matching one of my 'offering' skills
        // Return the matched skill pair so the UI can explain the exchange clearly
        const result = await pool.query(
            `SELECT DISTINCT ON (other.user_id)
                other.user_id,
                u.name         AS user_name,
                u.avatar       AS user_avatar,
                u.department   AS user_department,
                they_offer.skill_name  AS they_teach_me,   -- skill they offer that I want
                they_want.skill_name   AS i_teach_them      -- skill they want that I offer
             FROM users other
             JOIN users u ON u.user_id = other.user_id
             -- what they offer that I want
             JOIN skill_exchanges they_offer
               ON they_offer.user_id = other.user_id
              AND they_offer.exchange_type = 'offering'
              AND they_offer.status = 'open'
              AND LOWER(they_offer.skill_name) = ANY($2::text[])
             -- what they want that I offer
             JOIN skill_exchanges they_want
               ON they_want.user_id = other.user_id
              AND they_want.exchange_type = 'wanting'
              AND they_want.status = 'open'
              AND LOWER(they_want.skill_name) = ANY($3::text[])
             WHERE other.user_id != $1
             ORDER BY other.user_id`,
            [userId, myWanting, myOffering]
        );

        res.json({ matches: result.rows });
    } catch (err) {
        console.error('Error fetching skill matches:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
