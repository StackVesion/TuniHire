import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Breadcrumb from "./Breadcrumb";
import BurgerIcon from "./BurgerIcon";
import Footer from "./Footer";
import Header from "./Header";
import MobileMenu from "./MobileMenu";
import PageHead from "./PageHead";
import Sidebar from "./Sidebar";
import { getCurrentUser, clearUserData, checkAndRefreshToken, redirectToLogin } from "../../utils/authUtils";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const apiUrll = process.env.NEXT_PUBLIC_FRONT_API_URL || 'http://localhost:3000';
const apiUrlll = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3002';

export default function Layout({ headTitle, breadcrumbTitle, breadcrumbActive, children }) {
  const [isToggled, setToggled] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const handleToggle = () => {
    setToggled(!isToggled);
    if (!isToggled) {
      document.body.classList.add("mobile-menu-active");
    } else {
      document.body.classList.remove("mobile-menu-active");
    }
  };

  // Token refresh timer
  useEffect(() => {
    // Initial token check
    checkAndRefreshToken().catch(err => console.error('Initial token check failed:', err));
    
    // Set up periodic token refresh (every 4 minutes)
    const tokenRefreshInterval = setInterval(() => {
      console.log('Running scheduled token refresh check');
      checkAndRefreshToken()
        .then(isValid => {
          if (!isValid) {
            console.warn('Token is invalid and could not be refreshed, redirecting to login');
            redirectToLogin();
          }
        })
        .catch(err => {
          console.error('Scheduled token refresh failed:', err);
        });
    }, 4 * 60 * 1000); // 4 minutes
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, []);

  useEffect(() => {
    // Verify user session and role when component mounts
    const checkUserSession = () => {
      try {
        // First, check direct localStorage before using utility
        let token = localStorage.getItem("token");
        let userData = localStorage.getItem("user");
        let currentUser = null;

        console.log('Raw token from localStorage:', token ? token.substring(0, 15) + '...' : 'none');
        console.log('Raw user data exists:', !!userData);

        if (userData) {
          try {
            currentUser = JSON.parse(userData);
            console.log('Successfully parsed user data from localStorage');
          } catch (err) {
            console.error('Failed to parse user data:', err);
          }
        }

        // As a fallback, try the utility function
        if (!currentUser) {
          console.log('Trying utility function to get user');
          currentUser = getCurrentUser();
        }

        // Show detailed debug logs for troubleshooting
        console.log('Checking session in Company-Panel Layout.js');
        console.log('Token exists:', !!token);
        console.log('User data exists:', !!currentUser);
        
        if (currentUser) {
          console.log('User details:', currentUser.firstName, currentUser.lastName, currentUser.role);
        }

        // Enhanced session validation
        if (!token) {
          console.log('No token found. Attempting to recover...');
          
          // Check if there's a token in the URL parameters (could be from a redirect)
          const urlParams = new URLSearchParams(window.location.search);
          const urlToken = urlParams.get('token');
          
          if (urlToken) {
            console.log('Found token in URL. Attempting to use it...');
            localStorage.setItem('token', urlToken);
            token = urlToken;
            
            // Try to fetch user data with this token
            fetch(`${apiUrl}/api/users/validate-token`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            .then(response => response.json())
            .then(data => {
              if (data.valid && data.user) {
                console.log('Successfully recovered session with URL token');
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                // Refresh the page without the token in URL
                window.location.href = window.location.pathname;
              } else {
                redirectToLogin();
              }
            })
            .catch(error => {
              console.error('Error validating URL token:', error);
              redirectToLogin();
            });
            return;
          } else {
            redirectToLogin();
            return;
          }
        }

        if (!currentUser) {
          console.log('No valid user data found. Trying to fetch from backend...');
          
          // Try to repair session by validating token with backend (async)
          fetch(`${apiUrl}/api/users/validate-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.valid && data.user) {
              console.log('Successfully repaired session with backend data');
              console.log('User data retrieved:', data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
              setUser(data.user);
              
              // Force a refresh to apply the new session data
              setTimeout(() => {
                window.location.reload();
              }, 500);
            } else {
              console.log('Backend could not validate token. Redirecting to login...');
              redirectToLogin();
            }
          })
          .catch(error => {
            console.error('Error validating token with backend:', error);
            redirectToLogin();
          });
          
          return;
        }

        // Set user in component state and refresh localStorage
        console.log('User info:', currentUser.firstName, currentUser.lastName, currentUser.role);
        setUser(currentUser);
        
        // Ensure localStorage is consistent
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));

        // Role-based access control
        if (currentUser.role === "admin") {
          // Admin should be on admin panel
          if (window.location.port !== "3002") {
            console.log('Admin user detected. Redirecting to admin panel...');
            // Force localStorage update for cross-domain consistency
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            window.location.href = `${apiUrlll}/`;
          }
        } else if (currentUser.role === "HR" || currentUser.role === "candidate") {
          // HR and candidate can access company panel
          console.log(`${currentUser.role} user is allowed to access company panel`);
          // Force localStorage update for cross-domain consistency
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(currentUser));
          // Stay on current page
        } else {
          // Unrecognized role, redirect to front-end
          console.log('Unrecognized role. Redirecting to front-end...');
          window.location.href = `${apiUrll}/`;
        }
      } catch (error) {
        console.error("Error in checkUserSession:", error);
        clearUserData(); // Clear any corrupted data
        setTimeout(() => {
          window.location.href = `${apiUrll}/page-signin`;
        }, 1000);
      }
    };

    // Check if we're running on the client-side before accessing localStorage
    if (typeof window !== 'undefined') {
      checkUserSession();
    }

    // Clean up function
    return () => {};
  }, []);

  // useEffect(() => {
  //   // Ensure we're running on the client where window is defined
  //   if (typeof window !== "undefined") {
  //     // Dynamically import wowjs and extract the named export WOW
  //     import("wowjs").then(({ WOW }) => {
  //       // Initialize WOW.js animations
  //       new WOW({ live: false }).init();
  //     }).catch((err) => {
  //       console.error("Failed to load WOW.js", err);
  //     });
  //   }
  // }, []);

  return (
    <>
      <PageHead headTitle={headTitle} />
      <div className="body-overlay-1" onClick={handleToggle} />
      <Header />
      <BurgerIcon handleToggle={handleToggle} isToggled={isToggled} />
      <MobileMenu handleToggle={handleToggle} isToggled={isToggled} />
      <main className="main">
        <Sidebar />
        <div className="box-content">
          {breadcrumbTitle && (
            <Breadcrumb breadcrumbTitle={breadcrumbTitle} breadcrumbActive={breadcrumbActive} />
          )}
          <div className="row">{children}</div>
          <Footer />
        </div>
      </main>
    </>
  );
}
