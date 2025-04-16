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
    
    // Build the URL with query parameters if any
    const queryString = params.toString();
    const url = `/companies${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    const companies = response.data.companies || [];
    
    // If companies exist, fetch job counts for each company
    if (companies.length > 0) {
      // Use Promise.all to fetch job counts in parallel
      const companiesWithJobCounts = await Promise.all(
        companies.map(async (company) => {
          try {
            // Fetch jobs for this company
            const jobsResponse = await getJobsByCompany(company._id);
            // Add jobCount property based on the number of jobs
            return {
              ...company,
              jobCount: jobsResponse.jobs ? jobsResponse.jobs.length : 0
            };
          } catch (error) {
            console.error(`Error fetching jobs for company ${company._id}:`, error);
            return {
              ...company,
              jobCount: 0
            };
          }
        })
      );
      
      return {
        ...response.data,
        companies: companiesWithJobCounts
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return { companies: [] };
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
export const getJobs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.company) params.append('company', filters.company);
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.location) params.append('location', filters.location);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.minSalary) params.append('minSalary', filters.minSalary);
    if (filters.maxSalary) params.append('maxSalary', filters.maxSalary);
    if (filters.sortBy) params.append('sort', filters.sortBy);
    
    // Add page and limit for pagination
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const url = `/jobs${params.toString() ? `?${params.toString()}` : ''}`;
    console.log(`Fetching jobs from endpoint: ${url}`);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return { jobs: [] };
  }
};

// Get jobs by company ID
export const getJobsByCompany = async (companyId) => {
  try {
    if (!companyId) {
      console.warn('Company ID is missing when fetching jobs');
      return { jobs: [], success: false };
    }
    
    console.log(`Fetching jobs for company: ${companyId}`);
    const response = await api.get(`/jobs/company/${companyId}`);
    
    // Handle different response formats
    let jobs = [];
    if (Array.isArray(response.data)) {
      jobs = response.data;
    } else if (response.data.jobs) {
      jobs = response.data.jobs;
    }
    
    return { 
      jobs,
      success: true 
    };
  } catch (error) {
    console.error(`Error fetching jobs for company ${companyId}:`, error);
    return { jobs: [], success: false };
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