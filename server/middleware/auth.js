const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Company,
        as: 'company'
      }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

const requireCompanyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admin can access all companies
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user belongs to the requested company
  const requestedCompanyId = req.params.companyId || req.body.companyId;
  
  if (requestedCompanyId && req.user.companyId !== requestedCompanyId) {
    return res.status(403).json({ error: 'Access denied to this company.' });
  }

  next();
};

const requireOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params.id;
      const resource = await req.app.locals.models[modelName].findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found.' });
      }

      // Check if user owns the resource or belongs to the same company
      if (resource.userId && resource.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied to this resource.' });
      }

      if (resource.companyId && resource.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied to this resource.' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error checking resource ownership.' });
    }
  };
};

module.exports = {
  auth,
  requireRole,
  requireCompanyAccess,
  requireOwnership
};