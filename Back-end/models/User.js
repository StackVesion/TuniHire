const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Drop any existing User model to ensure indexes are recreated
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Define schema without any unique indexes except for email
const UserSchema = new mongoose.Schema({
  googleId: String,
  githubId: String,
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true },  // Removed unique constraint temporarily
  password: { type: String, required: function() { 
    // Password is required only if there's no googleId or githubId
    return !this.googleId && !this.githubId; 
  }},
  role: { 
    type: String, 
    enum: ["admin", "HR", "hr", "candidate", "recruiter", "company"] 
  },
  subscription: {
    type: String,
    enum: ["Free", "Golden", "Platinum", "Master"],
    default: "Free"
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan"
  },
  subscriptionExpiryDate: {
    type: Date
  },
  phone: { type: String },
  profilePicture: { type: String },
  experienceYears: { type: Number },
  skills: { type: [String] },
  projects: [{
    title: String,
    description: String,
    technologies: [String],
  }],
  education: [{
    degree: String,
    institution: String,
    yearCompleted: Number
  }],
  cv: { type: String },
  languagePreferences: { type: [String] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  picture: String,
  phoneNumber: String,
  // Face recognition fields - no indexes or constraints
  faceDescriptor: { type: Array },
  faceId: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
  isOtpVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,  // Profile verification fields
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verificationPhoto: { type: String },
  verificationScore: { type: Number, default: 0},
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { autoIndex: false });  // Disable automatic indexing

// Create a new model with the updated schema
const User = mongoose.model("User", UserSchema);

// Export the model
module.exports = User;
