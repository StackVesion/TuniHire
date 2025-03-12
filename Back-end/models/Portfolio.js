const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  projects: { type: [String] },
  certificates: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Certificate' 
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);
