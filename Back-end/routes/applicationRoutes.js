const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const JobPost = require("../models/JobPost");
const Application = require("../models/Application");
const applicationController = require("../controllers/applicationController");
const User = require("../models/User");
const Company = require("../models/Company");

// Get all applications for current user (both endpoints for compatibility)
router.get("/my-applications", verifyToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate({
        path: 'jobId',
        populate: { path: 'companyId' }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add an alias endpoint for '/user' that the frontend is trying to use
router.get("/user", verifyToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate({
        path: 'jobId',
        populate: { path: 'companyId' }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications for a specific job
router.get("/job/:jobId", verifyToken, async (req, res) => {
  try {
    console.log(`Fetching applications for job ID: ${req.params.jobId}`);
    console.log(`User details: ID=${req.user.id}, Role=${req.user.role}`);
    
    // Make role check case-insensitive
    const isHR = req.user.role && req.user.role.toString().toUpperCase() === 'HR';
    
    if (!isHR) {
      console.log('Access denied: User is not HR');
      return res.status(403).json({ message: 'Unauthorized: Only HR users can view job applications' });
    }
    
    // Find the job
    const job = await JobPost.findById(req.params.jobId);
    if (!job) {
      console.log(`Job not found with ID: ${req.params.jobId}`);
      return res.status(404).json({ message: 'Job not found' });
    }
    
    console.log(`Job found: companyId=${job.companyId}`);
    
    // Find the user's company
    let userCompany;
    
    // First try to get from req.user if it exists
    if (req.user.companyId) {
      userCompany = { _id: req.user.companyId };
      console.log(`Using companyId from user object: ${req.user.companyId}`);
    } else {
      // Otherwise fetch the user's company
      console.log(`Looking up company for user ID: ${req.user.id}`);
      userCompany = await Company.findOne({ createdBy: req.user.id });
      
      if (!userCompany) {
        console.log('User does not have a company');
        return res.status(403).json({ message: 'Unauthorized: You must have a company to view applications' });
      }
      console.log(`Found user company: ${userCompany._id}`);
    }
    
    // Compare company IDs safely
    const jobCompanyId = job.companyId.toString();
    const userCompanyId = userCompany._id.toString();
    
    console.log(`Comparing companyIds: Job=${jobCompanyId}, User=${userCompanyId}`);
    
    if (jobCompanyId !== userCompanyId) {
      console.log('Company ID mismatch - access denied');
      return res.status(403).json({ message: 'Unauthorized: You can only view applications for your company jobs' });
    }
    
    // Fetch applications for this job
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('userId', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${applications.length} applications for this job`);
    
    // Return even if no applications were found
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply for a job - use the controller
router.post("/apply/:jobId", verifyToken, applicationController.applyForJob);

// Update application status (for HR)
router.put("/:applicationId/status", verifyToken, async (req, res) => {
  try {
    // Check if user is HR (case-insensitive)
    if (!req.user.role || req.user.role.toString().toUpperCase() !== 'HR') {
      return res.status(403).json({ message: 'Only HR can update application status' });
    }
    
    const { status, feedback } = req.body;
    if (!['Pending', 'Accepted', 'Rejected', 'Interview'].includes(status)) {
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
    
    // Add feedback if provided
    if (feedback) {
      application.feedback = feedback;
    }
    
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

// Withdraw/delete an application (for candidates)
router.delete("/:applicationId", verifyToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }
    
    // Ensure only the application owner can withdraw it
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: You can only withdraw your own applications' 
      });
    }
    
    // Only allow withdrawal of pending applications
    if (application.status.toUpperCase() !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be withdrawn'
      });
    }
    
    await Application.findByIdAndDelete(req.params.applicationId);
    
    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Alternative endpoint for withdraw functionality
router.put("/:applicationId/withdraw", verifyToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }
    
    // Ensure only the application owner can withdraw it
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: You can only withdraw your own applications' 
      });
    }
    
    // Only allow withdrawal of pending applications
    if (application.status.toUpperCase() !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be withdrawn'
      });
    }
    
    await Application.findByIdAndDelete(req.params.applicationId);
    
    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get a specific application by ID (for HR to view individual application)
router.get("/job/application/:applicationId", verifyToken, async (req, res) => {
  try {
    // Check if user is HR (case-insensitive)
    if (!req.user.role || req.user.role.toString().toUpperCase() !== 'HR') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Only HR users can view application details' 
      });
    }
    
    const application = await Application.findById(req.params.applicationId)
      .populate('userId', 'firstName lastName email profilePicture phone location')
      .populate({
        path: 'jobId',
        populate: { path: 'companyId' }
      });
    
    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }
    
    // For the detailed portfolio view, we're going to allow HR to view any application
    // since they're already authenticated as HR. This helps during cross-company recruiting
    // events or when sharing candidate profiles.
    
    res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
