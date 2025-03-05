const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  googleId: String,
  githubId: String,
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { 
    // Password is required only if there's no googleId or githubId
    return !this.googleId && !this.githubId; 
  }},
  role: { 
    type: String, 
    enum: ["admin", "HR", "candidate", "visitor"] 
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
  faceDescriptor: { type: Array, default: null },
  faceId: { type: String, unique: true, sparse: true },
  // OTP for two-step verification
  otp: { type: String },
  otpExpiry: { type: Date },
  isOtpVerified: { type: Boolean, default: false },
  // Email verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date
});

module.exports = mongoose.model("User", UserSchema);
