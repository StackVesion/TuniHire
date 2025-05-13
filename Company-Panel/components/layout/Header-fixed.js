import { Menu } from '@headlessui/react'
import Link from "next/link"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getCurrentUser, clearUserData, getToken, createAuthAxios } from '../../utils/authUtils'
import { HiOutlineSparkles, HiStar, HiOutlineCrown } from 'react-icons/hi'

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
            console.error('Error fetching user subscription:', error);
            // For development: Set a default subscription if API fails
            setSubscription({
                subscription: 'Free',
                subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
    };
    
    // Function to handle logout
    const handleLogout = async () => {
        try {
            // API call to logout
            await authAxios.post('/api/auth/logout');
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            // Clear user data regardless of API success/failure
            clearUserData();
            // Redirect to login page
            router.push('/login');
        }
    };
    
    // Function to get subscription button style based on plan
    const getSubscriptionButtonStyle = (planName) => {
        const baseStyle = {
            padding: '8px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginRight: '10px',
            transition: 'all 0.3s ease',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
        };
        
        // Current subscription button style
        return {
            ...baseStyle,
            background: planName === 'Free' ? '#e0e0e0' : 
                        planName === 'Golden' ? 'linear-gradient(145deg, #ffd700, #ffb347)' : 
                        planName === 'Platinum' ? 'linear-gradient(145deg, #e5e4e2, #c0c0c0)' :
                        'linear-gradient(145deg, #ff4500, #ff8c00)',
            color: planName === 'Free' ? '#555' : '#fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            border: 'none',
        };
    };
    
    // Function to render subscription icon based on plan
    const renderSubscriptionIcon = (planName) => {
        switch(planName) {
            case 'Free':
                return null;
            case 'Golden':
                return <HiStar className="animate-pulse" />;
            case 'Platinum':
                return <HiOutlineSparkles className="animate-spin" style={{ animationDuration: '3s' }} />;
            case 'Master':
                return <HiOutlineCrown className="animate-bounce" style={{ animationDuration: '2s' }} />;
            default:
                return null;
        }
    };
    
    // Function to navigate to pricing page
    const handleGoToPricing = () => {
        router.push('/pricing');
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
                            <div className="block-signin">
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
                                        <div className="subscription-buttons d-flex mr-15">
                                            {/* Current subscription badge, clickable to redirect to pricing page */}
                                            {subscription && (
                                                <div 
                                                    className="subscription-badge"
                                                    style={getSubscriptionButtonStyle(subscription.subscription)}
                                                    onClick={handleGoToPricing}
                                                    title="Click to view subscription plans"
                                                >
                                                    {renderSubscriptionIcon(subscription.subscription)}
                                                    {subscription.subscription}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="member-login d-flex align-items-center">
                                            <img 
                                                alt="User profile" 
                                                src={user.profilePicture || "/assets/imgs/page/dashboard/profile.png"} 
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
                                    </>
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
    );
}
