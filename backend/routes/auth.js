/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Routes pour l'authentification des utilisateurs
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mot de passe (minimum 6 caractères)
 *               firstName:
 *                 type: string
 *                 description: Prénom de l'utilisateur
 *               lastName:
 *                 type: string
 *                 description: Nom de l'utilisateur
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 description: Rôle de l'utilisateur
 *               organizationId:
 *                 type: integer
 *                 description: ID de l'organisation (requis pour les admins)
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Données invalides ou email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Vérification du token JWT
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token valide"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Token invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Changement de mot de passe
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mot de passe actuel
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nouveau mot de passe (minimum 6 caractères)
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Mot de passe actuel incorrect ou données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation des entrées
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('firstName').notEmpty().trim().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().trim().withMessage('Le nom est requis'),
  body('role').isIn(['super_admin', 'admin', 'member']).withMessage('Rôle invalide')
];

// Route de connexion
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    
    console.log('🔍 Tentative de connexion:', { email, passwordLength: password?.length });

    // Recherche de l'utilisateur
    const [users] = await pool.execute(
      'SELECT id, email, password_hash, role, organization_id, is_active, first_name, last_name FROM users WHERE email = ?',
      [email]
    );

    console.log('👥 Utilisateurs trouvés:', users.length);
    if (users.length > 0) {
      console.log('📋 Détails utilisateur:', {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        isActive: users[0].is_active,
        hasPasswordHash: !!users[0].password_hash
      });
    }

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      console.log('❌ Compte utilisateur désactivé');
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Veuillez contacter l\'administrateur'
      });
    }

    // Vérification du mot de passe
    console.log('🔐 Vérification du mot de passe...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 Résultat vérification mot de passe:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Génération du token JWT
    console.log('🎟️ Génération du token JWT...');
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Mise à jour de la dernière connexion
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Récupération des informations de l'organisation si applicable
    let organization = null;
    if (user.organization_id) {
      const [organizations] = await pool.execute(
        'SELECT id, name, type, address FROM organizations WHERE id = ? AND is_active = TRUE',
        [user.organization_id]
      );
      if (organizations.length > 0) {
        organization = organizations[0];
      }
    }

    console.log('✅ Connexion réussie pour:', user.email);
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          organization
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

// Route d'inscription (uniquement pour les super admins ou création initiale)
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, role, organizationId, phone } = req.body;

    // Vérification si l'email existe déjà
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Si c'est un admin, vérifier que l'organisation existe
    if (role === 'admin' && organizationId) {
      const [organizations] = await pool.execute(
        'SELECT id FROM organizations WHERE id = ? AND is_active = TRUE',
        [organizationId]
      );

      if (organizations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Organisation non trouvée ou inactive'
        });
      }
    }

    // Hashage du mot de passe
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertion de l'utilisateur
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, passwordHash, firstName, lastName, role, organizationId || null, phone || null]
    );

    // Création de la notification de bienvenue
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [result.insertId, 'Bienvenue sur FaithConnect', 'Votre compte a été créé avec succès. Bienvenue dans la plateforme !', 'info']
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: result.insertId,
        email,
        firstName,
        lastName,
        role,
        organizationId
      }
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
});

// Route de vérification du token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Récupération des informations complètes de l'utilisateur
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, organization_id, phone, is_active, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Récupération des informations de l'organisation si applicable
    let organization = null;
    if (user.organization_id) {
      const [organizations] = await pool.execute(
        'SELECT id, name, type, address, phone FROM organizations WHERE id = ? AND is_active = TRUE',
        [user.organization_id]
      );
      if (organizations.length > 0) {
        organization = organizations[0];
      }
    }

    res.json({
      success: true,
      message: 'Token valide',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          isActive: user.is_active,
          lastLogin: user.last_login,
          organization
        }
      }
    });
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
});

// Route de déconnexion (optionnelle - côté client)
router.post('/logout', authenticateToken, (req, res) => {
  // Dans une implémentation plus avancée, on pourrait ajouter le token à une liste noire
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Route de changement de mot de passe
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Récupération du mot de passe actuel
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérification du mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hashage du nouveau mot de passe
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Mise à jour du mot de passe
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur de changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

module.exports = router;
