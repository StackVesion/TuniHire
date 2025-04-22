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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
};
