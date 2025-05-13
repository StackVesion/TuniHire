const Certificate = require('../models/Certificate');

// Get all certificates
exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('userId')
      .populate('courseId');
    res.status(200).json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get certificate by ID
exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('userId')
      .populate('courseId');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new certificate
exports.createCertificate = async (req, res) => {
  try {
    const newCertificate = new Certificate(req.body);
    const savedCertificate = await newCertificate.save();
    res.status(201).json(savedCertificate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update certificate
exports.updateCertificate = async (req, res) => {
  try {
    const updatedCertificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCertificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json(updatedCertificate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete certificate
exports.deleteCertificate = async (req, res) => {
  try {
    const deletedCertificate = await Certificate.findByIdAndDelete(req.params.id);
    if (!deletedCertificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get certificates by user
exports.getCertificatesByUser = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.params.userId })
      .populate('courseId');
    res.status(200).json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get certificates by course
exports.getCertificatesByCourse = async (req, res) => {
  try {
    const certificates = await Certificate.find({ courseId: req.params.courseId })
      .populate('userId');
    res.status(200).json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
