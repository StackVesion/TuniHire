const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');
const { cloudinary, uploadFromUrl } = require('../utils/cloudinaryConfig');
const axios = require('axios');

// Generate CV template HTML
const generateCVHtml = (userData, portfolio) => {
  const { name, email, phone } = userData;
  const { 
    education = [], 
    experience = [], 
    skills = [], 
    projects = [], 
    certificates = [],
    about = '',
    socialLinks = {}
  } = portfolio;

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };
  
  // Format education items
  const educationHtml = education.map(edu => `
    <div class="cv-item">
      <h3>${edu.degree} ${edu.fieldOfStudy ? '- ' + edu.fieldOfStudy : ''}</h3>
      <h4>${edu.school}${edu.location ? ', ' + edu.location : ''}</h4>
      <p class="date">${formatDate(edu.startDate)} - ${edu.currentlyEnrolled ? 'Present' : formatDate(edu.endDate)}</p>
      ${edu.description ? `<p>${edu.description}</p>` : ''}
    </div>
  `).join('');

  // Format experience items
  const experienceHtml = experience.map(exp => `
    <div class="cv-item">
      <h3>${exp.position}</h3>
      <h4>${exp.company}${exp.location ? ', ' + exp.location : ''}</h4>
      <p class="date">${formatDate(exp.startDate)} - ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</p>
      ${exp.description ? `<p>${exp.description}</p>` : ''}
    </div>
  `).join('');

  // Format projects
  const projectsHtml = projects.map(project => `
    <div class="cv-item">
      <h3>${project.title}</h3>
      ${project.description ? `<p>${project.description}</p>` : ''}
      ${project.technologies && project.technologies.length > 0 ?
        `<p><strong>Technologies:</strong> ${project.technologies.join(', ')}</p>` : ''
      }
      ${project.link ? `<p><a href="${project.link}" target="_blank">${project.link}</a></p>` : ''}
    </div>
  `).join('');

  // Format certificates
  const certificatesHtml = certificates.map(cert => `
    <div class="cv-item">
      <h3>${cert.title}</h3>
      ${cert.description ? `<p>${cert.description}</p>` : ''}
      ${cert.skills && cert.skills.length > 0 ?
        `<p><strong>Skills:</strong> ${cert.skills.join(', ')}</p>` : ''
      }
      ${cert.certificateUrl ? `<p><a href="${cert.certificateUrl}" target="_blank">View Certificate</a></p>` : ''}
    </div>
  `).join('');

  // Format skills
  const skillsHtml = skills.length > 0 ?
    `<div class="skills-container">
      ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
    </div>` : '';

  // Format social links
  const socialLinksHtml = Object.entries(socialLinks)
    .filter(([key, value]) => value)
    .map(([key, value]) => `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> <a href="${value}" target="_blank">${value}</a></p>`)
    .join('');

  // Put everything together in a nice HTML template
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV - ${name}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background: #fff;
        }
        .container {
          max-width: 800px;
          margin: 20px auto;
          padding: 30px;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
          background: #fff;
        }
        header {
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          text-align: center;
        }
        header h1 {
          color: #007bff;
          margin-bottom: 10px;
        }
        .contact-info {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 15px;
          font-size: 14px;
        }
        .contact-info span {
          display: flex;
          align-items: center;
        }
        section {
          margin-bottom: 25px;
        }
        h2 {
          color: #007bff;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-top: 30px;
        }
        .cv-item {
          margin-bottom: 20px;
        }
        .cv-item h3 {
          margin-bottom: 5px;
          color: #333;
        }
        .cv-item h4 {
          color: #555;
          margin-top: 0;
          margin-bottom: 5px;
          font-weight: normal;
        }
        .date {
          color: #777;
          font-style: italic;
          margin-top: 0;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .skill-tag {
          background: #f0f7ff;
          color: #007bff;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 14px;
        }
        .social-links {
          margin-top: 20px;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        @media print {
          body {
            background: #fff;
          }
          .container {
            box-shadow: none;
            padding: 0;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>${name}</h1>
          <div class="contact-info">
            <span>${email}</span>
            ${phone ? `<span>${phone}</span>` : ''}
          </div>
        </header>

        ${about ? `
        <section>
          <h2>About Me</h2>
          <p>${about}</p>
        </section>
        ` : ''}

        ${skills.length > 0 ? `
        <section>
          <h2>Skills</h2>
          ${skillsHtml}
        </section>
        ` : ''}

        ${experience.length > 0 ? `
        <section>
          <h2>Experience</h2>
          ${experienceHtml}
        </section>
        ` : ''}

        ${education.length > 0 ? `
        <section>
          <h2>Education</h2>
          ${educationHtml}
        </section>
        ` : ''}

        ${projects.length > 0 ? `
        <section>
          <h2>Projects</h2>
          ${projectsHtml}
        </section>
        ` : ''}

        ${certificates.length > 0 ? `
        <section>
          <h2>Certifications</h2>
          ${certificatesHtml}
        </section>
        ` : ''}

        ${socialLinksHtml ? `
        <section class="social-links">
          <h2>Links</h2>
          ${socialLinksHtml}
        </section>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

// Generate CV PDF
const generateCV = async (req, res) => {
  try {
    const { userId } = req.body;

    // Fetch user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch portfolio data
    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Generate HTML for the CV
    const html = generateCVHtml(user, portfolio);

    // Generate a unique filename
    const filename = `cv_${userId}_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '..', 'uploads', 'cvs', filename);

    // Make sure the uploads/cvs directory exists
    const uploadDir = path.join(__dirname, '..', 'uploads', 'cvs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate PDF using puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
    await browser.close();

    // Return the path to the PDF
    const pdfUrl = `http://localhost:5000/uploads/cvs/${filename}`;
    res.status(200).json({ success: true, pdfUrl });
  } catch (error) {
    console.error('Error generating CV:', error);
    res.status(500).json({ success: false, message: 'Failed to generate CV', error: error.message });
  }
};

// Upload CV to Cloudinary
const uploadCVToCloudinary = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { pdfUrl } = req.body;

    // Find the portfolio
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Download the PDF file
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfBuffer = Buffer.from(response.data);

    // Generate a unique filename
    const filename = `cv_${portfolio.userId}_${Date.now()}`;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(pdfBuffer, filename);

    // Update the portfolio with the Cloudinary URL
    portfolio.cvFile = {
      filename: filename,
      path: uploadResult.secure_url,
      uploadDate: new Date(),
      fileType: 'application/pdf'
    };

    await portfolio.save();

    res.status(200).json({ 
      success: true, 
      message: 'CV uploaded successfully', 
      portfolio,
      cloudinaryUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Error uploading CV to Cloudinary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload CV to Cloudinary', 
      error: error.message 
    });
  }
};

module.exports = {
  generateCV,
  uploadCVToCloudinary
};
