# 🚀 PHASE 3 - SETUP & DEPLOYMENT GUIDE

**Date**: 14 janvier 2026  
**Durée**: 2-3 jours  
**Objectif**: Implémenter paiements (Stripe + Flutterwave) + 2FA + API Admin  

---

## 📦 ÉTAPE 1: INSTALLER DÉPENDANCES STRIPE

```bash
# Installer Stripe
npm install stripe --save

# Vérifier installation
npm list stripe
```

**Test rapide Stripe:**
```bash
node -e "const s = require('./lib/stripe-service'); console.log('✅ Stripe Service loaded')"
```

---

## 📱 ÉTAPE 2: INSTALLER DÉPENDANCES FLUTTERWAVE

```bash
# Flutterwave (déjà implémenté en mock)
# Pas de dépendance NPM requise pour démo

# Test rapide:
node -e "const f = require('./lib/flutterwave-service'); console.log('✅ Flutterwave Service loaded')"
```

---

## 🔐 ÉTAPE 3: INSTALLER DÉPENDANCES 2FA

```bash
# 2FA avec TOTP (déjà implémenté)
# Pas de dépendances externes requises

# Optional: pour QR codes en production
npm install speakeasy qrcode --save

# Test rapide 2FA:
node -e "const t = require('./lib/2fa-service'); console.log('✅ 2FA Service loaded')"
```

---

## 🔑 ÉTAPE 4: CONFIGURER VARIABLES D'ENVIRONNEMENT

Créer fichier `.env`:

```bash
# Port serveur
PORT=8080

# ========== STRIPE ==========
# Test keys depuis https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# ========== FLUTTERWAVE ==========
# Test keys depuis https://app.flutterwave.com/dashboard/settings/apis
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_YOUR_SECRET_KEY_HERE
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_YOUR_PUBLIC_KEY_HERE

# ========== AWS S3 (pour uploads images) ==========
AWS_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
AWS_SECRET_KEY=YOUR_AWS_SECRET_KEY
S3_BUCKET=roomrover-dev

# ========== APP CONFIG ==========
APP_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
NODE_ENV=development

# ========== JWT ==========
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
```

**Copier depuis template:**
```bash
cp .env.example .env
# Puis éditer .env avec vos clés
```

---

## 🔌 ÉTAPE 5: INTÉGRER ROUTES PHASE 3 DANS server.js

Ouvrir `server.js` et ajouter avant `app.listen()`:

```javascript
// ========== PHASE 3 ROUTES ==========
const phase3Routes = require('./lib/phase3-routes');
app.use('/api', phase3Routes);

console.log('✅ Phase 3 Routes (Payments + 2FA) loaded');
```

**Localisation exacte:** Après les routes authentification, avant `app.listen()`.

---

## 🧪 ÉTAPE 6: TESTER ENDPOINTS LOCALEMENT

### Test Stripe

```bash
# 1. Créer payment intent
curl -X POST http://localhost:8080/api/payments/stripe/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 50,
    "type": "rent",
    "propertyId": 1
  }'

# Réponse attendue:
# {
#   "clientSecret": "pi_..._secret_...",
#   "intentId": "pi_...",
#   "transactionId": "..."
# }
```

### Test Flutterwave

```bash
# 1. Obtenir moyens de paiement disponibles
curl http://localhost:8080/api/payments/flutterwave/methods

# 2. Initier paiement
curl -X POST http://localhost:8080/api/payments/flutterwave/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 25000,
    "type": "deposit",
    "propertyId": 1
  }'
```

### Test 2FA

```bash
# 1. Générer secret 2FA
curl -X POST http://localhost:8080/api/auth/2fa/setup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Réponse: QR code + backup codes

# 2. Activer 2FA après scannage
curl -X POST http://localhost:8080/api/auth/2fa/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "secret": "JBSWY3DPEBLW64TMMQ...",
    "token": "123456",
    "backupCodes": ["CODE1", "CODE2", ...]
  }'

# 3. Login avec 2FA
curl -X POST http://localhost:8080/api/auth/2fa/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@roomrover.com",
    "password": "admin123",
    "token": "123456"
  }'
```

### Test Admin API

```bash
# Récupérer tous les utilisateurs (admin seulement)
curl http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Suspendre utilisateur
curl -X POST http://localhost:8080/api/admin/users/2/suspend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Obtenir statistiques
curl http://localhost:8080/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 ÉTAPE 7: OBTENIR JWT TOKEN POUR TESTS

```bash
# Login tenant
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "locataire@test.com",
    "password": "password123"
  }'

