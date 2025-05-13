// Simple script to test the API endpoints
const axios = require('axios');

const testEndpoints = async () => {
  console.log('Testing API endpoints...');
  
  // Test the API server health
  try {
    console.log('Testing server health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('Health response:', healthResponse.data);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
  
  // Test the ATS 2025 analyze endpoint
  try {
    console.log('\nTesting ATS 2025 analyze endpoint...');
    const ats2025Response = await axios.post('http://localhost:5000/api/ats2025/analyze', {
      resumeText: 'Software Developer with 5 years of experience in JavaScript, React, and Node.js.',
      jobDescription: 'We are looking for a software developer with experience in JavaScript.'
    });
    console.log('ATS 2025 response status:', ats2025Response.status);
    console.log('ATS 2025 response success:', ats2025Response.data?.success);
  } catch (error) {
    console.error('ATS 2025 test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test the standard ATS analyze endpoint
  try {
    console.log('\nTesting standard ATS analyze endpoint...');
    const atsResponse = await axios.post('http://localhost:5000/api/ats/analyze', {
      resumeText: 'Software Developer with 5 years of experience in JavaScript, React, and Node.js.',
      jobDescription: 'We are looking for a software developer with experience in JavaScript.'
    });
    console.log('ATS response status:', atsResponse.status);
    console.log('ATS response success:', atsResponse.data?.success);
  } catch (error) {
    console.error('ATS test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testEndpoints(); 