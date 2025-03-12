const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getUsers, createUser, signIn, signOut, signInWithFaceID, updateUserProfile, changeUserPassword } = require("../controllers/userController");
const User = require("../models/User"); // Add this line to import the User model
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Test endpoint for JWT verification
router.get("/test-auth", authMiddleware, (req, res) => {
    return res.status(200).json({ message: "Authentication successful", user: req.user });
});

// Route to get all users
router.get("/", getUsers);

// Route to sign up/create a new user
router.post("/signup", createUser);

// Route to sign in
router.post("/signin", signIn);

// Route to sign in with Face ID
router.post("/signin/faceid", signInWithFaceID);

// Route to sign out
router.post("/signout", signOut);

// Route to update user profile
router.put("/update-profile", authMiddleware, updateUserProfile);

// Route to change user password
router.put("/change-password", authMiddleware, changeUserPassword);

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

module.exports = router;
