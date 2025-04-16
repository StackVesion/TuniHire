const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

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
    // Set default folder if not provided
    const uploadOptions = {
      folder: options.folder || 'cvs',
      resource_type: options.resource_type || 'auto',
      ...options
    };
    
    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
