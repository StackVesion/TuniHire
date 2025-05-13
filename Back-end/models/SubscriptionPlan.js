const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: ["Free", "Golden", "Platinum", "Master"]
  },
  price: { type: Number, required: true },
  features: { type: [String] },
  duration: { type: Number, default: 30, required: true }, // Duration in days
  description: { type: String },
  isPopular: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
