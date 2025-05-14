const Meeting = require('../models/Meeting');
const User = require('../models/User');
const JobPost = require('../models/JobPost');
const mongoose = require('mongoose');

// Create a new meeting
exports.createMeeting = async (req, res) => {
  try {
    const { job_id, candidate_id, hr_id, meetingDate, notes } = req.body;

    // Validate required fields
    if (!job_id || !candidate_id || !hr_id || !meetingDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(job_id) || 
        !mongoose.Types.ObjectId.isValid(candidate_id) || 
        !mongoose.Types.ObjectId.isValid(hr_id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    // Validate that job exists
    const job = await JobPost.findById(job_id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job post not found' });
    }

    // Validate that candidate exists and is a candidate
    const candidate = await User.findById(candidate_id);
    if (!candidate || candidate.role.toString().toUpperCase() !== 'CANDIDATE') {
      return res.status(404).json({ success: false, message: 'Candidate not found or user is not a candidate' });
    }

    // Validate that HR exists and is an HR
    const hr = await User.findById(hr_id);
    if (!hr || (hr.role.toString().toUpperCase() !== 'HR')) {
      return res.status(404).json({ success: false, message: 'HR not found or user is not an HR' });
    }

    // Create new meeting
    const newMeeting = new Meeting({
      job_id,
      candidate_id,
      hr_id,
      meetingDate: new Date(meetingDate),
      notes,
      status: 'Scheduled'
    });

    await newMeeting.save();
    
    return res.status(201).json({
      success: true,
      data: newMeeting,
      message: 'Meeting created successfully'
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID format' });
    }

    const meeting = await Meeting.findById(id)
      .populate('job_id', 'title location workplaceType')
      .populate('candidate_id', 'firstName lastName email profilePicture')
      .populate('hr_id', 'firstName lastName email profilePicture');

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update meeting status
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'Meeting ID and status are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID format' });
    }

    // Validate status
    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Valid values are: ${validStatuses.join(', ')}` 
      });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({
      success: true,
      data: updatedMeeting,
      message: 'Meeting status updated successfully'
    });
  } catch (error) {
    console.error('Error updating meeting status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add room URL to meeting
exports.addRoomUrlToMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomUrl } = req.body;
    
    if (!id || !roomUrl) {
      return res.status(400).json({ success: false, message: 'Meeting ID and room URL are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID format' });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      { roomUrl },
      { new: true, runValidators: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({
      success: true,
      data: updatedMeeting,
      message: 'Meeting room URL added successfully'
    });
  } catch (error) {
    console.error('Error adding room URL to meeting:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get meetings by user ID (candidate or HR)
exports.getMeetingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine if user is candidate or HR to filter meetings
    const isCandidate = user.role.toString().toUpperCase() === 'CANDIDATE';
    const isHR = user.role.toString().toUpperCase() === 'HR';
    
    let query = {};
    if (isCandidate) {
      query = { candidate_id: userId };
    } else if (isHR) {
      query = { hr_id: userId };
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'User must be a candidate or HR to view meetings' 
      });
    }

    const meetings = await Meeting.find(query)
      .populate('job_id', 'title location workplaceType')
      .populate('candidate_id', 'firstName lastName email profilePicture')
      .populate('hr_id', 'firstName lastName email profilePicture')
      .sort({ meetingDate: -1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings by user ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get meetings by job ID
exports.getMeetingsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID format' });
    }

    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job post not found' });
    }

    const meetings = await Meeting.find({ job_id: jobId })
      .populate('candidate_id', 'firstName lastName email profilePicture')
      .populate('hr_id', 'firstName lastName email profilePicture')
      .sort({ meetingDate: -1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings by job ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
