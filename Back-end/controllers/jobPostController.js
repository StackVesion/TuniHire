const JobPost = require('../models/JobPost');

// Get all job posts
exports.getAllJobPosts = async (req, res) => {
  try {
    const jobPosts = await JobPost.find().populate('companyId');
    res.status(200).json(jobPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get job post by ID
exports.getJobPostById = async (req, res) => {
  try {
    const jobPost = await JobPost.findById(req.params.id).populate('companyId');
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    res.status(200).json(jobPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new job post
exports.createJobPost = async (req, res) => {
  try {
    const newJobPost = new JobPost(req.body);
    const savedJobPost = await newJobPost.save();
    res.status(201).json(savedJobPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update job post
exports.updateJobPost = async (req, res) => {
  try {
    const updatedJobPost = await JobPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    res.status(200).json(updatedJobPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete job post
exports.deleteJobPost = async (req, res) => {
  try {
    const deletedJobPost = await JobPost.findByIdAndDelete(req.params.id);
    if (!deletedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    res.status(200).json({ message: 'Job post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get job posts by company
exports.getJobPostsByCompany = async (req, res) => {
  try {
    const jobPosts = await JobPost.find({ companyId: req.params.companyId }).populate('companyId');
    res.status(200).json(jobPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
