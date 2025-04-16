const express = require("express");
const { verifyToken } = require("../middleware/auth");
const { analyzeResume } = require("../controllers/aiController");

const router = express.Router();

// Route for AI resume analysis - protected with verifyToken middleware
router.post("/analyze-resume", verifyToken, analyzeResume);

module.exports = router;
