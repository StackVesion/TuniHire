const Company = require("../models/Company");
const User = require("../models/User");
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    // Only get approved companies for the public-facing listing
    let query = { status: { $in: ["Approved", "Pending"] } };
    
    // Admin can see all companies if requested
    if (req.query.all === 'true') {
      query = {};
    }
    
    // Apply filters from query parameters
    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' }; // Case-insensitive search
    }
    
    if (req.query.category) {
      query.category = { $regex: req.query.category, $options: 'i' };
    }
    
    if (req.query.keyword) {
      // Search in company name or description
      const keywordRegex = { $regex: req.query.keyword, $options: 'i' };
      query.$or = [
        { name: keywordRegex },
        { description: keywordRegex }
      ];
    }
    
    // Determine sort order
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'oldest':
          sortOptions = { createdAt: 1 };
          break;
        case 'rating':
          sortOptions = { rating: -1 };
          break;
        // Default is already set (newest)
      }
    }
    
    const companies = await Company.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sortOptions);
    
    // For each company, get job count
    const companiesWithJobCount = await Promise.all(companies.map(async (company) => {
      // We'll need a Job model to count jobs, assuming it exists
      // const jobCount = await Job.countDocuments({ company: company._id });
      
      // For now, return a placeholder
      const companyObj = company.toObject();
      companyObj.jobCount = 0; // Replace with actual job count when Job model is implemented
      
      return companyObj;
    }));
    
    res.status(200).json({ 
      success: true,
      count: companiesWithJobCount.length, 
      companies: companiesWithJobCount 
    });
  } catch (error) {
    console.error("Error in getAllCompanies:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching companies", 
      error: error.message 
    });
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
    // Log request details for debugging
    console.log('-------- getMyCompany API Call --------');
    console.log('req.user:', req.user);
    console.log('req.userId:', req.userId);
    
    // Get the user ID from the request in a flexible way
    let userId;
    
    if (req.user && (req.user.id || req.user._id)) {
      // If req.user exists, prefer id or _id from it
      userId = req.user.id || req.user._id;
      console.log('Using ID from req.user:', userId);
    } else if (req.userId) {
      // Fall back to req.userId if set directly
      userId = req.userId;
      console.log('Using req.userId:', userId);
    } else {
      console.error('Authentication error: No valid user ID available');
      return res.status(400).json({ 
        success: false,
        message: "Invalid user information. Please login again." 
      });
    }
    
    console.log('Looking for company with createdBy:', userId);
    
    // Find company where the authenticated user is the creator
    const company = await Company.findOne({ createdBy: userId })
      .populate('createdBy', 'firstName lastName email');
    
    if (!company) {
      console.log(`No company found for user ID: ${userId}`);
      return res.status(404).json({ 
        success: false,
        message: "You don't have a company yet" 
      });
    }
    
    console.log(`Company found for user ID ${userId}:`, company.name);
    console.log('Company details:', {
      id: company._id,
      name: company.name,
      email: company.email,
      status: company.status
    });
    
    // Return success with the company data
    res.status(200).json({ 
      success: true,
      company 
    });
  } catch (error) {
    console.error("Error in getMyCompany:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve company data",
      error: error.message 
    });
  }
};

