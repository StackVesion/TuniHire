const express = require("express");
const { getUsers, createUser, signIn, signOut } = require("../controllers/userController");
const User = require("../models/User");

const router = express.Router();

// Route to get all users
router.get("/", getUsers);

// Route to sign up/create a new user
router.post("/signup", createUser); // Use createUser function from the controller

// Route to sign in
router.post("/signin", signIn);

// Route to sign out
// In userRoutes.js
router.post("/signout", (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destruction error:", err);
                return res.status(500).json({ message: "Failed to sign out" });
            }
            res.clearCookie("connect.sid", {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: 'lax'
            });
            return res.status(200).json({ message: "Signed out successfully" });
        });
    } catch (error) {
        console.error("Signout error:", error);
        res.status(500).json({ message: "Server error during sign out" });
    }
});
module.exports = router;
