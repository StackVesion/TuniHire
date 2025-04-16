const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dockqbc5i',
  api_key: process.env.CLOUDINARY_API_KEY || '329791328233327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Tld-iBuXfW8eKsiN2l1wYyKlWUw'
});

// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tunihire-cvs',
    allowed_formats: ['pdf']
  }
});

// Initialize multer upload for PDFs
const uploadPdf = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});

// Function to upload a file directly to Cloudinary
const uploadToCloudinary = async (fileBuffer, filename) => {
  try {
    // Upload the file to Cloudinary using a data URI
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:application/pdf;base64,${fileBuffer.toString('base64')}`,
        {
          folder: 'tunihire-cvs',
          public_id: filename,
          resource_type: 'raw',
          format: 'pdf'
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Function to upload a file from a URL to Cloudinary
const uploadFromUrl = async (url, filename) => {
  try {
    // Upload the file from a URL to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        url,
        {
          folder: 'tunihire-cvs',
          public_id: filename,
          resource_type: 'raw',
          format: 'pdf'
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload from URL error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadPdf,
  uploadToCloudinary,
  uploadFromUrl
};
