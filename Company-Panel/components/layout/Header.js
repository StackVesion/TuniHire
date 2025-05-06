import { Menu } from '@headlessui/react'
import Link from "next/link"
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getCurrentUser, clearUserData, getToken, createAuthAxios } from '../../utils/authUtils'

// Logo style for responsive design with adaptive sizing
const getLogoStyle = (windowWidth) => {
    // Base style for all screen sizes
    const baseStyle = {
        maxWidth: '150px',
        maxHeight: '50px',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        transition: 'all 0.3s ease'
    };

    // Medium screens (tablets)
    if (windowWidth < 992 && windowWidth >= 768) {
        return {
            ...baseStyle,
            maxWidth: '120px',
            maxHeight: '40px'
        };
    }
    
    // Small screens (mobile devices)
    if (windowWidth < 768) {
        return {
            ...baseStyle,
            maxWidth: '100px',
            maxHeight: '35px'
        };
    }
    
    // Default for large screens
    return baseStyle;
}

export default function Header() {
    const [scroll, setScroll] = useState(0);
    const [user, setUser] = useState(null);
    const [companyStatus, setCompanyStatus] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [subscription, setSubscription] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();
    const authAxios = createAuthAxios();
    
    useEffect(() => {
        // Handle scroll for sticky header
        const handleScroll = () => {
            const scrollCheck = window.scrollY > 100;
            if (scrollCheck !== scroll) {
                setScroll(scrollCheck);
            }
        };

        // Handle window resize for responsive logo
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        // Add event listeners
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleResize);
        
        // Set initial window width
        setWindowWidth(window.innerWidth);
        
        // Get user data using auth utils for consistency
        const currentUser = getCurrentUser();
        if (currentUser) {
            console.log('Header: User found', currentUser.firstName, currentUser.role);
            setUser(currentUser);
            
            // Fetch company status for the user
            fetchCompanyStatus(currentUser._id);
            
            // Fetch user subscription
            fetchUserSubscription();
        }
        
        // Clean up event listeners on unmount
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    
    // Function to fetch company status for the current user
    const fetchCompanyStatus = async (userId) => {
        try {
            console.log('Fetching company status for userId:', userId);
            
            const response = await authAxios.get('/api/companies/user/my-company');
            
            console.log('Company status:', response.data);
            setCompanyStatus(response.data);
        } catch (error) {
            console.log('Error fetching company status:', error.response?.data || error.message);
            // If error is 404, it means the user doesn't have a company yet
            if (error.response && error.response.status === 404) {
                setCompanyStatus({ exists: false });
            }
        }
    };
    
    // Function to fetch user's current subscription
    const fetchUserSubscription = async () => {
        try {
            const response = await authAxios.get('/api/subscriptions/user-subscription');
            console.log('User subscription data:', response.data);
            if (response.data) {
                setSubscription(response.data);
            }
        } catch (error) {
            console.log('Error fetching subscription:', error);
            
            // If backend is unavailable, check localStorage for subscription info
            try {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                if (userData.subscription) {
                    console.log('Using subscription data from localStorage:', userData.subscription);
                    // Create a subscription object similar to what the API would return
                    setSubscription({
                        subscription: userData.subscription,
                        mockData: true,
                        pendingSync: userData.subscriptionPendingSync,
                        expiryDate: userData.subscriptionExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    });
                }
            } catch (localStorageError) {
                console.error('Error reading from localStorage:', localStorageError);
            }
        }
    };
    
    // Function to handle logout
    const handleLogout = async () => {
        try {
            // Import SweetAlert dynamically
            const Swal = (await import('sweetalert2')).default;
            
            // Confirm logout with the user
            const result = await Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to logout?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Logout',
                cancelButtonText: 'Cancel'
            });
            
            if (result.isConfirmed) {
                try {
                    // Clear any cookies by setting expiration in the past
                    document.cookie.split(";").forEach(function(c) {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });
                    
                    // Use axios with credentials for proper cookie handling
                    const axiosInstance = axios.create({
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    // Check authentication type (same as Front-End)
                    if (user && user.googleId) {
                        // Google logout
                        await axiosInstance.get("http://localhost:5000/api/users/google/logout");
                    } else if (user && user.githubId) {
                        // GitHub logout
                        await axiosInstance.get("http://localhost:5000/api/users/github/logout");
                    } else {
                        // Regular logout - use the exact same endpoint as Front-End
                        await axiosInstance.post("http://localhost:5000/api/users/signout");
                    }
                    
                    // Success message
                    Swal.fire({
                        title: 'Logged Out!',
                        text: 'You have been successfully logged out',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (error) {
                    console.error("Logout API error:", error);
                    
                    // Show a message indicating local logout only
                    Swal.fire({
                        title: 'Logged Out',
                        text: 'You have been logged out locally, but there was an issue contacting the server.',
                        icon: 'info',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } finally {
                    // Always clear localStorage data
                    localStorage.clear(); // Clear all localStorage, not just user data
                    sessionStorage.clear(); // Clear session storage too
                    
                    // Force a reload of all open windows with the same origin
                    // This ensures both apps lose their session
                    setTimeout(() => {
                        // Redirect to sign-in page on Front-End project with a forced reload
                        window.location.href = `http://localhost:3000/page-signin?forceLogout=true&timestamp=${new Date().getTime()}`;
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error during logout process:', error);
            
            // Fallback: clear all data and hard redirect
            localStorage.clear();
            sessionStorage.clear();
            
            // Use a timestamp to force a fresh load
            window.location.href = `http://localhost:3000/page-signin?forceLogout=true&timestamp=${new Date().getTime()}`;
        }
    };
    
    // Function to get subscription button style based on plan
    const getSubscriptionButtonStyle = (planName) => {
        if (!planName) return {};
        
        const baseStyle = {
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
            fontSize: '12px',
            fontWeight: '600',
            gap: '5px'
        };

        switch(planName.toString()) {
            case 'Free':
                return {
                    ...baseStyle,
                    backgroundColor: '#f1f2f6',
                    color: '#666',
                    border: '1px solid #ddd'
                };
            case 'Golden':
                return {
                    ...baseStyle,
                    backgroundColor: '#fff8e1',
                    color: '#ff9800',
                    border: '1px solid #ffca28'
                };
            case 'Platinum':
                return {
                    ...baseStyle,
                    backgroundColor: '#ecf0f1',
                    color: '#7f8c8d',
                    border: '1px solid #bdc3c7'
                };
            case 'Master':
                return {
                    ...baseStyle,
                    backgroundColor: '#fbe9e7',
                    color: '#c0392b',
                    border: '1px solid #e74c3c'
                };
            default:
                return baseStyle;
        }
    };
    
    // Function to render subscription icon based on plan using CSS instead of icon packages
    const renderSubscriptionIcon = (planName) => {
        if (!planName) return null;
        
        switch(planName.toString()) {
            case 'Free':
                return null;
            case 'Golden':
                return <div className="animate-pulse" style={{ fontSize: '18px', color: 'gold' }}>★</div>;
            case 'Platinum':
                return <div className="animate-pulse" style={{ fontSize: '18px', color: 'silver' }}>✧</div>;
            case 'Master':
                return <div className="animate-bounce" style={{ fontSize: '18px', color: '#c0392b' }}>♕</div>;
            default:
                return null;
        }
    };
    
    // Function to navigate to pricing page
    const handleGoToPricing = () => {
        router.push('/pricing');
    };
    
    // Add click outside listener to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Toggle dropdown
    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <>
            <header className={`header sticky-bar ${scroll ? "stick" : ""}`}>
                <div className="container">
                    <div className="main-header">
                        <div className="header-left">
                            <div className="header-logo">
                                <Link className="d-flex" href="/">
                                    <img 
                                        alt="TuniHire" 
                                        src="/assets/logoBanner.png" 
                                        style={getLogoStyle(windowWidth)} 
                                        className={`logo-img ${scroll ? 'logo-scrolled' : ''}`}
                                    />
                                </Link>
                            </div>
                        </div>
                        
                        <div className="header-right">
                            <div className="block-signin d-flex align-items-center">
                                {user ? (
                                    <>
                                        {/* HR ROLE: Show Post New Job button if user is HR */}
                                        {user.role && user.role.toString().toUpperCase() === 'HR' && (
                                            <Link className="btn btn-default btn-md hover-up mr-15" href="/post-job" style={{ minWidth: '160px' }}>
                                                <i className="fi-rr-briefcase mr-5"></i> Post New Job
                                            </Link>
                                        )}
                                        
                                        {/* ADMIN ROLE: Show admin dashboard if user is admin */}
                                        {user.role && user.role.toString().toUpperCase() === 'ADMIN' && (
                                            <Link className="btn btn-default btn-md hover-up mr-15" href="/dashboard" style={{ minWidth: '160px' }}>
                                                <i className="fi-rr-chart-histogram mr-5"></i> Admin Dashboard
                                            </Link>
                                        )}
                                        
                                        {/* CANDIDATE ROLE: Show Apply For Company button */}
                                        {user.role && user.role.toString().toUpperCase() === 'CANDIDATE' && (
                                            <Link className="btn btn-default btn-md hover-up mr-15" href="/apply-company" style={{ minWidth: '160px' }}>
                                                <i className="fi-rr-building mr-5"></i> Apply For Company
                                            </Link>
                                        )}
                                        
                                        {/* Subscription Plan Badge */}
                                        <div className="subscription-buttons d-flex mr-15" style={{ marginLeft: 'auto' }}>
                                            {/* Current subscription badge, clickable to redirect to pricing page */}
                                            {subscription && subscription.subscription && (
                                                <div 
                                                    className="subscription-badge"
                                                    style={{
                                                        ...getSubscriptionButtonStyle(subscription.subscription),
                                                        animation: 'fadeIn 0.5s ease-in-out',
                                                    }}
                                                    onClick={handleGoToPricing}
                                                    title="Click to upgrade your subscription"
                                                >
                                                    {renderSubscriptionIcon(subscription.subscription)}
                                                    <span>{subscription.subscription} Plan</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="member-login d-flex align-items-center">
                                            <div className="position-relative" ref={dropdownRef}>
                                                <div 
                                                    className="d-flex align-items-center cursor-pointer" 
                                                    onClick={toggleDropdown}
                                                >
                                                    <div 
                                                        className="user-avatar"
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            overflow: 'hidden',
                                                            border: '2px solid #3c65f5',
                                                            boxShadow: '0 4px 10px rgba(60,101,245,0.2)',
                                                            transition: 'all 0.3s ease',
                                                        }}
                                                    >
                                                        <img 
                                                            alt="User profile" 
                                                            src={user.profilePicture || "/assets/imgs/page/dashboard/profile.png"} 
                                                            style={{ 
                                                                objectFit: 'cover',
                                                                width: '100%',
                                                                height: '100%'
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="info-member ml-10"> 
                                                        <strong className="color-brand-1 font-sm d-block">{user.firstName} {user.lastName}</strong>
                                                        <span className="font-xs color-text-paragraph-2 icon-down">{user.email}</span>
                                                    </div>
                                                </div>
                                                
                                                {showDropdown && (
                                                    <ul 
                                                        className="dropdown-menu dropdown-menu-light dropdown-menu-end show" 
                                                        style={{ 
                                                            display: 'block',
                                                            position: 'absolute',
                                                            right: 0,
                                                            top: '100%',
                                                            marginTop: '10px',
                                                            minWidth: '200px',
                                                            padding: '10px 0',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            boxShadow: '0 5px 30px rgba(0,0,0,0.1)',
                                                            zIndex: 1000,
                                                            backgroundColor: '#fff'
                                                        }}
                                                    >
                                                        <li>
                                                            <Link className="dropdown-item" href="/profile" style={{
                                                                padding: '10px 20px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.2s ease',
                                                                display: 'block'
                                                            }}>
                                                                <i className="fi-rr-user mr-10"></i> My Profile
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link className="dropdown-item" href="/GeneralSettings" style={{
                                                                padding: '10px 20px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.2s ease',
                                                                display: 'block'
                                                            }}>
                                                                <i className="fi-rr-settings mr-10"></i> Settings
                                                            </Link>
                                                        </li>
                                                        <li style={{ borderTop: '1px solid #eee', marginTop: '5px' }}>
                                                            <a 
                                                                className="dropdown-item" 
                                                                onClick={handleLogout} 
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    padding: '10px 20px',
                                                                    fontSize: '14px',
                                                                    transition: 'all 0.2s ease',
                                                                    color: '#dc3545',
                                                                    display: 'block'
                                                                }}
                                                            >
                                                                <i className="fi-rr-sign-out mr-10"></i> Logout
                                                            </a>
                                                        </li>
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <Link href="/login" className="btn btn-default btn-md hover-up ml-20">
                                        <i className="fi-rr-user mr-5"></i> Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}
