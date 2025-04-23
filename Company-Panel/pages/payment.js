import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { createAuthAxios } from '../utils/authUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, subscribeToPlan } from '../utils/paymentService';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample');

// Styled Card Component
const CardField = ({ onChange }) => (
  <div className="FormRow">
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
        hidePostalCode: true,
      }}
      onChange={onChange}
    />
  </div>
);

// Payment Form Component
const CheckoutForm = ({ plan, userType, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: ''
  });

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card details');
      return;
    }

    if (!billingDetails.name) {
      setError('Please provide your name');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent(plan._id, userType);
      
      if (!paymentIntent || !paymentIntent.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error: stripeError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: billingDetails,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onPaymentError(stripeError.message);
      } else if (confirmedIntent.status === 'succeeded') {
        // Payment successful, update subscription
        const subscriptionResult = await subscribeToPlan(plan._id, userType);
        if (subscriptionResult.success) {
          onPaymentSuccess(subscriptionResult);
        } else {
          throw new Error('Failed to update subscription');
        }
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'An error occurred during payment');
      onPaymentError(error.message || 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group mb-3">
        <label htmlFor="name" className="form-label">
          Name on Card
        </label>
        <input
          id="name"
          type="text"
          className="form-control"
          required
          value={billingDetails.name}
          onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
          placeholder="Jane Doe"
        />
      </div>
      
      <div className="form-group mb-4">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="form-control"
          required
          value={billingDetails.email}
          onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
          placeholder="jane.doe@example.com"
        />
      </div>

      <div className="form-group mb-4">
        <label htmlFor="card" className="form-label">
          Card Information
        </label>
        <div className="card-element-container form-control p-3">
          <CardField
            onChange={(e) => {
              setError(e.error ? e.error.message : '');
              setCardComplete(e.complete);
            }}
          />
        </div>
        {error && <div className="text-danger mt-2 small">{error}</div>}
        <div className="form-text">
          For testing, use card number: 4242 4242 4242 4242, any future date, and any CVC
        </div>
      </div>

      <div className="d-grid gap-2 mt-4">
        <button
          type="submit"
          className="btn btn-primary payment-button"
          disabled={!stripe || processing}
        >
          {processing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            `Pay $${plan.price}`
          )}
        </button>
      </div>
    </form>
  );
};

