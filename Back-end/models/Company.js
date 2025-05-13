const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  logo: { type: String }, // URL to the company logo image
  website: { type: String },
  category: { type: String },
  numberOfEmployees: { type: Number },
  projects: { type: [String] },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  status: { 
    type: String, 
    enum: ["Pending", "Approved"], 
    default: "Pending" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Company", CompanySchema);
