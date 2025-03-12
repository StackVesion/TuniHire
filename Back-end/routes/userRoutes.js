const express = require("express");
const { getUsers, createUser, signIn, signOut, signInWithFaceID, verifyOtp, resendOtp, verifyEmail,signInn } = require("../controllers/userController");

const router = express.Router();

// Route to get all users
router.get("/", getUsers);

// Route to sign up/create a new user
router.post("/signup", createUser);

// Route to sign in
router.post("/signin", signIn);
router.post("/signinn", signInn);

// Route to verify OTP for two-step verification
router.post("/verify-otp", verifyOtp);

// Route to resend OTP
router.post("/resend-otp", resendOtp);

// Route to sign in with Face ID
router.post("/signin/faceid", signInWithFaceID);

// Route to sign out
router.post("/signout", signOut);

// Route to verify email after registration
router.get('/verify-email/:token', verifyEmail);

module.exports = router;
