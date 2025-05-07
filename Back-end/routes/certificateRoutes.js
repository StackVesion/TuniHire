const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.get('/:id', certificateController.getCertificateById);

// Protected routes - require authentication
router.get('/', verifyToken, certificateController.getAllCertificates);
router.post('/', verifyToken, certificateController.createCertificate);
router.put('/:id', verifyToken, certificateController.updateCertificate);
router.delete('/:id', verifyToken, certificateController.deleteCertificate);

// User-specific routes
router.get('/user/:userId', verifyToken, certificateController.getCertificatesByUser);
router.get('/user', verifyToken, certificateController.getCertificatesByUser); // Get current user's certificates

// Course-specific routes
router.get('/course/:courseId', verifyToken, certificateController.getCertificatesByCourse);

// Certificate verification
router.get('/verify/:courseId', verifyToken, certificateController.verifyCertificate);

module.exports = router;
