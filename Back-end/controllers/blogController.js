const Blog = require('../models/Blog');
const User = require('../models/User');

// Get all blogs with pagination
exports.getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by tag if provided
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }
    
    // Only show published blogs for regular users
    if (!req.user || !req.user.isAdmin) {
      query.published = true;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('likes', 'firstName lastName profilePicture')
      .populate('comments.user', 'firstName lastName profilePicture')
      .populate('shares.user', 'firstName lastName profilePicture')
      .populate('reviews.user', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments(query);
    
    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBlogs: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
};

// Get a single blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('likes', 'firstName lastName profilePicture')
      .populate('comments.user', 'firstName lastName profilePicture')
      .populate('shares.user', 'firstName lastName profilePicture')
      .populate('reviews.user', 'firstName lastName profilePicture');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Check if trying to access unpublished blog
    if (!blog.published && (!req.user || !req.user.isAdmin)) {
      return res.status(403).json({ message: 'Access denied to unpublished blog' });
    }
    
    // Increment view count
    blog.viewCount += 1;
    await blog.save();
    
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog', error: error.message });
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, summary, category, tags, image, published } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const newBlog = new Blog({
      title,
      content,
      summary,
      author: req.user.id,
      category,
      tags: tags || [],
      image,
      published: published !== undefined ? published : true
    });
    
    const savedBlog = await newBlog.save();
    
    res.status(201).json(savedBlog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error: error.message });
  }
};

// Update a blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, summary, category, tags, image, published } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Only the author or an admin can update a blog
    if (blog.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title: title || blog.title,
        content: content || blog.content,
        summary: summary || blog.summary,
        category: category || blog.category,
        tags: tags || blog.tags,
        image: image || blog.image,
        published: published !== undefined ? published : blog.published,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('author', 'firstName lastName email profilePicture');
    
    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Only the author or an admin can delete a blog
    if (blog.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
};

// Get blogs by author ID
exports.getBlogsByAuthor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = { author: req.params.authorId };
    
    // Only show published blogs for regular users unless viewing own blogs
    if ((!req.user || !req.user.isAdmin) && req.user && req.user.id !== req.params.authorId) {
      query.published = true;
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('likes', 'firstName lastName profilePicture')
      .populate('comments.user', 'firstName lastName profilePicture')
      .populate('shares.user', 'firstName lastName profilePicture')
      .populate('reviews.user', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments(query);
    
    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBlogs: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching author blogs', error: error.message });
  }
};

// Like a blog
exports.likeBlog = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Check if user already liked the blog
    const alreadyLiked = blog.likes.includes(req.user.id);
    
    if (alreadyLiked) {
      // Unlike the blog
      blog.likes = blog.likes.filter(userId => userId.toString() !== req.user.id);
    } else {
      // Like the blog
      blog.likes.push(req.user.id);
    }
    
    await blog.save();
    
    const updatedBlog = await Blog.findById(req.params.id)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('likes', 'firstName lastName profilePicture');
    
    res.status(200).json({
      message: alreadyLiked ? 'Blog unliked successfully' : 'Blog liked successfully',
      blog: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog likes', error: error.message });
  }
};

// Add a comment to a blog
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const newComment = {
      user: req.user.id,
      content,
      createdAt: Date.now()
    };
    
    blog.comments.push(newComment);
    await blog.save();
    
    const updatedBlog = await Blog.findById(req.params.id)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('comments.user', 'firstName lastName profilePicture');
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: updatedBlog.comments[updatedBlog.comments.length - 1],
      blog: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const comment = blog.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Only the comment author, blog author, or an admin can delete the comment
    if (comment.user.toString() !== req.user.id && 
        blog.author.toString() !== req.user.id && 
        !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    comment.remove();
    await blog.save();
    
    const updatedBlog = await Blog.findById(req.params.id)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('comments.user', 'firstName lastName profilePicture');
    
    res.status(200).json({
      message: 'Comment deleted successfully',
      blog: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Share a blog
exports.shareBlog = async (req, res) => {
  try {
    const { platform } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!platform) {
      return res.status(400).json({ message: 'Platform is required' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const share = {
      user: req.user.id,
      platform,
      createdAt: Date.now()
    };
    
    blog.shares.push(share);
    await blog.save();
    
    const updatedBlog = await Blog.findById(req.params.id)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('shares.user', 'firstName lastName profilePicture');
    
    res.status(201).json({
      message: 'Blog shared successfully',
      share: updatedBlog.shares[updatedBlog.shares.length - 1],
      blog: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing blog', error: error.message });
  }
};

// Add a review to a blog
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Check if user already reviewed the blog
    const existingReviewIndex = blog.reviews.findIndex(
      review => review.user.toString() === req.user.id
    );
    
    if (existingReviewIndex !== -1) {
      // Update existing review
      blog.reviews[existingReviewIndex].rating = rating;
      blog.reviews[existingReviewIndex].comment = comment;
      blog.reviews[existingReviewIndex].createdAt = Date.now();
    } else {
      // Add new review
      const newReview = {
        user: req.user.id,
        rating,
        comment,
        createdAt: Date.now()
      };
      
      blog.reviews.push(newReview);
    }
    
    await blog.save();
    
    const updatedBlog = await Blog.findById(req.params.id)
      .populate('author', 'firstName lastName email profilePicture')
      .populate('reviews.user', 'firstName lastName profilePicture');
    
    res.status(201).json({
      message: existingReviewIndex !== -1 ? 'Review updated successfully' : 'Review added successfully',
      blog: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding/updating review', error: error.message });
  }
}; 