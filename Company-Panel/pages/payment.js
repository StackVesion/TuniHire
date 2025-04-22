import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { createAuthAxios } from '../utils/authUtils';
import { createPaymentIntent, confirmPayment, subscribeToPlan } from '../utils/paymentService';

export default function Payment() {
    const router = useRouter();
    const { planId } = router.query;
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState('initial'); // initial, processing, success, error
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
        nameOnCard: ''
    });
    const authAxios = createAuthAxios();

    useEffect(() => {
        // Fetch plan details when planId is available
        if (planId) {
            fetchPlanDetails();
        }
    }, [planId]);

    const fetchPlanDetails = async () => {
        try {
            setLoading(true);
            const response = await authAxios.get(`/api/subscriptions/plans/${planId}`);
            if (response.data) {
                setPlan(response.data);
            }
        } catch (error) {
            console.error('Error fetching plan details:', error);
            // Mock data for development
            setPlan({
                _id: planId,
                name: planId === '1' ? 'Free' : planId === '2' ? 'Golden' : planId === '3' ? 'Platinum' : 'Master',
                price: planId === '1' ? 0 : planId === '2' ? 49.99 : planId === '3' ? 99.99 : 199.99,
                duration: 30,
                description: 'Subscription plan'
            });
            setError('Could not fetch plan details. Using mock data for development.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!plan) {
            setError('No plan selected');
            return;
        }
        
        setPaymentStatus('processing');
        setError(null);
        
        try {
            // In a real implementation, this would use Stripe.js to collect card details securely
            // For this implementation, we'll use our payment service utility that has mock functionality
            
            // First create a payment intent
            const paymentIntent = await createPaymentIntent(plan._id);
            
            if (!paymentIntent || !paymentIntent.clientSecret) {
                throw new Error('Failed to create payment intent');
            }
            
            // Confirm the payment (in a real implementation, this would use Stripe.confirmCardPayment)
            const paymentResult = await confirmPayment(
                paymentIntent.clientSecret,
                {
                    payment_method: {
                        card: {
                            // These would normally be collected by Stripe Elements
                            number: formData.cardNumber,
                            exp_month: formData.cardExpiry.split('/')[0],
                            exp_year: formData.cardExpiry.split('/')[1],
                            cvc: formData.cardCvc
                        },
                        billing_details: {
                            name: formData.nameOnCard
                        }
                    }
                }
            );
            
            if (paymentResult.error) {
                throw new Error(paymentResult.error.message || 'Payment failed');
            }
            
            // Subscribe the user to the plan
            const subscriptionResult = await subscribeToPlan(plan._id);
            
            if (!subscriptionResult.success) {
                throw new Error('Failed to update subscription');
            }
            
            setPaymentStatus('success');
            
            // Redirect to dashboard after successful payment
            setTimeout(() => {
                router.push('/dashboard?payment=success');
            }, 2000);
            
        } catch (error) {
            console.error('Payment error:', error);
            setError(error.message || 'An error occurred during payment');
            setPaymentStatus('error');
        }
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

    return (
        <Layout>
            <div className="container mt-100 mb-100">
                <div className="row justify-content-center">
                    <div className="col-xl-6 col-lg-8 col-md-10">
                        <div className="card card-border">
                            <div className="card-body p-5">
                                <h2 className="mb-4 text-center">Complete Your Purchase</h2>
                                
                                {/* Order Summary */}
                                <div className="order-summary mb-4 p-4 bg-light rounded">
                                    <h5 className="mb-3">Order Summary</h5>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Plan:</span>
                                        <span><strong>{plan.name}</strong></span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Duration:</span>
                                        <span>{plan.duration} days</span>
                                    </div>
                                    <div className="d-flex justify-content-between fw-bold">
                                        <span>Total:</span>
                                        <span className="text-primary">${plan.price}</span>
                                    </div>
                                </div>

                                {paymentStatus === 'success' ? (
                                    <div className="text-center py-4">
                                        <div className="mb-3">
                                            <div style={{
                                                fontSize: '48px',
                                                color: '#4CAF50'
                                            }}>✓</div>
                                        </div>
                                        <h4 className="mb-3">Payment Successful!</h4>
                                        <p>Your subscription has been updated to the {plan.name} plan.</p>
                                        <p className="text-muted">Redirecting you to the dashboard...</p>
                                    </div>
                                ) : (
                                    <>
                                        {error && (
                                            <div className="alert alert-danger mb-4">
                                                {error}
                                            </div>
                                        )}
                                        
                                        <form onSubmit={handleSubmit}>
                                            <div className="mb-3">
                                                <label htmlFor="cardNumber" className="form-label">Card Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="cardNumber"
                                                    name="cardNumber"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={formData.cardNumber}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled={paymentStatus === 'processing'}
                                                />
                                                <div className="form-text">For testing, you can use: 4242 4242 4242 4242</div>
                                            </div>
                                            
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="cardExpiry" className="form-label">Expiration Date</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="cardExpiry"
                                                        name="cardExpiry"
                                                        placeholder="MM/YY"
                                                        value={formData.cardExpiry}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={paymentStatus === 'processing'}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="cardCvc" className="form-label">CVC</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="cardCvc"
                                                        name="cardCvc"
                                                        placeholder="123"
                                                        value={formData.cardCvc}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={paymentStatus === 'processing'}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label htmlFor="nameOnCard" className="form-label">Name on Card</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="nameOnCard"
                                                    name="nameOnCard"
                                                    placeholder="John Doe"
                                                    value={formData.nameOnCard}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled={paymentStatus === 'processing'}
                                                />
                                            </div>
                                            
                                            <div className="d-grid gap-2">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary btn-lg"
                                                    disabled={paymentStatus === 'processing'}
                                                >
                                                    {paymentStatus === 'processing' ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        `Pay $${plan.price}`
                                                    )}
                                                </button>
                                                
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => router.push('/pricing')}
                                                    disabled={paymentStatus === 'processing'}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                        
                                        <div className="mt-4 text-center text-muted">
                                            <small>This is a simulation. No actual payment will be processed.</small>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
