const express = require('express');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { 
  getAllPortfolios,
  getPortfolioById,
  getPortfolioByUserId,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addCertificateToPortfolio,
  removeCertificateFromPortfolio
} = require('../controllers/portfolioController');
const { verifyToken } = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const { generateCV } = require('../utils/pdfGenerator');

const router = express.Router();

// Public routes
router.get('/', getAllPortfolios);
router.get('/:id', getPortfolioById);
router.get('/user/:userId', getPortfolioByUserId);

// Protected routes - require authentication
router.post('/', verifyToken, createPortfolio);
router.put('/:id', verifyToken, updatePortfolio);
router.delete('/:id', verifyToken, deletePortfolio);

// Certificate management routes
router.post('/certificates', async (req, res) => {
    try {
        const { userId, certificate } = req.body;
        
        // Validate required fields
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        
        if (!certificate || !certificate.title) {
            return res.status(400).json({ success: false, message: 'Certificate title is required' });
        }
        
        // Find the portfolio by userId
        const portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({ success: false, message: 'Portfolio not found' });
        }
        
        // Add the certificate to the portfolio
        portfolio.certificates = portfolio.certificates || [];
        portfolio.certificates.push(certificate);
        portfolio.updatedAt = Date.now();
        
        await portfolio.save();
        
        res.status(200).json({ success: true, message: 'Certificate added successfully', certificate });
    } catch (error) {
        console.error('Error adding certificate:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/certificates/:index', async (req, res) => {
    try {
        const { userId, certificate } = req.body;
        const { index } = req.params;
        
        // Validate required fields
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        
        if (!certificate || !certificate.title) {
            return res.status(400).json({ success: false, message: 'Certificate title is required' });
        }
        
        // Find the portfolio by userId
        const portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({ success: false, message: 'Portfolio not found' });
        }
        
        // Make sure certificates array exists and index is valid
        if (!portfolio.certificates || !portfolio.certificates[index]) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }
        
        // Update the certificate at the specified index
        portfolio.certificates[index] = certificate;
        portfolio.updatedAt = Date.now();
        
        await portfolio.save();
        
        res.status(200).json({ success: true, message: 'Certificate updated successfully', certificate });
    } catch (error) {
        console.error('Error updating certificate:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/certificates/:index', async (req, res) => {
    try {
        const { userId } = req.body;
        const { index } = req.params;
        
        // Validate required fields
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        
        // Find the portfolio by userId
        const portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({ success: false, message: 'Portfolio not found' });
        }
        
        // Make sure certificates array exists and index is valid
        if (!portfolio.certificates || !portfolio.certificates[index]) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }
        
        // Remove the certificate at the specified index
        portfolio.certificates.splice(index, 1);
        portfolio.updatedAt = Date.now();
        
        await portfolio.save();
        
        res.status(200).json({ success: true, message: 'Certificate removed successfully' });
    } catch (error) {
        console.error('Error removing certificate:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/:portfolioId/certificates', verifyToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    const newCertificate = req.body;
    portfolio.certificates = portfolio.certificates || [];
    portfolio.certificates.push(newCertificate);
    const updatedPortfolio = await portfolio.save();
    
    res.status(201).json({
      success: true,
      certificate: portfolio.certificates[portfolio.certificates.length - 1],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    console.error('Error adding certificate:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.put('/:portfolioId/certificates/:index', verifyToken, async (req, res) => {
  try {
    const { index } = req.params;
    const updatedCertificate = req.body;
    
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (!portfolio.certificates || index >= portfolio.certificates.length || index < 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    portfolio.certificates[index] = updatedCertificate;
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      certificate: updatedPortfolio.certificates[index],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/:portfolioId/certificates/:index', verifyToken, async (req, res) => {
  try {
    const { index } = req.params;
    
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (!portfolio.certificates || index >= portfolio.certificates.length || index < 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    portfolio.certificates.splice(index, 1);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Certificate removed successfully',
      portfolio: updatedPortfolio
    });
  } catch (error) {
    console.error('Error removing certificate:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/:portfolioId/certificates/:certificateId', verifyToken, addCertificateToPortfolio);
router.delete('/:portfolioId/certificates/:certificateId', verifyToken, removeCertificateFromPortfolio);

// Special route for updating portfolio CV
router.put('/update-cv/:id', verifyToken, async (req, res) => {
  try {
    // Extract CV file data from request
    const { cvFile } = req.body;
    
    if (!cvFile) {
      return res.status(400).json({ message: 'CV file data is required' });
    }
    
    // Find the portfolio and update only the CV file
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { cvFile: cvFile },
      { new: true, runValidators: true }
    );
    
    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      portfolio: updatedPortfolio 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Special routes for updating specific sections of the portfolio
router.put('/:id/about', verifyToken, async (req, res) => {
  try {
    const { about } = req.body;
    
    // Find the portfolio and update only the about section
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { about: about },
      { new: true, runValidators: true }
    );
    
    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      portfolio: updatedPortfolio 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update social links
router.put('/:id/social-links', verifyToken, async (req, res) => {
  try {
    const { socialLinks } = req.body;
    
    // Find the portfolio and update only the social links
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { socialLinks: socialLinks },
      { new: true, runValidators: true }
    );
    
    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      portfolio: updatedPortfolio 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add, update, delete projects
router.post('/:id/projects', verifyToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    const newProject = req.body;
    portfolio.projects.push(newProject);
    const updatedPortfolio = await portfolio.save();
    
    res.status(201).json({
      success: true,
      project: portfolio.projects[portfolio.projects.length - 1],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.put('/:id/projects/:projectIndex', verifyToken, async (req, res) => {
  try {
    const { projectIndex } = req.params;
    const updatedProject = req.body;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (projectIndex >= portfolio.projects.length || projectIndex < 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    portfolio.projects[projectIndex] = updatedProject;
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      project: updatedPortfolio.projects[projectIndex],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/:id/projects/:projectIndex', verifyToken, async (req, res) => {
  try {
    const { projectIndex } = req.params;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (projectIndex >= portfolio.projects.length || projectIndex < 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Remove the project at the specified index
    portfolio.projects.splice(projectIndex, 1);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Project removed successfully',
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate CV endpoint 
router.post('/generate-cv', verifyToken, async (req, res) => {
  try {
    const { 
      userId,
      personalInfo,
      education,
      experience,
      skills,
      certificates,
      projects
    } = req.body;

    // Find user's portfolio
    const portfolio = await Portfolio.findOne({ userId: userId });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const cvFileName = `cv_${userId}_${timestamp}.pdf`;
    
    // Create paths for public and static access
    const uploadsDir = path.resolve(__dirname, '../public/uploads/resumes');
    const cvFilePath = path.join(uploadsDir, cvFileName);
    
    // Create a relative path for accessing from the web
    const relativePath = `/uploads/resumes/${cvFileName}`;
    const downloadUrl = `http://localhost:5000${relativePath}`;
    
    console.log(`CV will be generated at: ${cvFilePath}`);
    console.log(`CV will be accessible at: ${downloadUrl}`);
    
    // Make sure the directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log(`Creating uploads directory: ${uploadsDir}`);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Prepare data for CV generation
    const cvData = {
      personalInfo,
      education,
      experience,
      skills,
      certificates,
      projects,
      portfolio
    };

    // Generate CV using the new utility
    await generateCV(cvData, cvFilePath);

    // Verify the PDF file was created successfully
    if (!fs.existsSync(cvFilePath)) {
      throw new Error('PDF file was not created');
    }
    
    const fileStats = fs.statSync(cvFilePath);
    if (fileStats.size === 0) {
      throw new Error('PDF file is empty');
    }
    
    console.log(`PDF generated successfully: ${cvFilePath} (${fileStats.size} bytes)`);
    
    // Update portfolio with CV file information
    portfolio.cvFile = {
      filename: cvFileName,
      path: relativePath,
      downloadUrl: downloadUrl,
      uploadDate: new Date(),
      fileType: 'application/pdf'
    };

    await portfolio.save();

    // Return success response with file information
    return res.json({
      success: true,
      message: 'CV generated successfully',
      cvFileName: cvFileName,
      cvPath: relativePath,
      downloadUrl: downloadUrl,
      portfolio
    });

  } catch (error) {
    console.error('Error generating CV:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to generate CV', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Skills management with userId parameter
router.post('/skills', verifyToken, async (req, res) => {
  try {
    const { userId, skill } = req.body;
    
    if (!userId || !skill) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both userId and skill are required' 
      });
    }
    
    // Find portfolio by userId
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Add skill if it doesn't already exist
    if (!portfolio.skills.includes(skill)) {
      portfolio.skills.push(skill);
    }
    
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Skill added successfully',
      skills: updatedPortfolio.skills
    });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skill',
      error: error.message
    });
  }
});

router.delete('/skills', verifyToken, async (req, res) => {
  try {
    const { userId, skill } = req.body;
    
    if (!userId || !skill) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both userId and skill are required' 
      });
    }
    
    // Find portfolio by userId
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Remove the skill
    portfolio.skills = portfolio.skills.filter(s => s !== skill);
    
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Skill removed successfully',
      skills: updatedPortfolio.skills
    });
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove skill',
      error: error.message
    });
  }
});

// Update about section with userId parameter
router.patch('/about', verifyToken, async (req, res) => {
  try {
    const { userId, about } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Find portfolio by userId
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Update about section
    portfolio.about = about;
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'About section updated successfully',
      about: updatedPortfolio.about
    });
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update about section',
      error: error.message
    });
  }
});

// Projects management with userId parameter
router.post('/projects', verifyToken, async (req, res) => {
  try {
    const { userId, project } = req.body;
    
    if (!userId || !project) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both userId and project details are required' 
      });
    }
    
    // Find portfolio by userId
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Add the project
    portfolio.projects.push(project);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Project added successfully',
      project: updatedPortfolio.projects[updatedPortfolio.projects.length - 1]
    });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add project',
      error: error.message
    });
  }
});

router.put('/projects/:index', verifyToken, async (req, res) => {
  try {
    const { userId, project } = req.body;
    const { index } = req.params;
    
    if (!userId || !project) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both userId and project details are required' 
      });
    }
    
    // Find portfolio by userId
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Check if project index exists
    if (index < 0 || index >= portfolio.projects.length) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Update the project
    portfolio.projects[index] = project;
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedPortfolio.projects[index]
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

router.delete('/projects/:index', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const { index } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Find portfolio by userId
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Check if project index exists
    if (index < 0 || index >= portfolio.projects.length) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Remove the project
    portfolio.projects.splice(index, 1);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

// Education endpoints
router.post('/:id/education', verifyToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    const newEducation = req.body;
    portfolio.education.push(newEducation);
    const updatedPortfolio = await portfolio.save();
    
    res.status(201).json({
      success: true,
      education: portfolio.education[portfolio.education.length - 1],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.put('/:id/education/:educationIndex', verifyToken, async (req, res) => {
  try {
    const { educationIndex } = req.params;
    const updatedEducation = req.body;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (educationIndex >= portfolio.education.length || educationIndex < 0) {
      return res.status(404).json({ message: 'Education entry not found' });
    }
    
    portfolio.education[educationIndex] = updatedEducation;
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      education: updatedPortfolio.education[educationIndex],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/:id/education/:educationIndex', verifyToken, async (req, res) => {
  try {
    const { educationIndex } = req.params;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (educationIndex >= portfolio.education.length || educationIndex < 0) {
      return res.status(404).json({ message: 'Education entry not found' });
    }
    
    portfolio.education.splice(educationIndex, 1);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Education entry removed successfully',
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Experience endpoints
router.post('/:id/experience', verifyToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    const newExperience = req.body;
    portfolio.experience.push(newExperience);
    const updatedPortfolio = await portfolio.save();
    
    res.status(201).json({
      success: true,
      experience: portfolio.experience[portfolio.experience.length - 1],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.put('/:id/experience/:experienceIndex', verifyToken, async (req, res) => {
  try {
    const { experienceIndex } = req.params;
    const updatedExperience = req.body;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (experienceIndex >= portfolio.experience.length || experienceIndex < 0) {
      return res.status(404).json({ message: 'Experience entry not found' });
    }
    
    portfolio.experience[experienceIndex] = updatedExperience;
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      experience: updatedPortfolio.experience[experienceIndex],
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/:id/experience/:experienceIndex', verifyToken, async (req, res) => {
  try {
    const { experienceIndex } = req.params;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (experienceIndex >= portfolio.experience.length || experienceIndex < 0) {
      return res.status(404).json({ message: 'Experience entry not found' });
    }
    
    portfolio.experience.splice(experienceIndex, 1);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Experience entry removed successfully',
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Skills endpoints
router.post('/:id/skills', verifyToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    const skill = req.body.skill;
    
    if (!skill || typeof skill !== 'string') {
      return res.status(400).json({ message: 'Valid skill string is required' });
    }
    
    // Avoid duplicate skills
    if (!portfolio.skills.includes(skill)) {
      portfolio.skills.push(skill);
    }
    
    const updatedPortfolio = await portfolio.save();
    
    res.status(201).json({
      success: true,
      skills: updatedPortfolio.skills,
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/:id/skills/:skill', verifyToken, async (req, res) => {
  try {
    const { skill } = req.params;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    portfolio.skills = portfolio.skills.filter(s => s !== skill);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json({
      success: true,
      message: 'Skill removed successfully',
      portfolio: updatedPortfolio
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// @route   GET /api/portfolios/user
// @desc    Get current user's portfolio
// @access  Private
router.get('/user', verifyToken, async (req, res) => {
  try {
    // Get the user ID from the authenticated user
    const userId = req.user.id;

    // Find the portfolio for this user
    const portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found for this user' });
    }

    return res.json(portfolio);
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch portfolio', 
      error: error.message 
    });
  }
});

module.exports = router;
