/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Liste des utilisateurs
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Recherche par nom, prénom ou email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, member]
 *         description: Filtrer par rôle
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Non authentifié ou permissions insuffisantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Permissions insuffisantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Détails d'un utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Création d'un utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Non authentifié ou permissions insuffisantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Permissions insuffisantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireOrganizationAccess, requireResourceAccess } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Validation des entrées
const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('firstName').notEmpty().trim().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().trim().withMessage('Le nom est requis'),
  body('role').isIn(['admin', 'member']).withMessage('Rôle invalide')
];

const updateUserValidation = [
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('firstName').optional().notEmpty().trim().withMessage('Le prénom ne peut pas être vide'),
  body('lastName').optional().notEmpty().trim().withMessage('Le nom ne peut pas être vide'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Rôle invalide')
];

// GET /api/users - Liste des utilisateurs (admin et super admin seulement)
router.get('/', requireRole(['admin', 'super_admin']), requireOrganizationAccess, [
  query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('role').optional().isIn(['admin', 'member']).withMessage('Rôle de filtre invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const roleFilter = req.query.role;

    let whereClause = 'WHERE u.is_active = TRUE';
    let params = [];

    // Filtrage par organisation pour les admins
    if (req.user.role === 'admin') {
      whereClause += ' AND u.organization_id = ?';
      params.push(req.user.organizationId);
    }

    // Filtrage par rôle
    if (roleFilter) {
      whereClause += ' AND u.role = ?';
      params.push(roleFilter);
    }

    // Recherche
    if (search) {
      whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Requête principale
    const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, 
        u.phone, u.is_active, u.email_verified, u.last_login, u.created_at,
        o.id as organization_id, o.name as organization_name, o.type as organization_type
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [users] = await pool.execute(query, [...params, limit, offset]);

    // Comptage total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// GET /api/users/:id - Détails d'un utilisateur
router.get('/:id', requireResourceAccess('user'), async (req, res) => {
  try {
    const userId = req.params.id;

    const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, 
        u.phone, u.is_active, u.email_verified, u.last_login, u.created_at,
        o.id as organization_id, o.name as organization_name, o.type as organization_type,
        o.address as organization_address
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `;

    const [users] = await pool.execute(query, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Si c'est un membre, il ne peut voir que ses propres informations
    if (req.user.role === 'member' && userId != req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

// POST /api/users - Création d'un utilisateur (admin et super admin seulement)
router.post('/', requireRole(['admin', 'super_admin']), requireOrganizationAccess, createUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, role, phone, organizationId } = req.body;

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

    // Détermination de l'organisation_id
    let targetOrganizationId = organizationId;
    
    if (req.user.role === 'admin') {
      // Les admins ne peuvent créer que dans leur organisation
      targetOrganizationId = req.user.organizationId;
    } else if (role === 'admin' && !organizationId) {
      // Les super admins doivent spécifier une organisation pour les admins
      return res.status(400).json({
        success: false,
        message: 'L\'organisation_id est requis pour la création d\'un admin'
      });
    }

    // Si c'est un admin, vérifier que l'organisation existe
    if (role === 'admin' && targetOrganizationId) {
      const [organizations] = await pool.execute(
        'SELECT id FROM organizations WHERE id = ? AND is_active = TRUE',
        [targetOrganizationId]
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
      [email, passwordHash, firstName, lastName, role, targetOrganizationId || null, phone || null]
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
        organizationId: targetOrganizationId
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

// PUT /api/users/:id - Mise à jour d'un utilisateur
router.put('/:id', requireResourceAccess('user'), updateUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const userId = req.params.id;
    const { email, firstName, lastName, phone, role } = req.body;

    // Vérification que l'utilisateur existe
    const [existingUsers] = await pool.execute(
      'SELECT id, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const currentUser = existingUsers[0];

    // Si changement d'email, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== currentUser.email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Seuls les super admins peuvent changer les rôles
    if (role && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un super administrateur peut modifier les rôles'
      });
    }

    // Construction de la requête de mise à jour
    const updateFields = [];
    const updateParams = [];

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }
    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateParams.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateParams.push(lastName);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateParams.push(phone);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateParams.push(role);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
});

// DELETE /api/users/:id - Désactivation d'un utilisateur (admin et super admin seulement)
router.delete('/:id', requireRole(['admin', 'super_admin']), requireResourceAccess('user'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Empêcher la désactivation de soi-même
    if (userId == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    // Vérification que l'utilisateur existe
    const [users] = await pool.execute(
      'SELECT id, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'L\'utilisateur est déjà désactivé'
      });
    }

    // Désactivation de l'utilisateur
    await pool.execute(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'utilisateur'
    });
  }
});

// POST /api/users/:id/activate - Activation d'un utilisateur (admin et super admin seulement)
router.post('/:id/activate', requireRole(['admin', 'super_admin']), requireResourceAccess('user'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Vérification que l'utilisateur existe
    const [users] = await pool.execute(
      'SELECT id, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    if (user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'L\'utilisateur est déjà actif'
      });
    }

    // Activation de l'utilisateur
    await pool.execute(
      'UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Utilisateur activé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'activation de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation de l\'utilisateur'
    });
  }
});

// GET /api/users/profile - Profil de l'utilisateur connecté
router.get('/profile/me', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, 
        u.phone, u.is_active, u.email_verified, u.last_login, u.created_at,
        o.id as organization_id, o.name as organization_name, o.type as organization_type,
        o.address as organization_address, o.phone as organization_phone
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `;

    const [users] = await pool.execute(query, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: { user: users[0] }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

module.exports = router;
