import { useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { clearUserData } from '../utils/authUtils';

/**
 * Logout Redirect Page
 * 
 * This page acts as a synchronization point between the Company Panel and Front-End apps.
 * When Company Panel redirects to this page, it:
 * 1. Calls the backend logout API to invalidate the session
 * 2. Clears local storage data
 * 3. Redirects to the sign-in page
 */
export default function LogoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Get current user to determine logout endpoint
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        
        // Call appropriate logout endpoint based on auth type
        if (user && user.googleId) {
          await axios.get("http://localhost:5000/api/users/google/logout", { withCredentials: true });
        } else if (user && user.githubId) {
          await axios.get("http://localhost:5000/api/users/github/logout", { withCredentials: true });
        } else {
          await axios.post("http://localhost:5000/api/users/signout", {}, { withCredentials: true });
        }
      } catch (error) {
        console.error("Error during logout:", error);
      } finally {
        // Always clear user data from localStorage
        clearUserData();
        
        // Redirect to sign-in page with a short delay to ensure cleanup
        setTimeout(() => {
          router.replace('/page-signin');
        }, 500);
      }
    };

    // Execute logout immediately when page loads
    handleLogout();
  }, [router]);

  return (
    <div className="container text-center py-5">
      <div className="spinner-border text-primary mb-4" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <h3>Logging you out...</h3>
      <p>Please wait while we complete the logout process.</p>
    </div>
  );
}
