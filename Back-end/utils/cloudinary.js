const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Configure Cloudinary with the credentials from environment variables
cloudinary.config({
  cloud_name: 'dockqbc5i',
  api_key: '329791328233327',
  api_secret: 'Tld-iBuXfW8eKsiN2l1wYyKlWUw',
  secure: true
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {Object} options - Upload options
 * @returns {Promise} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    // First, verify the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist at path: ${filePath}`);
      return {
        success: false,
        error: `File does not exist at path: ${filePath}`
      };
    }

    // Get file stats to check size
    const stats = fs.statSync(filePath);
    console.log(`File size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error('File is empty (0 bytes)');
      return {
        success: false,
        error: 'File is empty (0 bytes)'
      };
    }

    // Set default upload options
    const uploadOptions = {
      folder: options.folder || 'cvs',
      resource_type: 'auto', // Let Cloudinary detect the type
      upload_preset: 'lq4gcwkj', // Use the preset for proper upload permissions
      overwrite: true, // Overwrite existing files with the same public_id
      ...options
    };
    
    console.log('Uploading to Cloudinary with options:', JSON.stringify(uploadOptions));
    
    // For PDF files specifically, ensure correct resource_type
    if (filePath.toLowerCase().endsWith('.pdf')) {
      uploadOptions.resource_type = 'raw';
      console.log('PDF file detected, using resource_type: raw');
    }
    
    // Upload the file to Cloudinary as a Promise
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath, 
        uploadOptions, 
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            resolve({
              success: false,
              error: error.message || 'Unknown error during Cloudinary upload'
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
    console.error('Error in uploadToCloudinary:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during upload process'
    };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
