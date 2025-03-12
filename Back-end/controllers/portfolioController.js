const Portfolio = require('../models/Portfolio');

// Get all portfolios
exports.getAllPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find()
      .populate('userId')
      .populate('certificates');
    res.status(200).json(portfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get portfolio by ID
exports.getPortfolioById = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)
      .populate('userId')
      .populate('certificates');
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.status(200).json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get portfolio by user ID
exports.getPortfolioByUserId = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.params.userId })
      .populate('userId')
      .populate('certificates');
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found for this user' });
    }
    res.status(200).json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new portfolio
exports.createPortfolio = async (req, res) => {
  try {
    const newPortfolio = new Portfolio(req.body);
    const savedPortfolio = await newPortfolio.save();
    res.status(201).json(savedPortfolio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update portfolio
exports.updatePortfolio = async (req, res) => {
  try {
    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.status(200).json(updatedPortfolio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete portfolio
exports.deletePortfolio = async (req, res) => {
  try {
    const deletedPortfolio = await Portfolio.findByIdAndDelete(req.params.id);
    if (!deletedPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.status(200).json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add certificate to portfolio
exports.addCertificateToPortfolio = async (req, res) => {
  try {
    const { portfolioId, certificateId } = req.params;
    
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    if (portfolio.certificates.includes(certificateId)) {
      return res.status(400).json({ message: 'Certificate already exists in portfolio' });
    }
    
    portfolio.certificates.push(certificateId);
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json(updatedPortfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove certificate from portfolio
exports.removeCertificateFromPortfolio = async (req, res) => {
  try {
    const { portfolioId, certificateId } = req.params;
    
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    portfolio.certificates = portfolio.certificates.filter(
      cert => cert.toString() !== certificateId
    );
    const updatedPortfolio = await portfolio.save();
    
    res.status(200).json(updatedPortfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
