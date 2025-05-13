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
    // Get the user ID from the request parameters
    const userId = req.params.userId;
    
    // Input validation
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Find the portfolio for the specified user
    const portfolio = await Portfolio.findOne({ userId: userId })
      .populate('userId', 'name email profileImage')
      .populate('certificates');

    // If no portfolio exists, return a 404 with a clear message
    if (!portfolio) {
      return res.status(404).json({ 
        success: false, 
        message: 'No portfolio found for this user',
        isPortfolioMissing: true
      });
    }

    // Return the portfolio data with success status
    res.status(200).json({
      success: true,
      portfolio: portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio by user ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch portfolio data', 
      error: error.message 
    });
  }
};

// Create new portfolio
exports.createPortfolio = async (req, res) => {
  try {
    // Validate input
    if (!req.body.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required to create a portfolio' 
      });
    }
    
    // Check if portfolio already exists for this user
    const existingPortfolio = await Portfolio.findOne({ userId: req.body.userId });
    if (existingPortfolio) {
      return res.status(400).json({ 
        success: false, 
        message: 'A portfolio already exists for this user',
        portfolio: existingPortfolio
      });
    }
    
    // Create portfolio with proper structure
    const portfolioData = {
      userId: req.body.userId,
      education: req.body.education || [],
      experience: req.body.experience || [],
      skills: req.body.skills || [],
      projects: req.body.projects || [],
      about: req.body.about || '',
      socialLinks: req.body.socialLinks || {
        linkedin: '',
        github: '',
        website: '',
        twitter: ''
      }
    };
    
    // Create new portfolio with proper structured response
    const newPortfolio = new Portfolio(portfolioData);
    await newPortfolio.save();
    
    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      portfolio: newPortfolio
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create portfolio', 
      error: error.message 
    });
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
