const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const JobPost = require("../models/JobPost");
const Application = require("../models/Application");
const applicationController = require("../controllers/applicationController");

// Get all applications for current user
router.get("/my-applications", verifyToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications for a specific job
router.get("/job/:jobId", verifyToken, async (req, res) => {
  try {
    // Check if user is HR and authorized to view these applications
    const job = await JobPost.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (req.user.role !== 'HR' || job.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({ message: 'Unauthorized to view these applications' });
    }
    
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('userId', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });
    
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply for a job - use the controller
router.post("/apply/:jobId", verifyToken, applicationController.applyForJob);

// Update application status (for HR)
router.put("/:applicationId/status", verifyToken, async (req, res) => {
  try {
    // Check if user is HR
    if (req.user.role !== 'HR') {
      return res.status(403).json({ message: 'Only HR can update application status' });
    }
    
    const { status } = req.body;
    if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const application = await Application.findById(req.params.applicationId)
      .populate({
        path: 'jobId',
        populate: { path: 'companyId' }
      });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if HR belongs to the same company as the job
    if (application.jobId.companyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this application' });
    }
    
    application.status = status;
    application.updatedAt = Date.now();
    await application.save();
    
    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
