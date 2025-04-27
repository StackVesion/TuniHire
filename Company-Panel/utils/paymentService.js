import axios from 'axios';
import { createAuthAxios } from './authUtils';

// Create authenticated axios instance
const authAxios = createAuthAxios();

// API Base URL - change this to match your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Create a payment intent for subscription
 * @param {string} planId - The subscription plan ID
 * @param {string} userType - The user type (company or candidate)
 * @returns {Promise<{clientSecret: string, planDetails: object}>}
 */
export const createPaymentIntent = async (planId, userType = 'company') => {
  try {
    console.log(`Sending payment-intent request to ${API_BASE_URL}/api/subscriptions/payment-intent`);
    console.log(`Plan ID: ${planId}, User Type: ${userType}`);
    
    const response = await authAxios.post(`${API_BASE_URL}/api/subscriptions/payment-intent`, {
      planId,
      userType
    });
    
    console.log('Payment intent created successfully:', response.data);
    return response.data;
  } catch (error) {
    const errorStatus = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`Error creating payment intent (${errorStatus}): ${errorMessage}`, error);
    throw new Error(`Payment setup failed: ${errorMessage}`);
  }
};

/**
 * Confirm the payment intent and update subscription
 * @param {string} paymentIntentId - The payment intent ID from Stripe
 * @param {string} planId - The subscription plan ID
 * @returns {Promise<Object>}
 */
export const confirmPayment = async (paymentIntentId, planId) => {
  try {
    console.log(`Sending confirm-payment request to ${API_BASE_URL}/api/subscriptions/confirm-payment`);
    console.log(`Payment Intent ID: ${paymentIntentId}, Plan ID: ${planId}`);
    
    const response = await authAxios.post(`${API_BASE_URL}/api/subscriptions/confirm-payment`, {
      paymentIntentId,
      planId
    });
    
    console.log('Payment confirmation response:', response.data);
    
    if (response.data) {
      // Update user data in localStorage with new subscription
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.subscription = response.data.subscription || response.data.message?.includes('Gold') ? 'Golden' : 
                               response.data.message?.includes('Platinum') ? 'Platinum' : 
                               response.data.message?.includes('Master') ? 'Master' : 'Free';
        userData.subscriptionExpiryDate = response.data.expiryDate;
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Updated user subscription data in localStorage:', userData.subscription);
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
    }
    
    return response.data;
  } catch (error) {
    const errorStatus = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`Error confirming payment (${errorStatus}): ${errorMessage}`, error);
    throw new Error(`Payment confirmation failed: ${errorMessage}`);
  }
};

/**
 * Subscribe user to a plan (after payment confirmation)
 * @param {string} planId - The subscription plan ID
 * @param {string} userType - The user type (company or candidate)
 * @returns {Promise<{success: boolean, message: string, subscription: string, expiryDate: Date}>}
 */
export const subscribeToPlan = async (planId, userType = 'company') => {
  try {
    console.log(`Sending subscribe request to ${API_BASE_URL}/api/subscriptions/subscribe/${planId}`);
    
    const response = await authAxios.post(`${API_BASE_URL}/api/subscriptions/subscribe/${planId}`, {
      userType
    });
    
    console.log('Subscription response:', response.data);
    
    // If the backend doesn't update the subscription immediately for paid plans,
    // we'll update the localStorage with the selected plan info
    if (response.data.planDetails) {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.subscription = response.data.planDetails.name;
        // Set expiry date if provided, otherwise calculate it from the duration
        if (response.data.expiryDate) {
          userData.subscriptionExpiryDate = response.data.expiryDate;
        } else if (response.data.planDetails.duration) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + response.data.planDetails.duration);
          userData.subscriptionExpiryDate = expiryDate.toISOString();
        }
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Updated user subscription in localStorage based on plan details:', userData.subscription);
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
    }
    
    return {
      success: true,
      ...response.data,
      subscription: response.data.subscription || (response.data.planDetails ? response.data.planDetails.name : null)
    };
  } catch (error) {
    const errorStatus = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`Error subscribing to plan (${errorStatus}): ${errorMessage}`, error);
    throw new Error(`Subscription failed: ${errorMessage}`);
  }
};

/**
 * Get available plans by user type
 * @param {string} userType - The user type (company or candidate)
 * @returns {Promise<Array>}
 */
export const getPlans = async (userType = 'company') => {
  try {
    console.log(`Sending plans request to ${API_BASE_URL}/api/subscriptions/plans?userType=${userType}`);
    const response = await authAxios.get(`${API_BASE_URL}/api/subscriptions/plans?userType=${userType}`);
    console.log(`Received ${response.data.length} plans from API`);
    return response.data;
  } catch (error) {
    const errorStatus = error.response?.status;
    console.error(`Error fetching plans (${errorStatus}):`, error);
    throw new Error('Failed to load subscription plans. Please try again later.');
  }
};

/**
 * Get user's current subscription details
 * @returns {Promise<{subscription: string, details: object, expiryDate: Date}>}
 */
export const getUserSubscription = async () => {
  try {
    console.log(`Sending user-subscription request to ${API_BASE_URL}/api/subscriptions/user-subscription`);
    const response = await authAxios.get(`${API_BASE_URL}/api/subscriptions/user-subscription`);
    
    console.log('User subscription response:', response.data);
    
    // Update local storage with the latest subscription data
    if (response.data && response.data.subscription) {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.subscription = response.data.subscription;
        userData.subscriptionExpiryDate = response.data.expiryDate;
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
    }
    
    return response.data;
  } catch (error) {
    const errorStatus = error.response?.status;
    console.error(`Error getting user subscription (${errorStatus}):`, error);
    
    // Check if user data is in localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.subscription) {
        console.log('Using subscription data from localStorage:', userData.subscription);
        return { 
          subscription: userData.subscription, 
          details: null, 
          expiryDate: userData.subscriptionExpiryDate || null 
        };
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }
    
    // Return default free subscription if there's an error
    return { subscription: 'Free', details: null, expiryDate: null };
  }
};

/**
 * Get all available subscription plans
 * @returns {Promise<Array>} List of subscription plans
 */
export const getAllPlans = async () => {
  try {
    console.log(`Sending all plans request to ${API_BASE_URL}/api/subscriptions/plans`);
    const response = await authAxios.get(`${API_BASE_URL}/api/subscriptions/plans`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all plans:', error);
    throw new Error('Failed to load subscription plans. Please try again later.');
  }
};
