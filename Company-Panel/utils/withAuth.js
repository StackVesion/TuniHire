import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, saveUserData } from './authUtils';
import axios from 'axios';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const apiUrll = process.env.NEXT_FRONT_API_URL || 'http://localhost:3000';
/**
 * Higher-order component that handles authentication and role-based access
 * @param {Component} WrappedComponent - The component to wrap with authentication
 * @param {Array} allowedRoles - Optional array of roles that are allowed to access the component
 */
export default function withAuth(WrappedComponent, allowedRoles = null) {
  return function WithAuthComponent(props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
      const checkAuth = async () => {
        // Check if there's a token in the URL query params
        const { token } = router.query;
        
        if (token) {
          try {
            console.log('Token found in URL, validating with API...');
            // Validate token with the backend API
            const response = await axios.get(`${apiUrl}/api/users/me`, { 
              headers: { Authorization: `Bearer ${token}` }
            });
            
            // If token is valid, save user data and token
            if (response.data && response.data.user) {
              console.log('Token valid, saving user data:', response.data.user.firstName);
              saveUserData(response.data.user, token);
              setUser(response.data.user);
              
              // Remove token from URL by redirecting to clean URL
              router.replace('/', undefined, { shallow: true });
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error validating token:', error);
            // Continue to check local storage
          }
        }
        
        // If no token in URL or token validation failed, check localStorage
        const currentUser = getCurrentUser();
        setUser(currentUser);
        
        if (!currentUser) {
          // No user found, redirect to login
          console.log('No authenticated user found, redirecting to login');
          router.replace('/login');
          return;
        }
      
        // Normalize user role for comparison (case insensitive)
        const userRole = currentUser.role.toString().toUpperCase();
        console.log(`User authenticated with role: ${userRole}`);
        
        // Both Candidate and HR roles are allowed in Company-Panel
        // No need to redirect them, only redirect other roles to main site
        if (userRole !== 'CANDIDATE' && userRole !== 'HR') {
          console.log(`User with role ${userRole} not allowed in Company-Panel, redirecting to main site`);
          window.location.href = `${apiUrll}`;
          
          return;
        }
        
        // If specific roles are required for a page, check if user has one of them
        if (allowedRoles && allowedRoles.length > 0) {
          const normalizedAllowedRoles = allowedRoles.map(role => 
            role.toString().toUpperCase()
          );
          
          if (!normalizedAllowedRoles.includes(userRole)) {
            console.log(`User with role ${userRole} not allowed to access this page. Allowed roles: ${normalizedAllowedRoles.join(', ')}`);
            
            // If user is not allowed to access this specific page, redirect to dashboard
            router.replace('/');
            return;
          }
        }
        
        setIsLoading(false);
      };
      checkAuth();
    }, [router]); // We'll handle the token as part of router

    // Show nothing while checking authentication
    if (isLoading) {
      return <div className="preloader">
        <div className="preloader-content">
          <div className="preloader-logo">
            <img src="/assets/imgs/template/loading.gif" alt="Loading" />
          </div>
        </div>
      </div>;
    }

    // If we get here, user is authenticated and authorized
    return <WrappedComponent {...props} user={user} />;
  };
}
