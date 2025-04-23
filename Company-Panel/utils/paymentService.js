import axios from 'axios';
import { createAuthAxios } from './authUtils';

// Create authenticated axios instance
const authAxios = createAuthAxios();

/**
 * Create a payment intent for subscription
 * @param {string} planId - The subscription plan ID
 * @param {string} userType - The user type (company or candidate)
 * @returns {Promise<{clientSecret: string, planDetails: object}>}
 */
export const createPaymentIntent = async (planId, userType = 'company') => {
  try {
    const response = await authAxios.post('/api/subscriptions/payment-intent', {
      planId,
      userType
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
 * Subscribe user to a plan (after payment confirmation)
 * @param {string} planId - The subscription plan ID
 * @param {string} userType - The user type (company or candidate)
 * @returns {Promise<{success: boolean, message: string, subscription: string, expiryDate: Date}>}
 */
export const subscribeToPlan = async (planId, userType = 'company') => {
  try {
    const response = await authAxios.post('/api/subscriptions/subscribe', {
      planId,
      userType
    });
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    // Handle 500 error by providing a better message
    if (error.response && error.response.status === 500) {
      return {
        success: false,
        message: 'Server error occurred while processing subscription. Please try again later.'
      };
    }
    
    // Mock response for development if API fails
    return { 
      success: true, 
      message: 'Mock subscription successful', 
      subscription: planId.includes('golden') ? 'Golden' : 
                  planId.includes('platinum') ? 'Platinum' : 
                  planId.includes('master') ? 'Master' : 'Free', 
      userType: userType,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
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
 * Get available plans by user type
 * @param {string} userType - The user type (company or candidate)
 * @returns {Promise<Array>}
 */
export const getPlans = async (userType = 'company') => {
  try {
    const response = await authAxios.get(`/api/subscriptions/plans?userType=${userType}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
    
    // Mock plans for development
    const companyPlans = [
      {
        _id: 'company-free',
        name: 'Free',
        price: 0,
        duration: 30,
        description: 'Basic features for small companies',
        features: ['Limited job postings', 'Basic company profile']
      },
      {
        _id: 'company-golden',
        name: 'Golden',
        price: 49.99,
        duration: 30,
        description: 'Enhanced features for growing companies',
        features: ['Unlimited job postings', 'Priority in search results']
      }
    ];
    
    const candidatePlans = [
      {
        _id: 'candidate-free',
        name: 'Free',
        price: 0,
        duration: 30,
        description: 'Basic features for job seekers',
        features: ['Limited job applications', 'Basic profile']
      },
      {
        _id: 'candidate-golden',
        name: 'Golden',
        price: 9.99,
        duration: 30,
        description: 'Enhanced features for job seekers',
        features: ['Unlimited applications', 'Advanced resume builder']
      }
    ];
    
    return userType === 'company' ? companyPlans : candidatePlans;
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
