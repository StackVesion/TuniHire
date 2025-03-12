const Application = require('../models/Application');

// Get all applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('userId')
      .populate('jobId');
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('userId')
      .populate('jobId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new application
exports.createApplication = async (req, res) => {
  try {
    const newApplication = new Application(req.body);
    const savedApplication = await newApplication.save();
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Pending', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }
    
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.status(200).json(updatedApplication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const deletedApplication = await Application.findByIdAndDelete(req.params.id);
    if (!deletedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get applications by user
exports.getApplicationsByUser = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.params.userId })
      .populate('jobId');
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get applications by job
exports.getApplicationsByJob = async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('userId');
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
