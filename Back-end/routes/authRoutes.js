const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const fileUpload = require('express-fileupload');

// Configure file upload middleware for verification
router.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
}));

// Route temporaire pour tester l'authentification
router.post('/login', (req, res) => {
  // Cette route est un placeholder - elle sera implémentée correctement plus tard
  res.status(200).json({
    success: true,
    message: 'Route de connexion temporaire',
    token: 'placeholder-token'
  });
});

// Route pour vérifier si un token est valide
router.get('/verify-token', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token valide',
    user: req.user
  });
});

// Public routes
router.post('/signup', userController.createUser);
router.post('/signin', userController.signInn);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.get('/verify-email/:token', userController.verifyEmail);
router.get('/generate-new-verification/:email', userController.generateNewVerificationToken);
router.post('/validate-token', userController.validateToken);
router.post('/signin-with-faceid', userController.signInWithFaceID);
router.post('/signin-classic', userController.signIn);

// Protected routes
router.post('/signout', authMiddleware, userController.signOut);
router.put('/update-profile', authMiddleware, userController.updateUserProfile);
router.post('/change-password', authMiddleware, userController.changeUserPassword);
router.post('/verify-profile', authMiddleware, userController.verifyUserProfile);

module.exports = router;
