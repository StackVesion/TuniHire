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
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Rejected"], 
    default: "Pending" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", ApplicationSchema);
