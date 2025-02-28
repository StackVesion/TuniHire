const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new user
const createUser = async (req, res) => {
    try {
        let { firstName, lastName, email, password, rePassword, faceDescriptor } = req.body;

        console.log("📤 Request Body:", req.body);

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
        if (faceDescriptor && (!Array.isArray(faceDescriptor) || faceDescriptor.some(isNaN))) {
            return res.status(400).json({ message: "Invalid face descriptor format" });
        }
        
        // Génération du faceId si un faceDescriptor est fourni
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
        });

        // Set faceId only if it is not null
        if (faceId) {
            newUser.faceId = faceId;
        }

        await newUser.save();

        // Génération du token JWT
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({ token, userId: newUser._id, email: newUser.email });

    } catch (error) {
        console.error("❌ Error creating user:", error);
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

        // Generate a JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Include firstName and lastName in the response
        res.status(200).json({ 
            token, 
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


module.exports = {
    getUsers,
    createUser,
    signIn,
    signInWithFaceID,
    signOut,
    handleGoogleUser
};
