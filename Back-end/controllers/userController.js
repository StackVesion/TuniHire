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

// Create a new user
const createUser = async (req, res) => {
    const { firstName, lastName, email, password, rePassword } = req.body;

    console.log("Request Body:", req.body); // Debugging: Check the request payload

    // Check if passwords match
    if (password !== rePassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with role set to "candidate"
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: "candidate"  // Adding this line to set default role
        });

        // Save the user to the database
        await newUser.save();

        // Generate a JWT token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Respond with the token and user details
        res.status(201).json({ token, userId: newUser._id, email: newUser.email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
        // Clear session
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Session destruction error:", err);
                }
            });
        }
        
        // If using passport, logout the user
        if (req.logout) {
            req.logout();
        }
        
        // Clear all authentication cookies
        res.clearCookie("token");
        res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax'
        });
        
        res.status(200).json({ message: "Successfully signed out" });
    } catch (error) {
        console.error("Sign out error:", error);
        res.status(500).json({ message: "Error during sign out process" });
    }
};

module.exports = {
    getUsers,
    createUser,
    signIn,
    signOut,
    handleGoogleUser
};
