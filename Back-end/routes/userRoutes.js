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
router.post("/signout", signOut);

module.exports = router;
