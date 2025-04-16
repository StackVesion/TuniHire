const express = require('express');
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
    const { userId, education, experience, skills, personalInfo, certificates, projects } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Find the portfolio by userId
    const portfolio = await Portfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Find user to get profile picture
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Generate a filename for the CV
    const timestamp = new Date().getTime();
    const cvFileName = `cv_${userId}_${timestamp}.pdf`;
    const cvFilePath = `./public/uploads/cvs/${cvFileName}`;
    
    // Make sure the directory exists
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../public/uploads/cvs');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Use a PDF generation library like PDFKit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4',
      info: {
        Title: `CV - ${personalInfo.firstName} ${personalInfo.lastName}`,
        Author: 'TuniHire',
        Subject: 'Professional CV',
        Keywords: 'CV, Resume, Professional, TuniHire'
      }
    });
    
    // Pipe the PDF into a file
    const stream = fs.createWriteStream(cvFilePath);
    doc.pipe(stream);
    
    // Color scheme
    const colors = {
      primary: '#1e88e5',   // Blue
      secondary: '#424242', // Dark gray
      accent: '#2c3e50',    // Dark blue
      light: '#f5f5f5',     // Light gray
      text: '#333333',      // Text color
      highlight: '#e1f5fe'  // Light blue highlight
    };
    
    // Add header with name and contact info
    doc.rect(0, 0, doc.page.width, 150).fill(colors.primary);
    
    // Load and add profile picture if available
    let hasProfilePicture = false;
    try {
      if (user.profilePicture) {
        const profilePicPath = user.profilePicture;
        
        // If it's a URL (including Cloudinary), try to fetch it
        if (profilePicPath.startsWith('http')) {
          const axios = require('axios');
          const response = await axios.get(profilePicPath, { responseType: 'arraybuffer' });
          
          // Create a temporary file for the profile picture
          const tempPicPath = path.join(uploadsDir, `temp_pic_${userId}.jpg`);
          fs.writeFileSync(tempPicPath, response.data);
          
          // Add profile picture as a circular image
          doc.save();
          doc.translate(75, 75);
          doc.circle(0, 0, 40).clip();
          doc.image(tempPicPath, -40, -40, { width: 80 });
          doc.restore();
          
          // Clean up temp file
          fs.unlink(tempPicPath, () => {});
          hasProfilePicture = true;
        } else {
          // Local file path
          const localPicPath = path.join(__dirname, '..', profilePicPath.replace(/^\//, ''));
          
          if (fs.existsSync(localPicPath)) {
            doc.save();
            doc.translate(75, 75);
            doc.circle(0, 0, 40).clip();
            doc.image(localPicPath, -40, -40, { width: 80 });
            doc.restore();
            hasProfilePicture = true;
          }
        }
      }
    } catch (error) {
      console.warn('Error adding profile picture to CV:', error);
      // Continue without profile picture
    }
    
    // Add name and title with positioning based on whether there's a profile picture
    const nameX = hasProfilePicture ? 130 : 50;
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff');
    doc.text(`${personalInfo.firstName} ${personalInfo.lastName}`, nameX, 50);
    
    // Add profession/role if available
    if (user.role) {
      doc.font('Helvetica').fontSize(16).fillColor('#ffffff');
      doc.text(user.role === 'candidate' ? 'Professional Developer' : user.role, nameX, 85);
    }
    
    // Add contact information on the right side
    const contactInfoX = 400;
    const contactInfoY = 50;
    doc.fontSize(10).fillColor('#ffffff');
    
    let lineHeight = 0;
    if (personalInfo.email) {
      doc.text(`Email: ${personalInfo.email}`, contactInfoX, contactInfoY + lineHeight);
      lineHeight += 15;
    }
    if (personalInfo.phone) {
      doc.text(`Phone: ${personalInfo.phone}`, contactInfoX, contactInfoY + lineHeight);
      lineHeight += 15;
    }
    if (personalInfo.address) {
      doc.text(`Location: ${personalInfo.address}`, contactInfoX, contactInfoY + lineHeight);
      lineHeight += 15;
    }
    
    // Add social links if available
    if (portfolio.socialLinks) {
      lineHeight += 5;
      if (portfolio.socialLinks.linkedin) {
        doc.text(`LinkedIn: ${portfolio.socialLinks.linkedin}`, contactInfoX, contactInfoY + lineHeight);
        lineHeight += 15;
      }
      if (portfolio.socialLinks.github) {
        doc.text(`GitHub: ${portfolio.socialLinks.github}`, contactInfoX, contactInfoY + lineHeight);
        lineHeight += 15;
      }
      if (portfolio.socialLinks.website) {
        doc.text(`Website: ${portfolio.socialLinks.website}`, contactInfoX, contactInfoY + lineHeight);
        lineHeight += 15;
      }
      if (portfolio.socialLinks.twitter) {
        doc.text(`Twitter: ${portfolio.socialLinks.twitter}`, contactInfoX, contactInfoY + lineHeight);
      }
    }
    
    // Start content below the header
    let yPosition = 170;
    
    // Helper function to add a section title
    const addSectionTitle = (title) => {
      doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.primary);
      doc.text(title, 50, yPosition);
      yPosition += 5;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke(colors.primary);
      yPosition += 15;
      return yPosition;
    };
    
    // Add about section if available
    if (portfolio.about) {
      addSectionTitle('ABOUT ME');
      doc.font('Helvetica').fontSize(11).fillColor(colors.text);
      const aboutText = doc.heightOfString(portfolio.about, { width: 500 });
      doc.text(portfolio.about, 50, yPosition, { width: 500 });
      yPosition += aboutText + 20;
    }
    
    // Check if the page is getting full and add a new page if needed
    const checkPageBreak = (neededSpace) => {
      if (yPosition + neededSpace > doc.page.height - 50) {
        doc.addPage();
        yPosition = 50;
      }
    };
    
    // Skills section - display in a more visual way
    if (skills && skills.length > 0) {
      checkPageBreak(100); // Approximate height for skills section
      addSectionTitle('SKILLS');
      
      // Create a more visually appealing skills list with columns and bars
      const skillsPerRow = 2;
      const skillWidth = 240;
      const skillMargin = 10;
      
      doc.font('Helvetica').fontSize(10).fillColor(colors.text);
      
      // Group skills into pairs for two-column layout
      for (let i = 0; i < skills.length; i += skillsPerRow) {
        const rowSkills = skills.slice(i, i + skillsPerRow);
        
        rowSkills.forEach((skill, index) => {
          const xPos = 50 + (index * (skillWidth + skillMargin));
          
          // Create a bar for the skill
          doc.rect(xPos, yPosition, skillWidth, 20).fill(colors.highlight);
          
          // Add skill name
          doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.secondary);
          doc.text(skill, xPos + 5, yPosition + 5);
        });
        
        yPosition += 25;
      }
      
      yPosition += 10;
    }
    
    // Experience section
    if (experience && experience.length > 0) {
      checkPageBreak(experience.length * 100); // Approximate height for experience section
      addSectionTitle('PROFESSIONAL EXPERIENCE');
      
      experience.forEach(exp => {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.secondary);
        doc.text(exp.position || 'Position', 50, yPosition);
        
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary);
        const company = exp.company ? `${exp.company}` : '';
        const location = exp.location ? `, ${exp.location}` : '';
        doc.text(company + location, 50, yPosition + 15);
        
        // Format dates
        let dateText = '';
        if (exp.startDate) {
          const startDate = new Date(exp.startDate);
          dateText += startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
        if (exp.endDate) {
          const endDate = new Date(exp.endDate);
          dateText += ` - ${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
        } else if (exp.currentlyWorking) {
          dateText += ' - Present';
        }
        
        // Add dates on the right
        if (dateText) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.secondary);
          doc.text(dateText, { align: 'right' }, 50, yPosition, { width: 500 });
        }
        
        // Add description with bullet points if available
        if (exp.description) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          const descLines = exp.description.split('\n');
          yPosition += 35;
          
          descLines.forEach(line => {
            line = line.trim();
            if (line) {
              doc.text(`• ${line}`, 60, yPosition);
              const lineHeight = doc.heightOfString(`• ${line}`, { width: 490 });
              yPosition += lineHeight + 5;
            }
          });
        } else {
          yPosition += 35;
        }
        
        yPosition += 10;
      });
    }
    
    // Education section
    if (education && education.length > 0) {
      checkPageBreak(education.length * 80); // Approximate height for education section
      addSectionTitle('EDUCATION');
      
      education.forEach(edu => {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.secondary);
        doc.text(edu.degree || 'Degree', 50, yPosition);
        
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary);
        const school = edu.school ? `${edu.school}` : '';
        const fieldOfStudy = edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : '';
        doc.text(school + fieldOfStudy, 50, yPosition + 15);
        
        // Format dates
        let dateText = '';
        if (edu.startDate) {
          const startDate = new Date(edu.startDate);
          dateText += startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
        if (edu.endDate) {
          const endDate = new Date(edu.endDate);
          dateText += ` - ${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
        } else if (edu.currentlyEnrolled) {
          dateText += ' - Present';
        }
        
        // Add dates on the right
        if (dateText) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.secondary);
          doc.text(dateText, { align: 'right' }, 50, yPosition, { width: 500 });
        }
        
        // Add location and description
        if (edu.location) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          yPosition += 35;
          doc.text(`Location: ${edu.location}`, 50, yPosition);
          yPosition += 15;
        } else {
          yPosition += 35;
        }
        
        if (edu.description) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          doc.text(edu.description, 50, yPosition);
          const descHeight = doc.heightOfString(edu.description, { width: 500 });
          yPosition += descHeight + 5;
        }
        
        yPosition += 10;
      });
    }
    
    // Certificates section
    if (certificates && certificates.length > 0) {
      checkPageBreak(certificates.length * 70); // Approximate height for certificates section
      addSectionTitle('CERTIFICATIONS');
      
      certificates.forEach(cert => {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.secondary);
        doc.text(cert.title || 'Certificate', 50, yPosition);
        
        yPosition += 15;
        
        if (cert.issuer) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          doc.text(`Issuer: ${cert.issuer}`, 50, yPosition);
          yPosition += 15;
        }
        
        if (cert.date) {
          const certDate = new Date(cert.date);
          doc.font('Helvetica').fontSize(10).fillColor(colors.secondary);
          doc.text(`Date: ${certDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`, 50, yPosition);
          yPosition += 15;
        }
        
        if (cert.description) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          doc.text(cert.description, 50, yPosition);
          const descHeight = doc.heightOfString(cert.description, { width: 500 });
          yPosition += descHeight + 5;
        }
        
        if (cert.skills && cert.skills.length > 0) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          doc.text(`Skills: ${cert.skills.join(', ')}`, 50, yPosition);
          yPosition += 15;
        }
        
        yPosition += 10;
      });
    }
    
    // Projects section
    if (projects && projects.length > 0) {
      checkPageBreak(projects.length * 80); // Approximate height for projects section
      addSectionTitle('PROJECTS');
      
      projects.forEach(project => {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.secondary);
        doc.text(project.title || 'Project', 50, yPosition);
        
        yPosition += 15;
        
        if (project.description) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          doc.text(project.description, 50, yPosition);
          const descHeight = doc.heightOfString(project.description, { width: 500 });
          yPosition += descHeight + 5;
        }
        
        if (project.technologies && project.technologies.length > 0) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.primary);
          doc.text(`Technologies: ${project.technologies.join(', ')}`, 50, yPosition);
          yPosition += 15;
        }
        
        if (project.link) {
          doc.font('Helvetica').fontSize(10).fillColor(colors.text);
          doc.text(`Link: ${project.link}`, 50, yPosition);
          yPosition += 15;
        }
        
        yPosition += 10;
      });
    }
    
    // Add footer with page numbers
    const totalPages = doc.bufferedPageRange().count;
    
    // Add document finalization code including page numbering
    doc.on('pageAdded', () => {
      const currentPage = doc.bufferedPageRange().count;
      doc.switchToPage(currentPage - 1); // Switch to the newly added page (uses 0-based index)
      
      // Add page number to the current page
      doc.font('Helvetica').fontSize(8).fillColor('#999999');
      doc.text(
        `Page ${currentPage} of ${totalPages}`, 
        50, 
        doc.page.height - 50, 
        { align: 'center', width: doc.page.width - 100 }
      );
      
      // Add generation date
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`, 
        50, 
        doc.page.height - 35, 
        { align: 'center', width: doc.page.width - 100 }
      );
    });
    
    // Add footer to the first page
    doc.font('Helvetica').fontSize(8).fillColor('#999999');
    doc.text(
      `Page 1 of ${totalPages}`, 
      50, 
      doc.page.height - 50, 
      { align: 'center', width: doc.page.width - 100 }
    );
    
    // Add generation date
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`, 
      50, 
      doc.page.height - 35, 
      { align: 'center', width: doc.page.width - 100 }
    );
    
    // Finalize PDF
    doc.end();
    
    // Import Cloudinary utilities
    const { uploadToCloudinary } = require('../utils/cloudinary');
    
    // When the stream is finished, upload to Cloudinary and send the response
    stream.on('finish', async () => {
      try {
        // Upload the generated PDF to Cloudinary
        const cloudinaryUpload = await uploadToCloudinary(cvFilePath, {
          folder: 'cvs',
          resource_type: 'raw',
          public_id: `cv_${userId}_${timestamp}`
        });
        
        if (!cloudinaryUpload.success) {
          throw new Error('Failed to upload to Cloudinary');
        }
        
        // Update portfolio with CV file info
        portfolio.cvFile = cloudinaryUpload.result.secure_url;
        await portfolio.save();
        
        // Return the file path to download
        res.status(200).json({
          success: true,
          message: 'CV generated and uploaded successfully',
          cvUrl: cloudinaryUpload.result.secure_url,
          cvPublicId: cloudinaryUpload.result.public_id,
          portfolio
        });
        
        // Remove the local file after uploading to Cloudinary
        fs.unlink(cvFilePath, (err) => {
          if (err) console.error('Error removing temporary CV file:', err);
        });
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload CV to Cloudinary',
          error: error.message
        });
      }
    });
    
    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating CV file',
        error: error.message
      });
    });
  } catch (error) {
    console.error('Error generating CV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CV',
      error: error.message
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

module.exports = router;
