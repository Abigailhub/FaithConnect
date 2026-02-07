const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireResourceAccess } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Validation des entrées
const createOrganizationValidation = [
  body('name').notEmpty().trim().withMessage('Le nom de l\'organisation est requis'),
  body('type').isIn(['mosque', 'church', 'association']).withMessage('Type d\'organisation invalide'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').optional().isLength({ min: 10, max: 20 }).withMessage('Numéro de téléphone invalide')
];

const updateOrganizationValidation = [
  body('name').optional().notEmpty().trim().withMessage('Le nom ne peut pas être vide'),
  body('type').optional().isIn(['mosque', 'church', 'association']).withMessage('Type d\'organisation invalide'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').optional().isLength({ min: 10, max: 20 }).withMessage('Numéro de téléphone invalide')
];

// GET /api/organizations - Liste des organisations
router.get('/', requireRole(['super_admin', 'admin']), [
  query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('type').optional().isIn(['mosque', 'church', 'association']).withMessage('Type de filtre invalide')
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
    const typeFilter = req.query.type;

    let whereClause = 'WHERE o.is_active = TRUE';
    let params = [];

    // Les admins ne voient que leur organisation
    if (req.user.role === 'admin') {
      whereClause += ' AND o.id = ?';
      params.push(req.user.organizationId);
    }

    // Filtrage par type
    if (typeFilter) {
      whereClause += ' AND o.type = ?';
      params.push(typeFilter);
    }

    // Recherche
    if (search) {
      whereClause += ' AND (o.name LIKE ? OR o.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Requête principale
    const query = `
      SELECT 
        o.id, o.name, o.type, o.address, o.phone, o.email, 
        o.description, o.is_active, o.created_at,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(DISTINCT e.id) as event_count,
        COALESCE(SUM(c.amount), 0) as total_contributions
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id AND u.is_active = TRUE
      LEFT JOIN events e ON o.id = e.organization_id AND e.is_active = TRUE
      LEFT JOIN contributions c ON o.id = c.organization_id AND c.is_verified = TRUE
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [organizations] = await pool.execute(query, [...params, limit, offset]);

    // Comptage total pour la pagination
    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM organizations o
      ${whereClause}
    `;
    
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des organisations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des organisations'
    });
  }
});

// GET /api/organizations/:id - Détails d'une organisation
router.get('/:id', requireResourceAccess('organization'), async (req, res) => {
  try {
    const organizationId = req.params.id;

    const query = `
      SELECT 
        o.id, o.name, o.type, o.address, o.phone, o.email, 
        o.description, o.is_active, o.created_at,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as admin_count,
        COUNT(DISTINCT CASE WHEN u.role = 'member' THEN u.id END) as regular_member_count,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT CASE WHEN e.event_date >= CURDATE() THEN e.id END) as upcoming_events,
        COALESCE(SUM(c.amount), 0) as total_contributions,
        COUNT(DISTINCT c.id) as contribution_count
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id AND u.is_active = TRUE
      LEFT JOIN events e ON o.id = e.organization_id AND e.is_active = TRUE
      LEFT JOIN contributions c ON o.id = c.organization_id AND c.is_verified = TRUE
      WHERE o.id = ? AND o.is_active = TRUE
      GROUP BY o.id
    `;

    const [organizations] = await pool.execute(query, [organizationId]);

    if (organizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organisation non trouvée'
      });
    }

    const organization = organizations[0];

    res.json({
      success: true,
      data: { organization }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'organisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'organisation'
    });
  }
});

// POST /api/organizations - Création d'une organisation (super admin seulement)
router.post('/', requireRole(['super_admin']), createOrganizationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { name, type, address, phone, email, description } = req.body;

    // Insertion de l'organisation
    const [result] = await pool.execute(
      'INSERT INTO organizations (name, type, address, phone, email, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, address || null, phone || null, email || null, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Organisation créée avec succès',
      data: {
        id: result.insertId,
        name,
        type,
        address,
        phone,
        email,
        description
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'organisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'organisation'
    });
  }
});

// PUT /api/organizations/:id - Mise à jour d'une organisation
router.put('/:id', requireResourceAccess('organization'), updateOrganizationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const organizationId = req.params.id;
    const { name, type, address, phone, email, description } = req.body;

    // Vérification que l'organisation existe
    const [organizations] = await pool.execute(
      'SELECT id FROM organizations WHERE id = ? AND is_active = TRUE',
      [organizationId]
    );

    if (organizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organisation non trouvée'
      });
    }

    // Construction de la requête de mise à jour
    const updateFields = [];
    const updateParams = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(name);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateParams.push(type);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateParams.push(address);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateParams.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(organizationId);

    const updateQuery = `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Organisation mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'organisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'organisation'
    });
  }
});

// DELETE /api/organizations/:id - Désactivation d'une organisation (super admin seulement)
router.delete('/:id', requireRole(['super_admin']), requireResourceAccess('organization'), async (req, res) => {
  try {
    const organizationId = req.params.id;

    // Vérification que l'organisation existe
    const [organizations] = await pool.execute(
      'SELECT id, is_active FROM organizations WHERE id = ?',
      [organizationId]
    );

    if (organizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organisation non trouvée'
      });
    }

    const organization = organizations[0];

    if (!organization.is_active) {
      return res.status(400).json({
        success: false,
        message: 'L\'organisation est déjà désactivée'
      });
    }

    // Désactivation de l'organisation
    await pool.execute(
      'UPDATE organizations SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [organizationId]
    );

    // Désactivation de tous les utilisateurs de l'organisation
    await pool.execute(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE organization_id = ?',
      [organizationId]
    );

    res.json({
      success: true,
      message: 'Organisation désactivée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'organisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'organisation'
    });
  }
});

// GET /api/organizations/:id/members - Membres d'une organisation
router.get('/:id/members', requireResourceAccess('organization'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100'),
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

    const organizationId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const roleFilter = req.query.role;

    let whereClause = 'WHERE u.organization_id = ? AND u.is_active = TRUE';
    let params = [organizationId];

    if (roleFilter) {
      whereClause += ' AND u.role = ?';
      params.push(roleFilter);
    }

    const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, 
        u.phone, u.email_verified, u.last_login, u.created_at
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [members] = await pool.execute(query, [...params, limit, offset]);

    // Comptage total
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
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des membres'
    });
  }
});

module.exports = router;
