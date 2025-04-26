const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Debug: Log available controller methods
console.log('Available courseController methods:', Object.keys(courseController));

// Test endpoint
router.get('/test', courseController.testEndpoint);

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes (require user authentication)
router.post('/enroll', verifyToken, courseController.enrollInCourse);
// Fix for the undefined updateProgress method
if (typeof courseController.updateProgress === 'function') {
  router.post('/progress', verifyToken, courseController.updateProgress);
} else {
  console.error('WARNING: courseController.updateProgress is not a function!');
  // Temporary placeholder to avoid the error
  router.post('/progress', verifyToken, (req, res) => {
    res.status(501).json({ message: 'Progress update functionality is currently unavailable' });
  });
}
router.get('/progress/:courseId', verifyToken, courseController.getUserProgress);
router.get('/certificates/user', verifyToken, courseController.getUserCertificates);

// Admin-only routes
router.post('/', verifyToken, isAdmin, courseController.createCourse);
router.put('/:id', verifyToken, isAdmin, courseController.updateCourse);
router.delete('/:id', verifyToken, isAdmin, courseController.deleteCourse);

module.exports = router;
