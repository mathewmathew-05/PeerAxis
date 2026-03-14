const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db");
require('dotenv').config();

const router = express.Router();

const generateToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            role: user.role,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

//Register
router.post("/register", async (req, res) => {
    const { name, email, password, role, department } = req.body;
    try {
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        await pool.query(
            `INSERT INTO users(user_id,name,email,password,role,department) VALUES ($1,$2,$3,$4,$5,$6)`, [userId, name, email, hashPassword, role, department]
        );

        const newUser = {
            user_id: userId,
            name,
            email,
            role,
            department
        };

        const token = generateToken(newUser);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                ...newUser,
                skills: [],
                availability: []
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }

});

//Login

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Block banned/deactivated accounts
        if (user.is_active === false) {
            return res.status(403).json({ error: "Your account has been deactivated. Please contact an administrator." });
        }

        const token = generateToken(user);

        res.json({
            message: "Login Successful",
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                skills: user.skills || [],
                availability: user.availability || [],
                bio: user.bio || '',
                avatar: user.avatar || '',
                rating: user.rating || null
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /forgot-password — stores token in DB (survives server restarts)
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.json({ message: "If that email exists, a reset token has been generated." });
        }
        const userId = result.rows[0].user_id;

        // Invalidate any existing unused tokens for this user
        await pool.query(
            "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
            [userId]
        );

        // Insert new token (expires in 1 hour)
        const tokenResult = await pool.query(
            `INSERT INTO password_reset_tokens (user_id, expires_at)
             VALUES ($1, NOW() + INTERVAL '1 hour')
             RETURNING token`,
            [userId]
        );
        const token = tokenResult.rows[0].token;
        res.json({ message: "Reset token generated.", token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /reset-password
router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const result = await pool.query(
            `SELECT * FROM password_reset_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }
        const { user_id } = result.rows[0];
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [hashed, user_id]);
        await pool.query("UPDATE password_reset_tokens SET used = TRUE WHERE token = $1", [token]);
        res.json({ message: "Password reset successfully. Please log in." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
