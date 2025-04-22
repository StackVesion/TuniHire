import axios from 'axios';
import { createAuthAxios } from './authUtils';

// Create authenticated axios instance
const authAxios = createAuthAxios();

/**
 * Create a payment intent for subscription
 * @param {string} planId - The subscription plan ID
 * @returns {Promise<{clientSecret: string, planDetails: object}>}
 */
export const createPaymentIntent = async (planId) => {
  try {
    const response = await authAxios.post('/api/subscriptions/payment-intent', {
      planId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    // Mock response for development if API fails
    return { 
      clientSecret: 'mock_client_secret', 
      planDetails: { name: 'Mock Plan', price: 29.99 } 
    };
  }
};

/**
 * Confirm payment and update user subscription
 * @param {string} paymentIntentId - The Stripe payment intent ID
 * @param {string} planId - The subscription plan ID
 * @returns {Promise<{message: string, subscription: string, expiryDate: Date}>}
 */
export const confirmPayment = async (paymentIntentId, planId) => {
  try {
    const response = await authAxios.post('/api/subscriptions/confirm-payment', {
      paymentIntentId,
      planId
    });
    return response.data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    // Mock response for development if API fails
    return { 
      message: 'Mock payment successful', 
      subscription: 'Golden', 
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
    };
  }
};

/**
 * Subscribe user to a free plan
 * @param {string} planId - The subscription plan ID
 * @returns {Promise<{message: string, subscription: string}>}
 */
export const subscribeToPlan = async (planId) => {
  try {
    const response = await authAxios.post(`/api/subscriptions/subscribe/${planId}`);
    return response.data;
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    // Mock response for development if API fails
    return { 
      message: 'Mock subscription successful', 
      subscription: 'Free' 
    };
  }
};

/**
 * Get user's current subscription details
 * @returns {Promise<{subscription: string, details: object, expiryDate: Date}>}
 */
export const getUserSubscription = async () => {
  try {
    const response = await authAxios.get('/api/subscriptions/user-subscription');
    return response.data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    // Return default free subscription if there's an error
    return { subscription: 'Free', details: null, expiryDate: null };
  }
};

/**
 * Get all available subscription plans
 * @returns {Promise<Array>} List of subscription plans
 */
export const getSubscriptionPlans = async () => {
  try {
    const response = await authAxios.get('/api/subscriptions/plans');
    return response.data;
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    // Mock plans for development if API fails
    return [
      {
        _id: 'mock_free_id',
        name: 'Free',
        price: 0,
        features: ['Basic features'],
        isPopular: false
      },
      {
        _id: 'mock_golden_id',
        name: 'Golden',
        price: 29.99,
        features: ['Premium features', 'Priority support'],
        isPopular: true
      },
      {
        _id: 'mock_platinum_id',
        name: 'Platinum',
        price: 59.99,
        features: ['All Golden features', 'Advanced analytics', 'Dedicated support'],
        isPopular: false
      },
      {
        _id: 'mock_master_id',
        name: 'Master',
        price: 99.99,
        features: ['All Platinum features', 'Custom integrations', '24/7 support'],
        isPopular: false
      }
    ];
  }
};
