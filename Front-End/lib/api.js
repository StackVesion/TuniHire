import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configure axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Companies API
export const getCompanies = async (filters = {}) => {
  try {
    // Convert filters to query string parameters
    const params = new URLSearchParams();
    
    if (filters.location) params.append('location', filters.location);
    if (filters.industry && filters.industry !== 'all') params.append('category', filters.industry);
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.sortBy) params.append('sort', filters.sortBy);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/companies?${queryString}` : '/companies';
    
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

// Get a single company by ID
export const getCompanyById = async (id) => {
  try {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    throw error;
  }
};

// Jobs API - simplified to use the confirmed working endpoint
// In api.js
export const getJobs = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Use the parameter name your backend expects
      if (filters.company) params.append('company', filters.company);
      // Other filters...
      
      const queryString = params.toString();
      const endpoint = queryString ? `/jobs?${queryString}` : '/jobs';
      
      console.log(`Fetching jobs from: ${endpoint}`);
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  };

// Utility to check available API routes
export const discoverApiRoutes = async () => {
  try {
    console.log('Testing available API endpoints...');
    
    // Skip trying to fetch API info from root which we know returns 404
    // Focus on testing common job-related endpoints
    const testEndpoints = [
      '/jobs', 
      '/jobPosts', 
      '/job-posts', 
      '/posts/jobs', 
      '/jobPost', 
      '/job',
      '/api/jobs'
    ];
    
    const results = {};
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await api.get(endpoint);
        results[endpoint] = `SUCCESS - ${response.status}`;
      } catch (error) {
        results[endpoint] = `ERROR - ${error.response?.status || 'Unknown'}`;
      }
    }
    
    console.table(results);
    return {
      success: true,
      message: 'API endpoints tested',
      results
    };
  } catch (error) {
    console.error('Error discovering API routes:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export default api;