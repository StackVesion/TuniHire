const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/author/:authorId', blogController.getBlogsByAuthor);
router.get('/:id', blogController.getBlogById);

// Protected routes - require authentication
router.post('/', verifyToken, blogController.createBlog);
router.put('/:id', verifyToken, blogController.updateBlog);
router.delete('/:id', verifyToken, blogController.deleteBlog);

// Social interaction routes
router.post('/:id/like', verifyToken, blogController.likeBlog);
router.post('/:id/comment', verifyToken, blogController.addComment);
router.delete('/:id/comment/:commentId', verifyToken, blogController.deleteComment);
router.post('/:id/share', verifyToken, blogController.shareBlog);
router.post('/:id/review', verifyToken, blogController.addReview);

module.exports = router; 