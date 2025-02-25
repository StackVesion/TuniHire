const express = require("express");
const { getUsers, createUser, signIn ,signInWithFaceId } = require("../controllers/userController");
const User = require("../models/User");

const router = express.Router();

// Route to get all users
router.get("/", getUsers);

// Route to sign up/create a new user
router.post("/signup", createUser); // Use createUser function from the controller
router.post("/signInWithFaceId", signInWithFaceId); // Use createUser function from the controller

// Route to sign in
router.post("/signin", signIn);

router.post('/signout', (req, res) => {
    res.status(200).json({ msg: 'Signout successful' });
    console.log('Signout successful');
});

module.exports = router;
