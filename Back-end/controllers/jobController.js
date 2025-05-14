const Job = require('../models/JobPost');
const Application = require('../models/Application');
const User = require('../models/User');

// Get all job applications for a specific job post and extract candidate information
exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find all applications for this job
    const applications = await Application.find({ jobId }).populate('userId', 'firstName lastName email profilePicture');
    
    // Extract candidate information
    const candidates = applications.map(app => app.userId);
    
    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
