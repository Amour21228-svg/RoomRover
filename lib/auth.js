// lib/auth.js - Authentication & Authorization Middleware

const jwt = require('jsonwebtoken');
const db = require('./database');

// Generate JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
}

// Verify JWT Token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
  } catch (error) {
    return null;
  }
}

// Middleware: Authenticate Request
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }

  req.user = decoded;
  next();
}

// Middleware: Check Role-Based Access
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé - permissions insuffisantes' });
    }

    next();
  };
}

// Middleware: Check Resource Ownership
function checkOwnership(resourceField = 'ownerId') {
  return (req, res, next) => {
    const resourceOwnerId = req.body[resourceField] || req.params.ownerId;

    if (!resourceOwnerId) {
      return next(); // Pas de propriétaire défini, laisser passer
    }

    if (req.user.id !== resourceOwnerId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous n\'avez pas accès à cette ressource' });
    }

    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  checkOwnership,
};
