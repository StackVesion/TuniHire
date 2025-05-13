const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');
const PaymentTransaction = require('../models/PaymentTransaction');

// Initialize Stripe with a test key if environment variable is not available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
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
      amount: Math.round(plan.price * 100), // Stripe uses cents, ensure it's an integer
      currency: 'usd',
      metadata: {
        userId: userId,
        planId: planId,
        planName: plan.name
      }
    });
    
    // Create a payment transaction record
    const transaction = new PaymentTransaction({
      userId: userId,
      planId: planId,
      amount: plan.price,
      paymentIntentId: paymentIntent.id,
      status: 'pending',
      description: `Subscription to ${plan.name} plan`,
      metadata: {
        planName: plan.name,
        planDuration: plan.duration
      }
    });
    
    await transaction.save();
    console.log(`Created payment transaction record: ${transaction._id}`);
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      planDetails: plan
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

// Confirm payment and update subscription
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, planId } = req.body;
    const userId = req.user.id;
    
    console.log(`Confirming payment for user ${userId}, plan ${planId}, payment intent ${paymentIntentId}`);
    
    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`Payment intent status: ${paymentIntent.status}`);
    
    if (paymentIntent.status !== 'succeeded') {
      // Find and update transaction record
      await PaymentTransaction.findOneAndUpdate(
        { paymentIntentId: paymentIntentId },
        { 
          status: 'failed',
          updatedAt: Date.now()
        }
      );
      
      return res.status(400).json({ message: 'Payment has not been completed' });
    }
    
    // Find the plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    console.log(`Found plan: ${plan.name}, duration: ${plan.duration} days`);
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`Current user subscription: ${user.subscription}, updating to: ${plan.name}`);
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration);
    
    // Update user subscription - IMPORTANT: This is the critical update that wasn't working
    user.subscription = plan.name;
    user.subscriptionId = plan._id;
    user.subscriptionExpiryDate = expiryDate;
    
    // Save user with updated subscription
    const savedUser = await user.save();
    console.log(`Updated user subscription to: ${savedUser.subscription}, expires: ${savedUser.subscriptionExpiryDate}`);
    
    // Double-check that user was updated
    const verifiedUser = await User.findById(userId);
    if (verifiedUser.subscription !== plan.name) {
      console.error(`SUBSCRIPTION UPDATE FAILED! User subscription is still ${verifiedUser.subscription} instead of ${plan.name}`);
      // Try updating with findByIdAndUpdate as a fallback
      await User.findByIdAndUpdate(userId, {
        subscription: plan.name,
        subscriptionId: plan._id,
        subscriptionExpiryDate: expiryDate
      }, { new: true });
      console.log('Attempted fallback update method');
    }
    
    // Update transaction record
    let transaction = await PaymentTransaction.findOne({ paymentIntentId: paymentIntentId });
    
    if (!transaction) {
      // If the transaction doesn't exist, create it
      transaction = new PaymentTransaction({
        userId: userId,
        planId: planId,
        amount: plan.price,
        paymentIntentId: paymentIntentId,
        status: 'succeeded',
        description: `Subscription to ${plan.name} plan`,
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || '',
        metadata: {
          planName: plan.name,
          planDuration: plan.duration
        }
      });
      
      await transaction.save();
      console.log(`Created payment transaction record: ${transaction._id}`);
    } else {
      // Update existing transaction
      transaction.status = 'succeeded';
      transaction.receiptUrl = paymentIntent.charges?.data[0]?.receipt_url || '';
      transaction.updatedAt = Date.now();
      await transaction.save();
      console.log(`Updated payment transaction record: ${transaction._id}`);
    }
    
    // Return success with explicit subscription information
    res.status(200).json({
      message: `Successfully subscribed to ${plan.name} plan`,
      subscription: plan.name, // Use plan name directly to ensure consistency
      expiryDate: expiryDate,
      transactionId: transaction._id,
      userId: userId,
      planId: planId
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all payment transactions (admin only)
exports.getAllTransactions = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await PaymentTransaction.countDocuments();
    
    // Find transactions with pagination and populate references
    const transactions = await PaymentTransaction.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('planId', 'name price duration');
    
    res.status(200).json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await PaymentTransaction.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('planId', 'name price duration');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.status(200).json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get current user's transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await PaymentTransaction.countDocuments({ userId });
    
    // Find user's transactions with pagination
    const transactions = await PaymentTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('planId', 'name price duration');
    
    res.status(200).json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ error: error.message });
  }
};
