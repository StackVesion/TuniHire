import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { createAuthAxios } from '../utils/authUtils';
import { HiOutlineSparkles, HiStar, HiOutlineCrown, HiCheck } from 'react-icons/hi';

export default function Pricing() {
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const authAxios = createAuthAxios();

    useEffect(() => {
        // Fetch subscription plans and user subscription on page load
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch subscription plans
                const plansRes = await authAxios.get('/api/subscriptions/plans');
                
                if (plansRes.data && Array.isArray(plansRes.data)) {
                    // Add features based on plan type if not already present
                    const plansWithFeatures = plansRes.data.map(plan => {
                        if (!plan.features || plan.features.length === 0) {
                            // Default features based on plan type
                            const features = [];
                            
                            // Common features for all plans
                            features.push('Access to job posting');
                            features.push('Basic company profile');
                            
                            // Additional features based on plan type
                            if (plan.name === 'Golden' || plan.name === 'Platinum' || plan.name === 'Master') {
                                features.push('Priority in search results');
                                features.push('Access to premium candidates');
                                features.push('Unlimited job postings');
                            }
                            
                            if (plan.name === 'Platinum' || plan.name === 'Master') {
                                features.push('Featured company profile');
                                features.push('Advanced analytics');
                                features.push('Dedicated support');
                            }
                            
                            if (plan.name === 'Master') {
                                features.push('Custom branding');
                                features.push('API access');
                                features.push('Priority customer support');
                            }
                            
                            return {
                                ...plan,
                                features
                            };
                        }
                        return plan;
                    });
                    
                    // Sort plans by price (ascending)
                    plansWithFeatures.sort((a, b) => a.price - b.price);
                    setSubscriptionPlans(plansWithFeatures);
                }
                
                // Fetch user subscription
                const userSubRes = await authAxios.get('/api/subscriptions/user-subscription');
                if (userSubRes.data) {
                    setCurrentSubscription(userSubRes.data);
                }
            } catch (error) {
                console.error('Error fetching subscription data:', error);
                // Mock data in case of API error
                setSubscriptionPlans([
                    {
                        _id: '1',
                        name: 'Free',
                        price: 0,
                        duration: 30,
                        description: 'Basic features for small companies',
                        features: [
                            'Access to job posting',
                            'Basic company profile',
                            'Limited applications',
                            'Email support'
                        ],
                        isPopular: false
                    },
                    {
                        _id: '2',
                        name: 'Golden',
                        price: 49.99,
                        duration: 30,
                        description: 'Advanced features for growing companies',
                        features: [
                            'Access to job posting',
                            'Basic company profile',
                            'Priority in search results',
                            'Access to premium candidates',
                            'Unlimited job postings',
                            'Chat support'
                        ],
                        isPopular: true
                    },
                    {
                        _id: '3',
                        name: 'Platinum',
                        price: 99.99,
                        duration: 30,
                        description: 'Premium features for established companies',
                        features: [
                            'Access to job posting',
                            'Basic company profile',
                            'Priority in search results',
                            'Access to premium candidates',
                            'Unlimited job postings',
                            'Featured company profile',
                            'Advanced analytics',
                            'Dedicated support'
                        ],
                        isPopular: false
                    },
                    {
                        _id: '4',
                        name: 'Master',
                        price: 199.99,
                        duration: 30,
                        description: 'Ultimate features for enterprise companies',
                        features: [
                            'Access to job posting',
                            'Basic company profile',
                            'Priority in search results',
                            'Access to premium candidates',
                            'Unlimited job postings',
                            'Featured company profile',
                            'Advanced analytics',
                            'Dedicated support',
                            'Custom branding',
                            'API access',
                            'Priority customer support'
                        ],
                        isPopular: false
                    }
                ]);
                
                // Mock current subscription
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

    // Helper function to get icon based on plan name
    const getPlanIcon = (planName) => {
        if (!planName) return null;
        
        switch(planName) {
            case 'Golden':
                return <HiStar className="text-yellow-500 text-xl" />;
            case 'Platinum':
                return <HiOutlineSparkles className="text-gray-300 text-xl" />;
            case 'Master':
                return <HiOutlineCrown className="text-orange-500 text-xl" />;
            case 'Free':
            default:
                return <span className="text-xl">🔄</span>; // Default emoji for Free plan
        }
    };

    // Helper function to check if user has this plan
    const isCurrentPlan = (planName) => {
        return currentSubscription && currentSubscription.subscription === planName;
    };

    return (
        <Layout>
            <div className="section-box">
                <div className="container mb-50 mt-70">
                    <div className="text-center">
                        <h2 className="section-title mb-10">Subscription Plans</h2>
                        <p className="font-lg color-text-paragraph-2">
                            Choose the perfect plan to boost your hiring process
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center mt-50">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading plans...</p>
                        </div>
                    ) : (
                        <div className="row mt-50">
                            {subscriptionPlans.map((plan) => (
                                <div key={plan._id} className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
                                    <div className={`card-grid-2 hover-up ${plan.isPopular ? 'bg-5' : ''}`}>
                                        <div className="card-subscription-plan text-center">
                                            {plan.isPopular && (
                                                <div className="popular-label">
                                                    Popular
                                                </div>
                                            )}
                                            <div className="card-subscription-header">
                                                <div className="d-flex align-items-center justify-content-center gap-2 mb-20">
                                                    {getPlanIcon(plan.name)}
                                                    <h3 className="mb-0">{plan.name}</h3>
                                                </div>
                                                <div className="card-subscription-price">
                                                    <h2 className="mb-0">
                                                        ${plan.price}
                                                        <span className="text-muted font-md">/month</span>
                                                    </h2>
                                                </div>
                                                <p className="font-sm color-text-paragraph mt-20">
                                                    {plan.description}
                                                </p>
                                            </div>
                                            <div className="card-subscription-body">
                                                <ul className="list-unstyled">
                                                    {plan.features && plan.features.map((feature, index) => (
                                                        <li key={index} className="d-flex align-items-center mb-10">
                                                            <HiCheck className="text-success mr-5" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="card-subscription-footer">
                                                {isCurrentPlan(plan.name) ? (
                                                    <button className="btn btn-success btn-md" disabled>
                                                        Current Plan
                                                    </button>
                                                ) : (
                                                    <Link href={`/payment?planId=${plan._id}`} className="btn btn-default btn-md">
                                                        Upgrade Now
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
