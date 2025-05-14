const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  job_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobPost',
    required: true
  },
  candidate_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  hr_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  dateCreation: { 
    type: Date, 
    default: Date.now 
  },
  meetingDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Pending'], 
    default: 'Scheduled' 
  },
  roomUrl: { 
    type: String,
    default: null
  },
  notes: { 
    type: String 
  }
});

module.exports = mongoose.model("Meeting", MeetingSchema);
