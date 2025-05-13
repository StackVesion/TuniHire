const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const config = require('../config/config');

// Use environment-specific configuration
require('../config/environment');

// Configuration for AI service
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const USE_AI_SERVICE = process.env.USE_AI_SERVICE === 'true';

/**
 * Service to connect to external AI service for advanced NLP analysis
 */
class AiServiceConnector {
  constructor() {
    this.baseUrl = AI_SERVICE_URL;
    console.log(`AI Service connector initialized with URL: ${this.baseUrl}`);
    
    // Endpoints configuration
    this.endpoints = {
      health: '/api/health',
      standardAts: '/api/ats/analyze-resume',
      ats2025: '/api/ats2025/analyze-resume'
    };
  }

  /**
   * Send a resume to AI service for analysis
   * @param {String} filePath Path to the resume file
   * @param {Object} jobData Job description data for comparison
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeResumeWithAI(filePath, jobData) {
    try {
      // First try ATS 2025 service
      const ats2025Available = await this.isEndpointAvailable(this.endpoints.ats2025);
      
      if (ats2025Available) {
        console.log('Using ATS 2025 service for advanced analysis');
        try {
          const result = await this.analyzeWithATS2025(filePath, jobData);
          if (result.success) {
            return result;
          }
        } catch (ats2025Error) {
          console.warn('ATS 2025 analysis failed, falling back to standard ATS:', ats2025Error.message);
        }
      }
      
      // Fall back to standard ATS service
      const standardAtsAvailable = await this.isEndpointAvailable(this.endpoints.standardAts);
      
      if (standardAtsAvailable) {
        console.log('Using standard ATS service for analysis');
        return this.analyzeWithStandardATS(filePath, jobData);
      }
      
      console.warn('No ATS service endpoints available');
      return {
        success: false,
        error: 'No ATS service endpoints available',
        aiServiceAvailable: false
      };
    } catch (error) {
      console.error('Error calling AI service:', error.message);
      
      // If the AI service is unavailable, we can still return the local analysis
      return {
        success: false,
        error: `AI service error: ${error.message}`,
        aiServiceAvailable: false
      };
    }
  }
  
  /**
   * Analyze resume with ATS 2025 advanced service
   * @param {String} filePath Path to the resume file
   * @param {Object} jobData Job description data for comparison
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeWithATS2025(filePath, jobData) {
    if (!fs.existsSync(filePath)) {
      return { 
        success: false, 
        error: 'File not found' 
      };
    }

    // Create form data with the resume file
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(filePath));
    
    // Add job data for comparison
    if (jobData) {
      formData.append('job_data', JSON.stringify({
        title: jobData.title || '',
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        skills: jobData.skills || []
      }));
    }

    // Add analysis level for 2025 service
    formData.append('analysis_level', 'comprehensive');

    // Call the ATS 2025 service
    const response = await axios.post(
      `${this.baseUrl}${this.endpoints.ats2025}`, 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json',
          'Authorization': 'Bearer dummy-token'
        },
        timeout: 60000 // 60 seconds timeout for comprehensive analysis
      }
    );

    if (response.status === 200 && response.data) {
      return {
        success: true,
        aiAnalysis: response.data,
        usingAiService: true,
        atsVersion: '2025'
      };
    } else {
      console.error('Error from ATS 2025 service:', response.status, response.data);
      return {
        success: false,
        error: 'ATS 2025 service returned an error'
      };
    }
  }
  
  /**
   * Analyze resume with standard ATS service
   * @param {String} filePath Path to the resume file
   * @param {Object} jobData Job description data for comparison
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeWithStandardATS(filePath, jobData) {
    if (!fs.existsSync(filePath)) {
      return { 
        success: false, 
        error: 'File not found' 
      };
    }

    // Create form data with the resume file
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(filePath));
    
    // Add job data for comparison
    if (jobData) {
      formData.append('job_data', JSON.stringify({
        title: jobData.title || '',
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        skills: jobData.skills || []
      }));
    }

    // Call the standard ATS service
    const response = await axios.post(
      `${this.baseUrl}${this.endpoints.standardAts}`, 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json',
          'Authorization': 'Bearer dummy-token'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    if (response.status === 200 && response.data) {
      return {
        success: true,
        aiAnalysis: response.data,
        usingAiService: true,
        atsVersion: 'standard'
      };
    } else {
      console.error('Error from standard ATS service:', response.status, response.data);
      return {
        success: false,
        error: 'Standard ATS service returned an error'
      };
    }
  }

  /**
   * Analyze a resume by application ID
   * @param {String} applicationId The application ID
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeResumeById(applicationId) {
    try {
      console.log(`Analyzing resume for application ${applicationId} using AI service`);
      
      // Call the AI service endpoint that handles analysis by ID
      const response = await axios.get(
        `${this.baseUrl}${this.endpoints.standardAts}/${applicationId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer dummy-token'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (response.status === 200 && response.data) {
        console.log('Successfully received analysis from AI service');
        return {
          success: true,
          analysis: response.data.data,
          usingAiService: true
        };
      } else {
        console.error('Error from AI service:', response.status, response.data);
        return {
          success: false,
          error: 'AI service returned an error'
        };
      }
    } catch (error) {
      console.error('Error calling AI service for application ID analysis:', error.message);
      
      // Return detailed error information
      return {
        success: false,
        error: `AI service error: ${error.message}`,
        aiServiceAvailable: false
      };
    }
  }

  /**
   * Check if a specific endpoint is available
   * @param {String} endpoint Endpoint path to check
   * @returns {Promise<Boolean>} True if available, false otherwise
   */
  async isEndpointAvailable(endpoint) {
    try {
      // For health endpoint, we can use GET
      if (endpoint === this.endpoints.health) {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, { timeout: 5000 });
        return response.status === 200;
      }
      
      // For other endpoints, we'll use OPTIONS to check availability
      const response = await axios.options(`${this.baseUrl}${endpoint}`, { timeout: 5000 });
      return response.status === 200 || response.status === 204;
    } catch (error) {
      console.warn(`Endpoint ${endpoint} not available:`, error.message);
      return false;
    }
  }

  /**
   * Check if AI service is available
   * @returns {Promise<Boolean>} True if available, false otherwise
   */
  async isAvailable() {
    try {
      // Check health endpoint first
      const healthAvailable = await this.isEndpointAvailable(this.endpoints.health);
      if (healthAvailable) {
        return true;
      }
      
      // If health endpoint is not available, check if any ATS endpoints are available
      const ats2025Available = await this.isEndpointAvailable(this.endpoints.ats2025);
      if (ats2025Available) {
        return true;
      }
      
      const standardAtsAvailable = await this.isEndpointAvailable(this.endpoints.standardAts);
      return standardAtsAvailable;
    } catch (error) {
      console.warn('AI service not available:', error.message);
      return false;
    }
  }
}

module.exports = new AiServiceConnector(); 