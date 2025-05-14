const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const JobPost = require("../models/JobPost");
const Application = require("../models/Application");
const applicationController = require("../controllers/applicationController");
const User = require("../models/User");
const Company = require("../models/Company");
const path = require("path");
const fs = require("fs");

// Route for Admin Panel to get all applications
router.get("/", verifyToken, async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user.role || req.user.role.toString().toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Only admin users can view all applications' 
      });
    }
    
    // Use the controller to get all applications
    await applicationController.getAllApplications(req, res);
  } catch (error) {
    console.error('Error in admin applications route:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

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

// Apply for a job - use the controller with upload middleware
router.post("/apply/:jobId", verifyToken, applicationController.uploadResume, applicationController.applyForJob);

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
    
    // For the portfolio view, we're allowing HR users to update any application
    // This is consistent with our approach to allow viewing any application details
    
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

// Add a new route to serve resume files
router.get("/resume/:applicationId", verifyToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if the user is authorized to access the resume
    // Allow if: 1) the user is the owner of the application, 2) the user is HR for the job's company
    const isOwner = application.userId.toString() === req.user.id;
    
    let isHR = false;
    if (req.user.role && req.user.role.toString().toUpperCase() === 'HR') {
      // Get the job to check company
      const job = await JobPost.findById(application.jobId);
      
      if (job && job.companyId) {
        // Check if the HR user belongs to the job's company
        if (req.user.companyId) {
          isHR = job.companyId.toString() === req.user.companyId.toString();
        } else {
          // If companyId is not in user object, check Company collection
          const userCompany = await Company.findOne({ createdBy: req.user.id });
          if (userCompany) {
            isHR = job.companyId.toString() === userCompany._id.toString();
          }
        }
      }
    }
    
    if (!isOwner && !isHR) {
      return res.status(403).json({ message: 'Unauthorized to access this resume' });
    }
    
    // Check if resume exists
    if (!application.resume || !application.resume.path) {
      return res.status(404).json({ message: 'Resume file not found' });
    }
    
    // For local files
    const resumePath = path.join(__dirname, '..', application.resume.path);
    
    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ message: 'Resume file not found on server' });
    }
    
    // Set proper content type
    res.setHeader('Content-Type', application.resume.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${application.resume.originalname || 'resume'}"}`);
    
    // Return the file
    return res.sendFile(resumePath);
  } catch (error) {
    console.error('Error serving resume file:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error retrieving resume file',
      error: error.message 
    });
  }
});

// Add a route to analyze resume text for ATS
router.get("/analyze-resume/:applicationId", verifyToken, applicationController.extractResumeData);

// Test endpoint for Mohamed's application
router.get("/test-analyze-resume/:applicationId", applicationController.extractResumeData);

// Route de téléchargement des CV - DOIT ÊTRE AVANT LA ROUTE GÉNÉRIQUE /:id
router.get("/download-resume/:id", verifyToken, async (req, res) => {
  try {
    console.log(`Download resume requested for application ID: ${req.params.id}`);
    
    // Delegate to the controller
    await applicationController.downloadResume(req, res);
  } catch (error) {
    console.error('Error in download route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading resume', 
      error: error.message 
    });
  }
});

