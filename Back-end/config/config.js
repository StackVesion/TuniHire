/**
 * Application configuration
 */
const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tunihire',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'YourSecretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // File upload configuration
  uploads: {
    baseDir: process.env.UPLOAD_DIR || 'uploads',
    resumes: process.env.RESUME_DIR || 'uploads/resumes',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  
  // External services
  services: {
    // AI service configuration
    ai: {
      url: process.env.AI_SERVICE_URL || 'http://localhost:5001',
      enabled: process.env.USE_AI_SERVICE === 'true' || false,
    },
  },
  
  // Gemini API configuration
  geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'
};

module.exports = config; 