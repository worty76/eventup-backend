const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (req.user.status === 'BLOCKED') {
        return res.status(403).json({
          success: false,
          message: 'Account has been blocked'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

exports.isCTV = (req, res, next) => {
  if (req.user.role !== 'CTV') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to CTV users'
    });
  }
  next();
};

exports.isBTC = (req, res, next) => {
  if (req.user.role !== 'BTC') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to BTC users'
    });
  }
  next();
};

exports.isPremium = (req, res, next) => {
  if (!req.user.isPremiumActive()) {
    return res.status(403).json({
      success: false,
      message: 'This feature requires an active Premium subscription'
    });
  }
  next();
};

exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
      } catch (err) {
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
