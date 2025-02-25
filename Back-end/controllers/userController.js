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
            lastName: user.lastName
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const signOut = (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Successfully signed out" });
};

module.exports = { getUsers, createUser, signIn, signOut };
