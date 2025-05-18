/* eslint-disable @next/next/no-html-link-for-pages */
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '../../styles/dashboard-button.module.css';
import { getCurrentUser, clearUserData, createAuthAxios, getBaseUrl } from '../../utils/authUtils';

const Header = ({handleOpen,handleRemove,openClass}) => {
    const [scroll, setScroll] = useState(false);
    const [isToggled, setToggled] = useState(false);
    const [user, setUser] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);
    const router = useRouter();

    const handleToggle = () => setToggled(!isToggled);

    useEffect(() => {
        // Scroll event listener
        document.addEventListener("scroll", () => {
          const scrollCheck = window.scrollY > 100;
          if (scrollCheck !== scroll) {
            setScroll(scrollCheck);
          }
        });
        
        // Close profile dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);

        // First, set user from localStorage immediately
        const currentUser = getCurrentUser();
        if (currentUser) {
            console.log("User found in localStorage:", currentUser.firstName, currentUser.role);
            setUser(currentUser);
        }

        // Then validate the token with the server
        const validateUserSession = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No token found in localStorage");
                setUser(null);
                return;
            }
            
            // Get the authAxios instance for making requests
            const authAxios = createAuthAxios();
            
            try {
                console.log("Validating token with server...");
                // Use authAxios which handles network errors gracefully
                const response = await authAxios.get("/api/users/validate-token");
                
                if (response.data.valid) {
                    console.log("Token validated by server");
                    // If user state isn't already set, set it now
                    if (!user) {
                        const storedUser = getCurrentUser();
                        if (storedUser) {
                            console.log("Setting user state from valid token:", storedUser.firstName, storedUser.role);
                            setUser(storedUser);
                        }
                    }
                } else {
                    console.warn("Server says token is invalid");
                    // Clear invalid session
                    clearUserData();
                    setUser(null);
                }
            } catch (error) {
                // Log the error but don't clear user data for network errors
                console.error("Token validation error:", error);
                
                if (error.code === 'ERR_NETWORK') {
                    console.warn('Network error occurred during token validation. Using cached user data.');
                    // Keep existing user data from localStorage for better UX during network issues
                    if (!user) {
                        const storedUser = getCurrentUser();
                        if (storedUser) setUser(storedUser);
                    }
                }
                // Note: Auth errors (401/403) are already handled by the authAxios interceptor
            }
        };
        
        validateUserSession();

        return () => {
            document.removeEventListener("scroll", () => {});
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        const user = getCurrentUser();
        const authAxios = createAuthAxios();
        const baseUrl = getBaseUrl();

        // Confirm logout
        const Swal = (await import('sweetalert2')).default;
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
                // Check authentication type
                if (user && user.googleId) {
                    // Google logout
                    await authAxios.get("/api/users/google/logout", { withCredentials: true });
                } else if (user && user.githubId) {
                    // GitHub logout
                    await authAxios.get("/api/users/github/logout", { withCredentials: true });
                } else {
                    // Regular logout
                    await authAxios.post("/api/users/signout", {}, { withCredentials: true });
                }

                // Clear localStorage using auth utility
                clearUserData();
                setUser(null);
                
                // Show success message
                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Redirect to sign-in page
                router.push('/page-signin');
            } catch (error) {
                console.error("Logout error:", error);
                
                // If the logout API call fails, still clear localStorage and redirect
                clearUserData();
                setUser(null);
                
                Swal.fire({
                    title: 'Logged Out',
                    text: 'You have been logged out, but there was an issue contacting the server.',
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                router.push('/page-signin');
            }
        }
    };

    const handleFaceLogout = async () => {
        const authAxios = createAuthAxios();
        const Swal = (await import('sweetalert2')).default;
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
                await authAxios.post("/api/users/signout", {}, { withCredentials: true });
                // Use our clearUserData utility instead of direct localStorage calls
                clearUserData();
                setUser(null);
                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                router.push('/page-signin');
            } catch (error) {
                console.error("Logout error:", error);
                // Use our clearUserData utility instead of direct localStorage calls
                clearUserData();
                setUser(null);
                Swal.fire({
                    title: 'Logged Out',
                    text: 'You have been logged out, but there was an issue contacting the server.',
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false
                });
                router.push('/page-signin');
            }
        }
    };

    return (
        <>
            <header className={scroll ? "header sticky-bar stick" : "header sticky-bar"}>
                <div className="container">
                    <div className="main-header">
                        <div className="header-left">
                            <div className="header-logo">
                            <Link legacyBehavior href="/"><a className="d-flex"><img alt="jobBox" src="assets/imgs/template/jobhub-logo.svg" /></a></Link>
                            </div>
                        </div>
                        <div className="header-nav">
                            <nav className="nav-main-menu">
                                <ul className="main-menu">
                                <li>
                                        <Link legacyBehavior href="/"><a>Home</a></Link>
                                </li>
                                <li>
                                        <Link 
                                            legacyBehavior 
                                            href={{
                                                pathname: '/jobs-grid',
                                                query: {}
                                            }}
                                        >
                                            <a>Find a Job</a>
                                        </Link>
                                </li>
                                <li>
                                        <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                </li>
                                <li>
                                        <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>
                                </li>
                                <li>
                                        <Link legacyBehavior href="/blog-grid"><a>Community</a></Link>
                                </li>
                                    <li className="has-children">
                                        <Link legacyBehavior href="/page-about"><a>About</a></Link>

                                        <ul className="sub-menu">
                                            <li>
                                                <Link legacyBehavior href="/page-about"><a>About Us</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/page-pricing"><a>Pricing Plan</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/page-contact"><a>Contact Us</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/page-content-protected"><a>Content Protected</a></Link>
                                            </li>
                                        </ul>
                                    </li>
                                    
                                    <li>
                                        <Link legacyBehavior href="/page-contact"><a>Contact</a></Link>
                                    </li>
                                </ul>
                            </nav>
                            <div className={`burger-icon burger-icon-white ${openClass && "burger-close"}`} 
                            onClick={()=>{handleOpen(); handleRemove()}}>
                                <span className="burger-icon-top" /><span className="burger-icon-mid" /><span className="burger-icon-bottom" /></div>
                        </div>
                        <div className="header-right">
                            <div className="block-signin">
                                {user ? (
                                    <div className="user-info d-flex align-items-center">
                                        {/* Dashboard button for HR role */}
                                        {(user.role && (user.role.toString().toUpperCase() === 'HR')) && (
                                            <a 
                                                onClick={() => {
                                                    // Use auth utilities to get and verify the user
                                                    const currentUser = getCurrentUser();
                                                    const token = localStorage.getItem('token');
                                                    if (token && currentUser) {
                                                        console.log('Redirecting HR user to company panel');
                                                        // Pass token in URL for better cross-domain persistence
                                                        window.location.href = `http://localhost:3001?token=${token}`;
                                                    } else {
                                                        console.error('No valid session found');
                                                        router.push('/page-signin');
                                                    }
                                                }} 
                                                className="btn btn-sm btn-primary me-2"
                                                style={{ borderRadius: '5px' }}
                                            >
                                                <i className="fi-rr-building me-1"></i> My Company
                                            </a>
                                        )}
                                        
                                        {(user.role === 'candidate' || user.role === 'Candidate') && (
                                            <a 
                                                onClick={() => {
                                                    const currentUser = getCurrentUser();
                                                    const token = localStorage.getItem('token');
                                                    if (token && currentUser) {
                                                        window.location.href = `http://localhost:3001/?token=${token}`;
                                                    } else {
                                                        router.push('/page-signin');
                                                    }
                                                }} 
                                                className="btn btn-sm btn-primary me-2"
                                                style={{ borderRadius: '5px' }}
                                            >
                                                <i className="fi-rr-dashboard me-1"></i> Dashboard
                                            </a>
                                        )}
                                        
                                        {(user.role === 'admin' || user.role === 'Admin') && (
                                            <a 
                                                onClick={() => {
                                                    const currentUser = getCurrentUser();
                                                    const token = localStorage.getItem('token');
                                                    if (token && currentUser) {
                                                        window.location.href = `http://localhost:3002/?token=${token}`;
                                                    } else {
                                                        router.push('/page-signin');
                                                    }
                                                }} 
                                                className="btn btn-sm btn-primary me-2"
                                                style={{ borderRadius: '5px' }}
                                            >
                                                <i className="fi-rr-dashboard me-1"></i> Dashboard
                                            </a>
                                        )}
                                        
                                        {/* Fallback button if needed - defaults to Dashboard text */}
                                        {!(user.role && (user.role.toString().toUpperCase() === 'HR') || 
                                          user.role === 'candidate' || user.role === 'Candidate' || 
                                          user.role === 'admin' || user.role === 'Admin') && (
                                            <a 
                                                onClick={() => {
                                                    const currentUser = getCurrentUser();
                                                    const token = localStorage.getItem('token');
                                                    if (token && currentUser) {
                                                        window.location.href = `http://localhost:3001?token=${token}`;
                                                    } else {
                                                        router.push('/page-signin');
                                                    }
                                                }}
                                                className="btn btn-sm btn-primary me-2"
                                                style={{ borderRadius: '5px' }}
                                            >
                                                <i className="fi-rr-dashboard me-1"></i> Dashboard
                                            </a>
                                        )}
                                        
                                        {/* Profile picture with dropdown menu */}
                                        <div className="position-relative" ref={profileDropdownRef}>
                                            <div 
                                                className="rounded-circle overflow-hidden border border-2 border-primary cursor-pointer" 
                                                style={{ width: '45px', height: '45px', cursor: 'pointer' }}
                                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                            >
                                                {user.profilePicture ? (
                                                    <img 
                                                        src={user.profilePicture} 
                                                        alt={user.firstName} 
                                                        className="w-100 h-100 object-cover"
                                                    />
                                                ) : (
                                                    <div 
                                                        className="w-100 h-100 d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
                                                    >
                                                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                )}
                                            </div>

                                             {/* Dropdown Menu */}
                                            {showProfileDropdown && (
                                                <div className="dropdown-profile-menu">
                                                    <div className="dropdown-header p-3 border-bottom text-center">
                                                        <strong>{user.firstName} {user.lastName}</strong>
                                                        <p className="small text-muted mb-0">{user.email}</p>
                                                        <span className="badge bg-light text-dark mt-1">
                                                            {user.role ? user.role.toString().toUpperCase() === 'HR' ? 'HR Manager' : 'Candidate' : 'User'}
                                                        </span>
                                                    </div>
                                                    <div className="dropdown-body p-2">
                                                        <Link legacyBehavior href="/candidate-profile">
                                                            <a className="dropdown-item py-2 px-3 rounded text-center">
                                                                <i className="fi-rr-user me-2 text-primary animate__animated animate__pulse"></i> My Profile
                                                            </a>
                                                        </Link>
                                                        <Link legacyBehavior href="/candidate-settings">
                                                            <a className="dropdown-item py-2 px-3 rounded text-center">
                                                                <i className="fi-rr-settings me-2 text-primary animate__animated animate__pulse"></i> Settings
                                                            </a>
                                                        </Link>
                                                        <hr className="dropdown-divider my-2" />
                                                        <button 
                                                            onClick={user.faceId ? handleFaceLogout : handleLogout} 
                                                            className="dropdown-item py-2 px-3 rounded text-center text-danger"
                                                        >
                                                            <i className="fi-rr-sign-out me-2 text-primary animate__animated animate__pulse"></i> Logout
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Link legacyBehavior href="page-register"><a className="text-link-bd-btom hover-up">Register</a></Link>
                                        <Link legacyBehavior href="page-signin"><a className="btn btn-default btn-shadow ml-40 hover-up">Sign in</a></Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <div className="mobile-header-active mobile-header-wrapper-style perfect-scrollbar">
                <div className="mobile-header-wrapper-inner">
                    <div className="mobile-header-content-area">
                        <div className="perfect-scroll">
                            <div className="mobile-search mobile-header-border mb-30">
                                <form action="#">
                                    <input type="text" placeholder="Search…" /><i className="fi-rr-search" />
                                </form>
                            </div>
                            <div className="mobile-menu-wrap mobile-header-border">
                                {/* mobile menu start*/}
                                <nav>
                                    <ul className="mobile-menu font-heading">
                                        <li>
                                            <Link legacyBehavior href="/"><a>Home</a></Link>
                                        </li>
                                        <li>
                                            <Link 
                                                legacyBehavior 
                                                href={{
                                                    pathname: '/jobs-grid',
                                                    query: {}
                                                }}
                                            >
                                                <a>Find a Job</a>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/blog-grid"><a>Community</a></Link>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/blog-grid"><a>About</a></Link>

                                            <ul className="sub-menu">
                                                <li>
                                                    <Link legacyBehavior href="/page-about"><a>About us</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-pricing"><a>Pricing Plan</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-contact"><a>Contact Us</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-content-protected"><a>Content Protected</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/page-contact"><a>Contact</a></Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                            <div className="mobile-account">
                                <h6 className="mb-10">Your Account</h6>
                                <ul className="mobile-menu font-heading">
                                    <li>
                                        <Link legacyBehavior href="#"><a>Profile</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="#"><a>Work Preferences</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="#"><a>Account Settings</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="#"><a>Go Pro</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="/page-signin"><a>Sign Out</a></Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="site-copyright">Copyright 2022 &copy; TuniHire. <br />Designed by StackVision.</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mobile-header-active mobile-header-wrapper-style perfect-scrollbar">
                <div className="mobile-header-wrapper-inner">
                    <div className="mobile-header-content-area">
                        <div className="perfect-scroll">
                            <div className="mobile-search mobile-header-border mb-30">
                                <form action="#">
                                    <input type="text" placeholder="Search…" /><i className="fi-rr-search" />
                                </form>
                            </div>
                            <div className="mobile-menu-wrap mobile-header-border">
                                {/* mobile menu start*/}
                                <nav>
                                    <ul className="mobile-menu font-heading">
                                    <li>
                                            <Link legacyBehavior href="/"><a>Home</a></Link>
                                        </li><li>
                                            <Link 
                                                legacyBehavior 
                                                href={{
                                                    pathname: '/jobs-grid',
                                                    query: {}
                                                }}
                                            >
                                                <a>Find a Job</a>
                                            </Link>
                                        </li><li>
                                            <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                        </li><li>
                                            <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/blog-grid"><a>Community</a></Link>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/page-about"><a>About</a></Link>

                                            <ul className="sub-menu">
                                                <li>
                                                    <Link legacyBehavior href="/page-about"><a>About Us</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-pricing"><a>Pricing Plan</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-contact"><a>Contact Us</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/page-contact"><a>Contact</a></Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                            <div className="mobile-account">
                                <h6 className="mb-10">Your Account</h6>
                                <ul className="mobile-menu font-heading">
                                    <li>
                                        <Link legacyBehavior href="#"><a>Profile</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="#"><a>Work Preferences</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="#"><a>Account Settings</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="#"><a>Go Pro</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="/page-signin"><a>Sign Out</a></Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="site-copyright">Copyright 2022 &copy; JobBox. <br />Designed by AliThemes.</div>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .btn-icon-profile, .btn-icon-logout {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .btn-icon-profile {
                    background-color: #3c65f5;
                    color: #fff;
                }
                
                .btn-icon-logout {
                    background-color: #f44336;
                    color: #fff;
                }
                
                .icon-profile, .icon-logout {
                    font-size: 18px;
                }
                
                .btn-icon-profile:hover, .btn-icon-logout:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.15);
                }
                
                .animate__pulse {
                    animation-duration: 2s;
                    animation-iteration-count: infinite;
                    animation-name: pulse;
                }
                
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
                
                .dropdown-profile-menu {
                    position: absolute;
                    right: 0;
                    top: 55px;
                    width: 280px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                }

                .dropdown-item {
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dropdown-item:hover {
                    background-color: #f8f9fa;
                    transform: scale(1.05);
                }
                
                .text-primary {
                    color: #3c65f5 !important;
                }
            `}</style>
        </>
    );
};

export default Header;