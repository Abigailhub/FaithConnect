const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireOrganizationAccess, requireResourceAccess } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Validation des entrées
const createContributionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Le montant doit être un nombre positif'),
  body('type').isIn(['donation', 'tithe', 'offering', 'other']).withMessage('Type de contribution invalide'),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'mobile_money', 'check', 'online']).withMessage('Méthode de paiement invalide'),
  body('contributionDate').isISO8601().withMessage('La date de contribution est invalide'),
  body('description').optional().isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('userId').optional().isInt({ min: 1 }).withMessage('L\'ID de l\'utilisateur doit être un entier positif')
];

const updateContributionValidation = [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Le montant doit être un nombre positif'),
  body('type').optional().isIn(['donation', 'tithe', 'offering', 'other']).withMessage('Type de contribution invalide'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'mobile_money', 'check', 'online']).withMessage('Méthode de paiement invalide'),
  body('description').optional().isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères')
];

// GET /api/contributions - Liste des contributions
router.get('/', requireOrganizationAccess, [
  query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('type').optional().isIn(['donation', 'tithe', 'offering', 'other']).withMessage('Type de filtre invalide'),
  query('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'mobile_money', 'check', 'online']).withMessage('Méthode de paiement invalide'),
  query('startDate').optional().isISO8601().withMessage('La date de début est invalide'),
  query('endDate').optional().isISO8601().withMessage('La date de fin est invalide'),
  query('isVerified').optional().isBoolean().withMessage('Le statut de vérification doit être un booléen'),
  query('userId').optional().isInt({ min: 1 }).withMessage('L\'ID de l\'utilisateur doit être un entier positif')
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
    const type = req.query.type;
    const paymentMethod = req.query.paymentMethod;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const isVerified = req.query.isVerified;
    const userId = req.query.userId;

    let whereClause = 'WHERE c.is_active = TRUE';
    let params = [];

    // Filtrage par organisation
    if (req.user.role === 'admin') {
      whereClause += ' AND c.organization_id = ?';
      params.push(req.user.organizationId);
    } else if (req.user.role === 'member') {
      whereClause += ' AND c.organization_id = ? AND c.user_id = ?';
      params.push(req.user.organizationId, req.user.id);
    }

    // Filtrage par type
    if (type) {
      whereClause += ' AND c.type = ?';
      params.push(type);
    }

    // Filtrage par méthode de paiement
    if (paymentMethod) {
      whereClause += ' AND c.payment_method = ?';
      params.push(paymentMethod);
    }

    // Filtrage par statut de vérification
    if (isVerified !== undefined) {
      whereClause += ' AND c.is_verified = ?';
      params.push(isVerified === 'true');
    }

    // Filtrage par utilisateur
    if (userId) {
      whereClause += ' AND c.user_id = ?';
      params.push(userId);
    }

    // Filtrage par dates
    if (startDate) {
      whereClause += ' AND c.contribution_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND c.contribution_date <= ?';
      params.push(endDate);
    }

    // Recherche
    if (search) {
      whereClause += ' AND (c.description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Requête principale
    const query = `
      SELECT 
        c.id, c.amount, c.type, c.payment_method, c.description, 
        c.contribution_date, c.is_verified, c.created_at,
        u.id as user_id, u.first_name, u.last_name, u.email,
        recorder.first_name as recorder_first_name, recorder.last_name as recorder_last_name,
        o.name as organization_name
      FROM contributions c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users recorder ON c.recorded_by = recorder.id
      LEFT JOIN organizations o ON c.organization_id = o.id
      ${whereClause}
      ORDER BY c.contribution_date DESC, c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [contributions] = await pool.query(query, params);

    // Comptage total pour la pagination
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM contributions c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
    `;
    
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        contributions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contributions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contributions'
    });
  }
});

// GET /api/contributions/:id - Détails d'une contribution
router.get('/:id', requireResourceAccess('contribution'), async (req, res) => {
  try {
    const contributionId = req.params.id;

    const query = `
      SELECT 
        c.id, c.amount, c.type, c.payment_method, c.description, 
        c.contribution_date, c.is_verified, c.created_at, c.recorded_by,
        u.id as user_id, u.first_name, u.last_name, u.email, u.phone,
        recorder.first_name as recorder_first_name, recorder.last_name as recorder_last_name,
        o.id as organization_id, o.name as organization_name, o.type as organization_type
      FROM contributions c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users recorder ON c.recorded_by = recorder.id
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE c.id = ? AND c.is_active = TRUE
    `;

    const [contributions] = await pool.execute(query, [contributionId]);

    if (contributions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contribution non trouvée'
      });
    }

    res.json({
      success: true,
      data: { contribution: contributions[0] }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la contribution'
    });
  }
});

