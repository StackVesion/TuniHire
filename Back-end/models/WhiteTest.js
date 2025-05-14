const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const whiteTestSchema = new Schema({
  job_id: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field on save
whiteTestSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('WhiteTest', whiteTestSchema);
