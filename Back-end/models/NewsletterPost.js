const mongoose = require("mongoose");

const NewsletterPostSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company' 
  },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("NewsletterPost", NewsletterPostSchema);
