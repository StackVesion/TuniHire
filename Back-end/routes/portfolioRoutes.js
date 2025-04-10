const express = require('express');
const { 
  getAllPortfolios,
  getPortfolioById,
  getPortfolioByUserId,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addCertificateToPortfolio,
  removeCertificateFromPortfolio
} = require('../controllers/portfolioController');
const { verifyToken } = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');

const router = express.Router();

// Public routes
router.get('/', getAllPortfolios);
router.get('/:id', getPortfolioById);
router.get('/user/:userId', getPortfolioByUserId);

// Protected routes - require authentication
router.post('/', verifyToken, createPortfolio);
router.put('/:id', verifyToken, updatePortfolio);
router.delete('/:id', verifyToken, deletePortfolio);

// Certificate management routes
router.post('/:portfolioId/certificates/:certificateId', verifyToken, addCertificateToPortfolio);
router.delete('/:portfolioId/certificates/:certificateId', verifyToken, removeCertificateFromPortfolio);

// Special route for updating portfolio CV
router.put('/update-cv/:id', verifyToken, async (req, res) => {
  try {
    // Extract CV file data from request
    const { cvFile } = req.body;
    
    if (!cvFile) {
      return res.status(400).json({ message: 'CV file data is required' });
    }
    
    // Find the portfolio and update only the CV file
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { cvFile: cvFile },
      { new: true, runValidators: true }
    );
    
    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      portfolio: updatedPortfolio 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
