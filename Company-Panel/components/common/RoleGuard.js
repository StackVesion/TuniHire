import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, clearUserData } from '../../utils/authUtils';

const API_URLL = process.env.NEXT_FRONT_API_URL || 'http://localhost:3000';
const API_URLLL= process.env.NEXT_ADMIN_API_URL || 'http://localhost:3002';
/**
 * Role-based access control component
 * Validates user has required role, redirects if unauthorized
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string | string[]} props.allowedRoles - Role(s) allowed to access the protected content
 * @param {string} [props.redirectTo='/'] - Where to redirect if unauthorized
 */
const RoleGuard = ({ children, allowedRoles, redirectTo = '/' }) => {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Check user authentication and role
    const checkAuth = () => {
      try {
        // Use our auth utility to get the current user
        const user = getCurrentUser();
        const token = localStorage.getItem('token');
        
        console.log('RoleGuard: Checking authorization');
        console.log('Token exists:', !!token);
        console.log('User exists:', !!user);
        
        if (!token || !user) {
          console.warn('RoleGuard: No valid session found');
          // Not authenticated, redirect to login
          window.location.href = `${API_URLL}/page-signin`;
          return;
        }
        
        
        // Check if user has required role
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        if (user.role && roles.includes(user.role)) {
          console.log(`RoleGuard: User role ${user.role} authorized`);
          // Force localStorage update for cross-domain consistency
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          setAuthorized(true);
        } else {
          console.log(`User role ${user.role} not allowed. Required: ${roles.join(' or ')}`);
          
          // Redirect based on role
          if (user.role === 'admin') {
            // Force localStorage update for cross-domain consistency
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            window.location.href = `${API_URLLL}/`;  
          } else if (user.role === 'HR' || user.role === 'candidate') {
            // Force localStorage update for cross-domain consistency
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            // Redirect to appropriate page within company panel
            router.push(redirectTo);
          } else {
            // Unknown role, back to main site
            window.location.href = `${API_URLL}/`;
          }
        }
      } catch (error) {
        console.error('Error checking authorization:', error);
        clearUserData(); // Clear any corrupted data
        window.location.href = `${API_URLL}/page-signin`;
      } finally {   
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [allowedRoles, redirectTo, router]);
  
  // Show loading state or render children if authorized
  if (loading) {
    return <div className="loading-container">Verifying access...</div>;
  }
  
  return authorized ? children : null;
};

export default RoleGuard;
