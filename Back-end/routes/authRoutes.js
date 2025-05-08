const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Route temporaire pour tester l'authentification
router.post('/login', (req, res) => {
  // Cette route est un placeholder - elle sera implémentée correctement plus tard
  res.status(200).json({
    success: true,
    message: 'Route de connexion temporaire',
    token: 'placeholder-token'
  });
});

// Route pour vérifier si un token est valide
router.get('/verify-token', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token valide',
    user: req.user
  });
});

module.exports = router;
