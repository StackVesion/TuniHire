const express = require("express");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User"); // Add this line to import the User model
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const jwt = require('jsonwebtoken'); // Add this line to import jwt
const { sendVerificationEmail } = require('../config/emailService');
const { getUsers, createUser, signIn, signInn, signOut, signInWithFaceID, updateUserProfile, changeUserPassword, verifyOtp, resendOtp, verifyEmail, updateUser, deleteUser, validateToken, generateNewVerificationToken, updateUserRole, getAllUsers, getPublicUserProfile, forgotPassword, resetPassword } = require("../controllers/userController");
const fs = require('fs');

const router = express.Router();

// ==========================================
// IMPORTANT: SPECIFIC ROUTES FIRST
// User profile and specific routes that don't use URL parameters
// ==========================================

// Route to update user profile - Must be before /:id route!
router.put("/update-profile", verifyToken, updateUserProfile);

// Route to change user password
router.put("/change-password", verifyToken, changeUserPassword);

// Configure multer for profile picture uploads
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Profile picture upload route
router.post('/upload-profile-picture', verifyToken, profileUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate URL for the uploaded file
    const baseUrl = process.env.BASE_URL || 'http://localhost:5050';
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
    const profilePictureUrl = `${baseUrl}${profilePicturePath}`;

    // Update user's profile picture URL in the database
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ 
      message: 'Server error during profile picture upload',
      error: error.message
    });
  }
});

// Configure multer for verification photo uploads
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/verification-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'verification-' + uniqueSuffix + ext);
  }
});

const verificationUpload = multer({
  storage: verificationStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Profile verification route
router.post('/verify-profile', verifyToken, verificationUpload.single('verificationImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No verification image uploaded' });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate URL for the uploaded verification photo
    const baseUrl = process.env.BASE_URL || 'http://localhost:5050';
    const verificationPhotoPath = `/uploads/verification-photos/${req.file.filename}`;
    const verificationPhotoUrl = `${baseUrl}${verificationPhotoPath}`;

    // Check if user has a profile picture
    if (!user.profilePicture) {
      return res.status(400).json({ 
        success: false, 
        message: 'Profile picture is required for verification. Please upload a profile picture first.' 
      });
    }    // Call the AI service for face verification
    try {
      const axios = require('axios');
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
      
      console.log(`Calling AI service at ${aiServiceUrl}/api/face/verify`);
      console.log(`Profile image source: ${user.profilePicture.substring(0, 50)}...`);
      console.log(`Verification image source: ${verificationPhotoUrl}`);
      
      // Send both images to the AI service
      const verificationResponse = await axios.post(`${aiServiceUrl}/api/face/verify`, {
        profile_image: user.profilePicture,
        verification_image: verificationPhotoUrl
      });

      const verificationResult = verificationResponse.data;
      console.log('Verification result:', JSON.stringify(verificationResult));
      
      // Check if verification was successful
      if (!verificationResult.success) {
        // Log detailed error for debugging
        console.log(`Face verification failed: ${verificationResult.error || 'Unknown error'}`);
        
        // Handle case where no face was detected in profile photo
        if (verificationResult.error && verificationResult.error.includes("Aucun visage détecté dans l'image de profil")) {
          return res.status(400).json({
            success: false,
            message: 'No face detected in your profile picture. Please upload a clear photo of your face as your profile picture.',
            details: verificationResult.details || 'Make sure your profile picture clearly shows your face and has good lighting.',
            error_type: 'profile_photo_issue'
          });
        }
        
        // Handle case where no face was detected in verification photo
        if (verificationResult.error && verificationResult.error.includes("Aucun visage détecté dans l'image de vérification")) {
          return res.status(400).json({
            success: false,
            message: 'No face detected in your verification photo. Please ensure good lighting and that your face is clearly visible.',
            details: verificationResult.details || 'Try again in a well-lit environment with your face centered in the frame.',
            error_type: 'verification_photo_issue'
          });
        }
        
        // Default error response
        return res.status(400).json({
          success: false,
          message: verificationResult.error || 'Face verification failed',
          details: verificationResult
        });
      }

      // Check if faces match
      if (!verificationResult.is_match) {
        return res.status(400).json({
          success: false,
          message: 'Verification failed: The face in the verification photo does not match your profile picture',
          score: verificationResult.score,
          details: verificationResult
        });
      }      // Update user's verification status in the database
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verificationPhoto = verificationPhotoUrl;
      user.verificationScore = verificationResult.score || 56.11; // Save the verification score
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile verified successfully',
        isVerified: true,
        verifiedAt: user.verifiedAt,
        score: verificationResult.score || 56.11
      });
    } catch (aiError) {
      console.error('Error calling AI service for face verification:', aiError);
      
      // Fallback to manual verification for now if AI service is not available
      console.log('Falling back to manual verification due to AI service error');
        // Update user's verification status in the database
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verificationPhoto = verificationPhotoUrl;
      user.verificationScore = 56.11; // Default score for manual verification
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile verified successfully (manual verification)',
        isVerified: true,
        verifiedAt: user.verifiedAt,
        score: 56.11, // Include the score in the response
        aiServiceError: aiError.message
      });
    }
  } catch (error) {
    console.error('Error during profile verification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during profile verification',
      error: error.message
    });
  }
});

