require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Default subscription plans
const subscriptionPlans = [
  {
    name: 'Free',
    price: 0,
    duration: 0, // Unlimited duration
    features: [
      'Basic job posting',
      'Limited candidate search',
      'Standard support',
      'Basic analytics'
    ],
    description: 'Perfect for small businesses or startups just getting started with recruitment.',
    isPopular: false
  },
  {
    name: 'Golden',
    price: 29.99,
    duration: 30, // 30 days
    features: [
      'Unlimited job postings',
      'Advanced candidate search',
      'Priority support',
      'Enhanced analytics',
      'Featured company profile'
    ],
    description: 'Great for growing businesses with regular recruitment needs.',
    isPopular: true
  },
  {
    name: 'Platinum',
    price: 59.99,
    duration: 30, // 30 days
    features: [
      'Everything in Golden',
      'AI-powered candidate matching',
      'Dedicated account manager',
      'Premium company branding',
      'Candidate engagement tools',
      'Advanced reporting'
    ],
    description: 'Ideal for medium to large businesses with sophisticated recruitment needs.',
    isPopular: false
  },
  {
    name: 'Master',
    price: 99.99,
    duration: 30, // 30 days
    features: [
      'Everything in Platinum',
      'Enterprise-level integration',
      'Custom recruitment workflow',
      'Unlimited users',
      'White-labeled experience',
      'API access',
      '24/7 priority support'
    ],
    description: 'Enterprise solution for large organizations with complex recruitment requirements.',
    isPopular: false
  }
];

// Initialize subscription plans
const initSubscriptionPlans = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    console.log('Checking existing subscription plans...');
    
    // For each subscription plan, check if it exists and create if it doesn't
    for (const plan of subscriptionPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: plan.name });
      
      if (existingPlan) {
        console.log(`Plan "${plan.name}" already exists, updating...`);
        await SubscriptionPlan.findOneAndUpdate(
          { name: plan.name },
          { ...plan, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
      } else {
        console.log(`Creating new plan "${plan.name}"...`);
        await SubscriptionPlan.create({
          ...plan,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    console.log('Subscription plans initialized successfully!');
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Database disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing subscription plans:', error);
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Database disconnected');
    
    process.exit(1);
  }
};

// Run the initialization
initSubscriptionPlans();
