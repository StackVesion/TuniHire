const JobPost = require('../models/JobPost');
const mongoose = require('mongoose');

// Get all job posts
exports.getAllJobPosts = async (req, res) => {
  try {
    console.log("Starting getAllJobPosts");
    
    // Use populate to include company information
    let jobPosts = await JobPost.find()
      .populate('companyId', 'name email website category numberOfEmployees status')
      .lean();
    
    console.log(`Found ${jobPosts?.length || 0} jobs initially`);

    // Renvoyer les emplois
    console.log(`Returning ${jobPosts.length} jobs`);
    return res.status(200).json(jobPosts);
  } catch (error) {
    console.error("Error in getAllJobPosts:", error);
    return res.status(500).json({ error: error.message });
  }
};
// Get job post by ID
exports.getJobPostById = async (req, res) => {
  try {
    console.log(`Getting job with ID: ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    // Use populate to include company information
    const jobPost = await JobPost.findById(req.params.id)
      .populate('companyId', 'name email website category numberOfEmployees projects status createdAt');
    
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    console.log(`Found job: ${jobPost.title}`);
    res.status(200).json(jobPost);
  } catch (error) {
    console.error(`Error getting job by ID: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Create new job post
exports.createJobPost = async (req, res) => {
  try {
    console.log("Creating new job post with data:", req.body);
    const newJobPost = new JobPost(req.body);
    const savedJobPost = await newJobPost.save();
    console.log(`Created new job post: ${savedJobPost.title} with ID: ${savedJobPost._id}`);
    res.status(201).json(savedJobPost);
  } catch (error) {
    console.error(`Error creating job post: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Update job post
exports.updateJobPost = async (req, res) => {
  try {
    console.log(`Updating job post with ID: ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const updatedJobPost = await JobPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    console.log(`Updated job post: ${updatedJobPost.title}`);
    res.status(200).json(updatedJobPost);
  } catch (error) {
    console.error(`Error updating job post: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Delete job post
exports.deleteJobPost = async (req, res) => {
  try {
    console.log(`Deleting job post with ID: ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const deletedJobPost = await JobPost.findByIdAndDelete(req.params.id);
    
    if (!deletedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    console.log(`Deleted job post: ${deletedJobPost.title}`);
    res.status(200).json({ message: 'Job post deleted successfully' });
  } catch (error) {
    console.error(`Error deleting job post: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get job posts by company
exports.getJobPostsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`Getting jobs for company ID: ${companyId}`);
    
    if (!companyId || companyId === 'undefined') {
      console.error("Invalid company ID received:", companyId);
      return res.status(400).json({ 
        message: 'Invalid company ID format',
        receivedId: companyId
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      console.error("Non-MongoDB ObjectID format received:", companyId);
      return res.status(400).json({ 
        message: 'Invalid company ID format',
        receivedId: companyId
      });
    }
    
    // First verify if the company exists
    const Company = require('../models/Company');
    const companyExists = await Company.findById(companyId);
    
    if (!companyExists) {
      console.error(`Company with ID ${companyId} not found in database`);
      return res.status(404).json({ 
        message: 'Company not found',
        requestedId: companyId 
      });
    }
    
    console.log(`Found company: ${companyExists.name}, proceeding to find jobs`);
    
    // Use populate to include company information
    const jobPosts = await JobPost.find({ 
      companyId: companyId
    })
    .populate('companyId', 'name email website category numberOfEmployees status')
    .sort({ createdAt: -1 });
    
    console.log(`Found ${jobPosts.length} jobs for company ${companyExists.name}`);
    
    // Return the jobs with company info in response
    return res.status(200).json(jobPosts);
  } catch (error) {
    console.error(`Error getting jobs by company: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

// Get company information by job post ID
exports.getCompanyByJobPost = async (req, res) => {
  try {
    console.log(`Getting company for job post ID: ${req.params.jobId}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    // First, find the job post to get its companyId
    const jobPost = await JobPost.findById(req.params.jobId);
    
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    if (!jobPost.companyId) {
      return res.status(404).json({ message: 'No company associated with this job post' });
    }
    
    // Now fetch the company information using the companyId from the job post
    const Company = require('../models/Company');
    const company = await Company.findById(jobPost.companyId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    console.log(`Found company: ${company.name} for job: ${jobPost.title}`);
    res.status(200).json(company);
  } catch (error) {
    console.error(`Error getting company by job post: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get jobs by location
exports.getJobsByLocation = async (req, res) => {
  try {
    console.log("Getting jobs grouped by location");
    
    const locationStats = await JobPost.aggregate([
      {
        $match: { location: { $exists: true, $ne: "" } }
      },
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
          jobs: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          location: "$_id",
          count: 1,
          jobSample: { $slice: ["$jobs", 3] } // Just include a sample of jobs for preview
        }
      },
      {
        $sort: { count: -1 } // Sort by most jobs first
      },
      {
        $limit: 6 // Limit to 6 locations for the display
      }
    ]);

    // Count companies per location - with safer handling of companyId
    for (const locationStat of locationStats) {
      // Safety check to ensure jobSample exists and is an array
      if (!locationStat.jobSample || !Array.isArray(locationStat.jobSample)) {
        locationStat.companiesCount = 0;
        continue;
      }
      
      // Filter out any jobs without valid companyId before mapping
      const companyIds = [...new Set(
        locationStat.jobSample
          .filter(job => job.companyId) // Filter out null/undefined companyIds
          .map(job => job.companyId.toString ? job.companyId.toString() : String(job.companyId))
      )];
      
      locationStat.companiesCount = companyIds.length;
    }
    
    console.log(`Found ${locationStats.length} locations with jobs`);
    res.status(200).json(locationStats);
  } catch (error) {
    console.error(`Error getting jobs by location: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};