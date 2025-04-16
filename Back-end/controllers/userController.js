const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { generateOTP, sendOTPEmail } = require("../utils/emailUtils");
const { sendVerificationEmail } = require('../config/emailService');
const fs = require("fs");

// Get all users
const getUsers = async (req, res) => {
    try {
        console.log('Received request:', req.query);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 12);

        // Build filter based on query parameters
        let filter = {};
        
        // Filtrer les utilisateurs par rôle "candidate" en gérant la casse (majuscule/minuscule)
        // Utiliser une expression régulière insensible à la casse pour trouver "candidate" ou "Candidate"
        filter.role = { $regex: new RegExp('^candidate$', 'i') };
        console.log('Filtering users with role candidate (case insensitive)');
        
        console.log('Using filter:', filter);

        // Compter d'abord combien d'utilisateurs existent dans la base de données (total)
        const totalUsers = await User.countDocuments({});
        console.log(`Total users in database: ${totalUsers}`);
        
        // Compter ensuite le nombre de candidats
        const totalCandidates = await User.countDocuments({ role: 'candidate' });
        console.log(`Total users with role 'candidate': ${totalCandidates}`);
        
        // Récupérer les utilisateurs selon le filtre avec plus de champs
        const [users, total] = await Promise.all([
            User.find(filter)
                .select('firstName lastName email role profilePicture skills location experienceYears title')
                .sort('-createdAt')
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);
        
        console.log(`Found ${users.length} users matching the filter`);

        // Log les données brutes des utilisateurs avant transformation
        console.log('Résultat brut de la requête:', JSON.stringify(users.map(u => ({ _id: u._id.toString(), email: u.email, role: u.role }))));
        
        // Transform data to ensure consistent format
        const processedUsers = users.map(user => {
            // Log détaillé de chaque utilisateur pour débogage
            console.log(`---------------------`);
            console.log(`Processing user: ID=${user._id}, Email=${user.email}, Role=${user.role}`);
            console.log(`User details: ${JSON.stringify(user)}`);
            
            // S'assurer que tous les champs sont correctement formatés même s'ils sont manquants ou invalides
            const processedUser = {
                _id: user._id ? user._id.toString() : '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                role: user.role || 'Undefined',  // Utiliser 'Undefined' si aucun rôle n'est spécifié
                profilePicture: user.profilePicture || '',
                googleId: user.googleId || null,
                skills: Array.isArray(user.skills) ? user.skills : [],
                location: user.location || '',
                title: user.title || '',
                experienceYears: user.experienceYears || 0
            };
            
            console.log(`Processed user: ${JSON.stringify(processedUser)}`);
            console.log(`---------------------`);
            
            return processedUser;
        });

        // Send response with required format
        return res.status(200).json({
            success: true,
            users: processedUsers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total: total,
                limit: limit
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch candidates'
        });
    }
};

// Create a new user
const createUser = async (req, res) => {
    try {
        let { firstName, lastName, email, password, rePassword, faceDescriptor } = req.body;

        console.log(" Request Body:", req.body);

        // Nettoyage des entrées
        firstName = firstName.trim();
        lastName = lastName.trim();
        email = email.trim();

        // Vérification des champs obligatoires
        if (!firstName || !lastName || !email || !password || !rePassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Vérification de la correspondance des mots de passe
        if (password !== rePassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Vérification si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User already exists with email:", email);
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Vérification du format faceDescriptor uniquement s'il est fourni
        if (faceDescriptor && (!Array.isArray(faceDescriptor) || faceDescriptor.some(isNaN))) {
            return res.status(400).json({ message: "Invalid face descriptor format" });
        }
        
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Génération du faceId uniquement si un faceDescriptor est fourni
        let faceId = null;
        if (faceDescriptor) {
            faceId = generateFaceId(faceDescriptor);
        }

        // Création du nouvel utilisateur
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            faceDescriptor: faceDescriptor || null,
            role: "candidate",
            emailVerificationToken,
            emailVerificationExpires,
            isEmailVerified: false,
        });

        // Set faceId only if it is not null
        if (faceId) {
            newUser.faceId = faceId;
        }

        await newUser.save();
        await sendVerificationEmail(email, emailVerificationToken, firstName);

        // Génération du token JWT
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({ 
            token, 
            userId: newUser._id, 
            email: newUser.email,
            hasFaceId: !!faceId
        });

    } catch (error) {
        console.error(" Error creating user:", error);
        res.status(500).json({ message: error.message });
    }
};

