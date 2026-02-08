const express = require("express");
const pool = require("../db");

const router=express.Router();

//route for the user profile
router.put("/profile/:userId",async(req,res)=>{
    const{userId}=req.params;
    const{skills,availability,department,bio,avatar}=req.body;

    if(!Array.isArray(skills) || !Array.isArray(availability)){
        return res.status(400).json({
            error:"Skills and availability must be arrays"
        });
    }

    try{
        const result=await pool.query(
            `UPDATE users
            SET skills=$1,
            availability=$2,
            department=$3,
            bio=$4,
            avatar=$5
            where user_id=$6
            RETURNING *
            `,
            [skills,availability,department,bio,avatar,userId]
        );
        if(result.rows.length===0){
            return res.status(404).json({error:"User not found"});
        }
        res.json({
            message:"Profile updated successfully",
            user:result.rows[0]
        });
    }catch(err){
        res.status(500).json({error:err.message});
    }
});
// GET user by ID (FULL PROFILE)
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT user_id, name, email, role, department, skills, availability,bio,avatar FROM users
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/mentee/skills",async(req,res)=>{
    const{mentee_id,skill_name,priority}=req.body;

    if(!mentee_id || !skill_name){
        return res.status(400).json({error:"Missing fields"});
    }
    
    if (skill_name.includes(",")) {
  return res.status(400).json({
    error: "Only one skill allowed per request",
  });
}

    try{
        const result=await pool.query(
            `INSERT INTO mentee_learning_skills (mentee_id,skill_name,priority)
            VALUES($1,$2,$3)
            RETURNING *`,
            [mentee_id,skill_name,priority ||"Medium"]
        );
        res.status(201).json(result.rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
})

router.get("/mentee/:id/skills",async(req,res)=>{
    try{
        const result=await pool.query(
            `SELECT * FROM mentee_learning_skills WHERE mentee_id=$1`,
            [req.params.id]
        );
        res.json(result.rows);
    }catch(err){
        res.status(500).json({error:err.message});
    }
})

router.delete("/mentee/skills/:skillId", async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM mentee_learning_skills WHERE id = $1`,
      [req.params.skillId]
    );

    res.json({ message: "Skill removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports=router;