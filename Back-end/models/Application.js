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
  // Resume data for Cloudinary uploads
  resume: {
    originalName: { type: String },
    fileType: { type: String },
    size: { type: Number },
    uploadDate: { type: Date, default: Date.now },
    publicId: { type: String },
    url: { type: String }
  },
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Rejected"], 
    default: "Pending" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", ApplicationSchema);
