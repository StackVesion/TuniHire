const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Course = require('../models/Course');

// Get all certificates
exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('user')
      .populate('course')
      .sort({ issueDate: -1 }); // Most recent first
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get certificate by ID
exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user')
      .populate('course');
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new certificate
exports.createCertificate = async (req, res) => {
  try {
    // Get user from token
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get course details
    const courseId = req.body.courseId;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if certificate already exists for this user and course
    const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
    if (existingCertificate) {
      return res.status(200).json({ 
        success: true, 
        message: 'Certificate already exists', 
        _id: existingCertificate._id,
        exists: true
      });
    }
    
    // Create the certificate
    const newCertificate = new Certificate({
      user: userId,
      course: courseId,
      userName: `${user.firstName} ${user.lastName}`,
      courseName: course.title || req.body.courseName,
      skills: req.body.skills || course.skills || [],
      grade: req.body.grade || 'A',
      score: req.body.score || 100,
      status: 'issued',
      metadata: {
        courseId: courseId,
        courseTitle: course.title,
        courseCategory: course.category,
        courseDifficulty: course.difficulty,
        completionDate: new Date()
      }
    });
    
    // Save the certificate
    const savedCertificate = await newCertificate.save();
    
    // Update user's education/certificates in profile
    if (!user.education) {
      user.education = [];
    }
    
    // Add the certificate to user's education array
    user.education.push({
      degree: `Course Certificate: ${course.title}`,
      institution: 'TuniHire Academy',
      yearCompleted: new Date().getFullYear(),
      certificateId: savedCertificate._id
    });
    
    // Add the skills from the course to the user's skills if they don't already have them
    if (course.skills && course.skills.length > 0) {
      if (!user.skills) {
        user.skills = [];
      }
      
      // Add new skills without duplicates
      const newSkills = course.skills.filter(skill => !user.skills.includes(skill));
      user.skills = [...user.skills, ...newSkills];
    }
    
    // Save user with updated education
    await user.save();
    
    // Return success response
    res.status(201).json({ 
      success: true, 
      message: 'Certificate created successfully', 
      _id: savedCertificate._id,
      ...savedCertificate._doc
    });
  } catch (error) {
    console.error('Certificate creation error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update certificate
exports.updateCertificate = async (req, res) => {
  try {
    const updatedCertificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCertificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json(updatedCertificate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete certificate
exports.deleteCertificate = async (req, res) => {
  try {
    const deletedCertificate = await Certificate.findByIdAndDelete(req.params.id);
    if (!deletedCertificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get certificates by user
exports.getCertificatesByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const certificates = await Certificate.find({ user: userId })
      .populate('course')
      .sort({ issueDate: -1 }); // Most recent first
      
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get certificates by course
exports.getCertificatesByCourse = async (req, res) => {
  try {
    const certificates = await Certificate.find({ course: req.params.courseId })
      .populate('user');
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify if a certificate exists for course and current user
exports.verifyCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;
    
    // Check if certificate exists
    const certificate = await Certificate.findOne({ 
      user: userId, 
      course: courseId 
    });
    
    if (certificate) {
      return res.status(200).json({ 
        success: true, 
        exists: true, 
        certificateId: certificate._id,
        message: 'Certificate exists for this course and user'
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        exists: false,
        message: 'No certificate found for this course and user'
      });
    }
  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