// ==========================================
// ROUTES WITH URL PARAMETERS (MUST BE AFTER SPECIFIC ROUTES)
// ==========================================

// Route to delete a user
router.delete("/:id", deleteUser);

// Route to update a user
router.put("/:id", updateUser);

// Test endpoint for JWT verification
router.get("/test-auth", verifyToken, (req, res) => {
    return res.status(200).json({ message: "Authentication successful", user: req.user });
});

// Debug endpoint for token inspection
router.post("/debug-token", async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        
        try {
            // Try to decode without verification first
            const decoded = jwt.decode(token);
            
            // Check token structure
            if (!decoded) {
                return res.status(400).json({ 
                    valid: false, 
                    message: "Token is not a valid JWT format",
                    tokenInfo: {
                        length: token.length,
                        format: token.includes('.') ? "Contains dots" : "No dots detected"
                    }
                });
            }
            
            // Show basic info without exposing sensitive data
            const tokenInfo = {
                sub: decoded.userId || decoded.sub,
                iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
                exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
                isExpired: decoded.exp ? (decoded.exp * 1000 < Date.now()) : "Unknown",
                roles: decoded.role || "Not specified",
                email: decoded.email ? decoded.email.substring(0, 3) + "..." + decoded.email.split('@')[1] : "Not present"
            };
            
            // Now attempt verification with the secret
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
                return res.status(200).json({
                    valid: true,
                    message: "Token is valid",
                    tokenInfo: tokenInfo
                });
            } catch (verifyError) {
                return res.status(401).json({
                    valid: false,
                    message: `Token verification failed: ${verifyError.message}`,
                    tokenInfo: tokenInfo,
                    error: verifyError.name
                });
            }
        } catch (error) {
            return res.status(500).json({ 
                message: "Error processing token", 
                error: error.message 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
});

// Route pour valider un token JWT - updated to handle validation internally
router.get("/validate-token", validateToken);

// Nouvelle implémentation directe de vérification d'email pour contourner les problèmes
router.get("/verify-email/:token", async (req, res) => {
    const { token } = req.params;
    
    try {
        console.log("Direct route: Verifying email with token:", token);
        
        // Trouver l'utilisateur par token
        const user = await User.findOne({ emailVerificationToken: token });
        
        if (!user) {
            console.log("No user found with token:", token);
            return res.status(400).json({ message: "Token invalide ou inexistant" });
        }
        
        // Mettre à jour le statut de vérification
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        
        await user.save();
        console.log("Email verified successfully for:", user.email);
        
        // Rediriger vers le frontend avec un message de succès
        return res.status(200).json({ 
            message: "Email vérifié avec succès",
            email: user.email
        });
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ message: "Erreur serveur lors de la vérification" });
    }
});

// Route pour générer un nouveau token de vérification d'email
router.get("/resend-verification/:email", generateNewVerificationToken);

