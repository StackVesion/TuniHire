const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }
        
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid Authorization header format' });
        }
        
        // Extract token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token missing' });
        }
        
        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Add user info to request
            req.user = decoded;
            
            // Continue
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            
            return res.status(401).json({ message: 'Token verification failed' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Authentication process failed', error: error.message });
    }
};

module.exports = authMiddleware;
