const mongoose = require("mongoose");

const JobPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: [String] },
  salaryRange: { type: String },
  location: { type: String },
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("JobPost", JobPostSchema);
