const express = require("express");
const router = express.Router();
const jobPostController = require("../controllers/jobPostController");
const jobController = require("../controllers/jobController");
const { verifyToken } = require("../middleware/auth");

// Public routes - no authentication needed
// The root route must be first
router.get("/", (req, res, next) => {
  console.log("GET /api/jobs request received");
  jobPostController.getAllJobPosts(req, res);
});

// Use a different pattern for the company endpoint to avoid conflicts
router.get("/job/:jobId/company", jobPostController.getCompanyByJobPost);

// Add route for jobs by location
router.get("/locations", jobPostController.getJobsByLocation);

// Static segment routes next
router.get("/company/:companyId", jobPostController.getJobPostsByCompany);

// The generic job ID route comes last
router.get("/:id", jobPostController.getJobPostById);

// Protected routes - require authentication
router.post("/", verifyToken, jobPostController.createJobPost);
router.put("/:id", verifyToken, jobPostController.updateJobPost);
router.delete("/:id", verifyToken, jobPostController.deleteJobPost);

// Get job applicants for a specific job
router.get("/:jobId/applicants", verifyToken, jobController.getJobApplicants);

// Get jobs by HR ID
router.get("/hr/:hrId", verifyToken, jobPostController.getJobsByHrId);

module.exports = router;
