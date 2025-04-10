const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Route to update user role
router.put("/update-role/:id", verifyToken, isAdmin, userController.updateUserRole);

module.exports = router;