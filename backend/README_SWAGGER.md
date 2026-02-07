# Documentation API FaithConnect avec Swagger

## 📖 Accès à la documentation

Une fois le serveur démarré, vous pouvez accéder à la documentation interactive de l'API à l'adresse :

```
http://localhost:3000/api-docs
```

## 🚀 Fonctionnalités de la documentation

### Interface Swagger UI
- **Documentation interactive** : Testez directement les endpoints depuis votre navigateur
- **Authentification intégrée** : Configurez facilement les tokens JWT
- **Exemples de requêtes/réponses** : Comprendre le format des données attendues
- **Validation des schémas** : Voir la structure des objets JSON

### Routes documentées

#### Authentification (`/api/auth`)
- `POST /login` - Connexion
- `POST /register` - Inscription  
- `GET /verify` - Vérification du token
- `POST /logout` - Déconnexion
- `POST /change-password` - Changement de mot de passe

#### Utilisateurs (`/api/users`)
- `GET /` - Liste des utilisateurs (admin/super admin)
- `GET /:id` - Détails d'un utilisateur
- `POST /` - Création d'un utilisateur (admin/super admin)
- `PUT /:id` - Mise à jour d'un utilisateur
- `DELETE /:id` - Désactivation d'un utilisateur
- `POST /:id/activate` - Activation d'un utilisateur
- `GET /profile/me` - Profil de l'utilisateur connecté

#### Organisations (`/api/organizations`)
- `GET /` - Liste des organisations
- `GET /:id` - Détails d'une organisation
- `POST /` - Création d'une organisation (super admin)
- `PUT /:id` - Mise à jour d'une organisation
- `DELETE /:id` - Désactivation d'une organisation
- `GET /:id/members` - Membres d'une organisation

#### Événements (`/api/events`)
- `GET /` - Liste des événements
- `GET /:id` - Détails d'un événement
- `POST /` - Création d'un événement (admin/super admin)
- `PUT /:id` - Mise à jour d'un événement
- `DELETE /:id` - Suppression d'un événement
- `POST /:id/register` - Inscription à un événement
- `DELETE /:id/register` - Désinscription d'un événement
- `PUT /:id/participants/:userId/status` - Mise à jour du statut de participation

#### Contributions (`/api/contributions`)
- `GET /` - Liste des contributions
- `GET /:id` - Détails d'une contribution
- `POST /` - Enregistrement d'une contribution (admin/super admin)
- `PUT /:id` - Mise à jour d'une contribution
- `DELETE /:id` - Suppression d'une contribution
- `POST /:id/verify` - Vérification d'une contribution
- `GET /statistics` - Statistiques des contributions

#### Rapports (`/api/reports`)
- `GET /dashboard` - Tableau de bord principal
- `GET /members` - Rapport des membres
- `GET /events` - Rapport des événements
- `GET /financial` - Rapport financier
- `GET /export` - Export de données

## 🔐 Configuration de l'authentification dans Swagger

1. Cliquez sur le bouton **"Authorize"** en haut à droite
2. Dans le champ "Bearer token", entrez votre JWT token obtenu via `/api/auth/login`
3. Cliquez sur **"Authorize"**
4. Le token sera automatiquement inclus dans toutes les requêtes protégées

## 📝 Exemples d'utilisation

### Connexion
```json
POST /api/auth/login
{
  "email": "admin@faithconnect.com",
  "password": "admin123"
}
```

### Créer un utilisateur
```json
POST /api/users
Authorization: Bearer <votre_token>
{
  "email": "nouveau@example.com",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "member",
  "phone": "0123456789"
}
```

### Créer un événement
```json
POST /api/events
Authorization: Bearer <votre_token>
{
  "title": "Cours d'arabe",
  "description": "Cours pour débutants",
  "eventDate": "2024-01-15T18:00:00Z",
  "location": "Salle principale",
  "maxParticipants": 30
}
```

## 🎯 Types de réponses

### Succès (200/201)
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": {
    // Données spécifiques à l'endpoint
  }
}
```

### Erreur (400/401/403/404/500)
```json
{
  "success": false,
  "message": "Message d'erreur",
  "errors": [
    {
      "field": "nom_du_champ",
      "message": "Message d'erreur spécifique"
    }
  ]
}
```

## 🔄 Pagination

Pour les endpoints qui retournent des listes, utilisez ces paramètres :
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10, max: 100)

Exemple : `GET /api/users?page=2&limit=20`

## 🔍 Filtres et recherche

### Utilisateurs
- `search` : Recherche par nom, prénom ou email
- `role` : Filtrer par rôle (admin, member)

### Événements
- `search` : Recherche par titre, description ou lieu
- `status` : Filtrer par statut (upcoming, past, all)
- `startDate` / `endDate` : Filtrer par dates

### Contributions
- `search` : Recherche par description ou nom du contributeur
- `type` : Filtrer par type (donation, tithe, offering, other)
- `paymentMethod` : Filtrer par méthode de paiement
- `isVerified` : Filtrer par statut de vérification

## 📊 Statistiques

Les endpoints de statistiques retournent des données agrégées :
- Générales (total, moyenne, min, max)
- Par type/catégorie
- Évolution temporelle
- Top contributeurs (pour les admins)

## 🚨 Gestion des erreurs

L'API retourne des codes HTTP appropriés :
- `200` : Succès
- `201` : Création réussie
- `400` : Données invalides
- `401` : Non authentifié
- `403` : Permissions insuffisantes
- `404` : Ressource non trouvée
- `500` : Erreur interne du serveur

## 📱 Pour les développeurs mobiles

Utilisez cette documentation pour :
- Comprendre les endpoints disponibles
- Tester les requêtes/réponses
- Valider les formats de données
- Déboguer les intégrations

## 🔄 Mise à jour de la documentation

La documentation est générée automatiquement à partir des commentaires Swagger dans le code. Pour ajouter ou modifier la documentation :

1. Ajoutez des commentaires `@swagger` dans les fichiers de routes
2. Redémarrez le serveur
3. La documentation sera automatiquement mise à jour

---

**Note** : En production, assurez-vous de sécuriser l'accès à la documentation si nécessaire.