// POST /api/contributions - Création d'une contribution (admin et super admin seulement)
router.post('/', requireRole(['admin', 'super_admin']), requireOrganizationAccess, createContributionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { amount, type, paymentMethod, contributionDate, description, userId } = req.body;

    // Détermination de l'organisation_id
    const organizationId = req.user.role === 'admin' ? req.user.organizationId : null;
    
    if (req.user.role === 'admin' && !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune organisation associée à cet administrateur'
      });
    }

    // Si un userId est spécifié, vérifier que l'utilisateur existe et appartient à l'organisation
    if (userId) {
      const [users] = await pool.execute(
        'SELECT id, organization_id FROM users WHERE id = ? AND is_active = TRUE',
        [userId]
      );

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Utilisateur non trouvé ou inactif'
        });
      }

      const user = users[0];

      // Pour les admins, vérifier que l'utilisateur appartient à leur organisation
      if (req.user.role === 'admin' && user.organization_id != organizationId) {
        return res.status(400).json({
          success: false,
          message: 'L\'utilisateur n\'appartient pas à votre organisation'
        });
      }
    }

    // Insertion de la contribution
    const [result] = await pool.execute(
      'INSERT INTO contributions (organization_id, user_id, amount, type, payment_method, description, contribution_date, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [organizationId, userId || null, amount, type, paymentMethod, description || null, contributionDate, req.user.id]
    );

    // Notification à l'utilisateur si spécifié
    if (userId) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          userId,
          `Contribution enregistrée: ${type}`,
          `Une contribution de ${amount}€ a été enregistrée pour vous le ${new Date(contributionDate).toLocaleDateString('fr-FR')}.`,
          'contribution'
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Contribution créée avec succès',
      data: {
        id: result.insertId,
        amount,
        type,
        paymentMethod,
        contributionDate,
        description,
        userId,
        organizationId
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la contribution'
    });
  }
});

