const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { verifyToken } = require('../middleware/auth');

// Create a new meeting
router.post('/', verifyToken, meetingController.createMeeting);

// Get meeting by ID
router.get('/:id', verifyToken, meetingController.getMeetingById);

// Update meeting status
router.patch('/:id/status', verifyToken, meetingController.updateMeetingStatus);

// Add room URL to meeting
router.patch('/:id/room', verifyToken, meetingController.addRoomUrlToMeeting);

// Get meetings by user ID (candidate or HR)
router.get('/user/:userId', verifyToken, meetingController.getMeetingsByUserId);

// Get meetings by job ID
router.get('/job/:jobId', verifyToken, meetingController.getMeetingsByJobId);

module.exports = router;
