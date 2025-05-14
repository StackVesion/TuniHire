const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(verifyToken);

// Start HR bot for a meeting
router.post('/start-hr-bot', botController.startHRBot);

// Start preparation bot for a candidate
router.post('/start-prep-bot', botController.startPrepBot);

module.exports = router;
