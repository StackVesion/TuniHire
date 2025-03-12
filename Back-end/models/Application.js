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
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Rejected"], 
    default: "Pending" 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", ApplicationSchema);
