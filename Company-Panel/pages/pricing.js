import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from "../components/layout/Layout";
import { getPlans } from "../utils/paymentService";
import Swal from 'sweetalert2';

export default function Pricing() {
    const [userType, setUserType] = useState('company');
    const [planType, setPlanType] = useState('monthly'); // Not implemented yet, for future use
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    
    useEffect(() => {
        // Get current user's subscription data from localStorage
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.subscription) {
                setCurrentSubscription(userData.subscription);
            }
        } catch (e) {
            console.error('Error reading from localStorage:', e);
        }
        
        // Fetch subscription plans based on selected user type
        fetchPlans(userType);
    }, [userType]); // Re-fetch when user type changes
    
    const fetchPlans = async (type) => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch plans from the API
            console.log(`Fetching ${type} plans...`);
            const fetchedPlans = await getPlans(type);
            
            if (fetchedPlans && fetchedPlans.length > 0) {
                console.log(`Fetched ${fetchedPlans.length} ${type} plans:`, fetchedPlans);
                
                // Add "isPopular" flag to the second plan (usually Golden)
                const processedPlans = fetchedPlans.map((plan, index) => ({
                    ...plan,
                    isPopular: index === 1 // Mark the second plan as popular
                }));
                
                setPlans(processedPlans);
            } else {
                console.log('No plans fetched, using fallback mock plans');
                // Fallback to mock plans if the API returned empty
                setPlans(getMockPlans(type));
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            setError('Failed to load subscription plans. Please try again later.');
            
            // Use mock plans as fallback
            setPlans(getMockPlans(type));
            
            // Show error to user but don't block the UI
            Swal.fire({
                title: 'Warning',
                text: 'Could not load plans from the server. Showing mock data instead.',
                icon: 'warning',
                confirmButtonColor: '#3085d6'
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Mock plans for development or when API fails
    const getMockPlans = (type) => {
        if (type === 'company') {
            return [
                {
                    _id: 'free-plan-company',
                    name: 'Free',
                    price: 0,
                    duration: 0,
                    description: 'Basic features for small companies',
                    features: [
                        'Post up to 3 jobs',
                        'Basic company profile',
                        'Standard support',
                        'Basic candidate search',
                        'Standard job posting'
                    ],
                    isPopular: false
                },
                {
                    _id: 'golden-plan-company',
                    name: 'Golden',
                    price: 49.99,
                    duration: 30,
                    description: 'Enhanced features for growing companies',
                    features: [
                        'Unlimited job postings',
                        'Enhanced company profile',
                        'Priority in search results',
                        'Advanced candidate search',
                        'Featured job postings',
                        'Priority support'
                    ],
                    isPopular: true
                },
                {
                    _id: 'platinum-plan-company',
                    name: 'Platinum',
                    price: 99.99,
                    duration: 30,
                    description: 'Premium features for established companies',
                    features: [
                        'All Golden features',
                        'Featured company profile',
                        'Advanced analytics',
                        'ATS AI integration',
                        'Candidate recommendation system',
                        'Dedicated support'
                    ],
                    isPopular: false
                },
                {
                    _id: 'master-plan-company',
                    name: 'Master',
                    price: 199.99,
                    duration: 30,
                    description: 'Ultimate features for enterprise companies',
                    features: [
                        'All Platinum features',
                        'Unlimited candidate search',
                        'Custom branding',
                        'API access',
                        'Advanced recommendation system',
                        'VIP customer support'
                    ],
                    isPopular: false
                }
            ];
        } else {
            return [
                {
                    _id: 'free-plan-candidate',
                    name: 'Free',
                    price: 0,
                    duration: 0,
                    description: 'Basic features for job seekers',
                    features: [
                        'Job applications (up to 10 per month)',
                        'Basic profile creation',
                        'Standard resume builder',
                        'Email support'
                    ],
                    isPopular: false
                },
                {
                    _id: 'golden-plan-candidate',
                    name: 'Golden',
                    price: 9.99,
                    duration: 30,
                    description: 'Enhanced features for serious job seekers',
                    features: [
                        'Unlimited job applications',
                        'Premium profile visibility',
                        'Advanced resume builder',
                        'Basic portfolio generator',
                        'Priority support'
                    ],
                    isPopular: true
                },
                {
                    _id: 'platinum-plan-candidate',
                    name: 'Platinum',
                    price: 19.99,
                    duration: 30,
                    description: 'Premium features for career advancement',
                    features: [
                        'All Golden features',
                        'Unlimited courses access',
                        'Advanced portfolio generator',
                        'Career path recommendations',
                        'Interview preparation tools',
                        'Dedicated support'
                    ],
                    isPopular: false
                },
                {
                    _id: 'master-plan-candidate',
                    name: 'Master',
                    price: 29.99,
                    duration: 30,
                    description: 'Ultimate career development package',
                    features: [
                        'All Platinum features',
                        'Personalized skill development plan',
                        '1-on-1 career coaching sessions',
                        'Advanced analytics dashboard',
                        'Priority profile promotion',
                        'VIP customer support'
                    ],
                    isPopular: false
                }
            ];
        }
    };
    
    // Function to toggle between company and candidate pricing
    const toggleUserType = (type) => {
        if (type !== userType) {
            setUserType(type);
        }
    };
    
    // Function to check if a plan is the user's current plan
    const isCurrentPlan = (planName) => {
        return currentSubscription === planName;
    };
    
    // Function to get the appropriate CSS class for plan card background
    const getPlanColorClass = (planName) => {
        switch(planName) {
            case 'Free':
                return 'card-free';
            case 'Golden':
                return 'card-golden';
            case 'Platinum':
                return 'card-platinum';
            case 'Master':
                return 'card-master';
            default:
                return 'card-free';
        }
    };
    
    // Function to get the appropriate badge class for plan name
    const getPlanBadgeClass = (planName) => {
        switch(planName) {
            case 'Free':
                return 'bg-success';
            case 'Golden':
                return 'bg-warning text-dark';
            case 'Platinum':
                return 'bg-secondary';
            case 'Master':
                return 'bg-primary';
            default:
                return 'bg-success';
        }
    };
    
    return (
        <Layout>
            <section className="subscription-section py-5">
                <div className="container">
                    <div className="row justify-content-center mb-5">
                        <div className="col-lg-8 text-center">
                            <h1 className="display-4 fw-bold mb-3 animate__animated animate__fadeInDown">Choose Your Plan</h1>
                            <p className="lead mb-4 animate__animated animate__fadeInDown animate__delay-1s">
                                Select the perfect subscription plan that meets your needs
                            </p>
                            
                            {/* Toggle for company/candidate pricing */}
                            <div className="mb-5 d-flex justify-content-center animate__animated animate__fadeIn">
                                <div className="btn-group" role="group" aria-label="User Type Toggle">
                                    <button 
                                        type="button" 
                                        className={`btn ${userType === 'company' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => toggleUserType('company')}
                                    >
                                        <i className="fas fa-building me-2"></i>
                                        For Companies
                                    </button>
                                    <button 
                                        type="button" 
                                        className={`btn ${userType === 'candidate' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => toggleUserType('candidate')}
                                    >
                                        <i className="fas fa-user me-2"></i>
                                        For Candidates
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Loading indicator */}
                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading subscription plans...</p>
                        </div>
                    )}
                    
                    {/* Error message */}
                    {error && !loading && (
                        <div className="alert alert-danger text-center">
                            {error}
                        </div>
                    )}
                    
                    {/* Subscription plan cards */}
                    {!loading && !error && (
                        <div className="row">
                            {plans.map((plan, index) => (
                                <div className="col-lg-3 col-md-6 mb-4" key={plan._id}>
                                    {/* Flip Card Container */}
                                    <div className="flip-card animate__animated animate__fadeInUp" style={{animationDelay: `${index * 0.1}s`}}>
                                        <div className="flip-card-inner">
                                            {/* Front Side */}
                                            <div className={`flip-card-front ${getPlanColorClass(plan.name)}`}>
                                                <div className="plan-card text-center p-4">
                                                    <div className="card-badge">
                                                        <span className={`badge ${getPlanBadgeClass(plan.name)}`}>
                                                            {plan.name}
                                                        </span>
                                                        {plan.isPopular && (
                                                            <span className="badge bg-danger ms-2">Popular</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="plan-price mt-4 mb-3">
                                                        <h2 className="display-4 fw-bold mb-0">${plan.price}</h2>
                                                        <p className="text-muted">per month</p>
                                                    </div>
                                                    
                                                    <p className="plan-description">
                                                        {plan.description}
                                                    </p>
                                                    
                                                    <div className="mt-4">
                                                        <button className="btn btn-outline-light" onClick={(e) => {
                                                            // Prevent parent link from being clicked
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            
                                                            // Get the parent flip-card and toggle the flipped class
                                                            e.currentTarget.closest('.flip-card').classList.toggle('flipped');
                                                        }}>
                                                            See Features
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Back Side */}
                                            <div className={`flip-card-back ${getPlanColorClass(plan.name)}`}>
                                                <div className="plan-features p-4">
                                                    <h4 className="mb-3">Features</h4>
                                                    <div className="feature-list-container">
                                                        <ul className="feature-list list-unstyled mb-4">
                                                            {plan.features && plan.features.map((feature, index) => (
                                                                <li key={index} className="mb-2">
                                                                    <span className="feature-icon">✓</span>
                                                                    <span className="feature-text">{feature}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    
                                                    <div className="plan-action-buttons">
                                                        {isCurrentPlan(plan.name) ? (
                                                            <button className="btn btn-success w-100" disabled>
                                                                Current Plan
                                                            </button>
                                                        ) : (
                                                            <Link href={`/payment?planId=${plan._id}&userType=${userType}`}>
                                                                <button className="btn btn-light w-100">
                                                                    Upgrade Now
                                                                </button>
                                                            </Link>
                                                        )}
                                                        
                                                        <button className="btn btn-link text-light mt-2" onClick={(e) => {
                                                            // Prevent parent link from being clicked
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            
                                                            // Get the parent flip-card and toggle the flipped class
                                                            e.currentTarget.closest('.flip-card').classList.toggle('flipped');
                                                        }}>
                                                            Back to Plan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Subscription Plan Comparison Table */}
                    <div className="row mt-5">
                        <div className="col-12">
                            <div className="card shadow-sm animate__animated animate__fadeIn">
                                <div className="card-header bg-light">
                                    <h3 className="mb-0">Features Comparison</h3>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover subscription-table">
                                            <thead>
                                                <tr>
                                                    <th>Feature</th>
                                                    {plans.map(plan => (
                                                        <th key={plan._id} className="text-center">
                                                            {plan.name}
                                                            {plan.isPopular && <div><span className="badge bg-danger">Popular</span></div>}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Dynamic feature rows based on combined features from all plans */}
                                                {userType === 'company' ? (
                                                    // Company-specific features
                                                    <>
                                                        <tr>
                                                            <td>Job Postings</td>
                                                            <td className="text-center">Up to 3</td>
                                                            <td className="text-center">Unlimited</td>
                                                            <td className="text-center">Unlimited</td>
                                                            <td className="text-center">Unlimited</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Company Profile</td>
                                                            <td className="text-center">Basic</td>
                                                            <td className="text-center">Enhanced</td>
                                                            <td className="text-center">Featured</td>
                                                            <td className="text-center">Custom</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Candidate Search</td>
                                                            <td className="text-center">Basic</td>
                                                            <td className="text-center">Advanced</td>
                                                            <td className="text-center">Premium</td>
                                                            <td className="text-center">Unlimited</td>
                                                        </tr>
                                                        <tr>
                                                            <td>AI Integration</td>
                                                            <td className="text-center">-</td>
                                                            <td className="text-center">-</td>
                                                            <td className="text-center">✓</td>
                                                            <td className="text-center">✓</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Support Level</td>
                                                            <td className="text-center">Standard</td>
                                                            <td className="text-center">Priority</td>
                                                            <td className="text-center">Dedicated</td>
                                                            <td className="text-center">VIP</td>
                                                        </tr>
                                                    </>
                                                ) : (
                                                    // Candidate-specific features
                                                    <>
                                                        <tr>
                                                            <td>Job Applications</td>
                                                            <td className="text-center">Up to 10</td>
                                                            <td className="text-center">Unlimited</td>
                                                            <td className="text-center">Unlimited</td>
                                                            <td className="text-center">Unlimited</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Resume Builder</td>
                                                            <td className="text-center">Basic</td>
                                                            <td className="text-center">Advanced</td>
                                                            <td className="text-center">Premium</td>
                                                            <td className="text-center">Premium</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Portfolio Generator</td>
                                                            <td className="text-center">-</td>
                                                            <td className="text-center">Basic</td>
                                                            <td className="text-center">Advanced</td>
                                                            <td className="text-center">Premium</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Career Coaching</td>
                                                            <td className="text-center">-</td>
                                                            <td className="text-center">-</td>
                                                            <td className="text-center">Group</td>
                                                            <td className="text-center">1-on-1</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Support Level</td>
                                                            <td className="text-center">Email</td>
                                                            <td className="text-center">Priority</td>
                                                            <td className="text-center">Dedicated</td>
                                                            <td className="text-center">VIP</td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* FAQ Section */}
                    <div className="row mt-5">
                        <div className="col-lg-8 mx-auto">
                            <h2 className="text-center mb-4">Frequently Asked Questions</h2>
                            <div className="accordion" id="subscriptionFAQ">
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="faqOne">
                                        <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                            How do I change my subscription plan?
                                        </button>
                                    </h2>
                                    <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="faqOne" data-bs-parent="#subscriptionFAQ">
                                        <div className="accordion-body">
                                            You can upgrade your subscription at any time by selecting a new plan from this page. If you wish to downgrade, please contact our support team.
                                        </div>
                                    </div>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="faqTwo">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                            When will I be billed?
                                        </button>
                                    </h2>
                                    <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="faqTwo" data-bs-parent="#subscriptionFAQ">
                                        <div className="accordion-body">
                                            You will be billed immediately upon selecting a paid plan. Subscriptions automatically renew at the end of each billing cycle unless canceled.
                                        </div>
                                    </div>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="faqThree">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                            Is there a free trial?
                                        </button>
                                    </h2>
                                    <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="faqThree" data-bs-parent="#subscriptionFAQ">
                                        <div className="accordion-body">
                                            Yes, our free plan offers basic features that you can use indefinitely. You can upgrade to a paid plan whenever you need access to more advanced features.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* CSS for the flip cards and animations */}
            <style jsx>{`
                .subscription-section {
                    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ec 100%);
                    padding: 40px 0;
                }
                
                .flip-card {
                    background-color: transparent;
                    width: 100%;
                    height: 450px; /* Increased height for the cards */
                    perspective: 1000px;
                    margin-bottom: 20px;
                }

                .flip-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    text-align: center;
                    transition: transform 0.8s;
                    transform-style: preserve-3d;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    border-radius: 10px;
                }

                .flip-card.flipped .flip-card-inner {
                    transform: rotateY(180deg);
                }

                .flip-card-front, .flip-card-back {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                    border-radius: 10px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .flip-card-front {
                    color: white;
                }

                .flip-card-back {
                    color: white;
                    transform: rotateY(180deg);
                    display: flex;
                    flex-direction: column;
                }
                
                .card-free {
                    background: linear-gradient(45deg, #43a047, #66bb6a);
                }
                
                .card-golden {
                    background: linear-gradient(45deg, #ff9800, #ffc107);
                }
                
                .card-platinum {
                    background: linear-gradient(45deg, #616161, #9e9e9e);
                }
                
                .card-master {
                    background: linear-gradient(45deg, #1565c0, #42a5f5);
                }
                
                .plan-card, .plan-features {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    justify-content: space-between;
                }
                
                .feature-list-container {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 15px;
                    max-height: 250px; /* Set a max height for scrolling */
                }
                
                .feature-list li {
                    text-align: left;
                    padding: 5px 0;
                }
                
                .feature-icon {
                    margin-right: 8px;
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    text-align: center;
                    line-height: 20px;
                }
                
                .plan-action-buttons {
                    margin-top: auto;
                    padding-top: 10px;
                }
                
                .subscription-table th, .subscription-table td {
                    vertical-align: middle;
                }
                
                /* Scrollbar styling for the feature list */
                .feature-list-container::-webkit-scrollbar {
                    width: 6px;
                }
                
                .feature-list-container::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                
                .feature-list-container::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                }
                
                .feature-list-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
                
                /* Add animate.css classes */
                .animate__animated {
                    animation-duration: 1s;
                }
                
                .animate__fadeIn {
                    animation-name: fadeIn;
                }
                
                .animate__fadeInDown {
                    animation-name: fadeInDown;
                }
                
                .animate__fadeInUp {
                    animation-name: fadeInUp;
                }
                
                /* Define animations */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translate3d(0, -20px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 20px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }
                
                .animate__delay-1s {
                    animation-delay: 0.3s;
                }
            `}</style>
        </Layout>
    );
}
