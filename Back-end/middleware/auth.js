const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and attach user to request
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
      console.log('Auth Error: No authorization header');
      return res.status(403).json({ message: 'Access denied: No token provided' });
    }
    
    // Check if bearer token format is correct
    if (!bearerHeader.startsWith('Bearer ')) {
      console.log('Auth Error: Invalid token format, expected Bearer token');
      return res.status(403).json({ message: 'Access denied: Invalid token format' });
    }
    
    // Extract token
    const token = bearerHeader.split(' ')[1];
    
    if (!token) {
      console.log('Auth Error: Token is empty');
      return res.status(403).json({ message: 'Access denied: Empty token' });
    }
    
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set basic user info from token
      req.userId = verified.userId || verified._id || verified.id;
      
      console.log('Token verified, userId from token:', req.userId);
      
      // Fetch the complete user from the database to ensure up-to-date info
      const user = await User.findById(req.userId);
      if (!user) {
        console.log('User not found with ID:', req.userId);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log('User found:', user.email, '(ID:', user._id, '- Role:', user.role, ')');
      
      // Set the user object in the request
      req.user = {
        id: user._id.toString(), // Important: Convert ObjectId to string
        _id: user._id.toString(), // Include both formats to be safe
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.log('Auth Error: Token verification failed -', error.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.log('Auth Error:', error.message);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

/**
 * Middleware to check if user is admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  
  // Check role (case insensitive)
  if (req.user.role && req.user.role.toString().toUpperCase() === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

/**
 * Middleware to check if user has HR role
 */
exports.isHR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  
  // Check role (case insensitive)
  if (req.user.role && req.user.role.toString().toUpperCase() === 'HR') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. HR privileges required.' });
  }
};
