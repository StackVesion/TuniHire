const mongoose = require("mongoose");

const StepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['video', 'quiz', 'test'],
    required: true 
  },
  content: {
    // For video type
    videoUrl: { type: String },
    duration: { type: Number }, // in minutes
    
    // For quiz/test type
    questions: [{
      question: { type: String },
      options: [{ type: String }],
      correctAnswer: { type: String },
      explanation: { type: String }
    }],
    passingScore: { type: Number, default: 70 } // Percentage needed to pass
  },
  order: { type: Number, required: true }
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  thumbnail: { type: String },
  coverImage: { type: String },
  instructor: { 
    name: { type: String, required: true },
    bio: { type: String },
    avatar: { type: String }
  },
  category: { type: String },
  tags: [{ type: String }],
  skills: [{ type: String }],
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: { type: Number }, // Total duration in minutes
  steps: [StepSchema],
  enrolledUsers: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  subscriptionRequired: {
    type: String,
    enum: ['Free', 'Golden', 'Platinum', 'Master'],
    default: 'Free'
  },
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model("Course", CourseSchema);
