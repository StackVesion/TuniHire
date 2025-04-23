const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Test endpoint
router.get('/test', courseController.testEndpoint);

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes (require user authentication)
router.post('/enroll', verifyToken, courseController.enrollInCourse);
router.post('/progress', verifyToken, courseController.updateProgress);
router.get('/progress/:courseId', verifyToken, courseController.getUserProgress);
router.get('/certificates/user', verifyToken, courseController.getUserCertificates);

// Admin-only routes
router.post('/', verifyToken, isAdmin, courseController.createCourse);
router.put('/:id', verifyToken, isAdmin, courseController.updateCourse);
router.delete('/:id', verifyToken, isAdmin, courseController.deleteCourse);

module.exports = router;