// Main Payment Page Component
export default function Payment() {
    const router = useRouter();
    const { planId, userType } = router.query;
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState('initial'); // initial, processing, success, error
    const [error, setError] = useState(null);
    const authAxios = createAuthAxios();

    useEffect(() => {
        // Fetch plan details when planId is available
        if (planId && userType) {
            fetchPlanDetails();
        }
    }, [planId, userType]);

    const fetchPlanDetails = async () => {
        try {
            setLoading(true);
            
            // For this implementation, we'll use the planId to determine details
            // In a production app, you would fetch this from your backend
            
            // Check if this is a company or candidate plan
            const isCompanyPlan = planId.startsWith('company-');
            const planType = planId.split('-')[1]; // 'free', 'golden', etc.
            
            let mockPlan;
            
            if (isCompanyPlan) {
                switch(planType) {
                    case 'golden':
                        mockPlan = {
                            _id: planId,
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
                            ]
                        };
                        break;
                    case 'platinum':
                        mockPlan = {
                            _id: planId,
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
                                'Dedicated support'
                            ]
                        };
                        break;
                    case 'master':
                        mockPlan = {
                            _id: planId,
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
                                'VIP customer support'
                            ]
                        };
                        break;
                    default:
                        mockPlan = {
                            _id: planId,
                            name: 'Free',
                            price: 0,
                            duration: 30,
                            description: 'Basic features for small companies',
                            features: [
                                'Job posting (limited to 3)',
                                'Basic company profile',
                                'Basic candidate search',
                                'Standard support'
                            ]
                        };
                }
            } else {
                // Candidate plans
                switch(planType) {
                    case 'golden':
                        mockPlan = {
                            _id: planId,
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
                            ]
                        };
                        break;
                    case 'platinum':
                        mockPlan = {
                            _id: planId,
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
                                'Dedicated support'
                            ]
                        };
                        break;
                    case 'master':
                        mockPlan = {
                            _id: planId,
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
                                'VIP customer support'
                            ]
                        };
                        break;
                    default:
                        mockPlan = {
                            _id: planId,
                            name: 'Free',
                            price: 0,
                            duration: 30,
                            description: 'Basic features for job seekers',
                            features: [
                                'Basic profile creation',
                                'Limited job applications',
                                'Standard resume builder',
                                'Email support'
                            ]
                        };
                }
            }
            
            setPlan(mockPlan);
            
        } catch (error) {
            console.error('Error fetching plan details:', error);
            setError('Could not fetch plan details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (result) => {
        setPaymentStatus('success');
        
        // Redirect to dashboard after successful payment
        setTimeout(() => {
            router.push('/dashboard?payment=success');
        }, 2000);
    };

    const handlePaymentError = (errorMessage) => {
        setError(errorMessage);
        setPaymentStatus('error');
    };

    if (loading) {
        return (
            <Layout>
                <div className="container mt-100 mb-100">
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading payment details...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!plan) {
        return (
            <Layout>
                <div className="container mt-100 mb-100">
                    <div className="alert alert-danger">
                        <h4>Plan not found</h4>
                        <p>The selected subscription plan could not be found. Please return to the pricing page and try again.</p>
                        <button 
                            className="btn btn-outline-primary mt-3"
                            onClick={() => router.push('/pricing')}
                        >
                            Back to Pricing
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    // If it's a free plan, no payment required
    if (plan.price === 0) {
        return (
            <Layout>
                <div className="container mt-100 mb-100">
                    <div className="row justify-content-center">
                        <div className="col-xl-6 col-lg-8 col-md-10">
                            <div className="card card-border shadow-lg">
                                <div className="card-body p-5">
                                    <div className="text-center mb-4">
                                        <div className="icon-circle bg-success">
                                            <i className="fas fa-check text-white"></i>
                                        </div>
                                        <h2 className="mb-3 mt-4">Free Plan Activation</h2>
                                        <p>The {plan.name} plan is free! Click below to activate it for your account.</p>
                                    </div>
                                    
                                    <div className="d-grid gap-2 mt-4">
                                        <button 
                                            className="btn btn-success btn-lg"
                                            onClick={async () => {
                                                try {
                                                    const result = await subscribeToPlan(plan._id, userType);
                                                    handlePaymentSuccess(result);
                                                } catch (error) {
                                                    handlePaymentError(error.message);
                                                }
                                            }}
                                        >
                                            Activate Free Plan
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => router.push('/pricing')}
                                        >
                                            Back to Pricing
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="payment-page container mt-100 mb-100">
                <div className="row justify-content-center">
                    <div className="col-xl-10 col-lg-11">
                        <div className="card shadow-lg payment-card animated fadeIn">
                            <div className="row g-0">
                                {/* Plan Summary Side */}
                                <div className="col-lg-5 bg-gradient-primary text-white p-0">
                                    <div className="p-5 h-100 d-flex flex-column">
                                        <div className="plan-header mb-4">
                                            <h3 className="mb-0">Order Summary</h3>
                                            <hr className="divider" />
                                        </div>
                                        
                                        <div className="order-details mb-4">
                                            <div className="plan-name mb-2">
                                                <span className="text-muted">Plan:</span>
                                                <h4>{plan.name} Plan</h4>
                                            </div>
                                            <div className="plan-type mb-2">
                                                <span className="text-muted">Type:</span>
                                                <h5>{userType === 'company' ? 'Company' : 'Candidate'}</h5>
                                            </div>
                                            <div className="plan-duration mb-2">
                                                <span className="text-muted">Duration:</span>
                                                <p>{plan.duration} days</p>
                                            </div>
                                        </div>
                                        
                                        <div className="plan-features mb-3">
                                            <h5 className="mb-3">Features:</h5>
                                            <ul className="feature-list">
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="mb-2">
                                                        <span className="feature-icon">✓</span>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        <div className="price-summary mt-auto">
                                            <hr className="divider" />
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>Total:</span>
                                                <h3 className="mb-0">${plan.price}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Payment Form Side */}
                                <div className="col-lg-7">
                                    <div className="p-5">
                                        <h2 className="mb-4">Complete Your Purchase</h2>
                                        
                                        {paymentStatus === 'success' ? (
                                            <div className="text-center py-4 animated fadeIn">
                                                <div className="success-animation mb-4">
                                                    <div className="checkmark">
                                                        <svg className="checkmark-circle" viewBox="0 0 52 52">
                                                            <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none" />
                                                            <circle className="checkmark-circle-check" cx="26" cy="26" r="25" fill="none" />
                                                        </svg>
                                                        <svg className="checkmark-check" viewBox="0 0 52 40">
                                                            <path className="checkmark-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <h4 className="mb-3">Payment Successful!</h4>
                                                <p>Your subscription has been updated to the {plan.name} plan.</p>
                                                <p className="text-muted">Redirecting you to the dashboard...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {error && (
                                                    <div className="alert alert-danger mb-4 animated shakeX">
                                                        {error}
                                                    </div>
                                                )}
                                                
                                                <Elements stripe={stripePromise}>
                                                    <CheckoutForm 
                                                        plan={plan} 
                                                        userType={userType}
                                                        onPaymentSuccess={handlePaymentSuccess}
                                                        onPaymentError={handlePaymentError}
                                                    />
                                                </Elements>
                                                
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary w-100"
                                                        onClick={() => router.push('/pricing')}
                                                    >
                                                        Cancel and Return to Pricing
                                                    </button>
                                                </div>
                                                
                                                <div className="mt-4 text-center text-muted">
                                                    <div className="secure-payment-info">
                                                        <i className="fas fa-lock me-2"></i>
                                                        <small>All payments are secure and encrypted</small>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .payment-page {
                    background-color: #f8f9fa;
                }
                
                .payment-card {
                    border-radius: 10px;
                    overflow: hidden;
                    border: none;
                }
                
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #2c3e50, #3498db);
                    position: relative;
                }
                
                .feature-list {
                    list-style: none;
                    padding-left: 0;
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
                
                .divider {
                    border-top: 1px solid rgba(255,255,255,0.2);
                    margin: 15px 0;
                }
                
                .card-element-container {
                    background-color: #fff;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    transition: box-shadow 0.15s ease, border-color 0.15s ease;
                }
                
                .card-element-container:focus-within {
                    border-color: #86b7fe;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
                
                /* Success Animation */
                .success-animation {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto;
                    position: relative;
                }
                
                .checkmark-circle {
                    width: 100px;
                    height: 100px;
                    position: relative;
                    display: block;
                    stroke-width: 2;
                    stroke: #4bb71b;
                }
                
                .checkmark-circle-bg {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    stroke-width: 2;
                    stroke-miterlimit: 10;
                    stroke: #4bb71b;
                    fill: none;
                    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                
                .checkmark-circle-check {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    stroke-width: 8;
                    stroke-miterlimit: 10;
                    stroke: rgba(75, 183, 27, 0.1);
                    fill: none;
                    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                
                .checkmark-check {
                    transform-origin: 50% 50%;
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    stroke-width: 3;
                    stroke: #4bb71b;
                    fill: none;
                    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                }
                
                @keyframes stroke {
                    100% {
                        stroke-dashoffset: 0;
                    }
                }
                
                /* Animations */
                .animated {
                    animation-duration: 1s;
                    animation-fill-mode: both;
                }
                
                .fadeIn {
                    animation-name: fadeIn;
                }
                
                .shakeX {
                    animation-name: shakeX;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes shakeX {
                    from, to { transform: translate3d(0, 0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate3d(-10px, 0, 0); }
                    20%, 40%, 60%, 80% { transform: translate3d(10px, 0, 0); }
                }
                
                /* For smaller screens */
                @media (max-width: 991.98px) {
                    .bg-gradient-primary {
                        border-radius: 10px 10px 0 0;
                    }
                }
            `}</style>
        </Layout>
    );
}
