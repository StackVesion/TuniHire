import Link from "next/link";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { getCurrentUser, clearUserData } from '../../utils/authUtils';

const Sidebar = ({ openClass }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isActive, setIsActive] = useState({
        status: false,
        key: "",
    });
    const [scroll, setScroll] = useState(0);
    const [isToggled, setToggled] = useState(false);

    useEffect(() => {
        // Load user data from localStorage
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    const handleToggle = (key) => {
        if (isActive.key === key) {
            setIsActive({
                status: false,
            });
        } else {
            setIsActive({
                status: true,
                key,
            });
        }
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            // Dynamically import SweetAlert2
            const Swal = (await import('sweetalert2')).default;
            
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to logout?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Logout',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                // Clear localStorage
                clearUserData();
                
                // Show success message
                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Redirect to sign-in page
                router.push("/page-signin");
            }
        } catch (error) {
            console.error("Logout error:", error);
            // If SweetAlert2 failed to load, show a basic alert
            alert('Failed to log out. Please try again.');
        }
    };

    const toggleTrueFalse = () => setToggled(!isToggled);

    return (
        <>
            <div className={`mobile-header-active mobile-header-wrapper-style perfect-scrollbar ${openClass}`}>
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
                                            <Link legacyBehavior href="/"><a className="active">Home</a></Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/jobs-grid"><a>Find a Job</a></Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/page-about"><a>About</a></Link>
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
                                    {user ? (
                                        <>
                                            {user.role && (user.role.toString().toUpperCase() === 'HR') && (
                                                <li>
                                                    <a 
                                                        onClick={() => {
                                                            const token = localStorage.getItem('token');
                                                            if (token) {
                                                                window.location.href = `http://localhost:3001?token=${token}`;
                                                            } else {
                                                                router.push('/page-signin');
                                                            }
                                                        }}
                                                        className="sidebar-link"
                                                    >
                                                        <i className="fi-rr-dashboard me-2 text-primary"></i> HR Dashboard
                                                    </a>
                                                </li>
                                            )}
                                            
                                            {user.role && (user.role === 'candidate' || user.role === 'Candidate' || 
                                              user.role === 'admin' || user.role === 'Admin') && (
                                                <li>
                                                    <a 
                                                        onClick={() => {
                                                            const token = localStorage.getItem('token');
                                                            if (token) {
                                                                window.location.href = `http://localhost:3002/?token=${token}`;
                                                            } else {
                                                                router.push('/page-signin');
                                                            }
                                                        }}
                                                        className="sidebar-link"
                                                    >
                                                        <i className="fi-rr-dashboard me-2 text-primary"></i> Dashboard
                                                    </a>
                                                </li>
                                            )}
                                            <li>
                                                <Link legacyBehavior href="/candidate-profile"><a className="sidebar-link"><i className="fi-rr-user me-2 text-primary"></i>My Profile</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/candidate-settings"><a className="sidebar-link"><i className="fi-rr-settings me-2 text-primary"></i>Settings</a></Link>
                                            </li>
                                            <li>
                                                <a href="#" onClick={handleLogout} className="sidebar-link">
                                                    <i className="fi-rr-sign-out me-2 text-primary"></i>Sign Out
                                                </a>
                                            </li>
                                        </>
                                    ) : (
                                        <>
                                            <li>
                                                <Link legacyBehavior href="/page-register"><a className="sidebar-link"><i className="fi-rr-user-add me-2 text-primary"></i>Register</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/page-signin"><a className="sidebar-link"><i className="fi-rr-sign-in me-2 text-primary"></i>Sign In</a></Link>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                            <div className="site-copyright">Copyright 2022 JobBox. Designed by AliThemes.</div>
                        </div>
                    </div>
                </div>

            </div>
            <style jsx>{`
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    transition: all 0.3s ease;
                    padding: 8px 12px;
                    border-radius: 5px;
                    cursor: pointer;
                }
                
                .sidebar-link:hover {
                    transform: translateX(5px);
                }
                
                .text-primary {
                    color: #3c65f5 !important;
                }
            `}</style>
        </>
    );
};

export default Sidebar;