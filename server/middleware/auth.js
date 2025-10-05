// Authentication middleware - handles JWT token verification and role-based access control
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

// Middleware to verify JWT token and authenticate users
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const authToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!authToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify the JWT token
    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);
    
    // Get user details from database
    const userResult = await query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [decodedToken.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    // Add user info to request object for use in other middleware/routes
    req.user = userResult.rows[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Middleware to check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole('admin');

// Middleware to check if user is organizer or admin
const requireOrganizer = requireRole('organizer', 'admin');

// Middleware to check if user is student or higher
const requireStudent = requireRole('student', 'organizer', 'admin');

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceIdParam = 'id', resourceTable = 'events', userIdColumn = 'created_by') => {
  return async (req, res, next) => {
    try {
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      
      // Check if user owns the resource
      const result = await query(
        `SELECT ${userIdColumn} FROM ${resourceTable} WHERE id = $1`,
        [resourceId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Resource not found' 
        });
      }

      if (result.rows[0][userIdColumn] !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied - you can only access your own resources' 
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking resource ownership' 
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireOrganizer,
  requireStudent,
  requireOwnershipOrAdmin
};
