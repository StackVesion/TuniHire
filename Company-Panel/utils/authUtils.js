/**
 * Authentication utilities for TuniHire
 * Provides consistent auth functions across applications
 */
import axios from 'axios';

// Get the current user from localStorage with validation
export const getCurrentUser = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) return null;
    
    // Try to parse user data
    const user = JSON.parse(userData);
    
    // Basic validation
    if (!user || !user.email || !user.role) return null;
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Save user data to localStorage
export const saveUserData = (userData, token) => {
  try {
    if (!userData || !token) return false;
    
    // Save token
    localStorage.setItem('token', token);
    
    // Store user info separately for easy access
    localStorage.setItem('user', JSON.stringify(userData));
    
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// Add refresh token handling
export const storeRefreshToken = (refreshToken) => {
  try {
    if (typeof window === 'undefined' || !refreshToken) return false;
    localStorage.setItem('refreshToken', refreshToken);
    return true;
  } catch (error) {
    console.error('Error storing refresh token:', error);
    return false;
  }
};

export const getRefreshToken = () => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

// Clear user data from localStorage
export const clearUserData = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

// Check if user has specific role(s)
export const hasUserRole = (requiredRoles) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Convert to array if it's a single role
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return roles.includes(user.role);
};

// Get token from localStorage
export const getToken = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Create authenticated axios instance with token refresh
export const createAuthAxios = () => {
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000',
  });

  // Request interceptor to add token to all requests
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle token expiration
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If error is 401 and not already retrying
      if (error.response?.status === 401 && 
          error.response?.data?.message === 'Token expired.' && 
          !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = getRefreshToken();
          
          if (!refreshToken) {
            // No refresh token available, redirect to login
            clearUserData();
            window.location.href = 'http://localhost:3000/page-signin';
            return Promise.reject(error);
          }
          
          // Call token refresh endpoint
          const response = await axios.post('http://localhost:5000/api/users/refresh-token', {
            refreshToken
          });
          
          const { accessToken } = response.data;
          
          // Update token in localStorage
          localStorage.setItem('token', accessToken);
          
          // Update authorization header and retry request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Clear user data and redirect to login
          clearUserData();
          window.location.href = 'http://localhost:3000/page-signin';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
};
