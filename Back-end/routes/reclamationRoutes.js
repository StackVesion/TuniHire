const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/reclamationController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// Test route
router.get('/test', function(req, res) {
  res.json({ message: 'Reclamation route test successful' });
});

// GET all reclamations (admin only)
router.get('/', auth.verifyToken, reclamationController.getAllReclamations);

// GET reclamation by ID
router.get('/:id', auth.verifyToken, reclamationController.getReclamationById);

// GET reclamations by user
router.get('/user/:userId', auth.verifyToken, reclamationController.getReclamationsByUser);

// GET reclamations by target
router.get('/target/:targetType/:targetId', auth.verifyToken, reclamationController.getReclamationsByTarget);

// GET reclamations for current logged in user
router.get('/user', auth.verifyToken, async (req, res) => {
  try {
    const reclamations = await Reclamation.find({ userId: req.user.id });
    res.status(200).json({ success: true, reclamations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE new reclamation
router.post('/', 
  auth.verifyToken,
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['technical', 'billing', 'account', 'job', 'other']).withMessage('Invalid category'),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
  ],
  reclamationController.createReclamation
);

// UPDATE reclamation
router.put('/:id', auth.verifyToken, reclamationController.updateReclamation);

// DELETE reclamation
router.delete('/:id', auth.verifyToken, reclamationController.deleteReclamation);

module.exports = router;
