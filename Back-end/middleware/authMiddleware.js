const jwt = require('jsonwebtoken');

// Verify token middleware
const verifyToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('Auth header missing');
            return res.status(401).json({ message: 'Authorization header missing' });
        }
        
        if (!authHeader.startsWith('Bearer ')) {
            console.log('Invalid auth header format:', authHeader);
            return res.status(401).json({ message: 'Invalid Authorization header format' });
        }
        
        // Extract token
        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('Token missing after Bearer prefix');
            return res.status(401).json({ message: 'Token missing' });
        }
        
        // For debugging - log token info without revealing full token
        console.log('Token verification attempt:', {
            length: token.length,
            prefix: token.substring(0, 10) + '...',
            secret: process.env.JWT_SECRET ? 'present' : 'missing'
        });
        
        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
            
            // Add user info to request and ensure userId is always available
            req.user = decoded;
            
            // Compatibility: make sure userId is always available regardless of whether the token uses 'id' or 'userId'
            if (decoded.id && !decoded.userId) {
                console.log('Converting legacy id to userId in token for compatibility');
                req.user.userId = decoded.id;
            }
            
            console.log('Token verified successfully for user:', decoded.email);
            
            // Continue
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.name, jwtError.message);
            
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            
            return res.status(401).json({ message: 'Token verification failed' });
        }
    } catch (error) {
        console.error('Authentication process failed:', error);
        return res.status(500).json({ message: 'Authentication process failed', error: error.message });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    // User must be authenticated first with verifyToken middleware
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
};

module.exports = { 
    verifyToken, 
    isAdmin 
};
