# Collection Postman FaithConnect API

Ce document contient une collection Postman complète pour tester tous les endpoints de l'API FaithConnect.

## 🚀 Configuration

### Base URL
```
http://localhost:3000/api
```

### Variables d'environnement
Créez ces variables dans Postman :

| Variable | Valeur | Description |
|----------|----------|-------------|
| `baseUrl` | `http://localhost:3000/api` | URL de base de l'API |
| `token` | `{{loginResponse.data.token}}` | Token JWT (auto-rempli après login) |
| `superAdminEmail` | `admin@faithconnect.com` | Email super admin |
| `superAdminPassword` | `admin123` | Mot de passe super admin |
| `adminEmail` | `admin@mosquee-alfath.fr` | Email admin test |
| `adminPassword` | `admin123` | Mot de passe admin test |
| `memberEmail` | `fatima.alami@email.com` | Email membre test |
| `memberPassword` | `member123` | Mot de passe membre test |

---

## 🔐 Authentification

### 1. Connexion Super Admin
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "{{superAdminEmail}}",
  "password": "{{superAdminPassword}}"
}
```

### 2. Connexion Admin
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}
```

### 3. Connexion Membre
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "{{memberEmail}}",
  "password": "{{memberPassword}}"
}
```

### 4. Vérification Token
```http
GET {{baseUrl}}/auth/verify
Authorization: Bearer {{token}}
```

### 5. Déconnexion
```http
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{token}}
```

### 6. Changement Mot de Passe
```http
POST {{baseUrl}}/auth/change-password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "currentPassword": "ancien_mot_de_passe",
  "newPassword": "nouveau_mot_de_passe"
}
```

---

## 👥 Utilisateurs

### 1. Liste des Utilisateurs (Admin/Super Admin)
```http
GET {{baseUrl}}/users?page=1&limit=10&search=jean&role=member
Authorization: Bearer {{token}}
```

### 2. Détails Utilisateur
```http
GET {{baseUrl}}/users/1
Authorization: Bearer {{token}}
```

### 3. Créer Utilisateur (Admin/Super Admin)
```http
POST {{baseUrl}}/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "nouveau.utilisateur@example.com",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "member",
  "phone": "0123456789"
}
```

### 4. Mettre à Jour Utilisateur
```http
PUT {{baseUrl}}/users/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Dupont-Modifié",
  "phone": "0987654321"
}
```

### 5. Désactiver Utilisateur (Admin/Super Admin)
```http
DELETE {{baseUrl}}/users/1
Authorization: Bearer {{token}}
```

### 6. Activer Utilisateur (Admin/Super Admin)
```http
POST {{baseUrl}}/users/1/activate
Authorization: Bearer {{token}}
```

### 7. Profil Utilisateur Connecté
```http
GET {{baseUrl}}/users/profile/me
Authorization: Bearer {{token}}
```

---

## 🏢 Organisations

### 1. Liste des Organisations
```http
GET {{baseUrl}}/organizations?page=1&limit=10&type=mosque&search=al-fath
Authorization: Bearer {{token}}
```

### 2. Détails Organisation
```http
GET {{baseUrl}}/organizations/1
Authorization: Bearer {{token}}
```

### 3. Créer Organisation (Super Admin)
```http
POST {{baseUrl}}/organizations
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Mosquée Test",
  "type": "mosque",
  "address": "123 Rue de la Paix",
  "phone": "0123456789",
  "email": "contact@mosquee-test.fr",
  "description": "Mosquée de test pour démonstration"
}
```

### 4. Mettre à Jour Organisation
```http
PUT {{baseUrl}}/organizations/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Mosquée Al-Fath - Modifiée",
  "address": "456 Rue Modifiée",
  "phone": "0987654321"
}
```

### 5. Désactiver Organisation (Super Admin)
```http
DELETE {{baseUrl}}/organizations/1
Authorization: Bearer {{token}}
```

### 6. Membres d'une Organisation
```http
GET {{baseUrl}}/organizations/1/members?page=1&limit=10&role=member
Authorization: Bearer {{token}}
```

---

## 📅 Événements

### 1. Liste des Événements
```http
GET {{baseUrl}}/events?page=1&limit=10&status=upcoming&search=cours
Authorization: Bearer {{token}}
```

### 2. Détails Événement
```http
GET {{baseUrl}}/events/1
Authorization: Bearer {{token}}
```

### 3. Créer Événement (Admin/Super Admin)
```http
POST {{baseUrl}}/events
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Cours d'arabe avancé",
  "description": "Cours pour les étudiants avancés en langue arabe",
  "eventDate": "2024-02-15T18:00:00Z",
  "location": "Salle des cours",
  "maxParticipants": 25
}
```

### 4. Mettre à Jour Événement
```http
PUT {{baseUrl}}/events/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Cours d'arabe - Modifié",
  "description": "Description mise à jour",
  "maxParticipants": 30
}
```

### 5. Supprimer Événement
```http
DELETE {{baseUrl}}/events/1
Authorization: Bearer {{token}}
```

### 6. S'inscrire à un Événement
```http
POST {{baseUrl}}/events/1/register
Authorization: Bearer {{token}}
```

### 7. Se désinscrire d'un Événement
```http
DELETE {{baseUrl}}/events/1/register
Authorization: Bearer {{token}}
```

### 8. Mettre à Jour Statut Participation (Admin/Super Admin)
```http
PUT {{baseUrl}}/events/1/participants/2/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "attended"
}
```

---

## 💰 Contributions

### 1. Liste des Contributions
```http
GET {{baseUrl}}/contributions?page=1&limit=10&type=donation&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {{token}}
```

### 2. Détails Contribution
```http
GET {{baseUrl}}/contributions/1
Authorization: Bearer {{token}}
```

### 3. Enregistrer Contribution (Admin/Super Admin)
```http
POST {{baseUrl}}/contributions
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "amount": 100.00,
  "type": "donation",
  "paymentMethod": "cash",
  "contributionDate": "2024-01-15",
  "userId": 2,
  "description": "Don mensuel pour la mosquée"
}
```

### 4. Mettre à Jour Contribution
```http
PUT {{baseUrl}}/contributions/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "amount": 150.00,
  "description": "Montant mis à jour"
}
```

### 5. Supprimer Contribution
```http
DELETE {{baseUrl}}/contributions/1
Authorization: Bearer {{token}}
```

### 6. Vérifier Contribution (Admin/Super Admin)
```http
POST {{baseUrl}}/contributions/1/verify
Authorization: Bearer {{token}}
```

### 7. Statistiques des Contributions
```http
GET {{baseUrl}}/contributions/statistics?period=month&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {{token}}
```

---

## 📊 Rapports

### 1. Tableau de Bord
```http
GET {{baseUrl}}/reports/dashboard?period=month
Authorization: Bearer {{token}}
```

### 2. Rapport des Membres
```http
GET {{baseUrl}}/reports/members?startDate=2024-01-01&endDate=2024-12-31&role=member
Authorization: Bearer {{token}}
```

### 3. Rapport des Événements
```http
GET {{baseUrl}}/reports/events?startDate=2024-01-01&endDate=2024-12-31&status=past
Authorization: Bearer {{token}}
```

### 4. Rapport Financier
```http
GET {{baseUrl}}/reports/financial?startDate=2024-01-01&endDate=2024-12-31&groupBy=month&type=donation
Authorization: Bearer {{token}}
```

### 5. Exporter des Données
```http
GET {{baseUrl}}/reports/export?type=members&format=csv&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {{token}}
```

---

## 🎯 Scénarios de Test

### Scénario 1: Flux Complet Admin
1. **Connexion** en tant qu'admin
2. **Créer** un nouvel utilisateur membre
3. **Créer** un événement
4. **Enregistrer** une contribution pour le membre
5. **Consulter** le tableau de bord
6. **Exporter** le rapport des membres

### Scénario 2: Flux Membre
1. **Connexion** en tant que membre
2. **Consulter** son profil
3. **Voir** la liste des événements
4. **S'inscrire** à un événement
5. **Consulter** ses contributions

### Scénario 3: Flux Super Admin
1. **Connexion** en tant que super admin
2. **Créer** une nouvelle organisation
3. **Créer** un admin pour cette organisation
4. **Consulter** les rapports globaux
5. **Exporter** les données financières

---

## 📝 Notes Importantes

### Authentification
- Tous les endpoints protégés nécessitent le header `Authorization: Bearer {{token}}`
- Le token expire après 7 jours par défaut
- En cas d'erreur 401, refaites une connexion

### Permissions
- **Super Admin** : Accès à toutes les organisations et fonctionnalités
- **Admin** : Accès limité à son organisation
- **Membre** : Accès limité à ses propres données

### Validation
- Les emails doivent être uniques
- Les mots de passe doivent avoir minimum 6 caractères
- Les montants doivent être positifs

### Pagination
- Utilisez `page` et `limit` pour naviguer dans les listes
- Par défaut : `page=1`, `limit=10`
- Maximum : `limit=100`

### Codes d'Erreur
- `200` : Succès
- `201` : Création réussie
- `400` : Données invalides
- `401` : Non authentifié
- `403` : Permissions insuffisantes
- `404` : Ressource non trouvée
- `500` : Erreur serveur

---

## 🚀 Importation dans Postman

1. Copiez ce document
2. Dans Postman : **Import** > **Raw text**
3. Collez le contenu
4. Configurez les variables d'environnement
5. Testez les endpoints !

---

## 🔍 Débogage

### Problèmes courants
1. **401 Unauthorized** : Vérifiez que le token est valide et bien formaté
2. **403 Forbidden** : Vérifiez que vous avez les permissions nécessaires
3. **400 Bad Request** : Vérifiez le format des données envoyées
4. **404 Not Found** : Vérifiez que l'ID de la ressource existe

### Logs du serveur
Consultez les logs du serveur pour voir les erreurs détaillées :
```bash
npm run dev
```

---

*Collection créée pour FaithConnect API v1.0.0*
