import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const apiUrll = process.env.NEXT_PUBLIC_FRONT_API_URL || 'http://localhost:3000';

// Get auth token from localStorage
export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refreshToken');
    }
    return null;
};

// Get user data from localStorage
export const getUserData = () => {
    if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }
    return null;
};

// Save tokens and user data to localStorage
export const saveAuthData = (token, refreshToken, userData) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (userData) localStorage.setItem('userData', JSON.stringify(userData));
    }
};

// Clear auth data from localStorage
export const clearAuthData = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
    }
};

// Create an axios instance with auth token
export const createAuthenticatedAxiosInstance = () => {
    const token = getToken();
    const instance = axios.create({
        baseURL: `${apiUrl}`,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    // Add response interceptor for handling token expiration
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // If error is 401 (Unauthorized) and it's not a retry
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Try to refresh the token
                    const refreshToken = getRefreshToken();
                    if (!refreshToken) {
                        // No refresh token available, redirect to login
                        redirectToLogin();
                        return Promise.reject(error);
                    }

                    // Call refresh token endpoint
                    const response = await axios.post(`${apiUrl}/api/users/refresh-token`, {
                        refreshToken   
                    });

                    // Get new access token
                    const { accessToken } = response.data;

                    // Save the new token
                    saveAuthData(accessToken, refreshToken);

                    // Update the authorization header of the original request
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    // Retry the original request
                    return axios(originalRequest);
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    // If refresh fails, redirect to login
                    redirectToLogin();
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

// Redirect to login page
export const redirectToLogin = () => {
    clearAuthData();
    
    // Use window.location for a full page reload to ensure clean state
    if (typeof window !== 'undefined') {
        window.location.href = `${apiUrll}/page-signin`;
        
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return !!getToken();
};

// Protect routes requiring authentication
export const withAuth = (Component) => {
    const AuthComponent = (props) => {
        const router = useRouter();

        useEffect(() => {
            // Check if we're in the browser
            if (typeof window !== 'undefined') {
                // If not authenticated, redirect to login
                if (!isAuthenticated()) {
                    router.replace('/page-signin');
                }
            }
        }, []);

        // If not in browser or authenticated, render component
        return <Component {...props} />;
    };

    return AuthComponent;
};