// PUT /api/contributions/:id - Mise à jour d'une contribution
router.put('/:id', requireResourceAccess('contribution'), requireRole(['admin', 'super_admin']), updateContributionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const contributionId = req.params.id;
    const { amount, type, paymentMethod, description } = req.body;

    // Vérification que la contribution existe
    const [contributions] = await pool.execute(
      'SELECT id, is_verified FROM contributions WHERE id = ? AND is_active = TRUE',
      [contributionId]
    );

    if (contributions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contribution non trouvée'
      });
    }

    const contribution = contributions[0];

    // Si la contribution est déjà vérifiée, seul un super admin peut la modifier
    if (contribution.is_verified && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Une contribution vérifiée ne peut être modifiée que par un super administrateur'
      });
    }

    // Construction de la requête de mise à jour
    const updateFields = [];
    const updateParams = [];

    if (amount !== undefined) {
      updateFields.push('amount = ?');
      updateParams.push(amount);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateParams.push(type);
    }
    if (paymentMethod !== undefined) {
      updateFields.push('payment_method = ?');
      updateParams.push(paymentMethod);
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
    updateParams.push(contributionId);

    const updateQuery = `UPDATE contributions SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Contribution mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la contribution'
    });
  }
});

// DELETE /api/contributions/:id - Suppression d'une contribution
router.delete('/:id', requireResourceAccess('contribution'), requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const contributionId = req.params.id;

    // Vérification que la contribution existe
    const [contributions] = await pool.execute(
      'SELECT id, is_verified FROM contributions WHERE id = ?',
      [contributionId]
    );

    if (contributions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contribution non trouvée'
      });
    }

    const contribution = contributions[0];

    if (!contribution.is_active) {
      return res.status(400).json({
        success: false,
        message: 'La contribution est déjà supprimée'
      });
    }

    // Si la contribution est déjà vérifiée, seul un super admin peut la supprimer
    if (contribution.is_verified && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Une contribution vérifiée ne peut être supprimée que par un super administrateur'
      });
    }

    // Suppression de la contribution (désactivation)
    await pool.execute(
      'UPDATE contributions SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [contributionId]
    );

    res.json({
      success: true,
      message: 'Contribution supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la contribution'
    });
  }
});

// POST /api/contributions/:id/verify - Vérification d'une contribution (admin et super admin seulement)
router.post('/:id/verify', requireResourceAccess('contribution'), requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const contributionId = req.params.id;

    // Vérification que la contribution existe
    const [contributions] = await pool.execute(
      'SELECT id, is_verified FROM contributions WHERE id = ? AND is_active = TRUE',
      [contributionId]
    );

    if (contributions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contribution non trouvée'
      });
    }

    const contribution = contributions[0];

    if (contribution.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'La contribution est déjà vérifiée'
      });
    }

    // Vérification de la contribution
    await pool.execute(
      'UPDATE contributions SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [contributionId]
    );

    res.json({
      success: true,
      message: 'Contribution vérifiée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de la contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la contribution'
    });
  }
});

// GET /api/contributions/statistics - Statistiques des contributions
router.get('/statistics', requireOrganizationAccess, [
  query('startDate').optional().isISO8601().withMessage('La date de début est invalide'),
  query('endDate').optional().isISO8601().withMessage('La date de fin est invalide'),
  query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Période invalide')
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

    const startDate = req.query.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const period = req.query.period || 'month';

    let whereClause = 'WHERE c.is_active = TRUE AND c.is_verified = TRUE AND c.contribution_date BETWEEN ? AND ?';
    let params = [startDate, endDate];

    // Filtrage par organisation
    if (req.user.role === 'admin') {
      whereClause += ' AND c.organization_id = ?';
      params.push(req.user.organizationId);
    } else if (req.user.role === 'member') {
      whereClause += ' AND c.organization_id = ? AND c.user_id = ?';
      params.push(req.user.organizationId, req.user.id);
    }

    // Statistiques générales
    const [generalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_contributions,
        COALESCE(SUM(c.amount), 0) as total_amount,
        COALESCE(AVG(c.amount), 0) as average_amount,
        COALESCE(MIN(c.amount), 0) as min_amount,
        COALESCE(MAX(c.amount), 0) as max_amount
      FROM contributions c
      ${whereClause}
    `, params);

    // Statistiques par type
    const [typeStats] = await pool.execute(`
      SELECT 
        c.type,
        COUNT(*) as count,
        COALESCE(SUM(c.amount), 0) as total_amount,
        COALESCE(AVG(c.amount), 0) as average_amount
      FROM contributions c
      ${whereClause}
      GROUP BY c.type
      ORDER BY total_amount DESC
    `, params);

    // Statistiques par méthode de paiement
    const [paymentStats] = await pool.execute(`
      SELECT 
        c.payment_method,
        COUNT(*) as count,
        COALESCE(SUM(c.amount), 0) as total_amount
      FROM contributions c
      ${whereClause}
      GROUP BY c.payment_method
      ORDER BY total_amount DESC
    `, params);

    // Évolution temporelle
    let dateFormat;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m';
    }

    const [timeStats] = await pool.execute(`
      SELECT 
        DATE_FORMAT(c.contribution_date, '${dateFormat}') as period,
        COUNT(*) as count,
        COALESCE(SUM(c.amount), 0) as total_amount
      FROM contributions c
      ${whereClause}
      GROUP BY DATE_FORMAT(c.contribution_date, '${dateFormat}')
      ORDER BY period ASC
    `, params);

    // Top contributeurs (uniquement pour admins et super admins)
    let topContributors = [];
    if (req.user.role !== 'member') {
      const [contributors] = await pool.execute(`
        SELECT 
          u.id, u.first_name, u.last_name, u.email,
          COUNT(*) as contribution_count,
          COALESCE(SUM(c.amount), 0) as total_amount,
          COALESCE(AVG(c.amount), 0) as average_amount
        FROM contributions c
        JOIN users u ON c.user_id = u.id
        ${whereClause}
        GROUP BY u.id
        ORDER BY total_amount DESC
        LIMIT 10
      `, params);
      topContributors = contributors;
    }

    res.json({
      success: true,
      data: {
        general: generalStats[0],
        byType: typeStats,
        byPaymentMethod: paymentStats,
        timeEvolution: timeStats,
        topContributors
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
