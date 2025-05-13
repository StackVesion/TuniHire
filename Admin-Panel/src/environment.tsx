export const base_path ='/'
export const img_path ='/'

// Environment configuration
const environment = {
    // API Endpoints
    apiUrl: 'http://localhost:5000/api',
    dashboardApiUrl: 'http://localhost:5000/api/dashboard',
    
    // Authentication settings
    tokenKey: 'token',
    refreshTokenKey: 'refreshToken',
    
    // Other configuration
    defaultLanguage: 'en',
    defaultTheme: 'light',
    
    // Feature flags
    enableNotifications: true,
};

export default environment;
