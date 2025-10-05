const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const authToken = authHeader && authHeader.split(' ')[1];

    if (!authToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);
    
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

const requireAdmin = requireRole('admin');
const requireOrganizer = requireRole('organizer', 'admin');
const requireStudent = requireRole('student', 'organizer', 'admin');

const requireOwnershipOrAdmin = (resourceIdParam = 'id', resourceTable = 'events', userIdColumn = 'created_by') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      
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
