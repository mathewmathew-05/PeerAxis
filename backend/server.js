const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express(); //initialize express
const http = require('http');
const { Server } = require("socket.io");
const server = http.createServer(app);

require('dotenv').config();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
    });

    socket.on('send_message', (data) => {
        // data: { receiver_id, content, ... }
        io.to(data.receiver_id).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


app.get("/health", (req, res) => {
    res.json({ status: "Backend is running " });
});

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ dbTime: result.rows[0] })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB connection failed" });
    }
});
//authentication
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

//profile
const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

app.use("/api/matching", require("./routes/matching"));


const requestRoutes = require("./routes/requests");
app.use("/api/requests", requestRoutes);

const sessionRoutes = require("./routes/sessions");
app.use("/api/sessions", sessionRoutes);

const notificationRoutes = require("./routes/notifications");
app.use("/api/notifications", notificationRoutes);

const goalsRoutes = require("./routes/goals");
app.use("/api/goals", goalsRoutes);

const messageRoutes = require("./routes/messages");
app.use("/api/messages", messageRoutes);

const skillRoutes = require("./routes/skills");
app.use("/api/skills", skillRoutes);

app.use("/api/analytics", require("./routes/analytics"));

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});