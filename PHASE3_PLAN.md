# 🚀 PHASE 3: IMPLÉMENTATION PAIEMENTS + 2FA + API

**Date**: 14 janvier 2026  
**Objectif**: Livrer Stripe + Flutterwave + 2FA + API endpoints  
**Durée estimée**: 2-3 jours  
**Status**: 🟡 À DÉMARRER

---

## 📋 TÂCHES PHASE 3

### 1️⃣ STRIPE INTEGRATION (Jour 1)

#### Setup
```bash
npm install stripe
```

#### Créer fichier: `lib/stripe-service.js`
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  // Créer payment intent
  createPaymentIntent: async (amount, currency = 'eur', metadata = {}) => {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency,
      metadata,
      description: metadata.description || 'RoomRover Payment',
    });
    return intent;
  },

  // Récupérer payment intent
  getPaymentIntent: async (intentId) => {
    return await stripe.paymentIntents.retrieve(intentId);
  },

  // Confirmer paiement
  confirmPayment: async (intentId, paymentMethod) => {
    return await stripe.paymentIntents.confirm(intentId, {
      payment_method: paymentMethod,
    });
  },

  // Créer customer
  createCustomer: async (email, name) => {
    return await stripe.customers.create({
      email,
      name,
    });
  },

  // Créer subscription
  createSubscription: async (customerId, priceId) => {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  },
};
```

#### Endpoints à ajouter dans server.js:

```javascript
// POST /api/payments/create-intent
app.post('/api/payments/create-intent', requireAuth, [
  body('amount').isFloat({ min: 0.01 }),
  body('type').isIn(['deposit', 'rent', 'subscription']),
], async (req, res) => {
  const { amount, type, propertyId, rentalId } = req.body;
  const user = req.user;

  try {
    const intent = await stripeService.createPaymentIntent(
      amount,
      'eur',
      {
        userId: user.id,
        type,
        propertyId: propertyId || null,
        rentalId: rentalId || null,
      }
    );

    // Sauvegarder transaction en BD
    const transaction = db.createTransaction({
      userId: user.id,
      type,
      amount,
      stripeIntentId: intent.id,
      status: 'pending',
    });

    res.json({
      clientSecret: intent.client_secret,
      transactionId: transaction.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/payments/confirm
app.post('/api/payments/confirm', requireAuth, async (req, res) => {
  const { intentId, transactionId } = req.body;

  try {
    const intent = await stripeService.getPaymentIntent(intentId);

    if (intent.status === 'succeeded') {
      // Mise à jour BD
      db.updateTransaction(transactionId, { status: 'completed' });

      res.json({
        success: true,
        message: 'Paiement complété',
        transactionId,
      });
    } else {
      res.status(400).json({ error: 'Paiement échoué' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /webhooks/stripe
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === 'payment_intent.succeeded') {
      const { id, amount, metadata } = event.data.object;
      db.updateTransaction(metadata.transactionId, {
        status: 'completed',
        stripeIntentId: id,
      });
    }

    res.json({received: true});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

---

### 2️⃣ FLUTTERWAVE INTEGRATION (Jour 1)

#### Setup
```bash
npm install flutterwave-node-v3
```

#### Créer fichier: `lib/flutterwave-service.js`
```javascript
const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

module.exports = {
  // Créer paiement
  initiatePayment: async (amount, email, name, description) => {
    const payload = {
      tx_ref: `RR-${Date.now()}`,
      amount,
      currency: 'XOF', // Franc CFA (Bénin)
      redirect_url: `${process.env.APP_URL}/payment-callback`,
      meta: {
        consumer_id: name,
        consumer_mac: email,
      },
      customer: {
        email,
        phonenumber: '',
        name,
      },
      customizations: {
        title: 'RoomRover Payment',
        description,
        logo: `${process.env.APP_URL}/logo.png`,
      },
    };

    const response = await flw.Payment.initiate(payload);
    return response;
  },

  // Vérifier paiement
  verifyPayment: async (transactionId) => {
    const response = await flw.Transaction.verify({
      id: transactionId,
    });
    return response;
  },

  // Transfert (remboursement)
  initiateTransfer: async (amount, accountBank, accountNumber, currency = 'XOF') => {
    const payload = {
      account_bank: accountBank,
      account_number: accountNumber,
      amount,
      narration: 'RoomRover Refund',
      currency,
      reference: `REF-${Date.now()}`,
    };

    const response = await flw.Transfer.initiate(payload);
    return response;
  },
};
```

#### Endpoints à ajouter:

```javascript
// POST /api/payments/flutterwave/initiate
app.post('/api/payments/flutterwave/initiate', requireAuth, async (req, res) => {
  const { amount, type, propertyId } = req.body;
  const user = req.user;

  try {
    const response = await flutterwaveService.initiatePayment(
      amount,
      user.email,
      `${user.firstName} ${user.lastName}`,
      `${type === 'deposit' ? 'Caution' : 'Paiement location'} - Propriété #${propertyId}`
    );

    // Sauvegarder transaction
    const transaction = db.createTransaction({
      userId: user.id,
      type,
      amount,
      provider: 'flutterwave',
      transactionRef: response.data.link.split('=')[1],
      status: 'pending',
    });

    res.json({
      paymentUrl: response.data.link,
      transactionId: transaction.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/payments/flutterwave/verify
app.post('/api/payments/flutterwave/verify', async (req, res) => {
  const { transactionId, flwRef } = req.body;

  try {
    const response = await flutterwaveService.verifyPayment(flwRef);

    if (response.data.status === 'successful') {
      db.updateTransaction(transactionId, { status: 'completed' });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Paiement échoué' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

### 3️⃣ ADMIN 2FA - GOOGLE AUTHENTICATOR (Jour 1-2)

#### Setup
```bash
npm install speakeasy qrcode
```

#### Créer fichier: `lib/2fa-service.js`
```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

module.exports = {
  // Générer secret
  generateSecret: async (email, appName = 'RoomRover') => {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${email})`,
      length: 32,
    });

    // Générer QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes: generateBackupCodes(),
    };
  },

  // Vérifier token TOTP
  verifyToken: (token, secret) => {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });
    return verified;
  },

  // Générer codes de secours
  generateBackupCodes: () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  },
};

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}
```

#### Endpoints 2FA:

```javascript
// POST /api/auth/2fa/setup
app.post('/api/auth/2fa/setup', requireAuth, async (req, res) => {
  const user = req.user;

  // 2FA réservée aux admins
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé aux administrateurs' });
  }

  try {
    const { secret, qrCode, backupCodes } = await twoFaService.generateSecret(user.email);

    // Pas encore sauvegardé, juste envoyé au client
    res.json({
      qrCode,
      secret,
      backupCodes,
      message: 'Scannez le QR code avec Google Authenticator',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/2fa/verify
app.post('/api/auth/2fa/verify', requireAuth, [
  body('secret').notEmpty(),
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  body('backupCodes').isArray(),
], async (req, res) => {
  const validation = handleValidation(req, res);
  if (validation.hasErrors) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { secret, token, backupCodes } = req.body;
  const user = req.user;

  try {
    const verified = twoFaService.verifyToken(token, secret);

    if (!verified) {
      return res.status(400).json({ error: 'Code invalide' });
    }

    // Sauvegarder 2FA pour l'utilisateur
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes;
    user.twoFactorEnabled = true;

    res.json({
      success: true,
      message: '2FA activée avec succès',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/2fa/login
app.post('/api/auth/2fa/login', [
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

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA non activée' });
    }

    const verified = twoFaService.verifyToken(token, user.twoFactorSecret);

    if (!verified) {
      return res.status(400).json({ error: 'Code 2FA invalide' });
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
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

### 4️⃣ API ENDPOINTS ADMIN (Jour 2)

```javascript
// GET /api/admin/users
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  const users = db.getAllUsers();
  res.json({ users });
});

// GET /api/admin/properties
app.get('/api/admin/properties', requireAuth, requireAdmin, (req, res) => {
  const properties = db.getAllProperties();
  res.json({ properties });
});

// GET /api/admin/payments
app.get('/api/admin/payments', requireAuth, requireAdmin, (req, res) => {
  const payments = db.getAllTransactions();
  res.json({ payments });
});

// GET /api/admin/logs
app.get('/api/admin/logs', requireAuth, requireAdmin, (req, res) => {
  const logs = db.getAuditLogs({ limit: 100 });
  res.json({ logs });
});

// POST /api/admin/users/:id/suspend
app.post('/api/admin/users/:id/suspend', requireAuth, requireAdmin, (req, res) => {
  const userId = req.params.id;
  db.updateUser(userId, { status: 'suspended' });
  res.json({ success: true });
});

// PUT /api/admin/properties/:id/approve
app.put('/api/admin/properties/:id/approve', requireAuth, requireAdmin, (req, res) => {
  const propId = req.params.id;
  db.updateProperty(propId, { approved: true });
  res.json({ success: true });
});
```

---

### 5️⃣ UPLOAD IMAGES (Jour 2)

#### Setup AWS S3 ou Cloudflare R2
```bash
npm install aws-sdk multer
# OU
npm install @aws-sdk/client-s3 multer
```

#### Créer fichier: `lib/upload-service.js`
```javascript
const S3 = require('aws-sdk/clients/s3');
const multer = require('multer');

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

module.exports = {
  uploadImage: async (file) => {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `properties/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  },

  deleteImage: async (fileKey) => {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
    }).promise();
  },
};
```

#### Endpoint upload:
```javascript
// POST /api/upload/property-image
app.post('/api/upload/property-image', requireAuth, multer().single('image'), async (req, res) => {
  try {
    const imageUrl = await uploadService.uploadImage(req.file);
    res.json({ url: imageUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## 📊 PHASES DÉPENDANCES

```
Phase 3A (Jour 1): 
  ✓ Stripe
  ✓ Flutterwave  
  ✓ 2FA Setup

Phase 3B (Jour 2):
  ✓ API Endpoints Admin
  ✓ Upload Images
  ✓ Integration tests

Phase 3C (Jour 3):
  ✓ E2E tests complets
  ✓ Validation finale
  ✓ Prêt Phase 4
```

---

## 🔑 VARIABLES D'ENVIRONNEMENT REQUISES

Créer `.env`:
```
PORT=8080
STRIPE_SECRET_KEY=sk_test_xxxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx

FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_xxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx

AWS_ACCESS_KEY=xxxxx
AWS_SECRET_KEY=xxxxx
S3_BUCKET=roomrover-dev

APP_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
```

---

## ✅ CHECKLIST PHASE 3

- [ ] Stripe endpoints créés et testés
- [ ] Flutterwave endpoints créés et testés
- [ ] 2FA admin implémenté et testé
- [ ] API admin endpoints connectés aux pages
- [ ] Upload images fonctionnel
- [ ] E2E tests Pass 90%+
- [ ] Déploiement Staging
- [ ] Sécurité audit (PCI DSS)
- [ ] Monitoring actif
- [ ] Prêt Phase 4

---

**Temps total estimé**: 40 heures (3 jours dev complet)  
**Prochaine date limite**: 17 janvier 2026  
**Livrables**: Tous les endpoints + tests + monitoring