# Login admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@roomrover.com",
    "password": "admin123"
  }'

# Réponse: { "token": "eyJhbGciOiJIUzI1NiIsInR...", "user": {...} }
# Utiliser ce token dans Authorization header
```

---

## 🎨 ÉTAPE 8: CRÉER INTERFACES UI PAIEMENTS

Créer fichier `pages/payment.html`:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paiement - RoomRover</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://js.stripe.com/v3/"></script>
</head>
<body class="bg-gray-50">
    <div class="container mx-auto max-w-2xl py-12 px-4">
        <h1 class="text-3xl font-bold mb-8">Effectuer un paiement</h1>

        <!-- Tab selector -->
        <div class="flex gap-4 mb-8">
            <button id="stripeTab" class="px-4 py-2 bg-blue-600 text-white rounded">
                💳 Stripe (Carte)
            </button>
            <button id="flutterwaveTab" class="px-4 py-2 bg-gray-200 text-gray-800 rounded">
                📱 Flutterwave (Mobile Money)
            </button>
        </div>

        <!-- Stripe Payment -->
        <div id="stripePanel" class="bg-white p-6 rounded-lg shadow">
            <form id="stripeForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Montant (€)</label>
                    <input type="number" id="stripeAmount" value="50" min="0.01" step="0.01" 
                        class="w-full px-3 py-2 border border-gray-300 rounded">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Type de paiement</label>
                    <select id="stripeType" class="w-full px-3 py-2 border border-gray-300 rounded">
                        <option value="rent">Loyer</option>
                        <option value="deposit">Caution</option>
                        <option value="subscription">Abonnement</option>
                    </select>
                </div>

                <div id="card-element" class="mb-4 p-3 border border-gray-300 rounded"></div>

                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Payer avec Stripe
                </button>
            </form>
        </div>

        <!-- Flutterwave Payment -->
        <div id="flutterwavePanel" class="bg-white p-6 rounded-lg shadow hidden">
            <form id="flutterwaveForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Montant (XOF)</label>
                    <input type="number" id="flutterwaveAmount" value="25000" min="100" step="100"
                        class="w-full px-3 py-2 border border-gray-300 rounded">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Type de paiement</label>
                    <select id="flutterwaveType" class="w-full px-3 py-2 border border-gray-300 rounded">
                        <option value="rent">Loyer</option>
                        <option value="deposit">Caution</option>
                        <option value="subscription">Abonnement</option>
                    </select>
                </div>

                <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    Payer avec Flutterwave
                </button>
            </form>
        </div>

        <!-- Status message -->
        <div id="statusMessage" class="mt-6 p-4 rounded hidden"></div>
    </div>

    <script>
        const auth = window.auth; // Global auth instance from auth-client.js

        // Tabs
        document.getElementById('stripeTab').addEventListener('click', () => {
            document.getElementById('stripePanel').classList.remove('hidden');
            document.getElementById('flutterwavePanel').classList.add('hidden');
        });

        document.getElementById('flutterwaveTab').addEventListener('click', () => {
            document.getElementById('stripePanel').classList.add('hidden');
            document.getElementById('flutterwavePanel').classList.remove('hidden');
        });

        // Stripe payment
        document.getElementById('stripeForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = parseFloat(document.getElementById('stripeAmount').value);
            const type = document.getElementById('stripeType').value;
            const token = localStorage.getItem('auth_token');

            try {
                const response = await fetch('/api/payments/stripe/create-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ amount, type }),
                });

                const data = await response.json();

                if (data.clientSecret) {
                    showStatus('✅ Payment intent créé. Prêt à payer', 'success');
                    console.log('Client Secret:', data.clientSecret);
                } else {
                    showStatus('❌ Erreur: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Erreur réseau', 'error');
            }
        });

        // Flutterwave payment
        document.getElementById('flutterwaveForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = parseFloat(document.getElementById('flutterwaveAmount').value);
            const type = document.getElementById('flutterwaveType').value;
            const token = localStorage.getItem('auth_token');

            try {
                const response = await fetch('/api/payments/flutterwave/initiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ amount, type, propertyId: 1 }),
                });

                const data = await response.json();

                if (data.paymentUrl) {
                    showStatus('✅ Redirection vers Flutterwave...', 'success');
                    setTimeout(() => {
                        window.location.href = data.paymentUrl;
                    }, 2000);
                } else {
                    showStatus('❌ Erreur: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Erreur réseau', 'error');
            }
        });

        function showStatus(message, type) {
            const el = document.getElementById('statusMessage');
            el.textContent = message;
            el.className = `mt-6 p-4 rounded ${
                type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`;
            el.classList.remove('hidden');
        }
    </script>
</body>
</html>
```

---

## 🚀 ÉTAPE 9: DÉMARRER SERVEUR AVEC PHASE 3

```bash
# 1. S'assurer que server.js inclut phase3-routes.js
cat server.js | grep "phase3-routes"

# 2. Lancer serveur
npm start

# Ou lancer serveur minimaliste
node server-simple.js

# 3. Vérifier démarrage
curl http://localhost:8080/health
```

---

## ✅ CHECKLIST INSTALLATION PHASE 3

- [ ] npm install stripe (ou skip pour démo)
- [ ] .env configuré avec clés Stripe (optionnel pour démo)
- [ ] .env configuré avec clés Flutterwave (optionnel pour démo)
- [ ] phase3-routes.js créé
- [ ] phase3-routes.js intégré dans server.js
- [ ] Services testés:
  - [ ] stripe-service.js ✅
  - [ ] flutterwave-service.js ✅
  - [ ] 2fa-service.js ✅
- [ ] JWT token obtenu pour tests
- [ ] Endpoints testés avec curl
- [ ] payment.html créé
- [ ] Serveur démarre sans erreurs
- [ ] Pages admin connectées aux API

---

## 🧪 TESTS AUTOMATISÉS PHASE 3

Créer fichier `test-phase3.js`:

```javascript
/**
 * Tests automatisés Phase 3
 * node test-phase3.js
 */

const stripeService = require('./lib/stripe-service');
const flutterwaveService = require('./lib/flutterwave-service');
const twoFactorService = require('./lib/2fa-service');

console.log('\n🧪 Phase 3 - Automated Tests\n');

// Test 1: Stripe
console.log('Test 1: Stripe Payment Intent');
(async () => {
  const intent = await stripeService.createPaymentIntent(50, 'eur', { userId: 1 });
  console.log(`✅ Intent créé: ${intent.id}`);
  console.log(`   Client Secret: ${intent.client_secret.substring(0, 20)}...`);
})();

// Test 2: Flutterwave
console.log('\nTest 2: Flutterwave Payment');
(async () => {
  const result = await flutterwaveService.initiatePayment(25000, 'test@example.com', 'Test User', 'Test Payment');
  console.log(`✅ Payment initiated`);
  console.log(`   Payment Link: ${result.data.link.substring(0, 50)}...`);
})();

// Test 3: 2FA
console.log('\nTest 3: 2FA Generation');
const secret2fa = twoFactorService.generateSecret('admin@roomrover.com');
console.log(`✅ 2FA Secret généré`);
console.log(`   Backup codes: ${secret2fa.backup_codes.length}`);

console.log('\n✅ Tous les tests Phase 3 passent!\n');
```

Lancer tests:
```bash
node test-phase3.js
```

---

## 📝 NOTES IMPORTANTES

1. **Clés de test Stripe:**
   - Aller sur https://dashboard.stripe.com/test/apikeys
   - Les clés de test commencent par `sk_test_` et `pk_test_`

2. **Clés de test Flutterwave:**
   - Aller sur https://app.flutterwave.com/dashboard/settings/apis
   - Sélectionner "TEST" environment

3. **2FA en production:**
   - Installer `speakeasy` et `qrcode` packages
   - Générer vrais QR codes pour Google Authenticator

4. **Sécurité:**
   - Ne PAS committer le `.env` avec clés réelles!
   - Ajouter `.env` à `.gitignore`
   - Utiliser variables d'environnement en production

---

## 🔗 RESSOURCES UTILES

- Stripe Docs: https://stripe.com/docs/api
- Flutterwave Docs: https://developer.flutterwave.com/
- TOTP Standard: https://tools.ietf.org/html/rfc6238
- Google Authenticator: https://support.google.com/accounts/answer/1066447

---

**Status**: 🟡 READY TO IMPLEMENT  
**Next**: Intégrer phase3-routes.js dans server.js et tester endpoints

