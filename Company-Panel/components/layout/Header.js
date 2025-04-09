import { Menu } from '@headlessui/react'
import Link from "next/link"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getCurrentUser, clearUserData } from '../../utils/authUtils'

export default function Header() {
    const [scroll, setScroll] = useState(0);
    const [user, setUser] = useState(null);
    const router = useRouter();
    
    useEffect(() => {
        document.addEventListener("scroll", () => {
            const scrollCheck = window.scrollY > 100;
            if (scrollCheck !== scroll) {
                setScroll(scrollCheck);
            }
        });
        
        // Get user data using auth utils for consistency
        const currentUser = getCurrentUser();
        if (currentUser) {
            console.log('Header: User found', currentUser.firstName, currentUser.role);
            setUser(currentUser);
        } else {
            console.warn('Header: No user found in auth utils');
            // Fallback to direct localStorage check
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    console.log('Header: Fallback user found', parsedUser.firstName, parsedUser.role);
                    setUser(parsedUser);
                } catch (err) {
                    console.error('Header: Failed to parse user data', err);
                }
            }
        }
    }, [scroll]);
    
    const handleLogout = async () => {
        try {
            // API call to logout
            await axios.post("http://localhost:5000/api/users/signout", {}, { withCredentials: true });
            
            // Clear localStorage using auth utils
            clearUserData();
            
            // Redirect to main site login page
            window.location.href = 'http://localhost:3000/page-signin';
        } catch (error) {
            console.error("Logout error:", error);
            
            // If the logout API call fails, still clear localStorage and redirect
            clearUserData();
            window.location.href = 'http://localhost:3000/page-signin';
        }
    };
    return (
        <>
            <header className={`header sticky-bar ${scroll? "stick":""}`}>
                <div className="container">
                    <div className="main-header">
                        <div className="header-left">
                            <div className="header-logo"><Link className="d-flex" href="/"><img alt="jobBox" src="assets/imgs/page/dashboard/logo.svg" /></Link></div>
                            {user && user.role && (
                                <span className="btn btn-grey-small ml-10">
                                    {user.role.toString().toUpperCase() === 'HR' ? 'HR Dashboard' : 
                                     user.role.toString().toLowerCase() === 'candidate' ? 'Candidate Area' : 
                                     'Dashboard'}
                                </span>
                            )}
                        </div>
                        <div className="header-search">
                            <div className="box-search">
                                <form>
                                    <input className="form-control input-search" type="text" name="keyword" placeholder="Search" />
                                </form>
                            </div>
                        </div>
                        <div className="header-menu d-none d-md-block">
                            <ul>
                                <li> <Link href="#">Home </Link></li>
                                <li> <Link href="#">About us </Link></li>
                                <li> <Link href="#">Contact</Link></li>
                            </ul>
                        </div>
                        <div className="header-right">
                            <div className="block-signin">
                                {/* HR: Single action button for posting jobs */}
                                {user && (user.role === 'HR' || user.role === 'hr' || user.role.toString().toUpperCase() === 'HR') && (
                                    <Link className="btn btn-default btn-md hover-up mr-15" href="/post-job" style={{ minWidth: '120px' }}>
                                        <i className="fi-rr-briefcase mr-5"></i> Post Job
                                    </Link>
                                )}
                                
                                {/* Candidate: Single action button for applying to company */}
                                {user && (user.role === 'candidate' || user.role === 'Candidate') && (
                                    <Link className="btn btn-default btn-md hover-up mr-15" href="/create-company" style={{ minWidth: '160px' }}>
                                        <i className="fi-rr-building mr-5"></i> Apply For Company
                                    </Link>
                                )}
                                <Menu as="div" className="dropdown d-inline-block">
                                    <Menu.Button as="a" className="btn btn-notify" />
                                    <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                        <li><Link className="dropdown-item active" href="#">10 notifications</Link></li>
                                        <li><Link className="dropdown-item" href="#">12 messages</Link></li>
                                        <li><Link className="dropdown-item" href="#">20 replies</Link></li>
                                    </Menu.Items>
                                </Menu>

                                {user ? (
                                    <div className="member-login">
                                        <img 
                                            alt="User profile" 
                                            src={user.profilePicture || "assets/imgs/page/dashboard/profile.png"} 
                                            style={{ objectFit: 'cover', borderRadius: '50%', width: '40px', height: '40px' }}
                                        />
                                        <div className="info-member"> 
                                            <strong className="color-brand-1">{user.firstName} {user.lastName}</strong>
                                            <Menu as="div" className="dropdown">
                                                <Menu.Button as="a" className="font-xs color-text-paragraph-2 icon-down">{user.email}</Menu.Button>
                                                <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                                    <li><Link className="dropdown-item" href="/profile">My Profile</Link></li>
                                                    <li><Link className="dropdown-item" href="/settings">Settings</Link></li>
                                                    <li><a className="dropdown-item" onClick={handleLogout} style={{cursor: 'pointer'}}>Logout</a></li>
                                                </Menu.Items>
                                            </Menu>
                                        </div>
                                    </div>
                                ) : (
                                    <Link href="/login" className="btn btn-default ml-20">
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}