// Create new company
exports.createCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has a company
    const existingCompany = await Company.findOne({ createdBy: userId });
    if (existingCompany) {
      // If there's a file uploaded but we're rejecting the request, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: "You already have a company registered. Its status is " + existingCompany.status 
      });
    }
    
    // Create new company
    const { name, email, website, category, numberOfEmployees } = req.body;
    
    // Handle projects which come as JSON string from FormData
    let projects = [];
    if (req.body.projects) {
      try {
        projects = JSON.parse(req.body.projects);
      } catch (e) {
        console.error('Error parsing projects:', e);
        // If parsing fails, try to handle as comma-separated string
        if (typeof req.body.projects === 'string') {
          projects = req.body.projects.split(',').map(p => p.trim()).filter(Boolean);
        }
      }
    }

    // Create the company object
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
    
    // Handle logo file if uploaded
    if (req.file) {
      // Generate URL for the uploaded file
      const baseUrl = process.env.BASE_URL || 'http://localhost:5050';
      const relativePath = req.file.path.replace(/\\/g, '/').split('/uploads/')[1];
      company.logo = `${baseUrl}/uploads/${relativePath}`;
    }
    
    await company.save();
    
    res.status(201).json({ 
      message: "Company created successfully and pending approval", 
      company 
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating company:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const userId = req.user.id;
    
    // Find the company
    const company = await Company.findById(companyId);
    
    // Check if company exists
    if (!company) {
      // Delete uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Company not found" });
    }
    
    // Check if user is the company owner
    if (company.createdBy.toString() !== userId && req.user.role !== "admin") {
      // Delete uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: "You are not authorized to update this company" });
    }

    // Get update data
    const { name, email, website, category, numberOfEmployees } = req.body;
    
    // Handle projects which come as JSON string from FormData
    let projects = company.projects; // Keep existing projects by default
    if (req.body.projects) {
      try {
        projects = JSON.parse(req.body.projects);
      } catch (e) {
        console.error('Error parsing projects:', e);
        // If parsing fails, try to handle as comma-separated string
        if (typeof req.body.projects === 'string') {
          projects = req.body.projects.split(',').map(p => p.trim()).filter(Boolean);
        }
      }
    }
    
    // Update company fields
    company.name = name || company.name;
    company.email = email || company.email;
    company.website = website || company.website;
    company.category = category || company.category;
    company.numberOfEmployees = numberOfEmployees || company.numberOfEmployees;
    company.projects = projects;
    company.updatedAt = Date.now();
    
    // Handle logo file if uploaded
    if (req.file) {
      // Delete old logo file if exists
      if (company.logo) {
        const oldLogoPath = company.logo.split('/uploads/')[1];
        if (oldLogoPath) {
          const fullPath = path.join(__dirname, '../uploads', oldLogoPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      }
      
      // Generate URL for the new uploaded file
      const baseUrl = process.env.BASE_URL || 'http://localhost:5050';
      const relativePath = req.file.path.replace(/\\/g, '/').split('/uploads/')[1];
      company.logo = `${baseUrl}/uploads/${relativePath}`;
    }
    
    await company.save();
    
    res.json({
      message: "Company updated successfully",
      company
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error updating company:', error);
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

// Reject company
exports.rejectCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    
    // Check if the company exists
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    // Instead of updating the status, delete the company entirely
    await Company.findByIdAndDelete(companyId);
    
    console.log("Company successfully deleted:", companyId);
    
    res.status(200).json({ 
      success: true,
      message: "Company rejected and deleted successfully"
    });
  } catch (error) {
    console.error("Error rejecting company:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
  }
};

// Get HR contact information for a company
exports.getHRContactInfo = async (req, res) => {
  try {
    const companyId = req.params.id;
    console.log('Fetching HR contact for company ID:', companyId);
    
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid company ID format" });
    }
    
    // Find the company
    const company = await Company.findById(companyId)
      .populate('createdBy', 'firstName lastName email profilePicture');
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    console.log('Company found:', company.name);
    
    // Format the HR contact information
    const hrContactInfo = {
      companyName: company.name,
      companyLogo: company.logo,
      hrManager: {
        name: `${company.createdBy?.firstName || 'HR'} ${company.createdBy?.lastName || 'Manager'}`,
        email: company.createdBy?.email || company.email || 'hr@company.com',
        profilePicture: company.createdBy?.profilePicture || '/assets/imgs/page/dashboard/avatar.png',
        department: "Human Resources",
        phone: company.phone || "+1 (555) 123-4567"  // Default or company phone if available
      },
      companyWebsite: company.website,
      companyEmail: company.email,
      numberOfEmployees: company.numberOfEmployees
    };
    
    res.status(200).json({ hrContactInfo });
  } catch (error) {
    console.error('Error fetching HR contact info:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add the getAnalytics method to the exports
exports.getAnalytics = async (req, res) => {
  try {
    // Get company statistics
    const totalCompanies = await Company.countDocuments();
    const pendingCompanies = await Company.countDocuments({ status: 'pending' });
    const approvedCompanies = await Company.countDocuments({ status: 'approved' });
    const rejectedCompanies = await Company.countDocuments({ status: 'rejected' });
    
    // Get most recent companies
    const recentCompanies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name logo industry location status createdAt');
    
    // Get companies by industry (for charts)
    const companiesByIndustry = await Company.aggregate([
      { $group: { _id: "$industry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get companies by location (for geographic visualization)
    const companiesByLocation = await Company.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Monthly growth data (for trend analysis)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyGrowth = await Company.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCompanies,
          pendingCompanies,
          approvedCompanies,
          rejectedCompanies,
          approvalRate: totalCompanies > 0 ? (approvedCompanies / totalCompanies * 100).toFixed(1) : 0
        },
        recentCompanies,
        companiesByIndustry,
        companiesByLocation,
        monthlyGrowth
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics data",
      error: error.message
    });
  }
};

module.exports = exports;
