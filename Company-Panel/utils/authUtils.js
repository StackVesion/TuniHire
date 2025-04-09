/**
 * Authentication utilities for TuniHire
 * Provides consistent auth functions across applications
 */

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
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};
