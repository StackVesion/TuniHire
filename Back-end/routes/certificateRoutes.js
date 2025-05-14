const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.get('/', verifyToken, certificateController.getAllCertificates);
router.post('/', verifyToken, certificateController.createCertificate);

// User-specific routes - must come before /:id to avoid being caught by the catchall
router.get('/user/:userId', verifyToken, certificateController.getCertificatesByUser);
router.get('/user', verifyToken, certificateController.getCertificatesByUser); // Get current user's certificates

// Course-specific routes - must come before /:id to avoid being caught by the catchall
router.get('/course/:courseId', verifyToken, certificateController.getCertificatesByCourse);

// Certificate verification - must come before /:id to avoid being caught by the catchall
router.get('/verify/:courseId', verifyToken, certificateController.verifyCertificate);

// Public route - this is a catchall for IDs so it must come AFTER more specific routes
router.get('/:id', certificateController.getCertificateById);

// Individual certificate operations
router.put('/:id', verifyToken, certificateController.updateCertificate);
router.delete('/:id', verifyToken, certificateController.deleteCertificate);

module.exports = router;