// Générer un faceId à partir du faceDescriptor
const generateFaceId = (faceDescriptor) => {
    return crypto.createHash("sha256").update(JSON.stringify(faceDescriptor)).digest("hex");
};

// Custom function to calculate Euclidean distance between two face descriptors
const euclideanDistance = (desc1, desc2) => {
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
};

// Sign in a user
const signIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // If the user signed up through Google, ask them to use Google sign-in
        if (user.googleId && !user.password) {
            return res.status(400).json({ 
                message: "This account was created with Google. Please sign in with Google."
            });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate a JWT access token (short-lived)
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-jwt-secret',
            { expiresIn: "1h" }
        );
        
        // Generate a refresh token (long-lived)
        const refreshToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
            { expiresIn: "7d" } // 7 days
        );

        // Include firstName and lastName in the response
        res.status(200).json({ 
            token, 
            refreshToken,
            userId: user._id, 
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sign in a user
const signInn = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        
        // Check email verification status first
        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                message: "Please verify your email before signing in",
                isEmailVerified: false
            });
        }

        // If the user signed up through Google, ask them to use Google sign-in
        if (user.googleId && !user.password) {
            return res.status(400).json({ 
                message: "This account was created with Google. Please sign in with Google."
            });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate OTP for two-step verification
        const otp = generateOTP(4);
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

        // Save OTP and expiry to the user record
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.isOtpVerified = false;
        await user.save();

        // IMPORTANT WORKAROUND FOR TESTING: Log the full OTP to console
        console.log(`--------------------------------------------------------------`);
        console.log(`🔑 DEVELOPMENT MODE: OTP CODE FOR TESTING IS: ${otp}`);
        console.log(`--------------------------------------------------------------`);

        // Try to send email, but don't fail if it doesn't work in development
        try {
            // Send OTP to user's email
            const emailResult = await sendOTPEmail(user.email, otp, user.firstName);
            
            if (!emailResult.success) {
                console.error(`Failed to send OTP email to ${email}. Error: ${emailResult.error}`);
                console.log(`For development/testing purposes, use the OTP displayed in the console above.`);
                
                // In production, this would return an error
                if (process.env.NODE_ENV === 'production') {
                    return res.status(500).json({ 
                        message: "Failed to send verification code. Please try again later." 
                    });
                }
            } else {
                console.log(`✅ OTP email sent successfully to ${email}`);
            }
        } catch (error) {
            console.error("Error sending email:", error.message);
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({ message: "Failed to send verification code" });
            }
            console.log(`For development/testing purposes, use the OTP displayed in the console above.`);
        }

        // Send a response indicating 2FA is required
        console.log("Sending OTP requirement response:", {
            email: user.email,
            requiresOtp: true
        });

        // Send a response indicating 2FA is required
        res.status(200).json({ 
            message: "Verification code sent to your email",
            email: user.email,
            requiresOtp: true,
            userId: user._id,
            role: user.role
        });
    } catch (error) {
        console.error("Error in signIn:", error);
        res.status(500).json({ message: error.message });
    }
};

