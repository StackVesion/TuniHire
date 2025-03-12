const SubscriptionPlan = require('../models/SubscriptionPlan');

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
