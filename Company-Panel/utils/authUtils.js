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
    // Clear all authentication-related items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    
    // Clear all localStorage items that might contain user data
    localStorage.removeItem('subscription');
    localStorage.removeItem('subscriptionExpiryDate');
    localStorage.removeItem('subscriptionPendingSync');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('lastLogin');
    
    // Clear any session storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    
    // Clear all cookies by setting expired date
    // This is crucial for shared authentication across different ports
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      // Set multiple paths to cover all bases
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.localhost`;
    }
    
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
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
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
      
      // If error is 401 (Unauthorized) and not already retrying
      if (error.response?.status === 401 && !originalRequest._retry) {
        console.log('Authentication error detected, attempting token refresh');
        originalRequest._retry = true;
        
        try {
          const refreshToken = getRefreshToken();
          
          if (!refreshToken) {
            console.log('No refresh token available, redirecting to login');
            clearUserData();
            redirectToLogin();
            return Promise.reject(error);
          }
          
          // Call token refresh endpoint
          console.log('Attempting to refresh token');
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh-token`, {
            refreshToken
          });
          
          if (response.data && response.data.token) {
            const { token, refreshToken: newRefreshToken } = response.data;
            
            console.log('Token refresh successful, updating credentials');
            
            // Update tokens in localStorage
            localStorage.setItem('token', token);
            if (newRefreshToken) {
              storeRefreshToken(newRefreshToken);
            }
            
            // Update authorization header and retry request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          } else {
            throw new Error('Invalid refresh token response');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Clear user data and redirect to login
          clearUserData();
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
};

// Helper function to redirect to the main application login page
export const redirectToLogin = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'http://localhost:3000';
  const returnUrl = encodeURIComponent(window.location.href);
  
  // Redirect to the main application's login page with return URL
  window.location.href = `${mainAppUrl}/login?returnUrl=${returnUrl}`;
};

// Function to check token expiration and proactively refresh if needed
export const checkAndRefreshToken = async () => {
  try {
    const token = getToken();
    if (!token) return false;
    
    // Decode the JWT token to check expiration
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return false;
    
    // Decode the base64 payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check if token is expired or about to expire (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = decodedPayload.exp;
    const timeToExpiry = expiryTime - currentTime;
    
    // If token is about to expire (less than 5 minutes remaining)
    if (timeToExpiry < 300 && timeToExpiry > 0) {
      console.log('Token expiring soon, refreshing proactively');
      
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh-token`, {
        refreshToken
      });
      
      if (response.data && response.data.token) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Update tokens in localStorage
        localStorage.setItem('token', token);
        if (newRefreshToken) {
          storeRefreshToken(newRefreshToken);
        }
        
        return true;
      }
    }
    
    return timeToExpiry > 0; // Return true if token is still valid
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};

// Function to handle logout and redirect to main application
export const logout = () => {
  clearUserData();
  const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'http://localhost:3000';
  window.location.href = `${mainAppUrl}/login?logout=true`;
};
