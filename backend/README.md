# FaithConnect Backend

Backend API pour FaithConnect - Plateforme de gestion d'association/mosquée/église.

## 🚀 Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de données relationnelle
- **JWT** - Authentification par token
- **bcryptjs** - Hashage des mots de passe
- **express-validator** - Validation des données
- **helmet** - Sécurité
- **cors** - Gestion des CORS
- **express-rate-limit** - Limitation des requêtes

## 📋 Prérequis

- Node.js 14+
- MySQL 8.0+
- npm ou yarn

## 🛠️ Installation

1. Clonez le repository
2. Installez les dépendances :
```bash
npm install
```

3. Configurez la base de données :
   - Créez une base de données MySQL nommée `faithconnect`
   - Importez le fichier `database.sql` pour créer les tables
   - Ou laissez l'application créer les tables automatiquement

4. Configurez les variables d'environnement :
```bash
cp .env.example .env
# Éditez .env avec vos configurations
```

## ⚙️ Configuration

Variables d'environnement requises dans `.env` :

```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=faithconnect
DB_PORT=3306

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
```

## 🚀 Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

## 📚 Documentation API

### Base URL
- Développement : `http://localhost:3000/api`
- Production : `https://votredomaine.com/api`

### Authentification

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@faithconnect.com",
  "password": "votre_mot_de_passe"
}
```

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "email@example.com",
  "password": "motdepasse",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "member",
  "organizationId": 1
}
```

#### Vérification du token
```http
GET /api/auth/verify
Authorization: Bearer <votre_token_jwt>
```

### Utilisateurs

#### Liste des utilisateurs (Admin/Super Admin)
```http
GET /api/users?page=1&limit=10&search=jean&role=member
Authorization: Bearer <token>
```

#### Détails d'un utilisateur
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Créer un utilisateur (Admin/Super Admin)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "nouveau@example.com",
  "password": "motdepasse",
  "firstName": "Nouveau",
  "lastName": "Utilisateur",
  "role": "member",
  "phone": "0123456789"
}
```

### Organisations

#### Liste des organisations
```http
GET /api/organizations?page=1&limit=10&type=mosque
Authorization: Bearer <token>
```

#### Créer une organisation (Super Admin)
```http
POST /api/organizations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mosquée Test",
  "type": "mosque",
  "address": "123 Rue de la Paix",
  "phone": "0123456789",
  "email": "contact@mosquee-test.fr"
}
```

### Événements

#### Liste des événements
```http
GET /api/events?status=upcoming&page=1&limit=10
Authorization: Bearer <token>
```

#### Créer un événement (Admin/Super Admin)
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Cours d'arabe",
  "description": "Cours pour débutants",
  "eventDate": "2024-01-15T18:00:00Z",
  "location": "Salle principale",
  "maxParticipants": 30
}
```

#### S'inscrire à un événement
```http
POST /api/events/:id/register
Authorization: Bearer <token>
```

### Contributions

#### Liste des contributions
```http
GET /api/contributions?startDate=2024-01-01&endDate=2024-12-31&type=donation
Authorization: Bearer <token>
```

#### Enregistrer une contribution (Admin/Super Admin)
```http
POST /api/contributions
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50.00,
  "type": "donation",
  "paymentMethod": "cash",
  "contributionDate": "2024-01-15",
  "userId": 123,
  "description": "Dons mensuels"
}
```

#### Statistiques des contributions
```http
GET /api/contributions/statistics?period=month
Authorization: Bearer <token>
```

### Rapports

#### Tableau de bord
```http
GET /api/reports/dashboard?period=month
Authorization: Bearer <token>
```

#### Rapport des membres
```http
GET /api/reports/members?startDate=2024-01-01&role=member
Authorization: Bearer <token>
```

#### Rapport financier
```http
GET /api/reports/financial?groupBy=month&type=donation
Authorization: Bearer <token>
```

#### Exporter des données
```http
GET /api/reports/export?type=members&format=csv
Authorization: Bearer <token>
```

## 🔐 Rôles et Permissions

### Super Administrateur
- Accès à toutes les organisations
- Création/modification des administrateurs
- Accès à tous les rapports et fonctionnalités
- Peut vérifier/supprimer n'importe quelle contribution

### Administrateur
- Gestion de son organisation uniquement
- Création/modification des membres de son organisation
- Organisation des événements
- Enregistrement des contributions
- Accès aux rapports de son organisation

### Membre
- Consultation de son profil
- Participation aux événements
- Consultation de ses contributions
- Réception des notifications

## 📊 Structure de la base de données

### Tables principales
- `organizations` - Informations des organisations
- `users` - Utilisateurs et leurs rôles
- `events` - Événements organisés
- `event_participants` - Participations aux événements
- `contributions` - Contributions financières
- `notifications` - Notifications utilisateurs
- `groups` - Groupes/sections
- `group_members` - Appartenance aux groupes

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage
```

## 🚀 Déploiement

### Variables d'environnement de production
```env
NODE_ENV=production
DB_HOST=votre_host_mysql
DB_USER=votre_user_mysql
DB_PASSWORD=votre_password_mysql
DB_NAME=faithconnect
JWT_SECRET=votre_secret_ tres_long_et_aleatoire
PORT=3000
```

### Avec PM2
```bash
npm install -g pm2
pm2 start server.js --name faithconnect-backend
pm2 startup
pm2 save
```

### Avec Docker
```bash
docker build -t faithconnect-backend .
docker run -p 3000:3000 --env-file .env faithconnect-backend
```

## 📝 Logs

Les logs sont configurés pour s'afficher dans la console. En production, vous pouvez utiliser un service comme Winston ou Morgan pour une gestion avancée des logs.

## 🔒 Sécurité

- **Helmet** : Protection contre les vulnérabilités web
- **Rate Limiting** : Limitation des requêtes (100 req/15min)
- **JWT** : Tokens avec expiration configurable
- **bcrypt** : Hashage des mots de passe (12 rounds)
- **CORS** : Configuration restrictive des origines
- **Validation** : Validation stricte des entrées

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que MySQL est en cours d'exécution
- Vérifiez les identifiants dans `.env`
- Assurez-vous que la base de données `faithconnect` existe

### Token JWT invalide
- Vérifiez que le token est bien envoyé en header `Authorization: Bearer <token>`
- Vérifiez que la clé `JWT_SECRET` est la même côté client et serveur

### Permissions refusées
- Vérifiez que l'utilisateur a le rôle requis
- Vérifiez que l'utilisateur appartient à la bonne organisation

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement FaithConnect.

## 📄 Licence

Ce projet est sous licence MIT.
