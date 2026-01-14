// server.js - Production-Ready Backend with Full API

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const db = require('./lib/database');
const auth = require('./lib/auth');

const app = express();
const port = process.env.PORT || 8080;

// ==================== SECURITY MIDDLEWARE ====================
// Helmet with strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.tailwindcss.com', 'https://cdn.jsdelivr.net', 'https://unpkg.com', "'unsafe-inline'"],
      styleSrc: ["'self'", 'https://cdn.tailwindcss.com', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http://static.photos'],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'http://localhost:8080'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  strictTransportSecurity: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// ==================== BODY PARSERS ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== CSRF TOKEN MIDDLEWARE ====================
const crypto = require('crypto');
const sessionStore = new Map(); // Simple session store for CSRF tokens

// Middleware to generate and validate CSRF tokens
const csrfMiddleware = (req, res, next) => {
  // Generate CSRF token for GET requests to forms
  if (req.method === 'GET') {
    const sessionId = req.sessionID || req.get('x-session-id') || crypto.randomBytes(16).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    sessionStore.set(sessionId, csrfToken);
    res.set('x-csrf-token', csrfToken);
    res.set('x-session-id', sessionId);
    res.locals.csrfToken = csrfToken;
    res.locals.sessionId = sessionId;
  }
  
  // Validate CSRF token for POST/PUT/DELETE requests
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const sessionId = req.get('x-session-id') || req.body._sessionId;
    const csrfToken = req.get('x-csrf-token') || req.body._csrfToken;
    const storedToken = sessionStore.get(sessionId);
    
    if (!storedToken || csrfToken !== storedToken) {
      // Allow API requests with JWT tokens to bypass CSRF
      const authHeader = req.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'CSRF token validation failed' });
      }
    }
  }
  
  next();
};

app.use(csrfMiddleware);
app.use(express.static(path.join(__dirname)));

// ==================== VALIDATION HELPERS ====================
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { hasErrors: true, errors: errors.array() };
  }
  return { hasErrors: false };
};

// ==================== PUBLIC ROUTES ====================

// CSRF Token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({
    csrfToken: res.locals.csrfToken,
    sessionId: res.locals.sessionId,
  });
});

// Validate Email endpoint (check if already exists)
app.post('/api/validate/email', [
  body('email').isEmail().normalizeEmail(),
], (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ valid: false, error: 'Email invalide' });
  }

  const { email } = req.body;
  const userExists = db.findUserByEmail(email);

  res.json({
    valid: !userExists,
    message: userExists ? 'Email déjà utilisé' : 'Email disponible',
  });
});

// Home redirect
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/index.html'));
});

// Serve HTML pages from pages/ folder
app.get('/:file.html', (req, res, next) => {
  const filePath = path.join(__dirname, 'pages', `${req.params.file}.html`);
  try {
    res.sendFile(filePath);
  } catch (err) {
    next();
  }
});

// ==================== AUTHENTICATION API ====================

// POST /api/auth/register
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['tenant', 'owner']),
], (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { email, password, firstName, lastName, role, phone } = req.body;

  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }

  const newUser = db.createUser({
    email,
    password,
    firstName,
    lastName,
    role,
    phone: phone || '',
  });

  const token = auth.generateToken(newUser);

  res.status(201).json({
    message: 'Inscription réussie',
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    },
    token,
    redirectUrl: role === 'tenant' ? '/tenant.html' : '/owner.html',
  });
});

// POST /api/auth/login
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { email, password } = req.body;

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  if (!db.verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const token = auth.generateToken(user);

  res.json({
    message: 'Connexion réussie',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
    redirectUrl: user.role === 'tenant' ? '/tenant.html' : user.role === 'owner' ? '/owner.html' : '/admin.html',
  });
});

// ==================== PUBLIC API ====================

// GET /api/properties - Public list
app.get('/api/properties', (req, res) => {
  const properties = db.findProperties({
    status: 'available',
    city: req.query.city,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
  });

  res.json(properties);
});

// GET /api/properties/:id - Property details
app.get('/api/properties/:id', (req, res) => {
  const property = db.findPropertyById(parseInt(req.params.id));

  if (!property) {
    return res.status(404).json({ error: 'Propriété non trouvée' });
  }

  res.json(property);
});

// ==================== PROTECTED ROUTES ====================

// GET /api/me - Current user info
app.get('/api/me', auth.authenticate, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
});

// ==================== TENANT ROUTES ====================

// GET /api/tenant/rentals - My rentals
app.get('/api/tenant/rentals', auth.authenticate, auth.authorize('tenant'), (req, res) => {
  const rentals = db.findRentals({ tenantId: req.user.id });

  const enrichedRentals = rentals.map(rental => ({
    ...rental,
    property: db.findPropertyById(rental.propertyId),
    payments: db.findPayments({ rentalId: rental.id }),
  }));

  res.json(enrichedRentals);
});

// GET /api/tenant/payments - My payments
app.get('/api/tenant/payments', auth.authenticate, auth.authorize('tenant'), (req, res) => {
  const payments = db.findPayments({ userId: req.user.id });
  res.json(payments);
});

// ==================== OWNER ROUTES ====================

// GET /api/owner/properties - My properties
app.get('/api/owner/properties', auth.authenticate, auth.authorize('owner'), (req, res) => {
  const properties = db.findProperties({ ownerId: req.user.id });
  res.json(properties);
});

// POST /api/owner/properties - Create property
app.post('/api/owner/properties', auth.authenticate, auth.authorize('owner'), [
  body('title').notEmpty(),
  body('price').isNumeric(),
  body('city').notEmpty(),
], (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const property = db.createProperty({
    ownerId: req.user.id,
    ...req.body,
  });

  res.status(201).json(property);
});

// GET /api/owner/rentals - My rentals
app.get('/api/owner/rentals', auth.authenticate, auth.authorize('owner'), (req, res) => {
  const rentals = db.findRentals({ ownerId: req.user.id });

  const enrichedRentals = rentals.map(rental => ({
    ...rental,
    property: db.findPropertyById(rental.propertyId),
    tenant: db.findUserById(rental.tenantId),
  }));

  res.json(enrichedRentals);
});

// ==================== ADMIN ROUTES ====================

// GET /api/admin/stats - Platform stats
app.get('/api/admin/stats', auth.authenticate, auth.authorize('admin'), (req, res) => {
  const stats = db.getAllStats();
  res.json(stats);
});

// GET /api/admin/users - All users
app.get('/api/admin/users', auth.authenticate, auth.authorize('admin'), (req, res) => {
  res.json(db.users.map(u => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    verified: u.verified,
    createdAt: u.createdAt,
  })));
});

// ==================== PAYMENT API ====================

// POST /api/payments - Create payment intent
app.post('/api/payments', auth.authenticate, [
  body('amount').isNumeric(),
  body('method').isIn(['moov_money', 'mtn_money', 'wave', 'flooz']),
  body('rentalId').isNumeric(),
], (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { amount, method, rentalId } = req.body;
  const rental = db.findRentalById(parseInt(rentalId));

  if (!rental || (rental.tenantId !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const payment = db.recordPayment({
    rentalId,
    userId: req.user.id,
    amount,
    method,
    status: 'pending',
    transactionId: `TRX-${Date.now()}`,
  });

  res.status(201).json({
    paymentId: payment.id,
    status: 'pending',
    message: 'Paiement créé. Procéder au fournisseur de paiement.',
  });
});

// ==================== CATCH-ALL & 404 ====================
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ==================== START SERVER ====================
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🎯 RoomRover Production Server        ║
║   📍 http://localhost:${port}              ║
║   🔐 Security: Enabled                 ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
