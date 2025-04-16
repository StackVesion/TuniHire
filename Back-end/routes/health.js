const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint - make this public (no auth required)
router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection status
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    res.json({
      status: "ok",
      mongodb: mongoStatus,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = router;