// Verify OTP for two-step verification
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if OTP exists and matches
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check if OTP is expired
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // OTP verified successfully, mark user OTP as verified
        user.isOtpVerified = true;
        await user.save();

        // Generate access token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-jwt-secret',
            { expiresIn: "1h" }
        );
        
        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
            { expiresIn: "7d" } // 7 days
        );

        // Prepare user data for response
        const userData = {
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };

        // Return token and user data
        return res.status(200).json({
            message: "OTP verified successfully",
            token,
            refreshToken,
            user: userData
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Resend OTP to user's email
const resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Generate new OTP
        const otp = generateOTP(4);
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

        // Save new OTP and expiry to the user record
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.isOtpVerified = false;
        await user.save();

        // Send OTP to user's email
        const emailResult = await sendOTPEmail(user.email, otp, user.firstName);
        if (!emailResult.success) {
            return res.status(500).json({ message: "Failed to send verification code" });
        }

        res.status(200).json({ 
            message: "New verification code sent to your email",
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sign in a user with Face ID
const signInWithFaceID = async (req, res) => {
    const { faceDescriptor } = req.body;

    try {

        // Check if the face descriptor is provided
        if (!faceDescriptor) {
            return res.status(400).json({ message: "Face descriptor is required" });
        }

        // Find all users with face descriptors
        const users = await User.find({ faceDescriptor: { $exists: true, $ne: null } });

        // Compare the provided face descriptor with the stored face descriptors
        for (const user of users) {
            const storedFaceDescriptor = user.faceDescriptor;
            const distance = euclideanDistance(faceDescriptor, storedFaceDescriptor);
            if (distance <= 0.6) { // Adjust the threshold as needed
                // Generate a JWT token
                const token = jwt.sign(
                    { userId: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                // Check email verification status first
                if (!user.isEmailVerified) {
                    return res.status(403).json({ 
                        message: "Please verify your email before signing in",
                        isEmailVerified: false
                    });
                }
                // Include firstName and lastName in the response
                return res.status(200).json({ 
                    token, 
                    userId: user._id, 
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                });
            }
        }

        return res.status(400).json({ message: "Face ID does not match any user" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Handle Google-authenticated users
const handleGoogleUser = async (profile) => {
    try {
        let user = await User.findOne({ 
            $or: [
                { googleId: profile.id },
                { email: profile.emails[0].value }
            ]
        });

        if (!user) {
            // Create new user
            user = new User({
                googleId: profile.id,
                email: profile.emails[0].value,
                firstName: profile.name.givenName || '',
                lastName: profile.name.familyName || '',
                profilePicture: profile.photos[0]?.value || '',
                role: "candidate" // Default role
            });
            await user.save();
        } else if (!user.googleId) {
            // If user exists by email but doesn't have googleId
            user.googleId = profile.id;
            
            // Update other profile data if missing
            if (!user.firstName) user.firstName = profile.name.givenName || '';
            if (!user.lastName) user.lastName = profile.name.familyName || '';
            if (!user.profilePicture) user.profilePicture = profile.photos[0]?.value || '';
            
            await user.save();
        }
        
        return user;
    } catch (error) {
        console.error("Error handling Google user:", error);
        throw error;
    }
};

const signOut = (req, res) => {
    try {
        // If using passport, logout the user
        if (req.logout) {
            req.logout(function (err) {
                if (err) {
                    console.error("Logout error:", err);
                    return res.status(500).json({ message: "Logout failed" });
                }
                
                // Clear session after logout
                if (req.session) {
                    req.session.destroy((err) => {
                        if (err) {
                            console.error("Session destruction error:", err);
                            return res.status(500).json({ message: "Session destruction failed" });
                        }
                        
                        // Clear authentication cookies
                        res.clearCookie("token");
                        res.clearCookie("connect.sid", {
                            path: "/",
                            httpOnly: true,
                            secure: process.env.NODE_ENV === "production",
                            sameSite: 'lax'
                        });

                        return res.status(200).json({ message: "Successfully signed out" });
                    });
                } else {
                    return res.status(200).json({ message: "Successfully signed out" });
                }
            });
        } else {
            return res.status(200).json({ message: "Successfully signed out" });
        }
    } catch (error) {
        console.error("Sign out error:", error);
        res.status(500).json({ message: "Error during sign out process" });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        // Ajouter des logs pour le débogage
        console.log("Attempting to verify email with token:", token);
        
        // Vérifier si le token est valide
        if (!token || token.length < 10) {
            console.log("Invalid token format:", token);
            return res.status(400).json({
                message: "Format de token invalide"
            });
        }

        // Rechercher l'utilisateur par le token uniquement d'abord
        let user = await User.findOne({
            emailVerificationToken: token
        });

        // Ajouter des logs pour voir quels utilisateurs existent avec des tokens de vérification
        console.log("Searching for token:", token);
        const usersWithTokens = await User.find({ emailVerificationToken: { $exists: true } })
            .select('email emailVerificationToken emailVerificationExpires');
        console.log("Users with verification tokens:", JSON.stringify(usersWithTokens, null, 2));

        if (!user) {
            console.log("No user found with this verification token");
            return res.status(400).json({
                message: "Token de vérification invalide ou inexistant"
            });
        }

        // Ajouter plus de détails sur l'utilisateur trouvé
        console.log("User found:", {
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            tokenExpiry: user.emailVerificationExpires,
            currentTime: new Date()
        });

        // Vérifier maintenant si le token est expiré
        if (user.emailVerificationExpires && user.emailVerificationExpires < Date.now()) {
            console.log("Token expired. Expiry:", user.emailVerificationExpires, "Current:", Date.now());
            return res.status(400).json({
                message: "Le lien de vérification a expiré",
                expired: true
            });
        }

        // Si l'utilisateur est déjà vérifié
        if (user.isEmailVerified) {
            console.log("User email already verified:", user.email);
            return res.status(200).json({
                message: "Email déjà vérifié",
                alreadyVerified: true
            });
        }

        // Mettre à jour l'utilisateur
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        console.log("Email verified successfully for user:", user.email);
        res.status(200).json({
            message: "Email vérifié avec succès"
        });
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ 
            message: "Une erreur est survenue lors de la vérification de l'email",
            error: error.message 
        });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        console.log("Update profile called");
        console.log("Request user:", req.user);
        console.log("Request body:", req.body);
        
        // Get userId from middleware auth
        const userId = req.user.userId;
        if (!userId) {
            return res.status(401).json({ message: "User ID not found in request" });
        }
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        console.log("Found user:", user.email);
        
        // Get fields from request body
        const { firstName, lastName, phone, experienceYears, skills, projects, education, languagePreferences } = req.body;
        
        // Update simple fields if they exist in the request
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (experienceYears !== undefined) user.experienceYears = experienceYears;
        
        // Update array fields
        if (skills && Array.isArray(skills)) {
            user.skills = skills;
        }
        
        // Convert projects strings to object format according to schema
        if (projects && Array.isArray(projects)) {
            // Handle both string arrays and object arrays
            user.projects = projects.map(project => {
                if (typeof project === 'string') {
                    return {
                        title: project,
                        description: '',
                        technologies: []
                    };
                }
                return project;
            });
        }
        
        // Convert education strings to object format according to schema
        if (education && Array.isArray(education)) {
            // Handle both string arrays and object arrays
            user.education = education.map(edu => {
                if (typeof edu === 'string') {
                    return {
                        degree: edu,
                        institution: '',
                        yearCompleted: null
                    };
                }
                return edu;
            });
        }
        
        // Update language preferences
        if (languagePreferences && Array.isArray(languagePreferences)) {
            user.languagePreferences = languagePreferences;
        }
        
        // Save the updated user
        await user.save();
        
        // Return success response with ALL user data
        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
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
            }
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ 
            message: "Server error when updating profile", 
            error: error.message,
            stack: error.stack
        });
    }
};

/**
 * Update a user by ID
 * @author haythem
 * @description API endpoint to update user information
 * @date March 2025
 */
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, role, isActive } = req.body;
        
        // Find user and check if exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another account'
                });
            }
        }
        
        // Update user fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        
        // Save updated user
        await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'User updated successfully',
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating user', 
            error: error.message 
        });
    }
};

