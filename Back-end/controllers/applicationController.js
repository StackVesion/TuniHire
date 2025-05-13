const Application = require('../models/Application');
const { uploadToCloudinary, uploadPdfToCloudinary, cloudinary } = require('../utils/cloudinaryy');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for resume uploads with improved error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Clean the original filename to avoid any problematic characters
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(sanitizedName);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to accept only PDF and DOC files
const fileFilter = (req, file, cb) => {
  // Accept only .pdf, .doc and .docx files
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/msword' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to handle resume upload
exports.uploadResume = upload.single('resume');

// Get all applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('userId', 'firstName lastName email profilePicture')
      .populate({
        path: 'jobId',
        populate: { path: 'companyId', select: 'name logo' }
      })
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching all applications:', error);
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
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Delete resume from Cloudinary if it exists
    if (application.resume && application.resume.publicId) {
      try {
        const { cloudinary } = require('../utils/cloudinaryy');
        await cloudinary.uploader.destroy(application.resume.publicId, { resource_type: 'raw' });
        console.log(`Resume deleted from Cloudinary: ${application.resume.publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting resume from Cloudinary:', cloudinaryError);
        // Continue with application deletion even if Cloudinary delete fails
      }
    }
    
    const deletedApplication = await Application.findByIdAndDelete(req.params.id);
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

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'You must be logged in to apply for jobs' });
    }
    
    const userId = req.user.id;
    
    // Log received data for debugging
    console.log(`Received application for job ${jobId} from user ${userId}`);
    console.log("Request body keys:", Object.keys(req.body));
    console.log("File received:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "No file");
    
    // Extract cover letter from request body
    const { coverLetter } = req.body;
    
    // Validate cover letter
    if (!coverLetter) {
      console.log("Cover letter validation failed - field missing");
      return res.status(400).json({ 
        message: 'Cover letter is required',
        receivedFields: Object.keys(req.body)
      });
    }
    
    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({ 
      userId: userId,
      jobId: jobId 
    });
    
    if (existingApplication) {
      return res.status(400).json({ 
        message: 'You have already applied for this job',
        application: existingApplication
      });
    }
    
    // Initialize resume data
    let resumeData = null;
    
    // Upload resume to Cloudinary if provided
    if (req.file) {
      try {
        console.log(`Processing resume upload: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // Path to temporarily stored file
        const resumePath = req.file.path;
        
        // Check if file exists and is readable
        if (!fs.existsSync(resumePath)) {
          return res.status(400).json({
            message: 'Resume file is not accessible',
            error: 'File access error'
          });
        }
        
        // Determine if file is a PDF based on mimetype
        const isPdf = req.file.mimetype === 'application/pdf';
        console.log(`File type: ${isPdf ? 'PDF' : req.file.mimetype}`);
        
        // Use different upload function based on file type
        let uploadResult;
        
        if (isPdf) {
          console.log(`Uploading PDF file: ${req.file.originalname}`);
          // Use specialized PDF upload function with proper settings
          uploadResult = await uploadPdfToCloudinary(resumePath, {
            folder: 'resumes',
            resource_type: 'raw', // Always raw for PDFs
            public_id: `resume_${userId}_${Date.now()}`,
            type: 'upload'
          });
        } else {
          console.log(`Uploading non-PDF file: ${req.file.originalname}`);
          // Use standard upload function for other file types
          uploadResult = await uploadToCloudinary(resumePath, {
            folder: 'resumes',
            public_id: `resume_${userId}_${Date.now()}`
          });
        }
        
        console.log('Upload result:', uploadResult ? 'Received' : 'Null');
        
        // Check upload result
        if (uploadResult && uploadResult.success && uploadResult.result) {
          const cloudinaryData = uploadResult.result;
          console.log(`Resume successfully uploaded to Cloudinary: ${cloudinaryData.secure_url}`);
          
          // Store resume metadata in application
          resumeData = {
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            size: req.file.size,
            uploadDate: new Date(),
            publicId: cloudinaryData.public_id,
            url: cloudinaryData.secure_url
          };
          
          // Clean up temporary file
          try {
            if (fs.existsSync(resumePath)) {
              fs.unlinkSync(resumePath);
              console.log(`Temporary file deleted after successful upload`);
            }
          } catch (cleanupError) {
            console.warn(`Warning: Could not delete temporary file: ${cleanupError.message}`);
            // Non-critical error, can continue
          }
        } else {
          // Handle upload failure
          const errorMessage = uploadResult?.error || 'Unknown upload error';
          console.error(`Cloudinary upload failed: ${errorMessage}`);
          
          // Clean up temporary file
          try {
            if (fs.existsSync(resumePath)) {
              fs.unlinkSync(resumePath);
            }
          } catch (cleanupError) {
            console.warn(`Warning: Could not delete temporary file: ${cleanupError.message}`);
          }
          
          return res.status(500).json({
            message: 'Failed to upload resume to Cloudinary. Please try again.',
            error: errorMessage
          });
        }
      } catch (uploadError) {
        console.error(`Error during resume upload: ${uploadError.message}`);
        console.error(uploadError.stack);
        
        // Clean up any temporary file
        if (req.file && req.file.path) {
          try {
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          } catch (cleanupError) {
            console.warn(`Warning: Could not delete temporary file: ${cleanupError.message}`);
          }
        }
        
        return res.status(500).json({
          message: 'Error processing resume upload. Please try again.',
          error: uploadError.message
        });
      }
    } else {
      return res.status(400).json({
        message: 'Resume file is required',
        receivedFields: Object.keys(req.body)
      });
    }
    
    // Create new application
    console.log('Creating new application...');
    const newApplication = new Application({
      userId: userId,
      jobId: jobId,
      coverLetter: coverLetter,
      status: 'Pending',
      resume: resumeData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    const savedApplication = await newApplication.save();
    console.log(`Application created successfully with ID: ${savedApplication._id}`);
    
    // Return the saved application with populated data
    const populatedApplication = await Application.findById(savedApplication._id)
      .populate('userId', 'firstName lastName email profilePicture')
      .populate('jobId', 'title companyId');
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application: populatedApplication
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: error.message });
  }
};
