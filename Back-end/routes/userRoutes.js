const express = require("express");
const { getUsers, createUser, signIn, signOut, signInWithFaceID } = require("../controllers/userController");

const router = express.Router();

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

module.exports = router;
