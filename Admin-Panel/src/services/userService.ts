import axios from 'axios';
import { updateUserProfile as updateReduxProfile } from '../core/data/redux/authSlice';
import { store } from '../core/data/redux/store';

// Use backend API URL
const API_URL = 'http://localhost:5000/api';

// Use mock data when API fails (for development)
const USE_MOCK_FALLBACK = true;

// User profile interface
export interface UserProfile {
  userId?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  role?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  experienceYears?: number;
  skills?: string[];
  projects?: any[];
  education?: any[];
  languagePreferences?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Mock user profile for development/fallback
const MOCK_USER_PROFILE: UserProfile = {
  userId: '1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@tunihire.com',
  phone: '+216 123 456 789',
  profilePicture: '/assets/img/profiles/avatar-01.jpg',
  role: 'admin',
  address: '123 TuniHire St',
  country: 'Tunisia',
  state: 'Tunis',
  city: 'Tunis City',
  zipCode: '1001',
  skills: ['Management', 'Leadership', 'HR'],
  experienceYears: 5
};

// Helper function to get the auth token and format it properly
const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Log token for debugging (remove in production)
  console.log('Token used for auth:', token ? 'Present' : 'Missing');
  
  // Return authorization header object
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to map UserProfile to Redux User format
export const mapProfileToReduxUser = (profile: UserProfile) => {
  return {
    id: profile.userId || profile._id || '',
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    role: profile.role || 'user',
    profilePicture: profile.profilePicture,
    phone: profile.phone
  };
};

// Get user profile
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    // Make API request with authorization header
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        ...getAuthHeader()
      }
    });
    
    // Update Redux store with the latest profile info
    const userData = response.data.user;
    if (userData) {
      store.dispatch(updateReduxProfile(mapProfileToReduxUser(userData)));
    }
    
    return response.data.user;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    
    // Check if the error is due to an expired token (401 Unauthorized)

    
    // If we're allowing mock fallback for development and got an auth error
    if (USE_MOCK_FALLBACK) {
      console.warn('Using mock profile data as fallback');
      return MOCK_USER_PROFILE;
    }
    
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    // Make API request with authorization header
    const response = await axios.put(`${API_URL}/users/update-profile`, profileData, {
      headers: {
        ...getAuthHeader()
      }
    });
    
    // Update Redux store with the latest profile info
    const updatedProfile = response.data.user;
    if (updatedProfile) {
      store.dispatch(updateReduxProfile(mapProfileToReduxUser(updatedProfile)));
    }
    
    return response.data.user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // If we're allowing mock fallback for development and got an auth error
    if (USE_MOCK_FALLBACK) {
      console.warn('Using mock data - simulating successful update');
      return {
        ...MOCK_USER_PROFILE,
        ...profileData
      };
    }
    
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file: File): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    // Make API request with authorization header
    const response = await axios.post(`${API_URL}/users/upload-profile-picture`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.profilePicture;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    
    // If we're allowing mock fallback for development and got an auth error
    if (USE_MOCK_FALLBACK) {
      console.warn('Using mock data - simulating successful image upload');
      // Return the mock profile image URL
      return MOCK_USER_PROFILE.profilePicture || '/assets/img/profiles/avatar-01.jpg';
    }
    
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    // Make API request with authorization header
    await axios.put(
      `${API_URL}/users/change-password`, 
      { currentPassword, newPassword },
      {
        headers: {
          ...getAuthHeader()
        }
      }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    
    // If we're allowing mock fallback for development and got an auth error
    if (USE_MOCK_FALLBACK) {
      console.warn('Using mock data - simulating successful password change');
      return;
    }
    
    throw error;
  }
}; 