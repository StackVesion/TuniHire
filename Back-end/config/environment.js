/**
 * Environment configuration
 * This file loads environment variables from .env file and sets defaults
 */
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Set environment variables
process.env.PORT = process.env.PORT || 5000;
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tunihire';
process.env.JWT_SECRET = process.env.JWT_SECRET || '129a49a5-dda6-49f9-8b5f-86a39c5cd7d9';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// AI Service Configuration
process.env.AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
process.env.USE_AI_SERVICE = process.env.USE_AI_SERVICE || 'true';

module.exports = process.env; 