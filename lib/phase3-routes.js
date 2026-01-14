/**
 * ✅ Phase 3 Payment Routes
 * Stripe + Flutterwave + 2FA + Admin Endpoints
 */

const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('./database');
const auth = require('./auth');
const stripeService = require('./stripe-service');
const flutterwaveService = require('./flutterwave-service');
const twoFactorService = require('./2fa-service');

const router = express.Router();

// ==================== MIDDLEWARE ====================

/**
 * Valider requête et retourner erreurs
 */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return {
      hasErrors: true,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    };
  }
  return { hasErrors: false };
};

/**
 * Middleware: Authentification requise
 */
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }

  try {
    const user = auth.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

/**
 * Middleware: Admin requis
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ==================== STRIPE ROUTES ====================

/**
 * POST /api/payments/stripe/create-intent
 * Créer une intention de paiement Stripe
 */
router.post('/payments/stripe/create-intent', requireAuth, [
  body('amount').isFloat({ min: 0.01 }),
  body('type').isIn(['deposit', 'rent', 'subscription']),
], async (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { amount, type, propertyId, rentalId } = req.body;
  const user = req.user;

  try {
    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      'eur',
      {
        userId: user.id,
        type,
        propertyId: propertyId || null,
        rentalId: rentalId || null,
      }
    );

    // Créer transaction en BD
    const transaction = db.createTransaction({
      userId: user.id,
      type,
      amount,
      provider: 'stripe',
      stripeIntentId: paymentIntent.id,
      status: 'pending',
      propertyId: propertyId || null,
      rentalId: rentalId || null,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
      transactionId: transaction.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/payments/stripe/confirm
 * Confirmer paiement Stripe
 */
router.post('/api/payments/stripe/confirm', requireAuth, async (req, res) => {
  const { intentId, transactionId } = req.body;

  try {
    const paymentIntent = await stripeService.confirmPayment(intentId);

    if (paymentIntent.status === 'succeeded') {
      db.updateTransaction(transactionId, { status: 'completed' });

      res.json({
        success: true,
        message: 'Paiement complété avec succès',
        transactionId,
      });
    } else {
      res.status(400).json({ error: 'Paiement échoué' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/payments/stripe/refund
 * Créer un remboursement
 */
router.post('/api/payments/stripe/refund', requireAuth, requireAdmin, async (req, res) => {
  const { transactionId, chargeId, amount } = req.body;

  try {
    const refund = await stripeService.createRefund(chargeId, amount);

    db.updateTransaction(transactionId, {
      status: 'refunded',
      refundId: refund.id,
    });

    res.json({
      success: true,
      refundId: refund.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== FLUTTERWAVE ROUTES ====================

/**
 * POST /api/payments/flutterwave/initiate
 * Initier paiement Flutterwave
 */
router.post('/api/payments/flutterwave/initiate', requireAuth, [
  body('amount').isFloat({ min: 100 }),
  body('type').isIn(['deposit', 'rent', 'subscription']),
], async (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { amount, type, propertyId } = req.body;
  const user = req.user;

  try {
    const response = await flutterwaveService.initiatePayment(
      amount,
      user.email,
      `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      `${type === 'deposit' ? 'Caution' : 'Paiement location'} - Propriété #${propertyId}`,
      {
        redirectUrl: `${process.env.APP_URL || 'http://localhost:8080'}/payment-callback`,
        type,
        propertyId: propertyId || null,
        phone: user.phone || '',
      }
    );

    // Créer transaction en BD
    const transaction = db.createTransaction({
      userId: user.id,
      type,
      amount,
      provider: 'flutterwave',
      transactionRef: response.data.link.split('=')[1],
      status: 'pending',
      propertyId: propertyId || null,
    });

    res.json({
      paymentUrl: response.data.link,
      transactionId: transaction.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/payments/flutterwave/verify
 * Vérifier paiement Flutterwave
 */
router.post('/api/payments/flutterwave/verify', async (req, res) => {
  const { transactionId, flwRef } = req.body;

  try {
    const response = await flutterwaveService.verifyPayment(flwRef);

    if (response.data.status === 'successful') {
      db.updateTransaction(transactionId, { status: 'completed' });

      res.json({
        success: true,
        message: 'Paiement vérifié avec succès',
      });
    } else {
      res.status(400).json({ error: 'Paiement échoué ou annulé' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/payments/flutterwave/methods
 * Obtenir moyens de paiement disponibles
 */
router.get('/api/payments/flutterwave/methods', (req, res) => {
  const methods = flutterwaveService.getPaymentMethods();
  res.json(methods);
});

// ==================== 2FA ROUTES ====================

/**
 * POST /api/auth/2fa/setup
 * Configurer 2FA pour admin
 */
router.post('/api/auth/2fa/setup', requireAuth, async (req, res) => {
  const user = req.user;

  // 2FA réservée aux admins
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé aux administrateurs' });
  }

  try {
    const { secret, otpauth_url, qr_code_url, backup_codes } = 
      twoFactorService.generateSecret(user.email);

    res.json({
      secret,
      qr_code_url,
      backup_codes,
      message: 'Scannez le QR code avec Google Authenticator',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/2fa/verify
 * Vérifier et activer 2FA
 */
router.post('/api/auth/2fa/verify', requireAuth, [
  body('secret').notEmpty(),
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  body('backupCodes').isArray({ min: 10 }),
], async (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { secret, token, backupCodes } = req.body;
  const user = req.user;

  try {
    const verified = twoFactorService.verifyToken(token, secret);

    if (!verified) {
      return res.status(400).json({ error: 'Code TOTP invalide' });
    }

    // Activer 2FA
    twoFactorService.enableTwoFactor(user.id, secret, backupCodes);

    res.json({
      success: true,
      message: '2FA activée avec succès',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/2fa/login
 * Login avec 2FA
 */
router.post('/api/auth/2fa/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req, res) => {
  const { email, password, token } = req.body;

  try {
    const user = db.findUserByEmail(email);

    if (!user || !auth.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    if (!twoFactorService.isTwoFactorEnabled(user.id)) {
      return res.status(400).json({ error: '2FA non activée pour ce compte' });
    }

    const verified = twoFactorService.verifyToken(token, twoFactorService.getSecret(user.id));

    if (!verified) {
      return res.status(400).json({ error: 'Code 2FA invalide' });
    }

    const jwtToken = auth.generateToken(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: jwtToken,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/2fa/backup-code
 * Login avec code de secours
 */
router.post('/api/auth/2fa/backup-code', [
  body('email').isEmail(),
  body('password').notEmpty(),
  body('backupCode').isLength({ min: 4 }),
], async (req, res) => {
  const { email, password, backupCode } = req.body;

  try {
    const user = db.findUserByEmail(email);

    if (!user || !auth.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const result = twoFactorService.useBackupCode(user.id, backupCode);

    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    const jwtToken = auth.generateToken(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token: jwtToken,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/auth/2fa/status
 * Obtenir statut 2FA utilisateur
 */
router.get('/api/auth/2fa/status', requireAuth, (req, res) => {
  const status = twoFactorService.getUserTwoFactorStatus(req.user.id);
  res.json(status);
});

/**
 * POST /api/auth/2fa/disable
 * Désactiver 2FA (admin seulement)
 */
router.post('/api/auth/2fa/disable', requireAuth, requireAdmin, [
  body('userId').notEmpty(),
  body('confirmPassword').notEmpty(),
], async (req, res) => {
  const { userId, confirmPassword } = req.body;

  try {
    // Vérifier mot de passe de l'admin
    const admin = db.getUserById(req.user.id);
    if (!admin || !auth.verifyPassword(confirmPassword, admin.password)) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    twoFactorService.disableTwoFactor(userId);

    res.json({ success: true, message: '2FA désactivée' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ADMIN API ROUTES ====================

/**
 * GET /api/admin/users
 * Obtenir tous les utilisateurs
 */
router.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  try {
    const users = db.getAllUsers();
    const filtered = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      status: u.status || 'active',
      createdAt: u.createdAt,
    }));

    res.json({ users: filtered });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:id/suspend
 * Suspendre un utilisateur
 */
router.post('/api/admin/users/:id/suspend', requireAuth, requireAdmin, (req, res) => {
  try {
    const userId = req.params.id;
    db.updateUser(userId, { status: 'suspended' });

    res.json({ success: true, message: `Utilisateur ${userId} suspendu` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:id/reactivate
 * Réactiver un utilisateur
 */
router.post('/api/admin/users/:id/reactivate', requireAuth, requireAdmin, (req, res) => {
  try {
    const userId = req.params.id;
    db.updateUser(userId, { status: 'active' });

    res.json({ success: true, message: `Utilisateur ${userId} réactivé` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/properties
 * Obtenir toutes les propriétés
 */
router.get('/api/admin/properties', requireAuth, requireAdmin, (req, res) => {
  try {
    const properties = db.getAllProperties();
    res.json({ properties });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/properties/:id/approve
 * Approuver une propriété
 */
router.put('/api/admin/properties/:id/approve', requireAuth, requireAdmin, (req, res) => {
  try {
    const propId = req.params.id;
    db.updateProperty(propId, { approved: true, status: 'approved' });

    res.json({ success: true, message: `Propriété ${propId} approuvée` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/properties/:id/reject
 * Rejeter une propriété
 */
router.put('/api/admin/properties/:id/reject', requireAuth, requireAdmin, [
  body('reason').optional(),
], (req, res) => {
  try {
    const propId = req.params.id;
    const { reason } = req.body;

    db.updateProperty(propId, {
      approved: false,
      status: 'rejected',
      rejectionReason: reason || '',
    });

    res.json({ success: true, message: `Propriété ${propId} rejetée` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/payments
 * Obtenir tous les paiements
 */
router.get('/api/admin/payments', requireAuth, requireAdmin, (req, res) => {
  try {
    const payments = db.getAllTransactions();
    res.json({ payments });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/logs
 * Obtenir les logs d'audit
 */
router.get('/api/admin/logs', requireAuth, requireAdmin, (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const logs = db.getAuditLogs({ limit });

    res.json({ logs, total: logs.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/stats
 * Obtenir statistiques globales
 */
router.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  try {
    const stats = {
      totalUsers: db.getAllUsers().length,
      totalProperties: db.getAllProperties().length,
      totalTransactions: db.getAllTransactions().length,
      totalRevenue: db.getAllTransactions()
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      activeRentals: db.getAllRentals()
        .filter(r => r.status === 'active').length,
    };

    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
