const express = require("express");
const router = express.Router();
const jobPostController = require("../controllers/jobPostController");
const { verifyToken } = require("../middleware/auth");

// Public job routes
router.get("/", jobPostController.getAllJobPosts);
router.get("/:id", jobPostController.getJobPostById);

// Protected job routes - User must be authenticated
router.post("/", verifyToken, jobPostController.createJobPost);
router.put("/:id", verifyToken, jobPostController.updateJobPost);
router.delete("/:id", verifyToken, jobPostController.deleteJobPost);

// Get jobs by company ID
router.get("/company/:companyId", jobPostController.getJobPostsByCompany);

module.exports = router;
