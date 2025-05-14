require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Set connection with database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tunihire', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Define seed data
const subscriptionPlans = [
  {
    name: 'Free',
    price: 0,
    features: [
      '1 Job Posting',
      'Basic Candidate Search',
      'Email Support',
      'Profile Visibility: 30 days'
    ],
    duration: 30,
    description: 'Perfect for small businesses or startups just getting started with hiring.',
    isPopular: false
  },
  {
    name: 'Golden',
    price: 49.99,
    features: [
      '5 Job Postings',
      'Advanced Candidate Search',
      'Email & Phone Support',
      'Featured Company Profile',
      'Candidate Recommendations',
      'Profile Visibility: 60 days'
    ],
    duration: 30,
    description: 'Ideal for growing companies with moderate hiring needs.',
    isPopular: true
  },
  {
    name: 'Platinum',
    price: 99.99,
    features: [
      '15 Job Postings',
      'Premium Candidate Search',
      'Priority Support',
      'Featured Job Listings',
      'Advanced Analytics',
      'Candidate Assessments',
      'Profile Visibility: 90 days'
    ],
    duration: 30,
    description: 'Best for companies with regular hiring needs looking for premium features.',
    isPopular: false
  },
  {
    name: 'Master',
    price: 199.99,
    features: [
      'Unlimited Job Postings',
      'Enterprise Candidate Search',
      'Dedicated Account Manager',
      'Premium Placement',
      'Custom Branding',
      'API Access',
      'Advanced Reporting',
      'Bulk Actions',
      'Profile Visibility: Unlimited'
    ],
    duration: 30,
    description: 'Complete solution for large organizations with high-volume recruiting needs.',
    isPopular: false
  }
];

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await SubscriptionPlan.deleteMany({});
    console.log('Existing subscription plans deleted');

    // Insert new data
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans);
    console.log(`${createdPlans.length} subscription plans created:`);
    createdPlans.forEach(plan => console.log(`- ${plan.name}: $${plan.price}`));

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
};

// Run the seeding process
connectDB()
  .then(() => seedData())
  .catch(error => console.error('Failed to seed database:', error.message)); 