// Route simple pour récupérer une application par son ID (GÉNÉRIQUE - DOIT ÊTRE EN DERNIER)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    console.log(`Fetching application with ID: ${req.params.id}`);
    
    const application = await Application.findById(req.params.id)
      .populate('userId', 'firstName lastName email profilePicture phone location')
      .populate({
        path: 'jobId',
        populate: { path: 'companyId' }
      });
    
    if (!application) {
      console.log(`Application not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Vérifier les autorisations 
    const isOwner = application.userId._id.toString() === req.user.id;
    const isHR = req.user.role && req.user.role.toString().toUpperCase() === 'HR';
    
    console.log(`Access check for user ${req.user.id}: isOwner=${isOwner}, isHR=${isHR}`);
    
    if (!isOwner && !isHR) {
      console.log('Access denied: Not owner or HR');
      return res.status(403).json({ message: 'Unauthorized to view this application' });
    }
    
    console.log('Application found and access granted');
    res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new route for direct PDF extraction
router.get("/extract-pdf/:id", verifyToken, async (req, res) => {
  try {
    console.log(`Direct PDF extraction requested for application ID: ${req.params.id}`);
    
    // Check if user is HR (case-insensitive)
    if (!req.user.role || req.user.role.toString().toUpperCase() !== 'HR') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Only HR users can perform PDF extraction' 
      });
    }
    
    // Get the application with resume info
    const application = await Application.findById(req.params.id)
      .populate('userId', 'firstName lastName email');
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }
    
    // Check if resume info exists
    if (!application.resume || !application.resume.path) {
      return res.status(404).json({ 
        success: false, 
        message: 'No resume file found for this application' 
      });
    }
    
    // Get the full path to the resume file
    const resumePath = path.join(__dirname, '..', application.resume.path);
    
    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found on server' 
      });
    }

    // Call the enhanced PDF extraction function from the controller
    const extractResult = await applicationController.enhancedPdfToText(resumePath);
    
    if (!extractResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to extract text from PDF',
        error: extractResult.error
      });
    }
    
    // Extract text from the PDF
    const extractedText = extractResult.text;
    console.log(`Extracted ${extractedText.length} characters from PDF`);
    
    // Perform analysis on the extracted text
    const analysisResult = applicationController.enhancedResumeAnalysis(extractedText);
    
    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze extracted text',
        error: analysisResult.error
      });
    }
    
    // Compare with job if jobId exists
    let jobMatchAnalysis = null;
    if (application.jobId) {
      try {
        const jobMatchResult = await applicationController.compareResumeWithJob(extractedText, application.jobId);
        if (jobMatchResult.success) {
          jobMatchAnalysis = jobMatchResult.matchAnalysis;
        }
      } catch (jobMatchError) {
        console.error('Error comparing with job:', jobMatchError);
      }
    }
    
    // Return the extracted text and analysis
    res.status(200).json({
      success: true,
      applicationId: req.params.id,
      candidateName: application.userId ? `${application.userId.firstName} ${application.userId.lastName}` : "Candidate",
      extractedText: extractedText,
      skills: analysisResult.skills,
      education: analysisResult.education,
      languages: analysisResult.languages,
      experienceYears: analysisResult.experienceYears,
      possibleJobTitles: analysisResult.possibleJobTitles,
      matchScore: analysisResult.matchScore,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      jobMatch: jobMatchAnalysis
    });
    
  } catch (error) {
    console.error('Error in PDF extraction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to extract PDF text', 
      error: error.message 
    });
  }
});

// Add a route to save extracted data
router.put("/:id/extracted-data", verifyToken, async (req, res) => {
  try {
    console.log(`Saving extracted data for application: ${req.params.id}`);
    
    // Check if user is HR
    if (!req.user.role || req.user.role.toString().toUpperCase() !== 'HR') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Only HR users can update application data' 
      });
    }
    
    const { extractedData } = req.body;
    
    if (!extractedData) {
      return res.status(400).json({
        success: false,
        message: 'No extracted data provided'
      });
    }
    
    // Find and update the application
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update the extractedData field
    await Application.findByIdAndUpdate(req.params.id, {
      extractedData: {
        ...extractedData,
        lastAnalyzed: new Date()
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Extracted data saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving extracted data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save extracted data',
      error: error.message
    });
  }
});

// Route pour extraire uniquement le texte du PDF sans analyse
router.get("/extract-pdf-text/:id", verifyToken, async (req, res) => {
  try {
    console.log(`PDF text extraction requested for application ID: ${req.params.id}`);
    
    // Check if user is HR (case-insensitive)
    if (!req.user.role || req.user.role.toString().toUpperCase() !== 'HR') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Only HR users can extract PDF text' 
      });
    }
    
    // Get the application with resume info
    const application = await Application.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('jobId', 'title description requirements');
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }
    
    // Check if resume info exists
    if (!application.resume || !application.resume.path) {
      return res.status(404).json({ 
        success: false, 
        message: 'No resume file found for this application' 
      });
    }
    
    // Get the full path to the resume file
    const resumePath = path.join(__dirname, '..', application.resume.path);
    
    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found on server' 
      });
    }

    // Call the enhanced PDF extraction function from the controller
    const extractResult = await applicationController.enhancedPdfToText(resumePath);
    
    if (!extractResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to extract text from PDF',
        error: extractResult.error
      });
    }
    
    // Return only the extracted text
    res.status(200).json({
      success: true,
      applicationId: req.params.id,
      candidateName: application.userId ? `${application.userId.firstName} ${application.userId.lastName}` : "Candidate",
      jobTitle: application.jobId ? application.jobId.title : "",
      jobDescription: application.jobId ? application.jobId.description : "",
      extractedText: extractResult.text
    });
    
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to extract PDF text', 
      error: error.message 
    });
  }
});

// Route pour analyser le texte extrait
router.post("/analyze-text/:id", verifyToken, async (req, res) => {
  try {
    console.log(`Text analysis requested for application ID: ${req.params.id}`);
    
    // Check if user is HR (case-insensitive)
    if (!req.user.role || req.user.role.toString().toUpperCase() !== 'HR') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Only HR users can analyze application data' 
      });
    }
    
    const { extractedText, jobDescription } = req.body;
    
    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: 'No text provided for analysis'
      });
    }
    
    // Get the application
    const application = await Application.findById(req.params.id)
      .populate('jobId');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Perform analysis on the extracted text
    const analysisResult = applicationController.enhancedResumeAnalysis(extractedText);
    
    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze text',
        error: analysisResult.error
      });
    }
    
    // Compare with job if jobId exists
    let jobMatchAnalysis = null;
    if (application.jobId) {
      try {
        // Use job description from request body if available
        if (jobDescription) {
          // Create an object with the structure expected by compareResumeWithTextJob
          const jobObject = {
            _id: application.jobId._id || 'unknown',
            title: application.jobId.title || '',
            description: jobDescription,
            requirements: application.jobId.requirements || '',
            skills: application.jobId.skills || []
          };
          
          const jobMatchResult = await applicationController.compareResumeWithTextJob(extractedText, jobObject);
          if (jobMatchResult.success) {
            jobMatchAnalysis = jobMatchResult.matchAnalysis;
          }
        } else {
          const jobMatchResult = await applicationController.compareResumeWithJob(extractedText, application.jobId);
          if (jobMatchResult.success) {
            jobMatchAnalysis = jobMatchResult.matchAnalysis;
          }
        }
      } catch (jobMatchError) {
        console.error('Error comparing with job:', jobMatchError);
      }
    }
    
    // Create recommendations
    let recommendations = "";
    if (jobMatchAnalysis && jobMatchAnalysis.recommendations) {
      recommendations = jobMatchAnalysis.recommendations.join(" ");
    }
    
    // Save the analysis results
    await Application.findByIdAndUpdate(req.params.id, {
      extractedData: {
        extractedText: extractedText,
        skills: analysisResult.skills,
        education: analysisResult.education,
        languages: analysisResult.languages,
        experienceYears: analysisResult.experienceYears,
        possibleJobTitles: analysisResult.possibleJobTitles,
        matchScore: jobMatchAnalysis ? jobMatchAnalysis.overallMatchScore : analysisResult.matchScore,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        lastAnalyzed: new Date()
      }
    });
    
    // Return the analysis results
    res.status(200).json({
      success: true,
      applicationId: req.params.id,
      skills: analysisResult.skills,
      education: analysisResult.education,
      languages: analysisResult.languages,
      experienceYears: analysisResult.experienceYears,
      possibleJobTitles: analysisResult.possibleJobTitles,
      matchScore: jobMatchAnalysis ? jobMatchAnalysis.overallMatchScore : analysisResult.matchScore,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      recommendations: recommendations,
      jobMatch: jobMatchAnalysis
    });
    
  } catch (error) {
    console.error('Error in text analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze text',
      error: error.message
    });
  }
});

module.exports = router;