// Change user password
const changeUserPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }
        
        // Get user ID from authentication
        const userId = req.user.userId;
        if (!userId) {
            return res.status(401).json({ message: "User ID not found in token" });
        }
        
        console.log("Attempting password change for user:", userId);
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Check if user has a password (might not if using social login)
        if (!user.password) {
            return res.status(400).json({ message: "This account doesn't have a password. It was created via social login." });
        }
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            console.log("Invalid password attempt for user:", userId);
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        
        // Hash and update the new password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        console.log("Password changed successfully for user:", userId);
        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Password change error:", error);
        res.status(500).json({ message: "Server error during password change" });
        }
        };

/**
 * Delete a user by ID
 * @author haythem
 * @description API endpoint to delete a user from the database
 * @date March 2025
 */
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Find user and check if exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        res.status(200).json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting user', 
            error: error.message 
        });
    }
};

// Validate JWT token and return full user data for session persistence
const validateToken = async (req, res) => {
    try {
        let token;
        
        // Support both methods:
        // 1. Token in request body (new method)
        // 2. Token in Authorization header (old method)
        if (req.body && req.body.token) {
            // New method: token in request body
            token = req.body.token;
        } else if (req.headers && req.headers.authorization) {
            // Old method: token in Authorization header
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        if (!token) {
            return res.status(400).json({ 
                valid: false, 
                message: "Token is required" 
            });
        }
        
        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        } catch (tokenError) {
            // Check if token is expired
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    valid: false, 
                    expired: true,
                    message: "Token has expired",
                    needsRefresh: true
                });
            }
            
            // Other token errors
            return res.status(401).json({ 
                valid: false, 
                message: "Invalid token" 
            });
        }
        
        // Get the complete user object to maintain session data across domains
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            console.error('User not found for token validation, userId:', decoded.userId);
            return res.status(404).json({ 
                valid: false, 
                message: "User not found" 
            });
        }
        
        console.log('Token validated successfully for user:', user.email, user.role);
        
        // Return full user object for client-side session management
        return res.status(200).json({ 
            valid: true,
            userId: decoded.userId,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error("Error validating token:", error);
        return res.status(401).json({ 
            valid: false,
            message: "Invalid token" 
        });
    }
};

