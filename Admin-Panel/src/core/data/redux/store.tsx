import { configureStore } from '@reduxjs/toolkit';
import themeSettingSlice from './themeSettingSlice';
import sidebarSlice from './sidebarSlice';
import authReducer from './authSlice';

// Create the store
export const store = configureStore({
  reducer: {
    themeSetting: themeSettingSlice,
    sidebarSlice: sidebarSlice,
    auth: authReducer,
  },
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Also export as default
export default store;
