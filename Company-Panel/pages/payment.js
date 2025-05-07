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
            fontFamily: '"Poppins", sans-serif',
            fontSmoothing: 'antialiased',
            '::placeholder': {
              color: '#aab7c4',
            },
            iconColor: '#6772e5',
          },
          invalid: {
            color: '#e53e3e',
            iconColor: '#e53e3e',
          },
        },
        hidePostalCode: true,
      }}
      onChange={onChange}
      className="card-element"
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

      // Payment successful, now we need to confirm it with the backend to update subscription
      console.log('Payment confirmed with Stripe, confirming on backend');
      
      // First update the SweetAlert to show we're confirming the payment
      Swal.update({
        title: 'Finalizing Payment',
        html: '<div class="payment-loader"><div class="spinner"></div><p>Activating your subscription...</p></div>'
      });
      
      // Confirm the payment with our backend
      const confirmationResult = await confirmPayment(payload.paymentIntent.id, plan._id);
      console.log('Backend confirmation result:', confirmationResult);
      
      // Now subscribe the user to the plan
      console.log('Updating subscription plan');
      const subscriptionResult = await subscribeToPlan(plan._id, userType);
      
      if (confirmationResult && confirmationResult.subscription) {
        // If confirmation already updated subscription, use that data
        onPaymentSuccess({
          subscription: confirmationResult.subscription,
          planId: plan._id,
          expiryDate: confirmationResult.expiryDate
        });
      } else if (subscriptionResult && subscriptionResult.success) {
        // If not, use data from subscribeToPlan
        onPaymentSuccess({
          subscription: plan.name,
          planId: plan._id,
          expiryDate: subscriptionResult.expiryDate
        });
      } else {
        throw new Error(subscriptionResult?.message || confirmationResult?.message || 'Failed to activate subscription');
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
            className="input-animated"
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
            className="input-animated"
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
              {/* Replace image references with FontAwesome icons */}
              <i className="fab fa-cc-visa fa-2x" style={{ color: '#1A1F71' }}></i>
              <i className="fab fa-cc-mastercard fa-2x" style={{ color: '#EB001B' }}></i>
              <i className="fab fa-cc-amex fa-2x" style={{ color: '#006FCF' }}></i>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="error-message animated shakeX">
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}
        
        <div className="form-row payment-info">
          <div className="payment-security">
            <i className="fas fa-lock"></i> Your payment is secure. We use SSL encryption to protect your data.
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
            
            // Save updated data to localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Updated user subscription in localStorage:', userData.subscription);
            
            // Force a storage event to notify other components about the change
            // This is needed because localStorage changes in the same window don't trigger the storage event
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'user',
                newValue: JSON.stringify(userData),
                url: window.location.href
            }));
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
                    <div className="col-md-7 mb-4 mb-md-0">
                        <div className="card shadow border-0 h-100 payment-card">
                            <div className={`card-header py-4 bg-gradient-primary text-white position-relative overflow-hidden`}>
                                <div className="header-shape"></div>
                                <h3 className="mb-0 mt-2">{plan.name} Plan</h3>
                                <p className="mb-0 opacity-75">{userType === 'company' ? 'For Companies' : 'For Candidates'}</p>
                                
                                {/* Premium indicator badge */}
                                {plan.name !== 'Free' && (
                                  <div className="premium-badge">
                                    <i className="fas fa-crown"></i> Premium
                                  </div>
                                )}
                            </div>
                            <div className="card-body">
                                <div className="plan-price mb-4">
                                    <h2 className="display-4 fw-bold mb-0">${plan.price.toFixed(2)}</h2>
                                    <p className="text-muted">per month</p>
                                </div>
                                
                                <h5 className="mb-3">Plan Features:</h5>
                                <ul className="features-list">
                                    {plan.features && plan.features.map((feature, index) => (
                                        <li key={index} className="feature-item">
                                            <i className="fas fa-check-circle text-success me-2"></i> {feature}
                                        </li>
                                    ))}
                                    
                                    {!plan.features || plan.features.length === 0 ? (
                                        <>
                                            <li className="feature-item"><i className="fas fa-check-circle text-success me-2"></i> Access to job board</li>
                                            <li className="feature-item"><i className="fas fa-check-circle text-success me-2"></i> Basic analytics</li>
                                            <li className="feature-item"><i className="fas fa-check-circle text-success me-2"></i> Email support</li>
                                            {plan.name !== 'Free' && (
                                                <>
                                                    <li className="feature-item"><i className="fas fa-check-circle text-success me-2"></i> AI-powered recommendations</li>
                                                    <li className="feature-item"><i className="fas fa-check-circle text-success me-2"></i> Priority support</li>
                                                </>
                                            )}
                                        </>
                                    ) : null}
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-5">
                        <div className="card shadow border-0 payment-form-card">
                            <div className="card-body p-4">
                                <h4 className="card-title mb-4">Payment Details</h4>
                                
                                {plan.price === 0 ? (
                                    <div className="free-plan-message mb-4">
                                        <p className="text-center mb-0">
                                            <i className="fas fa-gift text-success me-2"></i>
                                            You're activating the <strong>Free Plan</strong> - no payment information required!
                                        </p>
                                    </div>
                                ) : null}
                                
                                <Elements stripe={stripePromise}>
                                    <CheckoutForm 
                                        plan={plan} 
                                        userType={userType} 
                                        onPaymentSuccess={handlePaymentSuccess}
                                        onPaymentError={handlePaymentError}
                                    />
                                </Elements>
                                
                                <div className="payment-trust-badges text-center mt-4">
                                    <div className="d-flex justify-content-center align-items-center flex-wrap">
                                        <div className="trust-badge me-3 mb-2">
                                            <i className="fas fa-shield-alt"></i>
                                            <span>Secure</span>
                                        </div>
                                        <div className="trust-badge me-3 mb-2">
                                            <i className="fas fa-lock"></i>
                                            <span>Encrypted</span>
                                        </div>
                                        <div className="trust-badge mb-2">
                                            <i className="fas fa-credit-card"></i>
                                            <span>PCI DSS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center mt-3">
                            <button 
                                onClick={() => router.push('/pricing')} 
                                className="btn btn-outline-secondary"
                            >
                                <i className="fas fa-arrow-left me-2"></i> Back to Plans
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Add global styles */}
            <style jsx global>{`
                /* Modern form styling */
                .input-animated {
                    transition: all 0.3s;
                    border: 1px solid #ced4da;
                    border-radius: 0.375rem;
                    padding: 0.75rem 1rem;
                    width: 100%;
                    font-size: 1rem;
                }
                
                .input-animated:focus {
                    border-color: #6772e5;
                    box-shadow: 0 0 0 3px rgba(103, 114, 229, 0.2);
                    outline: none;
                }
                
                /* Card Element Styling */
                .card-element-container {
                    border: 1px solid #ced4da;
                    border-radius: 0.375rem;
                    padding: 0.75rem 1rem;
                    background: white;
                    transition: all 0.3s;
                }
                
                .card-element-container:focus-within {
                    border-color: #6772e5;
                    box-shadow: 0 0 0 3px rgba(103, 114, 229, 0.2);
                }
                
                .card-element {
                    width: 100%;
                }
                
                /* Card Icons */
                .card-icons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 10px;
                    opacity: 0.7;
                }
                
                /* Payment Button */
                .btn-payment {
                    background: linear-gradient(135deg, #6772e5 0%, #4b57c9 100%);
                    color: white;
                    border: none;
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    font-weight: 600;
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                    margin-top: 1rem;
                }
                
                .btn-payment:before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: all 0.5s;
                }
                
                .btn-payment:hover:not(:disabled):before {
                    left: 100%;
                }
                
                .btn-payment:disabled {
                    background: #b9beda;
                    cursor: not-allowed;
                }
                
                .btn-payment.processing {
                    background: #b9beda;
                }
                
                /* Error Message */
                .error-message {
                    color: #e53e3e;
                    padding: 0.5rem;
                    margin: 0.5rem 0;
                    background-color: rgba(229, 62, 62, 0.1);
                    border-radius: 0.375rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                /* Animation */
                @keyframes shakeX {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                
                .animated.shakeX {
                    animation: shakeX 0.8s;
                }
                
                /* Payment Card Styling */
                .payment-card {
                    border-radius: 1rem;
                    overflow: hidden;
                    transform: perspective(1000px) rotateY(0deg);
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                }
                
                .payment-card:hover {
                    transform: perspective(1000px) rotateY(5deg);
                }
                
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
                }
                
                .header-shape {
                    position: absolute;
                    top: -50px;
                    right: -50px;
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .premium-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 0.25rem 0.75rem;
                    background: rgba(255, 215, 0, 0.9);
                    color: #000;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                
                /* Features List */
                .features-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .feature-item {
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                }
                
                .feature-item:last-child {
                    border-bottom: none;
                }
                
                /* Payment Form Card */
                .payment-form-card {
                    border-radius: 1rem;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.05) !important;
                }
                
                /* Trust Badges */
                .trust-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    background: #f8f9fa;
                    border-radius: 0.5rem;
                }
                
                .trust-badge i {
                    color: #4b6cb7;
                    margin-bottom: 0.25rem;
                }
                
                .trust-badge span {
                    font-size: 0.75rem;
                    color: #6c757d;
                }
                
                /* Payment Security Info */
                .payment-security {
                    color: #6c757d;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                
                /* Success Animation */
                @keyframes checkmark {
                    0% { stroke-dashoffset: 100; }
                    100% { stroke-dashoffset: 0; }
                }
                
                @keyframes checkmark-circle {
                    0% { stroke-dashoffset: 480; }
                    100% { stroke-dashoffset: 960; }
                }
                
                .success-animation {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .checkmark {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: block;
                    stroke-width: 2;
                    stroke: #4bb71b;
                    stroke-miterlimit: 10;
                    box-shadow: 0 0 0 #4bb71b;
                    animation: checkmark-circle 0.6s ease-in-out forwards;
                }
                
                .checkmark-circle {
                    stroke-dasharray: 480;
                    stroke-dashoffset: 480;
                    stroke-width: 2;
                    stroke-miterlimit: 10;
                    stroke: #4bb71b;
                    fill: none;
                    animation: checkmark-circle 0.6s ease-in-out forwards;
                }
                
                .checkmark-check {
                    transform-origin: 50% 50%;
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                    animation: checkmark 1s ease-in-out 0.3s forwards;
                }
                
                /* Free plan message */
                .free-plan-message {
                    background-color: rgba(75, 183, 27, 0.1);
                    border: 1px solid rgba(75, 183, 27, 0.3);
                    border-radius: 0.5rem;
                    padding: 1rem;
                }
            `}</style>
        </Layout>
    );
}

// Export the Payment component as default
export default Payment;
