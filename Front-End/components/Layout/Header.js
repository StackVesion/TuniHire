/* eslint-disable @next/next/no-html-link-for-pages */
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const Header = ({handleOpen,handleRemove,openClass}) => {
    const [scroll, setScroll] = useState(false);
    const [isToggled, setToggled] = useState(false);
    const [user, setUser] = useState(null); 
    const router = useRouter();

    const handleToggle = () => setToggled(!isToggled);

    useEffect(() => {
        document.addEventListener("scroll", () => {
          const scrollCheck = window.scrollY > 100;
          if (scrollCheck !== scroll) {
            setScroll(scrollCheck);
          }
        });

        // Load user data from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [scroll]);

    const handleLogout = async () => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");

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
                    await axios.get("http://localhost:5000/api/users/google/logout", { withCredentials: true });
                } else if (user && user.githubId) {
                    // GitHub logout
                    await axios.get("http://localhost:5000/api/users/github/logout", { withCredentials: true });
                } else {
                    // Regular logout
                    await axios.post("http://localhost:5000/api/users/signout", {}, { withCredentials: true });
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
                router.push('/page-signin');
            } catch (error) {
                console.error("Logout error:", error);
                
                // If the logout API call fails, still clear localStorage and redirect
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                
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
                                    <li className="has-children">
                                    <Link legacyBehavior href="/"><a className="active">Home</a></Link>

                                        <ul className="sub-menu">
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
                                    <li className="has-children">
                                        <Link legacyBehavior href="/jobs-grid"><a>Find a Job</a></Link>

                                        <ul className="sub-menu">
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
                                                <Link legacyBehavior href="/job-details-2"><a>Jobs Details 2</a></Link>
                                            </li>
                                        </ul>
                                    </li>
                                    <li className="has-children">
                                        <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>

                                        <ul className="sub-menu">
                                            <li>
                                                <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/company-details"><a>Company Details</a></Link>
                                            </li>
                                        </ul>
                                    </li>
                                    <li className="has-children">
                                        <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>

                                        <ul className="sub-menu">
                                            <li>
                                                <Link legacyBehavior href="/candidates-grid"><a>Candidates Grid</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/candidate-details"><a>Candidate Details</a></Link>
                                            </li>
                                            <li>
                                                <Link legacyBehavior href="/candidate-profile"><a>Candidate Profile</a></Link>
                                            </li>
                                        </ul>
                                    </li>
                                    <li className="has-children">
                                        <Link legacyBehavior href="/blog-grid"><a>Pages</a></Link>

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
                                    <li className="has-children">
                                        <Link legacyBehavior href="/blog-grid"><a>Blog</a></Link>

                                        <ul className="sub-menu">
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
                            <div className={`burger-icon burger-icon-white ${openClass && "burger-close"}`} 
                            onClick={()=>{handleOpen(); handleRemove()}}>
                                <span className="burger-icon-top" /><span className="burger-icon-mid" /><span className="burger-icon-bottom" /></div>
                        </div>
                        <div className="header-right">
                            <div className="block-signin">
                                {user ? (
                                    <div className="user-info d-flex align-items-center">
                                        <Link legacyBehavior href="/candidate-profile">
                                            <a className="btn-icon-profile me-3" title="Profile">
                                                <i className="fi-rr-user icon-profile animate__animated animate__pulse"></i>
                                            </a>
                                        </Link>
                                        <button 
                                            onClick={handleLogout} 
                                            className="btn-icon-logout" 
                                            title="Logout"
                                        >
                                            <i className="fi-rr-sign-out icon-logout animate__animated animate__pulse"></i>
                                        </button>
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
                                        <li className="has-children">
                                            <Link legacyBehavior href="/"><a className="active">Home</a></Link>

                                            <ul className="sub-menu">
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
                                        <li className="has-children">
                                            <Link legacyBehavior href="/jobs-grid"><a>Find a Job</a></Link>

                                            <ul className="sub-menu">
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
                                                    <Link legacyBehavior href="/job-details-2"><a>Jobs Details 2</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>

                                            <ul className="sub-menu">
                                                <li>
                                                    <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/company-details"><a>Company Details</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>

                                            <ul className="sub-menu">
                                                <li>
                                                    <Link legacyBehavior href="/candidates-grid"><a>Candidates Grid</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/candidate-details"><a>Candidate Details</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/blog-grid"><a>Pages</a></Link>

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
                                        <li className="has-children">
                                            <Link legacyBehavior href="/blog-grid"><a>Blog</a></Link>

                                            <ul className="sub-menu">
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
                                        <li className="has-children">
                                            <Link legacyBehavior href="/"><a className="active">Home</a></Link>

                                            <ul className="sub-menu">
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
                                        <li className="has-children">
                                            <Link legacyBehavior href="/jobs-grid"><a>Find a Job</a></Link>

                                            <ul className="sub-menu">
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
                                                    <Link legacyBehavior href="/job-details-2"><a>Jobs Details 2</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>

                                            <ul className="sub-menu">
                                                <li>
                                                    <Link legacyBehavior href="/companies-grid"><a>Recruiters</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/company-details"><a>Company Details</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/candidates-grid"><a>Candidates</a></Link>

                                            <ul className="sub-menu">
                                                <li>
                                                    <Link legacyBehavior href="/candidates-grid"><a>Candidates Grid</a></Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="/candidate-details"><a>Candidate Details</a></Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="has-children">
                                            <Link legacyBehavior href="/blog-grid"><a>Pages</a></Link>

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
                                        <li className="has-children">
                                            <Link legacyBehavior href="/blog-grid"><a>Blog</a></Link>

                                            <ul className="sub-menu">
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
                }
            `}</style>
        </>
    );
};

export default Header;