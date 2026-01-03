const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ROLES } = require('../config/constants');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('company', 'name code logo');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Check if user owns the resource or is admin
const ownerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }
    
    if (req.user._id.toString() === resourceUserId) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.'
    });
  };
};

// Check first login and require password change
const checkFirstLogin = (req, res, next) => {
  if (req.user.isFirstLogin && req.path !== '/change-password' && req.path !== '/me') {
    return res.status(403).json({
      success: false,
      message: 'Password change required on first login',
      requirePasswordChange: true
    });
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
  ownerOrAdmin,
  checkFirstLogin
};
