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

// Clear user data from localStorage
export const clearUserData = () => {
  try {
    localStorage.removeItem('token');
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
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Get base API URL - allows for configurable endpoints
export const getBaseUrl = () => {
  // Could be extended to use environment variables if available
  return 'http://localhost:5000';
};

// Create pre-configured axios instance with auth headers
export const createAuthAxios = () => {
  const token = getToken();
  const instance = axios.create({
    baseURL: getBaseUrl(),
    timeout: 10000, // 10 second timeout
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  
  // Add response interceptor for handling 401/403 errors globally
  instance.interceptors.response.use(
    response => response,
    error => {
      // Don't automatically logout on network errors
      if (error.code === 'ERR_NETWORK') {
        console.warn('Network error occurred. Will try again later.');
        return Promise.reject(error);
      }
      
      // Only clear user data on auth errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication error, clearing session');
        clearUserData();
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};
