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
                availability: user.availability || []
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;