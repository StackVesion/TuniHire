const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobPost' 
  },
  coverLetter: {
    type: String,
    required: true
  },
  // Resume data for local file storage
  resume: {
    // Local file storage properties
    filename: { type: String },
    originalname: { type: String },
    path: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    uploadDate: { type: Date, default: Date.now },
    
    // Storage type always set to local
    storageType: { 
      type: String, 
      default: "local" 
    }
  },
  // Resume extracted data
  extractedData: {
    extractedText: { type: String },
    skills: [{ type: String }],
    education: [{ type: String }],
    languages: [{ type: String }],
    experienceYears: { type: Number },
    possibleJobTitles: [{ type: String }],
    lastAnalyzed: { type: Date },
    matchScore: { type: Number }
  },
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Rejected", "Interview"], 
    default: "Pending" 
  },
  feedback: { 
    type: String 
  },
  appliedDate: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Application", ApplicationSchema);
