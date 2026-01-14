---
# RoomRover — Exécution locale & développement

Ce dépôt contient une version statique du site RoomRover ainsi que des fichiers d'aide
pour le lancer en local sur Windows (PowerShell). Ce guide couvre l'exécution locale,
le serveur de développement, une mock API et des étapes pour tester le Service Worker (PWA).

---

## Prérequis 🔧
- Node.js et npm (https://nodejs.org/)
- (Optionnel) Python 3 pour lancer un serveur statique rapidement
- VS Code (recommandé)

## Contenu utile du dépôt 🔎
- `index.html`, `style.css`, `script.js` — site statique
- `components/` — web components (navbar, footer, etc.)
- `sw.js` — service worker (PWA)
- `manifest.json` — manifeste PWA
- `db.json` — données mock pour l'API
- `server.js` — serveur Express minimal pour dev local
- `package.json` — scripts et dépendances
- `run-local.ps1` — helper PowerShell pour démarrer le projet

## Démarrer le serveur Node (recommandé)
1. Ouvre PowerShell dans le dossier du projet :
   cd "c:\Users\KPATENON Amour\Downloads\DevAmour-roomrover-your-smart-room-rental-companion"
2. Installe les dépendances si nécessaire :
   npm install
3. Démarre le serveur :
   npm start
4. Ouvre `http://localhost:8080` dans ton navigateur.

L'endpoint mock est disponible : `GET http://localhost:8080/api/properties` — il renvoie le contenu de `db.json`.

## Lancer rapidement un serveur statique (option Python)
1. Ouvre PowerShell dans le dossier du projet.
2. Lancer : `py -3 -m http.server 8080`
3. Ouvre `http://localhost:8080`.

> Remarque : pour que le Service Worker s'enregistre correctement, le site doit être servi via HTTP(S). Le serveur Python ou le serveur Node conviennent.

## Script d'aide PowerShell
- `run-local.ps1` : aide pour démarrer en `node` (serveur Express) ou `python` (serveur statique).
  - Exemple : `.
un-local.ps1 node`

## Tester l'API mock 🔁
- Vérifie le endpoint dans ton navigateur ou via curl/PowerShell :
  - PowerShell : `Invoke-RestMethod http://localhost:8080/api/properties`
   - Script de test inclus : `.\test-api.ps1` (exécute `Invoke-RestMethod` et affiche le JSON)
   - Avec curl : `curl http://localhost:8080/api/properties`

## Tester le Service Worker et le PWA 🔍
1. Ouvre DevTools (F12) → **Application** → **Service Workers**.
2. Recharge la page, vérifie que le SW est installé et actif.
3. Pour tester hors-ligne : dans l'onglet Network coche `Offline` et recharge la page.
4. Si le SW ne s'installe pas : vérifie la console pour des erreurs (404, chemin incorrect), supprime le SW et recharge.

## Dépannage rapide ⚠️
- 404 sur ressources : vérifier chemins relatifs (depuis la racine du projet)
- Service Worker : vider le cache, unregister, recharger
- Formulaires qui n'envoient rien : vérifier si un backend est attendu

---

Si tu veux, je peux :
- ajouter une route POST d'exemple pour enregistrer une réservation
- créer une petite collection `db.json` plus complète
- ajouter des tests ou un script d'import SQL pour `database/roomrover.sql`

## Corrections et pages ajoutées ✅
   - Owner: `add-property.html`, `owner-properties.html`, `edit-property.html`, `owner-tenants.html`, `owner-payments.html`, `owner-reports.html`, `owner-premium.html`, `owner-settings.html`
   - Tenant: `tenant-rental.html`, `tenant-payments.html`, `tenant-documents.html`, `tenant-messages.html`, `tenant-settings.html`
   - Admin: `admin-activity.html`, `admin-users.html`, `admin-properties.html`, `admin-rentals.html`, `admin-payments.html`, `admin-reports.html`, `admin-settings.html`
   - Utilitaires: `receipt.html`, `documents.html`, `terms.html`, `cookies.html`, `privacy.html`, `logout.html`

### Refactor: code propriétaire centralisé
- Créé `components/owner.js` pour rassembler les interactions et initialisations communes aux pages "owner" (envoi de rappel, envoi de lien de paiement simulé, initialisation des icônes Feather, etc.).
- Les pages `owner-*.html` incluent maintenant `components/owner.js` et n'ont plus de scripts inline redondants.

Ces pages sont des stubs avec UI prête à être connectée à une API et rendent tous les boutons et liens principaux fonctionnels pour la navigation locale.

Dis‑moi ce que tu veux faire ensuite et j'agirai en conséquence.
 
## Nouvelle fonctionnalité : Recherche de chambres 🔎
- J'ai ajouté une page `search.html` accessible depuis le tableau de bord locataire (bouton "Rechercher une chambre").
- La page interroge l'endpoint `GET /api/properties` et permet de filtrer par titre, ville ou prix.

## Correction : redirection après inscription ✅
- Lorsqu'un **propriétaire** crée son compte via la page `register.html`, il est maintenant redirigé automatiquement vers **`owner-dashboard.html`**.
- Lorsqu'un **locataire** crée son compte, il est redirigé vers **`tenant-dashboard.html`**.
