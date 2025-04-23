const mongoose = require("mongoose");

const CompletedStepSchema = new mongoose.Schema({
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  score: {
    type: Number // For quiz/test steps
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date
  }
});

const CourseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  completedSteps: [CompletedStepSchema],
  currentStep: {
    type: Number,
    default: 0
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }
}, {
  timestamps: true
});

// Create a compound index to ensure a user can only have one progress record per course
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", CourseProgressSchema);
