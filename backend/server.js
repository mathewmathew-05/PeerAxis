const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app=express();
require('dotenv').config();

app.use(cors());    
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


app.get("/health",(req,res)=>{
    res.json({status:"Backend is running "});
});

app.get("/db-test",async(req,res)=>{
    try{
        const result=await pool.query("SELECT NOW()");
        res.json({dbTime:result.rows[0]})
    }catch(err){
    console.error(err);
    res.status(500).json({error:"DB connection failed"});
}    
});
//authentication
const authRoutes=require("./routes/auth");
app.use("/api/auth",authRoutes);

//profile
const userRoutes=require("./routes/users");
app.use("/api/users",userRoutes);

app.use("/api/matching", require("./routes/matching"));


const requestRoutes = require("./routes/requests");
app.use("/api/requests", requestRoutes);

const sessionRoutes = require("./routes/sessions");
app.use("/api/sessions", sessionRoutes);

const notificationRoutes = require("./routes/notifications");
app.use("/api/notifications", notificationRoutes);

const goalsRoutes=require("./routes/goals");
app.use("/api/goals",goalsRoutes);

const PORT=5000;
app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
});