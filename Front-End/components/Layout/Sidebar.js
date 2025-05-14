import Link from "next/link";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { getCurrentUser, clearUserData } from '../../utils/authUtils';

const API_URL = process.env.NEXT_PUBLIC_COMPANY_API_URL || 'http://localhost:3001';
const API_URLL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3002';

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

    // Vérifier si on est sur la page jobs-grid
    const isJobsPage = router.pathname === '/jobs-grid';

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
                                            <Link legacyBehavior href="/">
                                                <a className={router.pathname === '/' ? 'active' : ''}>Home</a>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/jobs-grid">
                                                <a className={isJobsPage ? 'active' : ''}>Find a Job</a>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/companies-grid">
                                                <a className={router.pathname === '/companies-grid' ? 'active' : ''}>Recruiters</a>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/candidates-grid">
                                                <a className={router.pathname === '/candidates-grid' ? 'active' : ''}>Candidates</a>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/page-about">
                                                <a className={router.pathname === '/page-about' ? 'active' : ''}>About</a>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link legacyBehavior href="/page-contact">
                                                <a className={router.pathname === '/page-contact' ? 'active' : ''}>Contact</a>
                                            </Link>
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
                                                                window.location.href = `${API_URL}?token=${token}`;
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
                                            
                                            {user.role && (user.role === 'candidate' || user.role === 'Candidate') && (
                                                <li>
                                                    <a 
                                                        onClick={() => {
                                                            const token = localStorage.getItem('token');  
                                                            if (token) {
                                                                window.location.href = `${API_URLL}?token=${token}`;
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
                                            
                                            {user.role && (user.role === 'admin' || user.role === 'Admin') && (
                                                <>
                                                    <li className="admin-section">
                                                        <span className="admin-section-header">Administration</span>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="/admin">
                                                            <a className="sidebar-link">
                                                                <i className="fi-rr-dashboard me-2 text-primary"></i> Tableau de bord
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="/admin/companies">
                                                            <a className="sidebar-link">
                                                                <i className="fi-rr-building me-2 text-primary"></i> Entreprises
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="/admin/newsletters">
                                                            <a className="sidebar-link">
                                                                <i className="fi-rr-envelope me-2 text-primary"></i> Newsletters
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="/admin/courses">
                                                            <a className="sidebar-link">
                                                                <i className="fi-rr-book me-2 text-primary"></i> Cours
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="/admin/reclamations">
                                                            <a className="sidebar-link">
                                                                <i className="fi-rr-flag me-2 text-primary"></i> Réclamations
                                                            </a>
                                                        </Link>
                                                    </li>
                                                </>
                                            )}
                                            <li>
                                                <Link legacyBehavior href="/candidate-profile">
                                                    <a className={`sidebar-link ${router.pathname === '/candidate-profile' ? 'active' : ''}`}>
                                                        <i className="fi-rr-user me-2 text-primary"></i>My Profile
                                                    </a>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/candidate-settings">
                                                    <a className={`sidebar-link ${router.pathname === '/candidate-settings' ? 'active' : ''}`}>
                                                        <i className="fi-rr-settings me-2 text-primary"></i>Settings
                                                    </a>
                                                </Link>
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
                                                <Link legacyBehavior href="/page-register">
                                                    <a className={`sidebar-link ${router.pathname === '/page-register' ? 'active' : ''}`}>
                                                        <i className="fi-rr-user-add me-2 text-primary"></i>Register
                                                    </a>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/page-signin">
                                                    <a className={`sidebar-link ${router.pathname === '/page-signin' ? 'active' : ''}`}>
                                                        <i className="fi-rr-sign-in me-2 text-primary"></i>Sign In
                                                    </a>
                                                </Link>
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
                
                .sidebar-link.active {
                    background-color: rgba(60, 101, 245, 0.1);
                    font-weight: bold;
                }
                
                .text-primary {
                    color: #3c65f5 !important;
                }
                
                .admin-section {
                    margin-top: 10px;
                    margin-bottom: 5px;
                }
                
                .admin-section-header {
                    font-weight: 600;
                    color: #3c65f5;
                    font-size: 14px;
                    text-transform: uppercase;
                    padding: 8px 12px;
                    display: block;
                    border-bottom: 1px solid #e0e6f7;
                }
            `}</style>
        </>
    );
};

export default Sidebar;