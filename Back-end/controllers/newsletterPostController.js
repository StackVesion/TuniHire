const NewsletterPost = require('../models/NewsletterPost');

// Get all newsletter posts
exports.getAllNewsletterPosts = async (req, res) => {
  try {
    const posts = await NewsletterPost.find().populate('companyId');
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get newsletter post by ID
exports.getNewsletterPostById = async (req, res) => {
  try {
    const post = await NewsletterPost.findById(req.params.id).populate('companyId');
    if (!post) {
      return res.status(404).json({ message: 'Newsletter post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new newsletter post
exports.createNewsletterPost = async (req, res) => {
  try {
    const newPost = new NewsletterPost(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update newsletter post
exports.updateNewsletterPost = async (req, res) => {
  try {
    const updatedPost = await NewsletterPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: 'Newsletter post not found' });
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete newsletter post
exports.deleteNewsletterPost = async (req, res) => {
  try {
    const deletedPost = await NewsletterPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: 'Newsletter post not found' });
    }
    res.status(200).json({ message: 'Newsletter post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get newsletter posts by company
exports.getNewsletterPostsByCompany = async (req, res) => {
  try {
    const posts = await NewsletterPost.find({ companyId: req.params.companyId });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
