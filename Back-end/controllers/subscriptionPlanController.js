const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');

// Initialize Stripe with a test key if environment variable is not available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51OnMDTUE4HnhJJRiKOipRXBg7hYTsAmmkPCtwVmhLmUHUK1QEGpNDkzCp6sOhx54hXnQ2LuE2bZHrXPpNZIgA2PZ00aM8uZfyV';
let stripe;

try {
  stripe = require('stripe')(stripeSecretKey);
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('Error initializing Stripe:', error.message);
  // Create a mock Stripe object for development
  stripe = {
    paymentIntents: {
      create: async () => ({ client_secret: 'mock_client_secret' }),
      retrieve: async () => ({ status: 'succeeded' })
    }
  };
  console.log('Using mock Stripe implementation for development');
}

// Get all subscription plans
exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get subscription plan by ID
exports.getSubscriptionPlanById = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const newPlan = new SubscriptionPlan(req.body);
    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update subscription plan
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPlan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    res.status(200).json(updatedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete subscription plan
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const deletedPlan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!deletedPlan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    res.status(200).json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user current subscription
exports.getUserSubscription = async (req, res) => {
  try {
    console.log('getUserSubscription called with user:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('Auth error: User not found in request object');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await User.findById(req.user.id).populate('subscriptionId');
    
    if (!user) {
      console.log('User not found with id:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user:', user.email, '- subscription:', user.subscription);
    
    // Check if subscription has expired
    if (user.subscriptionExpiryDate && new Date(user.subscriptionExpiryDate) < new Date()) {
      console.log('Subscription expired for user:', user.email);
      // Reset to free plan if expired
      user.subscription = 'Free';
      user.subscriptionId = null;
      user.subscriptionExpiryDate = null;
      await user.save();
    }
    
    console.log('Returning subscription data:', {
      subscription: user.subscription,
      details: user.subscriptionId,
      expiryDate: user.subscriptionExpiryDate
    });
    
    res.status(200).json({
      subscription: user.subscription,
      details: user.subscriptionId,
      expiryDate: user.subscriptionExpiryDate
    });
  } catch (error) {
    console.error('Error in getUserSubscription:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Subscribe user to a plan
exports.subscribeUser = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user.id;
    
    // Find the plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If it's a free plan, update immediately
    if (plan.name === 'Free') {
      user.subscription = plan.name;
      user.subscriptionId = plan._id;
      user.subscriptionExpiryDate = null; // Free has no expiry
      
      await user.save();
      
      return res.status(200).json({
        message: 'Successfully subscribed to Free plan',
        subscription: user.subscription
      });
    }
    
    // For paid plans, return the plan details for payment processing
    return res.status(200).json({
      planDetails: plan,
      message: 'Please proceed with payment to complete subscription'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a payment intent with Stripe
exports.createPaymentIntent = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    // Find the plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100, // Stripe uses cents
      currency: 'usd',
      metadata: {
        userId: userId,
        planId: planId,
        planName: plan.name
      }
    });
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      planDetails: plan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Confirm payment and update subscription
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, planId } = req.body;
    const userId = req.user.id;
    
    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment has not been completed' });
    }
    
    // Find the plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration);
    
    // Update user subscription
    user.subscription = plan.name;
    user.subscriptionId = plan._id;
    user.subscriptionExpiryDate = expiryDate;
    
    await user.save();
    
    res.status(200).json({
      message: `Successfully subscribed to ${plan.name} plan`,
      subscription: user.subscription,
      expiryDate: user.subscriptionExpiryDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
