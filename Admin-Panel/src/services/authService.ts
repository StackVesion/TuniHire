import axios from 'axios';

// Use backend API URL
const API_URL = 'http://localhost:5000/api';

// Authentication response interface
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Login function - uses your backend's signin endpoint
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_URL}/users/signin`, credentials);
    
    // Store tokens in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Check if user is authenticated by checking for token
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Get the authorization header for API requests
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get current user info from token
export const getCurrentUser = (): { userId: string; email: string; role: string } | null => {
  const token = localStorage.getItem('token');
  
  if (!token) return null;
  
  try {
    // Decode JWT token (this is a simple decode, not verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  
  // Call backend to logout (signout)
  try {
    axios.post(`${API_URL}/users/signout`).catch(err => {
      // Ignore errors, client-side logout is more important
      console.warn('Backend logout failed, but client-side logout succeeded');
    });
  } catch (error: any) {
    console.error('Error during logout:', error);
  }
};

// Validate token function - this checks with the backend if token is still valid
export const validateToken = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  
  if (!token) return false;
  
  try {
    const response = await axios.get(`${API_URL}/users/validate-token`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.valid === true;
  } catch (error: any) {
    console.error('Token validation error:', error);
    
    // If token is invalid, clear it
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    
    return false;
  }
};

// Refresh token function
export const refreshToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) return null;
  
  try {
    const response = await axios.post(`${API_URL}/users/refresh-token`, { refreshToken });
    
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      return response.data.accessToken;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    
    // If refresh token is invalid, clear both tokens
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    
    return null;
  }
};

// Check token validity on startup
export const checkTokenValidity = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  
  if (!token) return false;
  
  try {
    // Check if token is expired by decoding (without verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const decodedToken = JSON.parse(jsonPayload);
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
    
    // If token is expired, try to refresh it
    if (expirationTime < Date.now()) {
      console.log('Token is expired, attempting to refresh');
      const newToken = await refreshToken();
      return !!newToken;
    }
    
    // If token is not expired, validate it with backend
    return await validateToken();
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

// Diagnostic function to log token info
export const debugToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found in localStorage');
    return;
  }
  
  try {
    // Send to debug endpoint
    const response = await axios.post(`${API_URL}/users/debug-token`, { token });
    console.log('Token debug info:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error debugging token:', error);
    
    // Try local debug
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Token does not appear to be a valid JWT (should have 3 parts)');
        return;
      }
      
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('Token header:', header);
      console.log('Token payload:', {
        ...payload,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none',
        iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'none',
      });
      
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('Token is expired. Expired at:', new Date(payload.exp * 1000).toISOString());
      } else if (payload.exp) {
        console.log('Token is valid. Expires at:', new Date(payload.exp * 1000).toISOString());
      } else {
        console.log('Token has no expiration claim');
      }
    } catch (parseError) {
      console.error('Error parsing token locally:', parseError);
    }
  }
}; 