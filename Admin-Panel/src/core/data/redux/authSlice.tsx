import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
  phone?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  verificationEmail: string | null;
}

interface LoginSuccessPayload {
  token: string;
  user: User;
}

// Load initial state from localStorage
const loadAuthState = (): AuthState => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      return {
        isAuthenticated: true,
        token,
        user: JSON.parse(user),
        loading: false,
        error: null,
        verificationEmail: null
      };
    }
  } catch (error) {
    // If there's an error loading from localStorage, reset the state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  return {
    isAuthenticated: false,
    token: null,
    user: null,
    loading: false,
    error: null,
    verificationEmail: null
  };
};

// Initial state
const initialState: AuthState = loadAuthState();

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<LoginSuccessPayload>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      state.verificationEmail = null;
      
      // Save to localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.verificationEmail = null;
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    setVerificationEmail: (state, action: PayloadAction<string>) => {
      state.verificationEmail = action.payload;
      state.loading = false;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
        
        // Update in localStorage
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    checkAuth: (state) => {
      // This is handled by the loadAuthState function when initializing the slice
      // We'll keep this action for components to dispatch, but no additional logic is needed here
    }
  }
});

// Export actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setVerificationEmail,
  updateUserProfile,
  checkAuth
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;
