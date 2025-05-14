import Link from "next/link"
import { useRouter } from "next/router"
import { useState, useEffect, useRef } from "react"
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { getCurrentUser, clearUserData } from "../../utils/authUtils"
import axios from 'axios';
const apiUrl = process.env.NEXT_FRONT_API_URL || 'http://localhost:3000';
const percentage = 67;
export default function Sidebar() {
    const [isToggled, setToggled] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const toggleTrueFalse = () => setToggled(!isToggled);
    const router = useRouter();
    
    useEffect(() => {
        // Use our auth utility to get the current user
        const currentUser = getCurrentUser();
        if (currentUser) {
            console.log('Sidebar: Found user', currentUser.firstName, currentUser.role);
            setUser(currentUser);
        } else {
            console.warn('Sidebar: No user found in localStorage');
        }
    }, []);

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

    // Function to handle logout - directed through the Front-End logout page
    const handleLogout = async () => {
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
                // Instead of directly calling logout API, redirect to Front-End's logout page
                // This ensures the Front-End application also handles the logout properly
                
                // First clear local data
                clearUserData();
                
                // Show a brief message
                Swal.fire({
                    title: 'Logging Out...',
                    text: 'Redirecting to sign-in page',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Redirect to Front-End's logout page which will handle the API call
                // This ensures both applications are in sync
                window.location.href = `${apiUrl}/logout-redirect`;
                
            } catch (error) {
                console.error("Logout error:", error);
                
                // Fallback: clear data and redirect to signin
                clearUserData();
                window.location.href = `${apiUrl}/page-signin`;
            }
        }
    };
    
    return (
        <>
            <div className={`nav ${isToggled ? "close-nav" : ""}`}><a className={`btn btn-expanded ${isToggled ? "btn-collapsed" : ""}`} onClick={toggleTrueFalse} />
                <nav className="nav-main-menu">
                    {/* Mobile Profile Section - Only visible on smaller screens */}
                    <div className="mobile-profile d-lg-none d-block mb-20 p-3">
                        {user && (
                            <div className="d-flex align-items-center" ref={dropdownRef}>
                                <div 
                                    className="d-flex align-items-center cursor-pointer w-100" 
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
                                            marginRight: '10px'
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
                                    <div className="overflow-hidden">
                                        <strong className="color-brand-1 font-sm d-block text-truncate">{user.firstName} {user.lastName}</strong>
                                        <small className="font-xs color-text-paragraph-2 text-truncate d-block">{user.email}</small>
                                    </div>
                                    <i className="fi-rr-angle-small-down ml-auto"></i>
                                </div>
                                
                                {showDropdown && (
                                    <ul 
                                        className="dropdown-menu show" 
                                        style={{ 
                                            display: 'block',
                                            position: 'absolute',
                                            left: '20px',
                                            right: '20px',
                                            top: '100%',
                                            marginTop: '10px',
                                            backgroundColor: '#fff',
                                            borderRadius: '10px',
                                            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                                            zIndex: 1000,
                                            padding: '10px 0'
                                        }}
                                    >
                                        <li>
                                            <Link href="/profile" className="dropdown-item d-flex align-items-center px-3 py-2">
                                                <i className="fi-rr-user mr-2"></i> My Profile
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/GeneralSettings" className="dropdown-item d-flex align-items-center px-3 py-2">
                                                <i className="fi-rr-settings mr-2"></i> Settings
                                            </Link>
                                        </li>
                                        <li>
                                            <a 
                                                className="dropdown-item d-flex align-items-center px-3 py-2 text-danger" 
                                                onClick={handleLogout}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <i className="fi-rr-sign-out mr-2"></i> Logout
                                            </a>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    <ul className="main-menu">
                        {/* CANDIDATE ROLE: Candidate-specific menu items */}
                        {user && user.role && user.role.toString().toUpperCase() === 'CANDIDATE' && (
                            <>
                                <li><Link className={router.pathname === "/" ? "dashboard2 active" : "dashboard2"} href="/"><img src="/assets/imgs/page/dashboard/dashboard.svg" alt="jobBox" /><span className="name">Dashboard</span></Link></li>
                                <li><Link className={router.pathname === "/courses" ? "dashboard2 active" : "dashboard2"} href="/Course"><img src="/assets/imgs/page/dashboard/education.svg" alt="jobBox" /><span className="name">Courses</span></Link></li>
                                <li><Link className={router.pathname === "/my-resume" ? "dashboard2 active" : "dashboard2"} href="/my-resume"><img src="/assets/imgs/page/dashboard/cv-manage.svg" alt="jobBox" /><span className="name">My Resume</span></Link></li>
                                <li><Link className={router.pathname === "/my-applications" ? "dashboard2 active" : "dashboard2"} href="/my-applications"><img src="/assets/imgs/page/dashboard/candidates.svg" alt="jobBox" /><span className="name">My Applications</span></Link></li>
                                <li><Link className={router.pathname === "/apply-for-jobs" ? "dashboard2 active" : "dashboard2"} href="/apply-for-jobs"><img src="/assets/imgs/page/dashboard/recruiters.svg" alt="jobBox" /><span className="name">Apply for Job</span></Link></li>
                                <li><Link className={router.pathname === "/profile" ? "dashboard2 active" : "dashboard2"} href="/profile"><img src="/assets/imgs/page/dashboard/profiles.svg" alt="jobBox" /><span className="name">My Profile</span></Link></li>
                                <li><Link className={router.pathname === "/settings" ? "dashboard2 active" : "dashboard2"} href="/settings"><img src="/assets/imgs/page/dashboard/settings.svg" alt="jobBox" /><span className="name">Settings</span></Link></li>
                            </>
                        )}
                        
                        {/* HR ROLE: HR-specific menu items */}
                        {user && user.role && user.role.toString().toUpperCase() === 'HR' && (
                            <>
                                <li><Link className={router.pathname === "/" ? "dashboard2 active" : "dashboard2"} href="/"><img src="/assets/imgs/page/dashboard/dashboard.svg" alt="jobBox" /><span className="name">Company Dashboard</span></Link></li>
                                <li><Link className={router.pathname === "/my-job-grid" ? "dashboard2 active" : "dashboard2"} href="/my-job-grid"><img src="/assets/imgs/page/dashboard/jobs.svg" alt="jobBox" /><span className="name">Manage Jobs</span></Link></li>
                                <li><Link className={router.pathname === "/CampanyApplications" ? "dashboard2 active" : "dashboard2"} href="/CampanyApplications"><img src="/assets/imgs/page/dashboard/candidates.svg" alt="jobBox" /><span className="name">Applications</span></Link></li>
                                <li><Link className={router.pathname === "/company-settings" ? "dashboard2 active" : "dashboard2"} href="/settings"><img src="/assets/imgs/page/dashboard/profiles.svg" alt="jobBox" /><span className="name">Company Profile</span></Link></li>
                                <li><Link className={router.pathname === "/profile" ? "dashboard2 active" : "dashboard2"} href="/profile"><img src="/assets/imgs/page/dashboard/profiles.svg" alt="jobBox" /><span className="name">My Profile</span></Link></li>
                            </>
                        )}
                        
                        {/* Default menu if no user or role not recognized */}
                        {(!user || !user.role) && (
                            <>
                                <li><Link className={router.pathname === "/" ? "dashboard2 active" : "dashboard2"} href="/"><img src="/assets/imgs/page/dashboard/dashboard.svg" alt="jobBox" /><span className="name">Dashboard</span></Link></li>
                                <li><Link className={router.pathname === "/login" ? "dashboard2 active" : "dashboard2"} href="/login"><img src="/assets/imgs/page/dashboard/login.svg" alt="jobBox" /><span className="name">Login</span></Link></li>
                            </>
                        )}
                        {user && (
                            <li onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }} className="cursor-pointer">
                                <a className="dashboard2">
                                    <img src="/assets/imgs/page/dashboard/logout.svg" alt="jobBox" />
                                    <span className="name">Logout</span>
                                </a>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="border-bottom mb-20 mt-20" />
                <div className="box-profile-completed text-center mb-30">
                    <div style={{ width: "50%", margin: "0 auto" }} className="mt-30 mb-30">
                        <CircularProgressbar
                            value={percentage}
                            text={`${percentage}%`}
                            background
                            backgroundPadding={0}
                            styles={buildStyles({
                                backgroundColor: "#D8E0FD",
                                textColor: "#05264E",
                                pathColor: "#3498DB",
                                trailColor: "transparent",
                                strokeLinecap: "butt"
                            })}
                        />
                    </div>
                    <h6 className="mb-10">Profile Completed</h6>
                    <p className="font-xs color-text-mutted">Please add detailed information to your profile. This will help you
                        develop your career more quickly.</p>
                </div>
                <div className="sidebar-border-bg mt-50">
                    <span className="text-grey">WE ARE</span><span className="text-hiring">HIRING</span>
                    <p className="font-xxs color-text-paragraph mt-5">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                        Recusandae architecto
                    </p>
                    <div className="mt-15">
                        <Link className="btn btn-paragraph-2" href="#">Know More</Link>
                    </div>
                </div>
            </div>
        </>
    )
}
