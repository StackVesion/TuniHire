const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User"); // Add this line to import the User model
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const jwt = require('jsonwebtoken'); // Add this line to import jwt
const { sendVerificationEmail } = require('../config/emailService');
const { getUsers, createUser, signIn, signInn, signOut, signInWithFaceID, updateUserProfile, changeUserPassword, verifyOtp, resendOtp, verifyEmail, updateUser, deleteUser, validateToken, generateNewVerificationToken } = require("../controllers/userController");

const router = express.Router();

// Test endpoint for JWT verification
router.get("/test-auth", authMiddleware, (req, res) => {
    return res.status(200).json({ message: "Authentication successful", user: req.user });
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

// Route to delete a user
router.delete("/:id", deleteUser);

// Route to update a user
router.put("/:id", updateUser);

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

// Route to update user profile
router.put("/update-profile", authMiddleware, updateUserProfile);

// Route to change user password
router.put("/change-password", authMiddleware, changeUserPassword);

// Route to validate a token and return user info (for cross-site auth)
router.get("/me", authMiddleware, async (req, res) => {
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

// Ajouter cette nouvelle route pour récupérer le profil complet de l'utilisateur
router.get("/profile", authMiddleware, async (req, res) => {
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

module.exports = router;
