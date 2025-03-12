const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  features: { type: [String] }
});

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
