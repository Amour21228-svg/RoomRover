# 🚀 GUIDE DÉMARRAGE RAPIDE - RoomRover

## ⚡ Démarrage EN 5 MINUTES

### Option 1: Serveur Simple (RECOMMANDÉ pour tests)
```bash
cd "c:\Users\KPATENON Amour\Downloads\DevAmour-roomrover-your-smart-room-rental-companion"
node server-simple.js
```

Puis ouvrir: http://localhost:8080

**Avantage**: Pas de dépendances npm, charge immédiatement  
**Limitation**: API mock uniquement (GET /api/properties)

### Option 2: Serveur Complet (Production)
```bash
npm install
npm start
```

Puis ouvrir: http://localhost:8080

---

## 🧪 TESTS AUTOMATISÉS

Ouvrir dans le navigateur: http://localhost:8080/test-e2e-manual.html

Vérife:
- ✅ 15+ pages se chargent
- ✅ API /api/properties fonctionne
- ✅ Tous les composants chargent

---

## 📖 PARCOURS À TESTER MANUELLEMENT

### 1️⃣ Accueil Public
- [ ] Ouvrir http://localhost:8080
- [ ] Cliquer "[Se connecter]"
- [ ] Cliquer "[Créer un compte]"
- [ ] Voir navbar + footer

### 2️⃣ Inscription
- [ ] Remplir: Prénom, Nom, Email, Mot de passe
- [ ] Cocher "J'accepte les conditions"
- [ ] Cliquer "S'inscrire"
- [ ] Devrait rediriger vers dashboard

### 3️⃣ Connexion
- [ ] Email: `locataire@test.com` / Password: `password123`
- [ ] Ou Email: `proprietaire@test.com` / Password: `password123`
- [ ] Ou Email: `admin@roomrover.com` / Password: `admin123`

### 4️⃣ Dashboard Propriétaire
- [ ] Vérifier les stats affichent
- [ ] Cliquer "Ajouter une propriété"
- [ ] Remplir le formulaire
- [ ] Cliquer "Enregistrer"

### 5️⃣ Dashboard Locataire
- [ ] Voir "Ma location actuelle"
- [ ] Cliquer "Rechercher une chambre"
- [ ] Voir liste propriétés depuis API

### 6️⃣ Admin Dashboard
- [ ] Stats globales
- [ ] Navigation tabs (Activité, Utilisateurs, etc.)

---

## 🔍 VÉRIFICATIONS CRITIQUES

### Navigation
```
✅ Pages racine: /admin.html, /owner.html, /tenant.html
✅ Pages publiques: /pages/index.html, /pages/login.html, /pages/register.html
✅ Sous-pages: /pages/about.html, /pages/contact.html, /pages/properties.html
✅ Admin pages: /pages/admin-users.html, /pages/admin-payments.html, etc.
✅ Formulaires: /pages/add-property.html, /pages/edit-property.html
```

### API Endpoints
```
GET  /api/properties          → Liste chambres disponibles
GET  /api/properties/:id      → Détail chambre
POST /api/auth/login          → ⚠️ Nécessite Express complet
POST /api/auth/register       → ⚠️ Nécessite Express complet
POST /api/owner/properties    → ⚠️ Nécessite Express complet
```

---

## ❌ PROBLÈMES CONNUS

### 1. npm install échoue
```
Symptôme: npm ERR! code 1
Solution: Utiliser node server-simple.js à la place
```

### 2. Chemins cassés (404)
```
Symptôme: Ressources non trouvées
Status: ✅ FIXÉ - Chemins dynamiques implémentés
```

### 3. Authentification ne marche pas
```
Symptôme: Login échoue
Cause: Express n'a pas démarré correctement
Action: npm start ET attendre 3s
Test: POST http://localhost:8080/api/auth/login
```

### 4. Styles Tailwind manquants
```
Symptôme: Design cassé
Cause: Généralement normal en DEV
Solution: F12 → Console → Vérifier erreurs
```

---

## 📝 COMPTES TEST

| Role | Email | Password | Route |
|------|-------|----------|-------|
| Tenant | locataire@test.com | password123 | /tenant.html |
| Owner | proprietaire@test.com | password123 | /owner.html |
| Admin | admin@roomrover.com | admin123 | /admin.html |

---

## 📂 STRUCTURE FICHIERS

```
RoomRover/
├── pages/              ← Pages publiques
│   ├── index.html      ← Accueil
│   ├── login.html      ← Connexion
│   ├── register.html   ← Inscription
│   ├── properties.html ← Liste public
│   ├── about.html      ← À propos
│   ├── contact.html    ← Contact
│   ├── add-property.html
│   ├── edit-property.html
│   ├── documents.html
│   ├── receipt.html
│   ├── admin-*.html    ← Admin pages
│   └── terms.html, privacy.html, cookies.html
├── admin.html          ← Dashboard admin
├── owner.html          ← Dashboard propriétaire
├── tenant.html         ← Dashboard locataire
├── components/         ← Web components
├── js/                 ← Auth client & protection
├── lib/                ← Backend libs
├── style.css           ← Styles globaux
├── script.js           ← Utils globaux
├── server.js           ← Express complet (production)
├── server-simple.js    ← Serveur minimaliste (tests)
└── test-e2e-manual.html ← Tests auto
```

---

## 🎯 CHECKLIST AVANT PRODUCTION

- [ ] npm install réussit
- [ ] npm start lance le serveur
- [ ] Toutes les pages se chargent
- [ ] Authentification marche (login/register/logout)
- [ ] Paiements intégrés (Stripe/Flutterwave)
- [ ] 2FA admin fonctionnel
- [ ] DB PostgreSQL connectée
- [ ] Audit logs activés
- [ ] HTTPS forcé
- [ ] Monitoring actif
- [ ] Backups testés

---

## 📞 BESOIN D'AIDE?

1. **Tests E2E** → http://localhost:8080/test-e2e-manual.html
2. **Rapport complet** → Voir `RAPPORT_FINALISATION.md`
3. **Console navigateur** → F12 → Console pour erreurs
4. **Logs serveur** → Terminal où `npm start` tourne

---

**Dernière mise à jour**: 14 janvier 2026  
**Status**: ✅ Prêt pour tests  
**Prochaine phase**: Intégration paiements + DB PostgreSQL
