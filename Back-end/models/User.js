const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: { type: String},
  lastName: { type: String},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
  faceDescriptor: { type: Array, required: false }, // Stocke les données faciales
});

module.exports = mongoose.model("User", UserSchema);
