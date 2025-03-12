const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  targetType: { 
    type: String, 
    enum: ["Post", "Company", "User"],
    required: true
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reclamation", ReclamationSchema);
