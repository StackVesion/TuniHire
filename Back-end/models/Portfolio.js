const mongoose = require("mongoose");

// Define education schema
const EducationSchema = new mongoose.Schema({
  school: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  currentlyEnrolled: { type: Boolean, default: false },
  description: { type: String },
  location: { type: String }
});

// Define work experience schema
const ExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  currentlyWorking: { type: Boolean, default: false },
  description: { type: String },
  location: { type: String }
});

// Define project schema
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  technologies: [{ type: String }],
  link: { type: String },
  image: { type: String }
});

const PortfolioSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  cvFile: {
    filename: { type: String },
    path: { type: String },
    uploadDate: { type: Date },
    fileType: { type: String }
  },
  education: [EducationSchema],
  experience: [ExperienceSchema],
  skills: [{ type: String }],
  projects: [ProjectSchema],
  certificates: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Certificate' 
  }],
  about: { type: String },
  socialLinks: {
    linkedin: { type: String },
    github: { type: String },
    website: { type: String },
    twitter: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);
