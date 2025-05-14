const express = require('express');
const router = express.Router();
const whiteTestController = require('../controllers/whiteTestController');
const { verifyToken } = require('../middleware/authMiddleware'); // Fixed path

// Apply auth middleware to all routes
router.use(verifyToken);

// Get white test for a specific job
router.get('/job/:jobId', whiteTestController.getWhiteTestByJobId);

// Create a new white test
router.post('/', whiteTestController.createWhiteTest);

// Generate white test with AI for a job
router.get('/generate/:jobId', whiteTestController.generateWhiteTest);

// Update an existing white test
router.put('/:id', whiteTestController.updateWhiteTest);

// Delete a white test
router.delete('/:id', whiteTestController.deleteWhiteTest);

module.exports = router;
