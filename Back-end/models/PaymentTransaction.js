const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  paymentIntentId: {
    type: String
  },
  description: {
    type: String
  },
  metadata: {
    type: Object
  },
  receiptUrl: {
    type: String
  },
  invoiceId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, 
{ 
  timestamps: true 
});

// Create index for faster querying
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ paymentIntentId: 1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
