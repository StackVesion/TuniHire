const Company = require("../models/Company");
const User = require("../models/User");

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ companies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    res.status(200).json({ company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get company by user ID (my company)
exports.getMyCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findOne({ createdBy: userId })
      .populate('createdBy', 'firstName lastName email');
    
    if (!company) {
      return res.status(404).json({ message: "You don't have a company yet" });
    }
    
    res.status(200).json({ company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new company
exports.createCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has a company
    const existingCompany = await Company.findOne({ createdBy: userId });
    if (existingCompany) {
      return res.status(400).json({ 
        message: "You already have a company registered. Its status is " + existingCompany.status 
      });
    }
    
    // Create new company
    const { name, email, website, category, numberOfEmployees, projects } = req.body;
    
    const company = new Company({
      name,
      email,
      website,
      category,
      numberOfEmployees,
      projects,
      createdBy: userId,
      status: "Pending"
    });
    
    await company.save();
    
    res.status(201).json({ 
      message: "Company created successfully and pending approval", 
      company 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.params.id;
    
    // Find the company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    // Check if user is the owner or admin
    if (company.createdBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this company" });
    }
    
    // Update company
    const { name, email, website, category, numberOfEmployees, projects } = req.body;
    
    company.name = name || company.name;
    company.email = email || company.email;
    company.website = website || company.website;
    company.category = category || company.category;
    company.numberOfEmployees = numberOfEmployees || company.numberOfEmployees;
    company.projects = projects || company.projects;
    company.updatedAt = Date.now();
    
    await company.save();
    
    res.status(200).json({ 
      message: "Company updated successfully", 
      company 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete company
exports.deleteCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.params.id;
    
    // Find the company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    // Check if user is the owner or admin
    if (company.createdBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this company" });
    }
    
    await Company.findByIdAndDelete(companyId);
    
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve company
exports.approveCompany = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to approve companies" });
    }
    
    const companyId = req.params.id;
    
    // Find the company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    company.status = "Approved";
    company.updatedAt = Date.now();
    
    await company.save();
    
    res.status(200).json({ 
      message: "Company approved successfully", 
      company 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending companies
exports.getPendingCompanies = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to view pending companies" });
    }
    
    const companies = await Company.find({ status: "Pending" })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ companies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
