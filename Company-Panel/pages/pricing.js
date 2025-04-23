import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from "../components/layout/Layout";
import { createAuthAxios } from "../utils/authUtils";

export default function Pricing() {
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState('company'); // 'company' or 'candidate'
    const [error, setError] = useState(null);
    const authAxios = createAuthAxios();

    // Company plans data
    const companyPlans = [
        {
            _id: 'company-free',
            name: 'Free',
            price: 0,
            duration: 30,
            description: 'Basic features for small companies',
            features: [
                'Job posting (limited to 3)',
                'Basic company profile',
                'Basic candidate search',
                'Standard support'
            ],
            isPopular: false
        },
        {
            _id: 'company-golden',
            name: 'Golden',
            price: 49.99,
            duration: 30,
            description: 'Advanced features for growing companies',
            features: [
                'Unlimited job postings',
                'Enhanced company profile',
                'Priority in search results',
                'Access to premium candidates',
                'Basic analytics dashboard',
                'Priority support'
            ],
            isPopular: true
        },
        {
            _id: 'company-platinum',
            name: 'Platinum',
            price: 99.99,
            duration: 30,
            description: 'Premium features for established companies',
            features: [
                'Everything in Golden plan',
                'Featured company profile',
                'Advanced analytics',
                'ATS AI integration',
                'Candidate recommendation system',
                'Newsletter management',
                'Company profile badges',
                'Dedicated support'
            ],
            isPopular: false
        },
        {
            _id: 'company-master',
            name: 'Master',
            price: 199.99,
            duration: 30,
            description: 'Ultimate features for enterprise companies',
            features: [
                'Everything in Platinum plan',
                'Infinite candidate search',
                'Custom branding',
                'API access',
                'Advanced recommendation system',
                'Priority in ads and homepage',
                'VIP customer support',
                'Personalized HR consulting'
            ],
            isPopular: false
        }
    ];

    // Candidate plans data
    const candidatePlans = [
        {
            _id: 'candidate-free',
            name: 'Free',
            price: 0,
            duration: 30,
            description: 'Basic features for job seekers',
            features: [
                'Basic profile creation',
                'Limited job applications',
                'Standard resume builder',
                'Email support'
            ],
            isPopular: false
        },
        {
            _id: 'candidate-golden',
            name: 'Golden',
            price: 9.99,
            duration: 30,
            description: 'Enhanced features for serious job seekers',
            features: [
                'Unlimited job applications',
                'Premium profile visibility',
                'Advanced resume builder',
                'Basic portfolio generator',
                'Job match notifications',
                'Priority support'
            ],
            isPopular: true
        },
        {
            _id: 'candidate-platinum',
            name: 'Platinum',
            price: 19.99,
            duration: 30,
            description: 'Premium features for career advancement',
            features: [
                'Everything in Golden plan',
                'Unlimited courses access',
                'Advanced portfolio generator',
                'Career path recommendations',
                'Interview preparation tools',
                'Basic analytics dashboard',
                'Dedicated support'
            ],
            isPopular: false
        },
        {
            _id: 'candidate-master',
            name: 'Master',
            price: 29.99,
            duration: 30,
            description: 'Ultimate career development package',
            features: [
                'Everything in Platinum plan',
                'Personalized skill development plan',
                '1-on-1 career coaching sessions',
                'Advanced analytics dashboard',
                'Priority profile promotion',
                'Custom portfolio themes',
                'VIP customer support'
            ],
            isPopular: false
        }
    ];

    useEffect(() => {
        // Fetch subscription plans and user subscription on page load
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch user subscription
                const userSubRes = await authAxios.get('/api/subscriptions/user-subscription');
                if (userSubRes.data) {
                    setCurrentSubscription(userSubRes.data);
                    // Set initial userType based on subscription if available
                    if (userSubRes.data.userType) {
                        setUserType(userSubRes.data.userType);
                    }
                }
            } catch (error) {
                console.error('Error fetching subscription data:', error);
                setError('Failed to load current subscription. Please try again later.');
                
                // Mock current subscription for development
                setCurrentSubscription({
                    subscription: 'Free',
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // Effect to update plans when userType changes
    useEffect(() => {
        setSubscriptionPlans(userType === 'company' ? companyPlans : candidatePlans);
    }, [userType]);

    // Helper function to check if user has this plan
    const isCurrentPlan = (planName) => {
        return currentSubscription && currentSubscription.subscription === planName;
    };

    // Get plan badge class
    const getPlanBadgeClass = (planName) => {
        switch(planName) {
            case 'Golden':
                return 'bg-warning text-dark';
            case 'Platinum':
                return 'bg-secondary text-white';
            case 'Master':
                return 'bg-primary text-white';
            case 'Free':
            default:
                return 'bg-success text-white';
        }
    };

    // Get plan color for styling
    const getPlanColorClass = (planName) => {
        switch(planName) {
            case 'Golden':
                return 'card-golden';
            case 'Platinum':
                return 'card-platinum';
            case 'Master':
                return 'card-master';
            case 'Free':
            default:
                return 'card-free';
        }
    };

    return (
        <Layout>
            <section className="section-box subscription-section">
                <div className="container mb-50 mt-70">
                    <div className="text-center mb-50">
                        <h1 className="section-title display-4 mb-4 animate__animated animate__fadeInDown">
                            Choose Your Perfect Plan
                        </h1>
                        <p className="font-lg color-text-paragraph-2 mb-30 animate__animated animate__fadeIn animate__delay-1s">
                            Select the plan that best fits your needs and take your career or business to the next level
                        </p>
                        
                        {/* User Type Toggle */}
                        <div className="user-type-toggle mb-50 animate__animated animate__fadeIn animate__delay-1s">
                            <div className="btn-group" role="group" aria-label="User Type Selection">
                                <button 
                                    type="button" 
                                    className={`btn ${userType === 'company' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setUserType('company')}
                                >
                                    Company
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${userType === 'candidate' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setUserType('candidate')}
                                >
                                    Candidate
                                </button>
                            </div>
                        </div>

                        {/* Title based on selected user type */}
                        <div className="animate__animated animate__fadeIn">
                            <h2 className="mb-10">
                                {userType === 'company' ? 'Company Subscription Plans' : 'Candidate Subscription Plans'}
                            </h2>
                            <p className="font-md color-text-paragraph">
                                {userType === 'company' 
                                    ? 'Find the perfect plan for your recruiting needs' 
                                    : 'Accelerate your career with our professional tools'}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center mt-50">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading plans...</p>
                        </div>
                    ) : (
                        <div className="row mt-30">
                            {subscriptionPlans.map((plan, index) => (
                                <div key={plan._id} className="col-xl-3 col-lg-6 col-md-6 col-sm-12 mb-30">
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
                                                    <ul className="feature-list list-unstyled mb-4">
                                                        {plan.features && plan.features.map((feature, index) => (
                                                            <li key={index} className="mb-2">
                                                                <span className="feature-icon">✓</span>
                                                                <span className="feature-text">{feature}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    
                                                    <div className="mt-auto">
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
                    
                    {/* Feature Comparison Section */}
                    <div className="mt-100 pt-4 animate__animated animate__fadeIn">
                        <h3 className="text-center mb-4">Compare Plan Features</h3>
                        <div className="table-responsive">
                            <table className="table table-bordered subscription-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Features</th>
                                        {subscriptionPlans.map(plan => (
                                            <th key={plan._id} scope="col" className="text-center">
                                                <span className={`badge ${getPlanBadgeClass(plan.name)}`}>
                                                    {plan.name}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {userType === 'company' ? (
                                        <>
                                            <tr>
                                                <td>Job Postings</td>
                                                <td className="text-center">Limited (3)</td>
                                                <td className="text-center">Unlimited</td>
                                                <td className="text-center">Unlimited</td>
                                                <td className="text-center">Unlimited</td>
                                            </tr>
                                            <tr>
                                                <td>Company Profile</td>
                                                <td className="text-center">Basic</td>
                                                <td className="text-center">Enhanced</td>
                                                <td className="text-center">Featured</td>
                                                <td className="text-center">Premium</td>
                                            </tr>
                                            <tr>
                                                <td>AI Recruiting Tools</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">✓</td>
                                                <td className="text-center">Advanced</td>
                                            </tr>
                                            <tr>
                                                <td>Candidate Search</td>
                                                <td className="text-center">Basic</td>
                                                <td className="text-center">Advanced</td>
                                                <td className="text-center">Premium</td>
                                                <td className="text-center">Infinite</td>
                                            </tr>
                                            <tr>
                                                <td>Analytics Dashboard</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">Basic</td>
                                                <td className="text-center">Advanced</td>
                                                <td className="text-center">Enterprise</td>
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
                                        <>
                                            <tr>
                                                <td>Job Applications</td>
                                                <td className="text-center">Limited</td>
                                                <td className="text-center">Unlimited</td>
                                                <td className="text-center">Unlimited</td>
                                                <td className="text-center">Unlimited</td>
                                            </tr>
                                            <tr>
                                                <td>Resume Builder</td>
                                                <td className="text-center">Standard</td>
                                                <td className="text-center">Advanced</td>
                                                <td className="text-center">Premium</td>
                                                <td className="text-center">Premium</td>
                                            </tr>
                                            <tr>
                                                <td>Course Access</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">Limited</td>
                                                <td className="text-center">Unlimited</td>
                                                <td className="text-center">Unlimited</td>
                                            </tr>
                                            <tr>
                                                <td>Portfolio Generator</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">Basic</td>
                                                <td className="text-center">Advanced</td>
                                                <td className="text-center">Custom</td>
                                            </tr>
                                            <tr>
                                                <td>Analytics Dashboard</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">Basic</td>
                                                <td className="text-center">Advanced</td>
                                            </tr>
                                            <tr>
                                                <td>Career Coaching</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">✓</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* FAQ Section */}
                    <div className="faq-section mt-80 mb-40 animate__animated animate__fadeIn">
                        <h3 className="text-center mb-4">Frequently Asked Questions</h3>
                        <div className="row justify-content-center">
                            <div className="col-lg-8">
                                <div className="accordion" id="faqAccordion">
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id="faqOne">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                                                How do I change my subscription plan?
                                            </button>
                                        </h2>
                                        <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="faqOne" data-bs-parent="#faqAccordion">
                                            <div className="accordion-body">
                                                You can upgrade your subscription at any time by selecting a new plan and proceeding to payment. Your new subscription will start immediately with prorated charges for the current billing period.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id="faqTwo">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                                Can I cancel my subscription?
                                            </button>
                                        </h2>
                                        <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="faqTwo" data-bs-parent="#faqAccordion">
                                            <div className="accordion-body">
                                                Yes, you can cancel your subscription at any time from your account settings. Your subscription benefits will remain active until the end of your current billing period.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id="faqThree">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                                How does billing work?
                                            </button>
                                        </h2>
                                        <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="faqThree" data-bs-parent="#faqAccordion">
                                            <div className="accordion-body">
                                                Subscriptions are billed monthly or annually, depending on your chosen plan. Payment is processed securely using Stripe as our payment processor.
                                            </div>
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
                    height: 400px;
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
                
                .subscription-table th, .subscription-table td {
                    vertical-align: middle;
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
