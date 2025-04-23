const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    required: true
  },
  issuedDate: { type: Date, default: Date.now },
  completionDate: { type: Date, default: Date.now },
  certificateNumber: { 
    type: String,
    unique: true
  },
  skills: [{ type: String }],
  grade: { type: String },
  score: { type: Number },
  status: {
    type: String,
    enum: ['issued', 'verified', 'revoked'],
    default: 'issued'
  },
  issuer: {
    name: { type: String, default: 'TuniHire' },
    signature: { type: String }
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Generate a unique certificate number before saving
CertificateSchema.pre('save', async function(next) {
  if (!this.certificateNumber) {
    // Format: TH-YEAR-USERID(FIRST 5)-RANDOM(4)
    const year = new Date().getFullYear();
    const userIdPart = this.userId.toString().slice(0, 5);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    this.certificateNumber = `TH-${year}-${userIdPart}-${randomPart}`;
  }
  next();
});

module.exports = mongoose.model("Certificate", CertificateSchema);
