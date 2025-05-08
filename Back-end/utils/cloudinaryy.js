const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dd1bisl3a',
  api_key: process.env.CLOUDINARY_API_KEY || '365654761587579',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dZ4lT4dtYm-II_MDZ2teZA_JxNo',
  secure: true
});

// Log configuration for debugging
console.log('Cloudinary Configuration:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? 'API_KEY_SET' : 'API_KEY_MISSING',
  api_secret: cloudinary.config().api_secret ? 'API_SECRET_SET' : 'API_SECRET_MISSING'
});

/**
 * Simple direct upload function that uses cloudinary.uploader.upload directly
 * @param {string} filePath - Path to the file to upload
 * @param {Object} options - Upload options
 * @returns {Promise} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist at path: ${filePath}`);
      return { success: false, error: `File does not exist at path: ${filePath}` };
    }

    // Get file stats and check size
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.error('File is empty (0 bytes)');
      return { success: false, error: 'File is empty (0 bytes)' };
    }
    
    console.log(`Uploading file: ${filePath}, Size: ${stats.size} bytes`);

    // Get the file extension and mime type
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Determine if PDF file
    const isPDF = fileExtension === '.pdf';
    
    // Set upload options with special handling for PDFs
    const uploadOptions = {
      folder: options.folder || 'resumes',
      use_filename: true,
      unique_filename: true,
      // Critical: For PDF files we must use 'raw' resource_type
      resource_type: isPDF ? 'raw' : 'auto',
      // Important: For PDF uploads, don't try to analyze/transform the file
      eager: isPDF ? [] : options.eager,
      // Create a unique ID for each upload
      public_id: options.public_id || `resume_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      // Merge any other options provided
      ...options
    };
    
    console.log(`Uploading file ${fileName} to Cloudinary as ${isPDF ? 'raw PDF' : 'auto-detected type'}`);
    console.log('Upload options:', JSON.stringify(uploadOptions));
    
    // Return a promise that wraps the Cloudinary upload
    return new Promise((resolve) => {
      cloudinary.uploader.upload(
        filePath,
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            resolve({ 
              success: false, 
              error: error.message || 'Unknown error during upload'
            });
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve({ 
              success: true, 
              result
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during file upload process'
    };
  }
};

/**
 * Alternative upload method for PDF files specifically
 * @param {string} filePath - Path to the PDF file
 * @param {Object} options - Upload options
 * @returns {Promise} - Cloudinary upload result
 */
const uploadPdfToCloudinary = async (filePath, options = {}) => {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }
    
    // For PDF files, we use very specific options
    const uploadOptions = {
      folder: options.folder || 'resumes',
      resource_type: 'raw', // Always use 'raw' for PDFs
      use_filename: true,
      unique_filename: true,
      public_id: options.public_id || `resume_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      ...options
    };
    
    console.log('Uploading PDF with options:', JSON.stringify(uploadOptions));
    
    return new Promise((resolve) => {
      cloudinary.uploader.upload(
        filePath,
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('PDF upload error:', error);
            resolve({ success: false, error: error.message });
          } else {
            console.log('PDF upload success:', result.secure_url);
            resolve({ success: true, result });
          }
        }
      );
    });
  } catch (error) {
    console.error('Unexpected error during PDF upload:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadPdfToCloudinary
};
