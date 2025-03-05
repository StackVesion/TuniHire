import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { store } from '../data/redux/store';
import { logout } from '../data/redux/authSlice';

// Base URL config
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Clear authentication state
      store.dispatch(logout());
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    // Handle forbidden errors (403)
    if (error.response && error.response.status === 403) {
      // Possibly the user doesn't have admin privileges
      console.error('Access forbidden - insufficient privileges');
    }
    
    return Promise.reject(error);
  }
);

export default api;
