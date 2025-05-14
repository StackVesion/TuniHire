const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const applicationController = require('../controllers/applicationController');

// Routes ATS
router.post('/ats/analyze', verifyToken, applicationController.analyzeResume);
router.post('/ats/analyze-resume', verifyToken, applicationController.analyzeResume);
router.get('/ats/analyze-resume/:id', verifyToken, applicationController.analyzeResumeById);

// Routes ATS 2025
router.post('/ats2025/analyze', verifyToken, applicationController.analyzeResumeAdvanced);
router.post('/ats2025/analyze-resume', verifyToken, applicationController.analyzeResumeAdvanced);
router.get('/ats2025/analyze-resume/:id', verifyToken, applicationController.analyzeResumeByIdAdvanced);

// Route santé AI service
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'API service is running', timestamp: new Date().toISOString() });
});

module.exports = router; 