import { Menu } from '@headlessui/react'
import Link from "next/link"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getCurrentUser, clearUserData, getToken, createAuthAxios } from '../../utils/authUtils'
import { HiOutlineSparkles, HiStar, HiOutlineCrown } from 'react-icons/hi'
import { createPaymentIntent, confirmPayment, subscribeToPlan } from '../../utils/paymentService'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// Payment Form Component
const PaymentForm = ({ selectedPlan, onSuccess, onCancel }) => {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!stripe || !elements) {
            return
        }
        
        setLoading(true)
        setError(null)
        
        try {
            // Create payment intent
            const { clientSecret } = await createPaymentIntent(selectedPlan._id)
            
            // Confirm card payment
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: e.target.name.value,
                    },
                },
            })
            
            if (result.error) {
                setError(result.error.message)
            } else if (result.paymentIntent.status === 'succeeded') {
                // Confirm payment with backend
                await confirmPayment(result.paymentIntent.id, selectedPlan._id)
                onSuccess()
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="payment-form">
                <h6 className="mb-3">Payment Details</h6>
                <div className="form-group mb-3">
                    <label className="form-label">Card Information</label>
                    <div className="card-element-container" style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: '#fff'
                    }}>
                        <CardElement 
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#424770',
                                        '::placeholder': {
                                            color: '#aab7c4',
                                        },
                                    },
                                    invalid: {
                                        color: '#9e2146',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
                <div className="form-group mb-3">
                    <label className="form-label">Name on Card</label>
                    <input 
                        type="text" 
                        name="name"
                        className="form-control" 
                        placeholder="John Doe" 
                        required
                    />
                </div>
                
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
            </div>
            
            <div className="modal-footer" style={{borderTop: '1px solid #eee', paddingTop: '15px'}}>
                <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={onCancel}
                    disabled={loading}
                    style={{
                        background: '#f5f5f5',
                        color: '#333',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    disabled={!stripe || loading}
                    className="btn btn-primary"
                    style={{
                        background: '#3c65f5',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginLeft: '10px'
                    }}
                >
                    {loading ? 'Processing...' : `Pay $${selectedPlan.price}`}
                </button>
            </div>
        </form>
    )
}

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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
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
            
            // Fetch subscription plans
            fetchSubscriptionPlans();
        } else {
            console.warn('Header: No user found in auth utils');
            // Fallback to direct localStorage check
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    console.log('Header: Fallback user found', parsedUser.firstName, parsedUser.role);
                    setUser(parsedUser);
                    
                    // Fetch company status for the user
                    fetchCompanyStatus(parsedUser._id);
                    
                    // Fetch user subscription
                    fetchUserSubscription();
                    
                    // Fetch subscription plans
                    fetchSubscriptionPlans();
                } catch (err) {
                    console.error('Header: Failed to parse user data', err);
                }
            }
        }
        
        // Cleanup event listeners on unmount
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []); // Empty dependency array to run only once on mount
    
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
    
    // Function to fetch user's subscription
    const fetchUserSubscription = async () => {
        try {
            const response = await authAxios.get('/api/subscriptions/user-subscription');
            setSubscription(response.data);
            console.log('User subscription:', response.data);
        } catch (error) {
            console.error('Error fetching subscription:', error.response?.data || error.message);
            // Default to Free plan if there's an error
            setSubscription({ subscription: 'Free' });
        }
    };
    
    // Function to fetch all subscription plans
    const fetchSubscriptionPlans = async () => {
        try {
            const response = await authAxios.get('/api/subscriptions/plans');
            setSubscriptionPlans(response.data);
            console.log('Subscription plans:', response.data);
        } catch (error) {
            console.error('Error fetching subscription plans:', error.response?.data || error.message);
        }
    };
    
    // Function to handle subscription plan selection
    const handleSelectPlan = (plan) => {
        if (!plan) return;
        
        setSelectedPlan(plan);
        
        // If it's a free plan, subscribe directly without payment
        if (plan.name === 'Free') {
            handleFreePlanSubscription(plan._id);
        } else {
            setShowPaymentModal(true);
        }
    };
    
    // Function to handle free plan subscription
    const handleFreePlanSubscription = async (planId) => {
        try {
            await subscribeToPlan(planId);
            // Refresh subscription data
            await fetchUserSubscription();
            // Show success message
            alert('Successfully subscribed to Free plan');
        } catch (error) {
            console.error('Error subscribing to Free plan:', error);
            alert('Failed to subscribe to Free plan. Please try again.');
        }
    };

    // Function to handle payment success
    const handlePaymentSuccess = async () => {
        setPaymentSuccess(true);
        
        // Close modal after 2 seconds
        setTimeout(() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
            setPaymentSuccess(false);
            
            // Refresh subscription data
            fetchUserSubscription();
        }, 2000);
    };

    // Function to close payment modal
    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
        setPaymentSuccess(false);
    };
    
    // Function to handle logout
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
        };
        
        // Current subscription button style
        if (subscription && subscription.subscription === planName) {
            return {
                ...baseStyle,
                background: planName === 'Free' ? '#e0e0e0' : 
                           planName === 'Golden' ? 'linear-gradient(145deg, #ffd700, #ffb347)' : 
                           planName === 'Platinum' ? 'linear-gradient(145deg, #e5e4e2, #c0c0c0)' :
                           'linear-gradient(145deg, #ff4500, #ff8c00)',
                color: planName === 'Free' ? '#555' : '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                border: 'none',
                cursor: 'default',
            };
        }
        
        // Other plan button styles
        return {
            ...baseStyle,
            background: '#fff',
            color: planName === 'Free' ? '#555' : 
                   planName === 'Golden' ? '#ffd700' : 
                   planName === 'Platinum' ? '#c0c0c0' : 
                   '#ff4500',
            border: `1px solid ${
                planName === 'Free' ? '#ddd' : 
                planName === 'Golden' ? '#ffd700' : 
                planName === 'Platinum' ? '#c0c0c0' : 
                '#ff4500'
            }`,
            cursor: 'pointer',
            '&:hover': {
                background: planName === 'Free' ? '#f5f5f5' : 
                           planName === 'Golden' ? 'rgba(255,215,0,0.1)' : 
                           planName === 'Platinum' ? 'rgba(192,192,192,0.1)' :
                           'rgba(255,69,0,0.1)',
                transform: 'translateY(-2px)',
            }
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
    
    return (
        <>
            <header className={`header sticky-bar ${scroll? "stick":""}`}>
                <div className="container">
                    <div className="main-header">
                        <div className="header-left">
                            <div className="header-logo">
                                <Link className="d-flex" href="/">
                                    <img 
                                        alt="TuniHire" 
                                        src="assets/logoBanner.png" 
                                        style={getLogoStyle(windowWidth)} 
                                        className={`logo-img ${scroll ? 'logo-scrolled' : ''}`}
                                    />
                                </Link>
                            </div>
                        </div>
                        
                        
                        <div className="header-right">
                            <div className="block-signin">
                                {/* Show different buttons based on user role */}
                                {user && (
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
                                        
                                        {/* Subscription Plan Buttons */}
                                        <div className="subscription-buttons d-flex mr-15">
                                            {/* Current subscription */}
                                            {subscription && (
                                                <div 
                                                    className="subscription-badge"
                                                    style={getSubscriptionButtonStyle(subscription.subscription)}
                                                >
                                                    {renderSubscriptionIcon(subscription.subscription)}
                                                    {subscription.subscription}
                                                </div>
                                            )}
                                            
                                            {/* Button to upgrade to Golden */}
                                            {(!subscription || subscription.subscription !== 'Golden') && (
                                                <div 
                                                    className="subscription-button" 
                                                    style={getSubscriptionButtonStyle('Golden')}
                                                    onClick={() => handleSelectPlan(subscriptionPlans.find(p => p.name === 'Golden'))}
                                                >
                                                    <HiStar />
                                                    Golden
                                                </div>
                                            )}
                                            
                                            {/* Button to upgrade to Platinum */}
                                            {(!subscription || subscription.subscription !== 'Platinum') && (
                                                <div 
                                                    className="subscription-button" 
                                                    style={getSubscriptionButtonStyle('Platinum')}
                                                    onClick={() => handleSelectPlan(subscriptionPlans.find(p => p.name === 'Platinum'))}
                                                >
                                                    <HiOutlineSparkles />
                                                    Platinum
                                                </div>
                                            )}
                                            
                                            {/* Button to upgrade to Master */}
                                            {(!subscription || subscription.subscription !== 'Master') && (
                                                <div 
                                                    className="subscription-button" 
                                                    style={getSubscriptionButtonStyle('Master')}
                                                    onClick={() => handleSelectPlan(subscriptionPlans.find(p => p.name === 'Master'))}
                                                >
                                                    <HiOutlineCrown />
                                                    Master
                                                </div>
                                            )}
                                        </div>
                                    </>
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
            
            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="modal-backdrop show">
                    <div className="modal-dialog" 
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1050,
                            width: '90%',
                            maxWidth: '500px',
                            background: '#fff',
                            borderRadius: '10px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            padding: '20px'
                        }}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {paymentSuccess 
                                        ? 'Payment Successful!' 
                                        : `Upgrade to ${selectedPlan.name} Plan`}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={handleClosePaymentModal}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        position: 'absolute',
                                        right: '20px',
                                        top: '15px'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                            
                            <div className="modal-body">
                                {paymentSuccess ? (
                                    <div className="text-center py-4">
                                        <div className="mb-3">
                                            <i className="fi-rs-check-circle" style={{
                                                fontSize: '48px',
                                                color: '#4CAF50'
                                            }}></i>
                                        </div>
                                        <h4 className="mb-3">Thank you for your payment!</h4>
                                        <p>Your subscription has been updated to {selectedPlan.name} plan.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="plan-details mb-4">
                                            <div className="plan-name mb-2" style={{
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                color: selectedPlan.name === 'Golden' ? '#ffd700' : 
                                                    selectedPlan.name === 'Platinum' ? '#c0c0c0' : 
                                                    '#ff4500'
                                            }}>
                                                {selectedPlan.name} Plan
                                            </div>
                                            <div className="plan-price mb-3" style={{
                                                fontSize: '36px',
                                                fontWeight: 'bold'
                                            }}>
                                                ${selectedPlan.price}<span style={{fontSize: '16px', color: '#888'}}>/month</span>
                                            </div>
                                            <div className="plan-features mb-3">
                                                <h6>Features:</h6>
                                                <ul style={{paddingLeft: '20px'}}>
                                                    {selectedPlan.features && selectedPlan.features.map((feature, index) => (
                                                        <li key={index} style={{marginBottom: '5px'}}>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <Elements stripe={stripePromise}>
                                            <PaymentForm 
                                                selectedPlan={selectedPlan} 
                                                onSuccess={handlePaymentSuccess}
                                                onCancel={handleClosePaymentModal}
                                            />
                                        </Elements>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
