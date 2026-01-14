# QA Visual Checklist — RoomRover (local)

Suivez ces étapes pour vérifier l'apparence et les interactions de l'application localement.

1. Démarrage
   - Lancer le serveur : `npm start` (ou `node server.js`).
   - Ouvrir `http://localhost:8080`.

2. Barre de navigation (desktop + mobile)
   - L'ordre : RoomRover (logo) — Accueil — Propriétés — À propos — Contact — Connexion (bouton à droite).
   - Survol des liens : couleur primaire foncée et léger fond.
   - Sur mobile : menu hamburger ouvre/ferme correctement.

3. Hero & Espacements
   - Titre et sous-texte centrés, espacement vertical correct (pas de chevauchement).
   - Boutons `Se connecter` / `Créer un compte` alignés et espacés.

4. Témoignages
   - Deux cartes visibles (Marie D., Thomas L.), texte lisible et spacing uniforme.

5. Pied de page
   - Sections : RoomRover | Liens rapides | Legal | Contact.
   - Liens `mailto:` et `tel:` fonctionnels.
   - Pas de badge DeepSite visible.

6. Pages importantes
   - `properties.html` : affichage des cartes, actions visibles.
   - `search.html` : recherche renvoie des résultats.
   - `register.html` : sélection rôle redirige vers le tableau de bord correspondant (owner/tenant).

7. Interactions & Accessibilité rapide
   - Dark mode fonctionne et est persisté (`localStorage`).
   - Aucun élément non-stylé ou collision d'éléments (ex. nav ou footer en colonne à gauche).

8. Console & réseau
   - Ouvrir DevTools : pas d'erreurs JS critiques.
   - Vérifier /api/properties retourne JSON (GET http://localhost:8080/api/properties).

Notes:
- Si un point échoue, prendre une capture d'écran et noter le nom de la page + étape qui a échoué.
- Me l'envoyer et je corrige l'élément spécifique rapidement.

Bonne vérification ! ✅
