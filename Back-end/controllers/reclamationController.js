const Reclamation = require('../models/Reclamation');

// Get all reclamations
exports.getAllReclamations = async (req, res) => {
  try {
    const reclamations = await Reclamation.find().populate('userId');
    res.status(200).json(reclamations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reclamation by ID
exports.getReclamationById = async (req, res) => {
  try {
    const reclamation = await Reclamation.findById(req.params.id).populate('userId');
    if (!reclamation) {
      return res.status(404).json({ message: 'Reclamation not found' });
    }
    res.status(200).json(reclamation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new reclamation
exports.createReclamation = async (req, res) => {
  try {
    const newReclamation = new Reclamation(req.body);
    const savedReclamation = await newReclamation.save();
    res.status(201).json(savedReclamation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update reclamation
exports.updateReclamation = async (req, res) => {
  try {
    const updatedReclamation = await Reclamation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedReclamation) {
      return res.status(404).json({ message: 'Reclamation not found' });
    }
    res.status(200).json(updatedReclamation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete reclamation
exports.deleteReclamation = async (req, res) => {
  try {
    const deletedReclamation = await Reclamation.findByIdAndDelete(req.params.id);
    if (!deletedReclamation) {
      return res.status(404).json({ message: 'Reclamation not found' });
    }
    res.status(200).json({ message: 'Reclamation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reclamations by user
exports.getReclamationsByUser = async (req, res) => {
  try {
    const reclamations = await Reclamation.find({ userId: req.params.userId });
    res.status(200).json(reclamations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reclamations by target
exports.getReclamationsByTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const reclamations = await Reclamation.find({ 
      targetType: targetType,
      targetId: targetId 
    }).populate('userId');
    res.status(200).json(reclamations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
