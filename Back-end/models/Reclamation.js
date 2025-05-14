const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema({
  // User submitting the reclamation
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  // Optional target information
  targetType: { 
    type: String, 
    enum: ["Post", "Company", "User", "General"],
    default: "General",
    required: function() {
      return this.targetId !== undefined && this.targetId !== null;
    }
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.targetType !== "General" && this.targetType !== undefined;
    }
  },
  // New fields for the form submission
  subject: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'account', 'job', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reclamation", ReclamationSchema);
