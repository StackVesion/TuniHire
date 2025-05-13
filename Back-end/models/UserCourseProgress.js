const mongoose = require('mongoose');

const UserCourseProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedSteps: [{
    type: String, // Store step IDs
  }],
  currentStep: {
    type: Number,
    default: 0
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  scores: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Create a compound index for user and course to ensure uniqueness
UserCourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('UserCourseProgress', UserCourseProgressSchema);