// Fonction de diagnostic et réparation pour la vérification d'email
const generateNewVerificationToken = async (req, res) => {
    try {
        const { email } = req.params;
        
        // Vérifier si l'email est fourni
        if (!email) {
            return res.status(400).json({ message: "Email requis" });
        }
        
        // Chercher l'utilisateur
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        // Vérifier si l'email est déjà vérifié
        if (user.isEmailVerified) {
            return res.status(200).json({ 
                message: "Email déjà vérifié",
                isVerified: true 
            });
        }
        
        // Générer un nouveau token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
        
        // Mettre à jour l'utilisateur
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save();
        
        // Envoyer un nouvel email de vérification
        try {
            await sendVerificationEmail(user.email, emailVerificationToken, user.firstName);
            console.log("New verification email sent to:", user.email);
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            // On continue même si l'email échoue
        }
        
        return res.status(200).json({
            message: "Nouveau token généré avec succès",
            verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${emailVerificationToken}`,
            token: emailVerificationToken,
            expires: emailVerificationExpires
        });
        
    } catch (error) {
        console.error("Error generating new verification token:", error);
        return res.status(500).json({ message: error.message });
    }
};

// Define updateUserRole as a regular function instead of using exports.updateUserRole
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validation du rôle
        const validRoles = ['candidate', 'recruiter', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role specified' 
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { 
                role,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Keep the main module.exports with all functions
module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    signIn,
    signInn,
    signInWithFaceID,
    signOut,
    verifyOtp,
    resendOtp,
    verifyEmail,
    updateUserProfile,
    changeUserPassword,
    validateToken,
    generateNewVerificationToken,
    updateUserRole
};
