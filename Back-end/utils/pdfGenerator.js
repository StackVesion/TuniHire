const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional CV PDF
 * @param {Object} data - CV data
 * @param {string} outputPath - Path to save the PDF
 * @returns {Promise<string>} - Path to the generated PDF
 */
async function generateCV(data, outputPath) {
  const {
    personalInfo,
    education,
    experience,
    skills,
    certificates,
    projects,
    portfolio
  } = data;

  // Create PDF with proper configuration
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    info: {
      Title: `${personalInfo.firstName} ${personalInfo.lastName} - CV`,
      Author: 'TuniHire',
      Subject: 'Professional CV',
      Keywords: 'cv, resume, professional'
    }
  });

  // Create write stream
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Colors and styling
  const primaryColor = '#1967d2';
  const textColor = '#333333';
  const lightGray = '#f5f5f5';

  // ============= HEADER SECTION =============
  doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
  
  // Name
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff');
  doc.text(`${personalInfo.firstName} ${personalInfo.lastName}`, 50, 40);
  
  // Role/profession
  const role = personalInfo.role || 'Professional Developer';
  doc.font('Helvetica').fontSize(16).fillColor('#ffffff');
  doc.text(role, 50, 75);
  
  // Contact info row - all on the same line
  const contactY = 100;
  
  // Email
  if (personalInfo.email) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('Email:', 50, contactY, { continued: true });
    doc.font('Helvetica').fontSize(9).fillColor('#ffffff');
    doc.text(` ${personalInfo.email}`, { 
      link: `mailto:${personalInfo.email}`,
      continued: true
    });
  }
  
  // GitHub 
  let currentX = 260;
  if (portfolio.socialLinks && portfolio.socialLinks.github) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('   GitHub:', currentX, contactY, { continued: true });
    doc.font('Helvetica').fontSize(9).fillColor('#ffffff');
    doc.text(' View Profile', { 
      link: portfolio.socialLinks.github,
      continued: true
    });
  }
  
  // LinkedIn
  currentX = 400;
  if (portfolio.socialLinks && portfolio.socialLinks.linkedin) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('   LinkedIn:', currentX, contactY, { continued: true });
    doc.font('Helvetica').fontSize(9).fillColor('#ffffff');
    doc.text(' View Profile', { 
      link: portfolio.socialLinks.linkedin,
      continued: true
    });
  }
  
  // Website - make sure it's on the same line
  if (portfolio.socialLinks && portfolio.socialLinks.website) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('   Website:', 540, contactY, { continued: true });
    doc.font('Helvetica').fontSize(9).fillColor('#ffffff');
    doc.text(' Visit Site', { 
      link: portfolio.socialLinks.website 
    });
  } else {
    // End the line if there's no website
    doc.text('');
  }

  // Set starting position for content
  let yPosition = 150;
  const pageWidth = doc.page.width - 100;

  // ============= HELPER FUNCTIONS =============
  // Function to add section titles WITHOUT underlines
  const addSection = (title) => {
    // Check for page break
    if (yPosition > doc.page.height - 120) {
      doc.addPage();
      yPosition = 50;
    }
    
    // Add section title without underline
    doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor);
    doc.text(title.toUpperCase(), 50, yPosition);
    yPosition += 25;
  };

  // Function to format date ranges
  const formatDate = (startDate, endDate, current = false) => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (current) {
      return `${startStr} - Present`;
    } else if (endDate) {
      const end = new Date(endDate);
      const endStr = end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    
    return startStr;
  };

  // ============= ABOUT SECTION =============
  if (portfolio.about) {
    addSection('About Me');
    doc.font('Helvetica').fontSize(11).fillColor(textColor);
    doc.text(portfolio.about, 50, yPosition, { width: pageWidth, align: 'justify' });
    yPosition += doc.heightOfString(portfolio.about, { width: pageWidth }) + 20;
  }

  // ============= SKILLS SECTION =============
  if (skills && skills.length > 0) {
    addSection('Skills');
    
    // Create a grid of skills with light background
    const skillsPerRow = 2;
    const skillWidth = 230;
    const skillHeight = 30;
    const skillGap = 20;
    
    for (let i = 0; i < skills.length; i += skillsPerRow) {
      const rowSkills = skills.slice(i, i + skillsPerRow);
      
      rowSkills.forEach((skill, index) => {
        const x = 50 + (index * (skillWidth + skillGap));
        
        // Skill box with light background
        doc.rect(x, yPosition, skillWidth, skillHeight).fill('#e1f5fe');
        
        // Center the skill name in the box
        doc.font('Helvetica').fontSize(11).fillColor(textColor);
        const textWidth = doc.widthOfString(skill);
        doc.text(skill, x + (skillWidth - textWidth) / 2, yPosition + 10);
      });
      
      yPosition += skillHeight + 10;
    }
    
    yPosition += 10;
  }

  // ============= EXPERIENCE SECTION =============
  if (experience && experience.length > 0) {
    addSection('Professional Experience');
    
    experience.forEach(exp => {
      // Check for page break
      if (yPosition > doc.page.height - 150) {
        doc.addPage();
        yPosition = 50;
      }
      
      // Position/title
      doc.font('Helvetica-Bold').fontSize(13).fillColor(textColor);
      doc.text(exp.position || 'Position', 50, yPosition);
      
      // Dates right-aligned
      const dateText = formatDate(exp.startDate, exp.endDate, exp.currentlyWorking);
      if (dateText) {
        const dateWidth = doc.widthOfString(dateText);
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        doc.text(dateText, doc.page.width - 50 - dateWidth, yPosition);
      }
      
      // Company and location
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
      let companyText = exp.company || '';
      if (exp.location) companyText += `, ${exp.location}`;
      doc.text(companyText, 50, yPosition + 20);
      
      yPosition += 40;
      
      // Description with bullet points
      if (exp.description) {
        const descLines = exp.description.split('\n');
        
        descLines.forEach(line => {
          if (line.trim()) {
            // Check for page break
            if (yPosition > doc.page.height - 60) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.font('Helvetica').fontSize(10).fillColor(textColor);
            doc.text('•', 50, yPosition);
            doc.text(line.trim(), 65, yPosition, { width: pageWidth - 20 });
            
            const lineHeight = doc.heightOfString(line.trim(), { width: pageWidth - 20 });
            yPosition += lineHeight + 5;
          }
        });
      }
      
      yPosition += 15;
    });
  }

  // ============= EDUCATION SECTION =============
  if (education && education.length > 0) {
    addSection('Education');
    
    education.forEach(edu => {
      // Check for page break
      if (yPosition > doc.page.height - 150) {
        doc.addPage();
        yPosition = 50;
      }
      
      // Degree
      doc.font('Helvetica-Bold').fontSize(13).fillColor(textColor);
      doc.text(edu.degree || 'Degree', 50, yPosition);
      
      // Dates right-aligned
      const dateText = formatDate(edu.startDate, edu.endDate, edu.currentlyEnrolled);
      if (dateText) {
        const dateWidth = doc.widthOfString(dateText);
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        doc.text(dateText, doc.page.width - 50 - dateWidth, yPosition);
      }
      
      // School and field
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
      let schoolText = edu.school || '';
      if (edu.fieldOfStudy) schoolText += `, ${edu.fieldOfStudy}`;
      doc.text(schoolText, 50, yPosition + 20);
      
      yPosition += 40;
      
      // Location
      if (edu.location) {
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        doc.text(`Location: ${edu.location}`, 50, yPosition);
        yPosition += 15;
      }
      
      // Description
      if (edu.description) {
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        doc.text(edu.description, 50, yPosition, { width: pageWidth, align: 'justify' });
        yPosition += doc.heightOfString(edu.description, { width: pageWidth }) + 5;
      }
      
      yPosition += 15;
    });
  }

  // ============= CERTIFICATIONS SECTION =============
  if (certificates && certificates.length > 0) {
    addSection('Certifications');
    
    certificates.forEach(cert => {
      // Check for page break
      if (yPosition > doc.page.height - 120) {
        doc.addPage();
        yPosition = 50;
      }
      
      // Certificate title
      doc.font('Helvetica-Bold').fontSize(12).fillColor(textColor);
      doc.text(cert.title || 'Certificate', 50, yPosition);
      
      // Date if available
      if (cert.date) {
        const certDate = new Date(cert.date);
        const dateText = certDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const dateWidth = doc.widthOfString(dateText);
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        doc.text(dateText, doc.page.width - 50 - dateWidth, yPosition);
      }
      
      // Issuer
      if (cert.issuer) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
        doc.text(cert.issuer, 50, yPosition + 20);
        yPosition += 40;
      } else {
        yPosition += 25;
      }
      
      // Description
      if (cert.description) {
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        doc.text(cert.description, 50, yPosition, { width: pageWidth, align: 'justify' });
        yPosition += doc.heightOfString(cert.description, { width: pageWidth }) + 10;
      }
      
      // Skills
      if (cert.skills && cert.skills.length > 0) {
        const skillsText = Array.isArray(cert.skills) ? cert.skills.join(', ') : cert.skills;
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor(textColor);
        doc.text('Skills: ', 50, yPosition, { continued: true });
        
        doc.font('Helvetica').fontSize(10).fillColor(primaryColor);
        doc.text(skillsText);
        
        yPosition += 15;
      }
      
      yPosition += 15;
    });
  }

  // ============= PROJECTS SECTION =============
  if (projects && projects.length > 0) {
    addSection('Projects');
    
    projects.forEach(project => {
      // Check for page break
      if (yPosition > doc.page.height - 120) {
        doc.addPage();
        yPosition = 50;
      }
      
      // Project title
      doc.font('Helvetica-Bold').fontSize(12).fillColor(textColor);
      doc.text(project.title || 'Project', 50, yPosition);
      
      yPosition += 20;
      
      // Technologies
      if (project.technologies) {
        const techArray = Array.isArray(project.technologies) 
          ? project.technologies 
          : project.technologies.split(',');
        
        const techText = techArray.join(', ');
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor(textColor);
        doc.text('Technologies: ', 50, yPosition, { continued: true });
        
        doc.font('Helvetica').fontSize(10).fillColor(primaryColor);
        doc.text(techText);
        
        yPosition += 20;
      }
      
      // Description
      if (project.description) {
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        doc.text(project.description, 50, yPosition, { width: pageWidth, align: 'justify' });
        yPosition += doc.heightOfString(project.description, { width: pageWidth }) + 15;
      }
      
      // Project link as a button
      if (project.link) {
        // Draw button
        const linkText = 'View Project';
        const linkWidth = doc.widthOfString(linkText) + 20;
        doc.rect(50, yPosition, linkWidth, 20).fill(primaryColor);
        
        // Button text
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
        doc.text(linkText, 60, yPosition + 6, { link: project.link });
        
        yPosition += 30;
      }
      
      yPosition += 15;
    });
  }

  // ============= FOOTER =============
  // Simple footer with generation date
  doc.font('Helvetica').fontSize(8).fillColor('#999999');
  doc.text(
    `Generated by TuniHire on ${new Date().toLocaleDateString()}`,
    50,
    doc.page.height - 50,
    { align: 'center', width: doc.page.width - 100 }
  );

  // Finalize PDF
  doc.end();
  
  // Wait for the write stream to finish
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}

module.exports = { generateCV };
