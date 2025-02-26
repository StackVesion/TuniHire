import Link from "next/link";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';

const Sidebar = ({ openClass }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isActive, setIsActive] = useState({
        status: false,
        key: "",
    });
    const [scroll, setScroll] = useState(0)
    const [isToggled, setToggled] = useState(false);

    useEffect(() => {
        // Load user data from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
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
                title: 'Are you sure?',
                text: 'You will be logged out of your account',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, log out!',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                // Check if user is Google-authenticated
                const isGoogleUser = user && user.googleId;
                
                if (isGoogleUser) {
                    // Google logout
                    await fetch("http://localhost:5000/api/users/google/logout", { 
                        credentials: "include"
                    });
                } else {
                    // Regular logout
                    await fetch("http://localhost:5000/api/users/signout", {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });
                }

                // Clear localStorage
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                
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
                                         <li className={isActive.key == 1 ? "has-children active" : "has-children"}>
                                            <span onClick={() => handleToggle(1)} className="menu-expand"><i className="fi-rr-angle-small-down"></i></span>

                                            <Link legacyBehavior href="/"><a className="active">Home</a></Link>

                                            <ul className={isActive.key == 1 ? "sub-menu d-block" : "sub-menu d-none"}>
                                                <li>
                                                    <Link legacyBehavior href="/"><a>Home 1</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/index-2"><a>Home 2</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/index-3"><a>Home 3</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/index-4"><a>Home 4</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/index-5"><a>Home 5</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/index-6"><a>Home 6</a></Link>
                                                    </li>
                                            </ul>
                                        </li>
                                         <li className={isActive.key == 2 ? "has-children active" : "has-children"}>
                                            <span onClick={() => handleToggle(2)} className="menu-expand"><i className="fi-rr-angle-small-down"></i></span>

                                            <Link legacyBehavior href="/jobs-grid"><a>Find a Job</a></Link>

                                            <ul className={isActive.key == 2 ? "sub-menu d-block" : "sub-menu d-none"}>
                                                <li>
                                                    <Link legacyBehavior href="/jobs-grid"><a>Jobs Grid</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/jobs-list"><a>Jobs List</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/job-details"><a>Jobs Details</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/job-details-2"><a>Jobs Details 2            </a></Link>
                                                    </li>
                                            </ul>
                                        </li>
                                         <li className={isActive.key == 3 ? "has-children active" : "has-children"}>
                                            <span onClick={() => handleToggle(3)} className="menu-expand"><i className="fi-rr-angle-small-down"></i></span>

                                            <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>

                                            <ul className={isActive.key == 3 ? "sub-menu d-block" : "sub-menu d-none"}>
                                                <li>
                                                    <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/company-details"><a>Company Details</a></Link>
                                                    </li>
                                            </ul>
                                        </li>
                                         <li className={isActive.key == 4 ? "has-children active" : "has-children"}>
                                            <span onClick={() => handleToggle(4)} className="menu-expand"><i className="fi-rr-angle-small-down"></i></span>

                                            <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>

                                            <ul className={isActive.key == 4 ? "sub-menu d-block" : "sub-menu d-none"}>
                                                <li>
                                                    <Link legacyBehavior href="/candidates-grid"><a>Candidates Grid</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/candidate-details"><a>Candidate Details</a></Link>
                                                    </li>
                                            </ul>
                                        </li>
                                         <li className={isActive.key == 5 ? "has-children active" : "has-children"}>
                                            <span onClick={() => handleToggle(5)} className="menu-expand"><i className="fi-rr-angle-small-down"></i></span>

                                            <Link legacyBehavior href="/blog-grid"><a>Pages</a></Link>

                                            <ul className={isActive.key == 5 ? "sub-menu d-block" : "sub-menu d-none"}>
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
                                                    <Link legacyBehavior href="/page-register"><a>Register</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-signin"><a>Signin</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-reset-password"><a>Reset Password</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/page-content-protected"><a>Content Protected</a></Link>
                                                    </li>
                                            </ul>
                                        </li>
                                         <li className={isActive.key == 6 ? "has-children active" : "has-children"}>
                                            <span onClick={() => handleToggle(6)} className="menu-expand"><i className="fi-rr-angle-small-down"></i></span>

                                            <Link legacyBehavior href="/blog-grid"><a>Blog</a></Link>

                                            <ul className={isActive.key == 6 ? "sub-menu d-block" : "sub-menu d-none"}>
                                                <li>
                                                    <Link legacyBehavior href="/blog-grid"><a>Blog Grid</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/blog-grid-2"><a>Blog Grid 2</a></Link>
                                                    </li>
                                                <li>
                                                    <Link legacyBehavior href="/blog-details"><a>Blog Single</a></Link>
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
                                        <Link legacyBehavior href="#"><a className="sidebar-link"><i className="fi-rr-settings me-2 animate__animated animate__pulse"></i>Account Settings</a></Link>
                                    </li>
                                    <li>
                                        <Link legacyBehavior href="/candidate-profile"><a className="sidebar-link"><i className="fi-rr-user me-2 animate__animated animate__pulse"></i>My Profile</a></Link>
                                    </li>
                                    <li>
                                        <a href="#" onClick={handleLogout} className="sidebar-link"><i className="fi-rr-sign-out me-2 animate__animated animate__pulse"></i>Sign Out</a>
                                    </li>
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
                }
                
                .sidebar-link:hover {
                    transform: translateX(5px);
                }
                
                .animate__pulse {
                    animation-duration: 3s;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </>
    );
};

export default Sidebar;