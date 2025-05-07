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
    console.log('Looking for certificate with ID:', req.params.id);
    
    let certificate = null;
    
    // First try direct ID lookup
    certificate = await Certificate.findById(req.params.id)
      .populate('user')
      .populate('course');
      
    // If not found, try course ID lookup for the current user
    if (!certificate && req.user) {
      const userId = req.user.id || req.user._id;
      console.log('Certificate not found by ID, trying to find by course ID for user:', userId);
      
      certificate = await Certificate.findOne({
        course: req.params.id,
        user: userId
      }).populate('user').populate('course');
    }
    
    if (!certificate) {
      console.log('Certificate still not found after all lookups');
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    
    console.log('Certificate found:', certificate._id);
    res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new certificate
exports.createCertificate = async (req, res) => {
  try {
    // Get user from token (handles different token formats)
    const userId = req.user.id || req.user._id;
    
    console.log('DEBUG - User token info:', req.user);
    console.log('DEBUG - Looking for user with ID:', userId);
    
    const user = await User.findById(userId);
    
    console.log('DEBUG - User found:', user ? 'Yes' : 'No');
    
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
    // Use more flexible lookup to handle different ID formats
    let existingCertificate = null;
    
    try {
      // Direct lookup
      existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
      
      // If not found, try string comparison as fallback
      if (!existingCertificate) {
        console.log('Checking for existing certificate using string comparison...');
        const allCertificates = await Certificate.find();
        
        existingCertificate = allCertificates.find(cert => {
          const certUserId = cert.user?.toString();
          const certCourseId = cert.course?.toString();
          return certUserId === userId.toString() && certCourseId === courseId.toString();
        });
      }
    } catch (certError) {
      console.error('Error checking for existing certificate:', certError);
    }
    
    if (existingCertificate) {
      console.log('Existing certificate found:', existingCertificate._id);
      return res.status(200).json({ 
        success: true, 
        message: 'Certificate already exists', 
        _id: existingCertificate._id,
        exists: true
      });
    } else {
      console.log('No existing certificate found, will create new one');
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
    const userId = req.params.userId || req.user.id || req.user._id;
    
    console.log('DEBUG - getCertificatesByUser - User token info:', req.user);
    console.log('DEBUG - getCertificatesByUser - Looking for certificates with user ID:', userId);
    
    const certificates = await Certificate.find({ user: userId })
      .populate('course')
      .sort({ issueDate: -1 }); // Most recent first
      
    console.log('DEBUG - getCertificatesByUser - Found certificates:', certificates.length);
      
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
    // Extract user ID from token, handling different formats
    const userId = req.user.id || req.user._id;
    const courseId = req.params.courseId;
    
    console.log('DEBUG - verifyCertificate - User token info:', req.user);
    console.log('DEBUG - verifyCertificate - Looking for certificate with user ID:', userId, 'and course ID:', courseId);
    
    // Check if certificate exists - more flexible matching
    let certificate = null;
    
    try {
      certificate = await Certificate.findOne({ 
        user: userId, 
        course: courseId 
      });
    } catch (findError) {
      console.error('Error in certificate lookup:', findError);
    }
    
    // If not found, try string comparison as fallback
    if (!certificate) {
      console.log('Certificate not found by direct match, trying string comparison...');
      const allCertificates = await Certificate.find().populate('user').populate('course');
      
      certificate = allCertificates.find(cert => {
        // Safely handle potentially undefined values
        const certUserId = cert.user ? (cert.user._id ? cert.user._id.toString() : cert.user.toString()) : '';
        const certCourseId = cert.course ? (cert.course._id ? cert.course._id.toString() : cert.course.toString()) : '';
        const userIdStr = userId ? userId.toString() : '';
        const courseIdStr = courseId ? courseId.toString() : '';
        
        console.log('Comparing:', { certUserId, userIdStr, certCourseId, courseIdStr });
        return certUserId === userIdStr && certCourseId === courseIdStr;
      });
    }
    
    if (certificate) {
      console.log('Certificate found:', certificate._id);
      return res.status(200).json({ 
        success: true, 
        message: 'Certificate exists', 
        exists: true,
        certificateId: certificate._id,
        _id: certificate._id // Adding _id for consistency with other endpoints
      });
    } else {
      console.log('No certificate found for this user and course');
      return res.status(200).json({ 
        success: true, 
        message: 'Certificate does not exist', 
        exists: false
      });
    }
  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
