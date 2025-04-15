const express = require("express");
const router = express.Router();
const jobPostController = require("../controllers/jobPostController");
const { verifyToken } = require("../middleware/auth");

// Public routes - no authentication needed
router.get("/", (req, res, next) => {
  console.log("GET /api/jobs request received");
  jobPostController.getAllJobPosts(req, res);
});
router.get("/:id", jobPostController.getJobPostById);
router.get("/company/:companyId", jobPostController.getJobPostsByCompany);

// Protected routes - require authentication
router.post("/", verifyToken, jobPostController.createJobPost);
router.put("/:id", verifyToken, jobPostController.updateJobPost);
router.delete("/:id", verifyToken, jobPostController.deleteJobPost);

module.exports = router;
