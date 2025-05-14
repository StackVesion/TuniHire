const axios = require('axios');

const API_URL =  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function testEndpoints() {
  try {
    console.log('Testing health endpoint...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('Health response:', health.data);
    
    // For testing authenticated endpoints, you'd need a token
    const token = ''; // Add a valid token here
    const headers = { Authorization: `Bearer ${token}` };
    
    if (token) {
      console.log('\nTesting dashboard stats endpoint...');
      const stats = await axios.get(`${API_URL}/dashboard/stats`, { headers });
      console.log('Stats response:', stats.data);
      
      // Test other endpoints...
    } else {
      console.log('\nSkipping authenticated endpoints (no token provided)');
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
  }
}

testEndpoints();