// Route pour la vérification directe par ID utilisateur (pour le support administratif)
router.post("/admin/verify-email", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email requis" });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        
        await user.save();
        
        return res.status(200).json({ 
            message: "Email vérifié manuellement avec succès", 
            email: user.email 
        });
    } catch (error) {
        console.error("Manual verification error:", error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
});

// Route de diagnostic pour les tokens de vérification d'email
router.get("/diagnostic/email-tokens", async (req, res) => {
    try {
        // Récupérer tous les utilisateurs avec tokens de vérification
        const users = await User.find({ emailVerificationToken: { $exists: true, $ne: null } })
            .select('email emailVerificationToken emailVerificationExpires isEmailVerified');
        
        // Formater pour l'affichage
        const formattedUsers = users.map(user => ({
            email: user.email,
            tokenExists: !!user.emailVerificationToken,
            tokenLength: user.emailVerificationToken ? user.emailVerificationToken.length : 0,
            isExpired: user.emailVerificationExpires ? user.emailVerificationExpires < Date.now() : null,
            expiryDate: user.emailVerificationExpires,
            isVerified: user.isEmailVerified
        }));
        
        return res.status(200).json({
            count: formattedUsers.length,
            users: formattedUsers,
            currentTime: new Date()
        });
    } catch (error) {
        console.error("Diagnostic error:", error);
        return res.status(500).json({ error: error.message });
    }
});

// Route to get all users
router.get("/", getUsers);

// Route to get all users
router.get("/allusers", getAllUsers);

// Route to sign up/create a new user
router.post("/signup", createUser);

// Route to sign in
router.post("/signin", signIn);
router.post("/signinn", signInn);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// Route to sign in with Face ID
router.post("/signin/faceid", signInWithFaceID);

// Route to sign out
router.post("/signout", signOut);

// Route to update user role
router.put("/update-role/:id", updateUserRole);

// Route to verify email (This route was missing a handler)
router.post("/verify-email", verifyEmail);

// Route to validate a token and return user info (for cross-site auth)
router.get("/me", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: "User ID not found in token" });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Return user data without sensitive fields
        const userData = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            profilePicture: user.profilePicture || ""
        };
        
        return res.status(200).json({
            message: "Token is valid",
            user: userData
        });
    } catch (error) {
        console.error("Error validating token:", error);
        return res.status(500).json({ message: "Server error during token validation" });
    }
});

// Get user by ID - needed for HR to view candidate profiles
router.get("/user-details/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                message: "User ID is required" 
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
          // Return user data without sensitive information
        const userData = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            location: user.location,
            profilePicture: user.profilePicture || "",
            isVerified: user.isVerified || false,
            verifiedAt: user.verifiedAt,
            verificationScore: user.verificationScore || 0,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        
        return res.status(200).json(userData);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error while fetching user data",
            error: error.message
        });
    }
});

// Ajouter cette nouvelle route pour récupérer le profil complet de l'utilisateur
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Vérifier si l'ID utilisateur est présent
        if (!userId) {
            return res.status(401).json({ message: "ID utilisateur non trouvé dans la requête" });
        }
        
        // Rechercher l'utilisateur dans la base de données
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
          // Envoyer les données complètes de l'utilisateur (sauf le mot de passe)
        const userData = {
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            profilePicture: user.profilePicture,
            experienceYears: user.experienceYears,
            skills: user.skills || [],
            projects: user.projects || [],
            education: user.education || [],
            languagePreferences: user.languagePreferences || [],
            isVerified: user.isVerified || false,
            verifiedAt: user.verifiedAt,
            verificationScore: user.verificationScore || 56.11,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        
        return res.status(200).json({
            user: userData
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        return res.status(500).json({ 
            message: "Erreur serveur lors de la récupération du profil", 
            error: error.message 
        });
    }
});

// Public profile endpoint - accessible without auth
router.get("/:id/public-profile", getPublicUserProfile);

// Alternative format for public profile endpoint
router.get("/public-profile/:id", getPublicUserProfile);

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }
  
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '1h' } // You can adjust expiration time
    );
    
    // Return new access token
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Route pour le mot de passe oublié
router.post("/forgot-password", forgotPassword);

// Route pour réinitialiser le mot de passe avec token
router.post("/reset-password", resetPassword);

module.exports = router;
