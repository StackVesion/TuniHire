const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Import face-api.js
const faceapi = require("face-api.js");

// Create a new user with Face ID
const createUser = async (req, res) => {
    console.log(req.body); // Debugging
    const { email, password, faceDescriptor } = req.body;

    // Check if required fields are provided
    if (!email || !password || !faceDescriptor) {
        return res.status(400).json({ message: "Email, password, and faceDescriptor are required" });
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user object
        const newUser = new User({
            email,
            password: hashedPassword,
            faceDescriptor // Store face recognition data
        });

        // Save the user
        await newUser.save();

        // Generate a JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ user: newUser, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const signIn = async (req, res) => {
    const { email, password, faceDescriptor } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        let isPasswordValid = false;
        let isFaceValid = false;

        // Vérification du mot de passe
        if (password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                isPasswordValid = true;
            }
        }

        // Vérification de la reconnaissance faciale (si l'utilisateur a un Face ID enregistré)
        if (user.faceDescriptor && faceDescriptor) {
            const euclideanDistance = Math.sqrt(
                user.faceDescriptor.reduce((sum, value, index) => 
                    sum + Math.pow(value - faceDescriptor[index], 2), 0)
            );

            if (euclideanDistance <= 0.6) {
                isFaceValid = true;
            }
        } else if (user.faceDescriptor && !faceDescriptor) {
            return res.status(400).json({ message: "Face ID required for this account!" });
        }

        // Vérifier que les DEUX méthodes sont valides
        if (!isPasswordValid || !isFaceValid) {
            return res.status(400).json({ message: "Invalid credentials!" });
        }

        // Générer un token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });

    } catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const signInWithFaceId = async (req, res) => {
    const { faceDescriptor } = req.body;

    try {
        const users = await User.find();
        let authenticatedUser = null;

        for (const user of users) {
            if (user.faceDescriptor) {
                const euclideanDistance = Math.sqrt(
                    user.faceDescriptor.reduce((sum, value, index) => 
                        sum + Math.pow(value - faceDescriptor[index], 2), 0)
                );

                if (euclideanDistance <= 0.6) {
                    authenticatedUser = user;
                    break;
                }
            }
        }

        if (authenticatedUser) {
            const token = jwt.sign({ id: authenticatedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ 
                token,
                email: authenticatedUser.email  // Add email to response
            });
        } else {
            return res.status(400).json({ message: "Invalid Face ID!" });
        }
    } catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getUsers, createUser, signIn, signInWithFaceId };
