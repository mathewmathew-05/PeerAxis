const express = require("express");
const router = express.Router();
const pool = require("../db");

console.log("🔥 matching routes file loaded");

router.get("/mentors/:menteeId", async (req, res) => {
  console.log("🔥 matching route HIT");

  const { menteeId } = req.params;

  try {
    /* 1️⃣ Fetch mentee profile */
    const menteeResult = await pool.query(
      `SELECT department, availability
       FROM users
       WHERE user_id = $1 AND role = 'mentee'`,
      [menteeId]
    );

    if (menteeResult.rows.length === 0) {
      return res.status(404).json({ error: "Mentee not found" });
    }

    const mentee = menteeResult.rows[0];

    /* 2️⃣ Fetch mentee learning skills */
    const skillsResult = await pool.query(
      `SELECT LOWER(TRIM(skill_name)) AS skill
       FROM mentee_learning_skills
       WHERE mentee_id = $1`,
      [menteeId]
    );

    const menteeSkills = skillsResult.rows.map(r => r.skill);

    if (menteeSkills.length === 0) {
      return res.json([]);
    }

    /* 3️⃣ Fetch mentors */
    const mentorsResult = await pool.query(
      `SELECT user_id, name, department, skills, availability, rating, bio, avatar
       FROM users
       WHERE role = 'mentor'`
    );

    /* 4️⃣ Compute matching score */
    const matches = mentorsResult.rows.map(mentor => {
      // Skill match (S)
      const mentorSkills = (mentor.skills || []).map(s =>
        s.toLowerCase().trim()
      );

      const matchedSkills = mentorSkills.filter(skill =>
        menteeSkills.includes(skill)
      );

      const S = matchedSkills.length / menteeSkills.length;

      // Availability match (A)
      const menteeAvail = mentee.availability || [];
      const mentorAvail = mentor.availability || [];

      const commonSlots = mentorAvail.filter(slot =>
        menteeAvail.includes(slot)
      );

      const A =
        menteeAvail.length === 0
          ? 0
          : commonSlots.length / menteeAvail.length;

      // Department match (D)
      let D = 0;
      if (mentor.department === mentee.department) {
        D = 1;
      } else if (
        mentor.department &&
        mentee.department &&
        mentor.department.split(" ")[0] === mentee.department.split(" ")[0]
      ) {
        D = 0.5;
      }

      // Rating (R)
      const R = mentor.rating ? mentor.rating / 5 : 0;

      // Final score
      const score =
        0.4 * S +
        0.3 * A +
        0.2 * D +
        0.1 * R;

      return {
        mentor_id: mentor.user_id,
        name: mentor.name,
        department: mentor.department,
        skills: mentor.skills,
        availability: mentor.availability,
        rating: mentor.rating,
        bio: mentor.bio,
        avatar: mentor.avatar,
        score: Number(score.toFixed(3)),
        matchedSkills
      };
    });

    /* 5️⃣ Rank mentors */
    const ranked = matches
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);

    res.json(ranked);

  } catch (err) {
  console.error("❌ MATCHING ERROR:", err.message);
  console.error(err);
  res.status(500).json({
    error: "Matching failed",
    details: err.message
  });
}

});

module.exports = router;
