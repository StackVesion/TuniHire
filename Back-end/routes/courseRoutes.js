const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Test endpoint
router.get('/test', courseController.testEndpoint);

// Protected routes (require user authentication)
// These specific routes must come BEFORE parameterized routes to avoid conflicts

// Course enrollment and progress endpoints for Company Panel
router.post('/:id/enroll', verifyToken, courseController.enrollCourse);
router.post('/progress', verifyToken, courseController.updateCourseProgress);
router.get('/user/progress', verifyToken, courseController.getUserCourseProgress);

// Get specific course with user progress
router.get('/:id', verifyToken, courseController.getCourseWithUserProgress);

// Public routes
router.get('/', courseController.getAllCourses);

// Certificate routes
router.get('/certificates/:id', verifyToken, courseController.getCertificate);
router.get('/certificates/course/:courseId', verifyToken, courseController.getCertificateByCourse);

// Admin-only routes
router.post('/', verifyToken, isAdmin, courseController.createCourse);
router.put('/:id', verifyToken, isAdmin, courseController.updateCourse);
router.delete('/:id', verifyToken, isAdmin, courseController.deleteCourse);

module.exports = router;
