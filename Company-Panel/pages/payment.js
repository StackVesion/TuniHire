import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { createAuthAxios } from '../utils/authUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, subscribeToPlan, confirmPayment, getPlans } from '../utils/paymentService';
import Swal from 'sweetalert2';

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
    email: '',
    address: {
      line1: '',
      city: '',
      country: ''
    }
  });

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      Swal.fire({
        title: 'Error',
        text: "Stripe hasn't loaded yet. Please try again.",
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (!cardComplete) {
      Swal.fire({
        title: 'Error',
        text: 'Please complete your card details',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (!billingDetails.name) {
      Swal.fire({
        title: 'Error',
        text: 'Please provide your name',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setProcessing(true);
    setError(null);

    // Show loading indicator
    Swal.fire({
      title: 'Processing Payment',
      html: '<div class="payment-loader"><div class="spinner"></div><p>Please wait while we process your payment...</p></div>',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Create payment intent
      console.log(`Creating payment intent for plan: ${plan._id}, userType: ${userType}`);
      const paymentIntentResult = await createPaymentIntent(plan._id, userType);
      
      if (!paymentIntentResult || !paymentIntentResult.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      console.log('Payment intent created successfully');
      
      // For free plans, skip payment confirmation
      if (plan.price === 0) {
        console.log('Free plan selected, skipping payment confirmation');
        // Update SweetAlert to show processing for free plan
        Swal.update({
          title: 'Activating Free Plan',
          html: '<div class="payment-loader"><div class="spinner"></div><p>Please wait while we activate your free subscription...</p></div>'
        });
        
        const subscriptionResult = await subscribeToPlan(plan._id, userType);
        if (subscriptionResult && subscriptionResult.success) {
          onPaymentSuccess({
            subscription: plan.name,
            planId: plan._id,
            expiryDate: subscriptionResult.expiryDate
          });
        } else {
          throw new Error(subscriptionResult?.message || 'Failed to activate free subscription');
        }
        return;
      }

      // Real Stripe payment processing
      const cardElement = elements.getElement(CardElement);
      
      // Confirm the payment
      const payload = await stripe.confirmCardPayment(paymentIntentResult.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email
          }
        }
      });

      if (payload.error) {
        throw new Error(payload.error.message);
      }

      // Payment successful, subscribe to plan
      console.log('Payment confirmed, subscribing to plan');
      const subscriptionResult = await subscribeToPlan(plan._id, userType);
      
      if (subscriptionResult && subscriptionResult.success) {
        onPaymentSuccess({
          subscription: plan.name,
          planId: plan._id,
          expiryDate: subscriptionResult.expiryDate
        });
      } else {
        throw new Error(subscriptionResult?.message || 'Failed to activate subscription');
      }
    } catch (err) {
      console.error('Payment error:', err.message);
      Swal.close();
      setError(err.message);
      onPaymentError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="card-details">
        <div className="form-row">
          <label htmlFor="name">
            <span className="required">Full Name</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Smith"
            required
            value={billingDetails.name}
            onChange={(e) => {
              setBillingDetails(prev => ({ ...prev, name: e.target.value }));
            }}
          />
        </div>
        
        <div className="form-row">
          <label htmlFor="email">
            <span className="required">Email Address</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="john.smith@example.com"
            required
            value={billingDetails.email}
            onChange={(e) => {
              setBillingDetails(prev => ({ ...prev, email: e.target.value }));
            }}
          />
        </div>
        
        <div className="form-row">
          <label htmlFor="card">
            <span className="required">Card Information</span>
          </label>
          <div className="card-element-container">
            <CardField
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setError(e.error.message);
                } else {
                  setError(null);
                }
              }}
            />
            <div className="card-icons">
              <img src="/assets/imgs/page/payment/visa.svg" alt="Visa" />
              <img src="/assets/imgs/page/payment/mastercard.svg" alt="Mastercard" />
              <img src="/assets/imgs/page/payment/amex.svg" alt="American Express" />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="error-message animated shakeX">
            <i className="fi-rr-exclamation-triangle"></i> {error}
          </div>
        )}
        
        <div className="form-row payment-info">
          <div className="payment-security">
            <i className="fi-rr-lock"></i> Your payment is secure. We use SSL encryption to protect your data.
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={processing || !stripe || !cardComplete} 
          className={`btn btn-payment ${processing ? 'processing' : ''}`}
        >
          {processing ? (
            <span className="processing-text">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Processing...
            </span>
          ) : (
            <span>Pay ${plan.price > 0 ? plan.price.toFixed(2) : '0.00'}</span>
          )}
        </button>
      </div>
    </form>
  );
};

// Main Payment Page Component
function Payment() {
    const router = useRouter();
    const { planId, userType = 'company' } = router.query;
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, error
    const [subscription, setSubscription] = useState(null);
    
    useEffect(() => {
        if (planId) {
            fetchPlanDetails();
        } else if (router.isReady) {
            // If router is ready but no planId, redirect to pricing
            router.push('/pricing');
        }
    }, [planId, router.isReady]);
    
    const fetchPlanDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // If we don't have a planId, redirect to pricing page
            if (!planId) {
                router.push('/pricing');
                return;
            }
            
            console.log(`Fetching plan details for ID: ${planId}, type: ${userType}`);
            
            // Try to get plans from the API
            const plans = await getPlans(userType);
            
            if (!plans || plans.length === 0) {
                throw new Error('No subscription plans available');
            }
            
            // Find the selected plan
            const selectedPlan = plans.find(p => p._id === planId);
            
            if (selectedPlan) {
                console.log('Selected plan found:', selectedPlan);
                setPlan(selectedPlan);
            } else {
                // If plan not found in API results, show error
                console.error('Selected plan not found in available plans. PlanId:', planId);
                setError('Selected plan not found. Please go back to the pricing page and try again.');
                
                // Show error dialog
                Swal.fire({
                    title: 'Plan Not Found',
                    text: 'The selected subscription plan could not be found. Please go back to the pricing page and try again.',
                    icon: 'error',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Go to Pricing',
                }).then((result) => {
                    if (result.isConfirmed) {
                        router.push('/pricing');
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching plan details:', error);
            setError('Failed to load plan details. Please try again.');
            
            // Show error dialog
            Swal.fire({
                title: 'Error',
                text: 'Failed to load subscription plan details. Please try again later.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (result) => {
        console.log('Payment successful:', result);
        setPaymentStatus('success');
        setSubscription(result.subscription);
        
        // Update user data in localStorage with new subscription
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.subscription = result.subscription;
            userData.subscriptionExpiryDate = result.expiryDate;
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Updated user subscription in localStorage:', userData.subscription);
        } catch (e) {
            console.error('Error updating localStorage:', e);
        }
        
        // Show success message
        Swal.fire({
            title: 'Success!',
            html: `
                <div class="success-animation">
                    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
                <h4>Payment Successful!</h4>
                <p>You have successfully subscribed to the <strong>${result.subscription}</strong> plan.</p>
            `,
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Go to Homepage'
        }).then((result) => {
            if (result.isConfirmed) {
                router.push('/');
            }
        });
        
        // Automatically redirect to home page after 3 seconds
        setTimeout(() => {
            router.push('/');
        }, 3000);
    };
    
    const handlePaymentError = (errorMessage) => {
        console.log('Payment failed:', errorMessage);
        setPaymentStatus('error');
    };
    
    if (loading) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading plan details...</p>
                    </div>
                </div>
            </Layout>
        );
    }
    
    if (error) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                    <div className="text-center">
                        <button 
                            className="btn btn-primary" 
                            onClick={() => router.push('/pricing')}
                        >
                            Back to Pricing
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }
    
    if (!plan) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="alert alert-warning" role="alert">
                        Plan not found. Please select a plan from the pricing page.
                    </div>
                    <div className="text-center">
                        <button 
                            className="btn btn-primary" 
                            onClick={() => router.push('/pricing')}
                        >
                            Go to Pricing
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }
    
    if (paymentStatus === 'success') {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="row justify-content-center">
                        <div className="col-md-8 text-center">
                            <div className="card shadow-sm border-0">
                                <div className="card-body p-5">
                                    <div className="success-animation mb-4">
                                        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                                            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                        </svg>
                                    </div>
                                    
                                    <h2 className="display-6 fw-bold text-success mb-3">Payment Successful!</h2>
                                    <p className="lead mb-4">
                                        Thank you for subscribing to our {plan.name} plan. Your account has been upgraded successfully.
                                    </p>
                                    
                                    <div className="d-grid gap-2 col-6 mx-auto">
                                        <button 
                                            className="btn btn-primary btn-lg" 
                                            onClick={() => router.push('/')}
                                        >
                                            Go to Dashboard
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
            <div className="container py-5">
                <div className="row">
                    <div className="col-md-6 mb-4 mb-md-0">
                        <div className="card shadow-sm border-0 h-100">
                            <div className={`card-header py-4 bg-gradient-primary text-white`}>
                                <h3 className="mb-0">{plan.name} Plan</h3>
                                <p className="mb-0 opacity-75">{userType === 'company' ? 'For Companies' : 'For Candidates'}</p>
                            </div>
                            <div className="card-body">
                                <div className="plan-price mb-4">
                                    <h2 className="display-4 fw-bold mb-0">${plan.price.toFixed(2)}</h2>
                                    <p className="text-muted">per month</p>
                                </div>
                                
                                <div className="plan-features">
                                    <h5 className="mb-3">What's included:</h5>
                                    <ul className="feature-list list-unstyled mb-4">
                                        {plan.features && plan.features.map((feature, index) => (
                                            <li key={index} className="mb-2">
                                                <span className="feature-icon">✓</span>
                                                <span className="feature-text">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="card shadow-sm border-0">
                            <div className="card-header py-4">
                                <h3 className="mb-0">Payment Details</h3>
                            </div>
                            <div className="card-body p-4">
                                {plan.price === 0 ? (
                                    <div className="text-center py-4">
                                        <h4 className="mb-4">Free Plan</h4>
                                        <p className="mb-4">No payment required for the Free plan.</p>
                                        <button 
                                            className="btn btn-primary btn-lg"
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const result = await subscribeToPlan(plan._id, userType);
                                                    handlePaymentSuccess({
                                                      subscription: plan.name,
                                                      planId: plan._id,
                                                      expiryDate: result.expiryDate
                                                    });
                                                } catch (error) {
                                                    handlePaymentError(error.message);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                        >
                                            Activate Free Plan
                                        </button>
                                    </div>
                                ) : (
                                    <Elements stripe={stripePromise}>
                                        <CheckoutForm 
                                            plan={plan}
                                            userType={userType}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={handlePaymentError}
                                        />
                                    </Elements>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .payment-header {
                    background: linear-gradient(135deg, #3a8ffe 0%, #9658fe 100%);
                    padding: 40px 0;
                    text-align: center;
                    color: white;
                    border-radius: 10px 10px 0 0;
                    margin-bottom: 30px;
                }
                
                .payment-wrapper {
                    background-color: #fff;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    margin-top: 50px;
                    margin-bottom: 50px;
                }
                
                .plan-details {
                    padding: 0 30px 30px;
                }
                
                .plan-name {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 10px;
                }
                
                .plan-price {
                    font-size: 42px;
                    font-weight: 800;
                    color: #fff;
                    margin-bottom: 5px;
                }
                
                .plan-billing {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 20px 0;
                }
                
                .plan-features li {
                    padding: 10px 0;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                }
                
                .plan-features li:last-child {
                    border-bottom: none;
                }
                
                .feature-icon {
                    color: #4BB543;
                    margin-right: 10px;
                    font-size: 18px;
                }
                
                .checkout-form {
                    padding: 20px 30px 30px;
                }
                
                .card-details {
                    background-color: #f9f9f9;
                    padding: 25px;
                    border-radius: 10px;
                }
                
                .form-row {
                    margin-bottom: 20px;
                }
                
                .form-row label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }
                
                .form-row .required:after {
                    content: "*";
                    color: #e53935;
                    margin-left: 3px;
                }
                
                .form-row input {
                    width: 100%;
                    padding: 12px 15px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                }
                
                .form-row input:focus {
                    border-color: #3a8ffe;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(58, 143, 254, 0.2);
                }
                
                .card-element-container {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background-color: white;
                    transition: all 0.3s;
                }
                
                .card-element-container:focus-within {
                    border-color: #3a8ffe;
                    box-shadow: 0 0 0 2px rgba(58, 143, 254, 0.2);
                }
                
                .card-icons {
                    display: flex;
                    margin-top: 10px;
                    gap: 10px;
                }
                
                .card-icons img {
                    height: 25px;
                }
                
                .error-message {
                    background-color: #ffebee;
                    color: #d32f2f;
                    padding: 10px 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                }
                
                .error-message i {
                    margin-right: 8px;
                    font-size: 18px;
                }
                
                .btn-payment {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #3a8ffe 0%, #9658fe 100%);
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .btn-payment:hover {
                    background: linear-gradient(135deg, #3183e8 0%, #8750e8 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(58, 143, 254, 0.3);
                }
                
                .btn-payment:disabled {
                    background: #b0bec5;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                
                .btn-payment.processing {
                    background: #b0bec5;
                }
                
                .processing-text {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .payment-security {
                    display: flex;
                    align-items: center;
                    color: #757575;
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                
                .payment-security i {
                    color: #4CAF50;
                    margin-right: 8px;
                    font-size: 16px;
                }
                
                .subscription-icon {
                    font-size: 64px;
                    color: white;
                    margin-bottom: 20px;
                }
                
                .success-animation {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto;
                    position: relative;
                }
                
                .checkmark {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: block;
                    stroke-width: 2;
                    stroke: #4bb71b;
                    stroke-miterlimit: 10;
                    box-shadow: inset 0px 0px 0px #4bb71b;
                    animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
                    position: relative;
                    top: 5px;
                    right: 5px;
                    margin: 0 auto;
                }
                
                .checkmark-circle {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    stroke-width: 2;
                    stroke-miterlimit: 10;
                    stroke: #4bb71b;
                    fill: none;
                    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                
                .checkmark-check {
                    transform-origin: 50% 50%;
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                }
                
                @keyframes stroke {
                    100% {
                        stroke-dashoffset: 0;
                    }
                }
                
                @keyframes scale {
                    0%, 100% {
                        transform: none;
                    }
                    50% {
                        transform: scale3d(1.1, 1.1, 1);
                    }
                }
                
                @keyframes fill {
                    100% {
                        box-shadow: inset 0px 0px 0px 30px #4bb71b;
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
                    .payment-header {
                        border-radius: 10px 10px 0 0;
                    }
                }
                
                /* Loader Styles */
                .payment-loader {
                    text-align: center;
                    padding: 20px;
                }
                
                .spinner {
                    display: inline-block;
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top-color: #3498db;
                    animation: spin 1s ease-in-out infinite;
                    margin-bottom: 15px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Plan feature icons */
                .plan-feature-icon {
                    width: 20px;
                    height: 20px;
                    margin-right: 10px;
                    color: #4CAF50;
                }
                
                /* Plan card styling */
                .plan-card {
                    border-radius: 10px;
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                }
                
                .plan-card.free {
                    background: linear-gradient(135deg, #90CAF9 0%, #42A5F5 100%);
                }
                
                .plan-card.golden {
                    background: linear-gradient(135deg, #FFD54F 0%, #FFA000 100%);
                }
                
                .plan-card.platinum {
                    background: linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%);
                }
                
                .plan-card.master {
                    background: linear-gradient(135deg, #CE93D8 0%, #9C27B0 100%);
                }
                
                .plan-card:before {
                    content: '';
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: rgba(255, 255, 255, 0.15);
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                }
                
                .plan-card:after {
                    content: '';
                    position: absolute;
                    bottom: -50px;
                    left: -50px;
                    background: rgba(255, 255, 255, 0.1);
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                }
            `}</style>
        </Layout>
    );
}

// Export the Payment component as default
export default Payment;
