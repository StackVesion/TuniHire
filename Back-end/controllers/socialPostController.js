const SocialPost = require('../models/SocialPost');

// Get all social posts
exports.getAllSocialPosts = async (req, res) => {
  try {
    const posts = await SocialPost.find().populate('userId');
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get social post by ID
exports.getSocialPostById = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id).populate('userId');
    if (!post) {
      return res.status(404).json({ message: 'Social post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new social post
exports.createSocialPost = async (req, res) => {
  try {
    const newPost = new SocialPost(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update social post
exports.updateSocialPost = async (req, res) => {
  try {
    const updatedPost = await SocialPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: 'Social post not found' });
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete social post
exports.deleteSocialPost = async (req, res) => {
  try {
    const deletedPost = await SocialPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: 'Social post not found' });
    }
    res.status(200).json({ message: 'Social post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get social posts by user
exports.getSocialPostsByUser = async (req, res) => {
  try {
    const posts = await SocialPost.find({ userId: req.params.userId });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
