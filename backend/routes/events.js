const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireOrganizationAccess, requireResourceAccess } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Validation des entrées
const createEventValidation = [
  body('title').notEmpty().trim().withMessage('Le titre de l\'événement est requis'),
  body('eventDate').isISO8601().withMessage('La date de l\'événement est invalide'),
  body('description').optional().isLength({ max: 1000 }).withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('location').optional().isLength({ max: 255 }).withMessage('Le lieu ne peut pas dépasser 255 caractères'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Le nombre maximum de participants doit être un entier positif')
];

const updateEventValidation = [
  body('title').optional().notEmpty().trim().withMessage('Le titre ne peut pas être vide'),
  body('eventDate').optional().isISO8601().withMessage('La date de l\'événement est invalide'),
  body('description').optional().isLength({ max: 1000 }).withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('location').optional().isLength({ max: 255 }).withMessage('Le lieu ne peut pas dépasser 255 caractères'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Le nombre maximum de participants doit être un entier positif')
];

// GET /api/events - Liste des événements
router.get('/', requireOrganizationAccess, [
  query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('status').optional().isIn(['upcoming', 'past', 'all']).withMessage('Statut de filtre invalide'),
  query('startDate').optional().isISO8601().withMessage('La date de début est invalide'),
  query('endDate').optional().isISO8601().withMessage('La date de fin est invalide')
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
    const status = req.query.status || 'upcoming';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let whereClause = 'WHERE e.is_active = TRUE';
    let params = [];

    // Filtrage par organisation
    if (req.user.role === 'admin') {
      whereClause += ' AND e.organization_id = ?';
      params.push(req.user.organizationId);
    } else if (req.user.role === 'member') {
      whereClause += ' AND e.organization_id = ?';
      params.push(req.user.organizationId);
    }

    // Filtrage par statut
    if (status === 'upcoming') {
      whereClause += ' AND e.event_date >= NOW()';
    } else if (status === 'past') {
      whereClause += ' AND e.event_date < NOW()';
    }

    // Filtrage par dates
    if (startDate) {
      whereClause += ' AND e.event_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND e.event_date <= ?';
      params.push(endDate);
    }

    // Recherche
    if (search) {
      whereClause += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Requête principale
    const query = `
      SELECT 
        e.id, e.title, e.description, e.event_date, e.location, 
        e.max_participants, e.is_active, e.created_at,
        u.first_name as creator_first_name, u.last_name as creator_last_name,
        COUNT(DISTINCT ep.id) as participant_count,
        COUNT(DISTINCT CASE WHEN ep.status = 'attended' THEN ep.id END) as attended_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.event_date ASC
      LIMIT ? OFFSET ?
    `;

    const [events] = await pool.execute(query, [...params, limit, offset]);

    // Comptage total pour la pagination
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
      ${whereClause}
    `;
    
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
});

// GET /api/events/:id - Détails d'un événement
router.get('/:id', requireResourceAccess('event'), async (req, res) => {
  try {
    const eventId = req.params.id;

    const query = `
      SELECT 
        e.id, e.title, e.description, e.event_date, e.location, 
        e.max_participants, e.is_active, e.created_at, e.created_by,
        u.first_name as creator_first_name, u.last_name as creator_last_name,
        o.name as organization_name, o.type as organization_type,
        COUNT(DISTINCT ep.id) as participant_count,
        COUNT(DISTINCT CASE WHEN ep.status = 'attended' THEN ep.id END) as attended_count,
        COUNT(DISTINCT CASE WHEN ep.status = 'registered' THEN ep.id END) as registered_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN organizations o ON e.organization_id = o.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id
      WHERE e.id = ? AND e.is_active = TRUE
      GROUP BY e.id
    `;

    const [events] = await pool.execute(query, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    const event = events[0];

    // Récupération des participants
    const [participants] = await pool.execute(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone,
        ep.status, ep.registered_at
      FROM event_participants ep
      JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = ?
      ORDER BY ep.registered_at ASC
    `, [eventId]);

    event.participants = participants;

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'événement'
    });
  }
});

// POST /api/events - Création d'un événement (admin et super admin seulement)
router.post('/', requireRole(['admin', 'super_admin']), requireOrganizationAccess, createEventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { title, description, eventDate, location, maxParticipants } = req.body;

    // Détermination de l'organisation_id
    const organizationId = req.user.role === 'admin' ? req.user.organizationId : null;
    
    if (req.user.role === 'admin' && !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune organisation associée à cet administrateur'
      });
    }

    // Insertion de l'événement
    const [result] = await pool.execute(
      'INSERT INTO events (organization_id, title, description, event_date, location, max_participants, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [organizationId, title, description || null, eventDate, location || null, maxParticipants || null, req.user.id]
    );

    // Notification aux membres de l'organisation
    if (organizationId) {
      await pool.execute(`
        INSERT INTO notifications (user_id, title, message, type)
        SELECT u.id, ?, ?, 'event'
        FROM users u
        WHERE u.organization_id = ? AND u.is_active = TRUE AND u.id != ?
      `, [
        `Nouvel événement: ${title}`,
        `Un nouvel événement "${title}" a été programmé le ${new Date(eventDate).toLocaleDateString('fr-FR')}.`,
        organizationId,
        req.user.id
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Événement créé avec succès',
      data: {
        id: result.insertId,
        title,
        description,
        eventDate,
        location,
        maxParticipants,
        organizationId
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'événement'
    });
  }
});

// PUT /api/events/:id - Mise à jour d'un événement
router.put('/:id', requireResourceAccess('event'), requireRole(['admin', 'super_admin']), updateEventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const eventId = req.params.id;
    const { title, description, eventDate, location, maxParticipants } = req.body;

    // Vérification que l'événement existe
    const [events] = await pool.execute(
      'SELECT id, created_by FROM events WHERE id = ? AND is_active = TRUE',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Construction de la requête de mise à jour
    const updateFields = [];
    const updateParams = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    if (eventDate !== undefined) {
      updateFields.push('event_date = ?');
      updateParams.push(eventDate);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateParams.push(location);
    }
    if (maxParticipants !== undefined) {
      updateFields.push('max_participants = ?');
      updateParams.push(maxParticipants);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(eventId);

    const updateQuery = `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Événement mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'événement'
    });
  }
});

// DELETE /api/events/:id - Suppression d'un événement
router.delete('/:id', requireResourceAccess('event'), requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const eventId = req.params.id;

    // Vérification que l'événement existe
    const [events] = await pool.execute(
      'SELECT id, is_active FROM events WHERE id = ?',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    const event = events[0];

    if (!event.is_active) {
      return res.status(400).json({
        success: false,
        message: 'L\'événement est déjà supprimé'
      });
    }

    // Suppression de l'événement (désactivation)
    await pool.execute(
      'UPDATE events SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [eventId]
    );

    res.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'événement'
    });
  }
});

// POST /api/events/:id/register - Inscription à un événement
router.post('/:id/register', requireResourceAccess('event'), async (req, res) => {
  try {
    const eventId = req.params.id;

    // Vérification que l'événement existe et est actif
    const [events] = await pool.execute(
      'SELECT id, max_participants, event_date FROM events WHERE id = ? AND is_active = TRUE',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    const event = events[0];

    // Vérification que l'événement n'est pas passé
    if (new Date(event.event_date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de s\'inscrire à un événement passé'
      });
    }

    // Vérification que l'utilisateur n'est pas déjà inscrit
    const [existingRegistrations] = await pool.execute(
      'SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?',
      [eventId, req.user.id]
    );

    if (existingRegistrations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà inscrit à cet événement'
      });
    }

    // Vérification du nombre maximum de participants
    if (event.max_participants) {
      const [participantCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM event_participants WHERE event_id = ?',
        [eventId]
      );

      if (participantCount[0].count >= event.max_participants) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre maximum de participants est atteint'
        });
      }
    }

    // Inscription de l'utilisateur
    const [result] = await pool.execute(
      'INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, ?)',
      [eventId, req.user.id, 'registered']
    );

    res.status(201).json({
      success: true,
      message: 'Inscription à l\'événement réussie',
      data: {
        registrationId: result.insertId,
        eventId,
        userId: req.user.id,
        status: 'registered'
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription à l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription à l\'événement'
    });
  }
});

// DELETE /api/events/:id/register - Désinscription d'un événement
router.delete('/:id/register', requireResourceAccess('event'), async (req, res) => {
  try {
    const eventId = req.params.id;

    // Vérification que l'événement existe et est actif
    const [events] = await pool.execute(
      'SELECT id, event_date FROM events WHERE id = ? AND is_active = TRUE',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    const event = events[0];

    // Vérification que l'événement n'est pas passé
    if (new Date(event.event_date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de se désinscrire d\'un événement passé'
      });
    }

    // Vérification que l'utilisateur est inscrit
    const [registrations] = await pool.execute(
      'SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?',
      [eventId, req.user.id]
    );

    if (registrations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à cet événement'
      });
    }

    // Désinscription
    await pool.execute(
      'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?',
      [eventId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Désinscription de l\'événement réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la désinscription de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désinscription de l\'événement'
    });
  }
});

// PUT /api/events/:id/participants/:userId/status - Mise à jour du statut de participation (admin et super admin seulement)
router.put('/:id/participants/:userId/status', requireResourceAccess('event'), requireRole(['admin', 'super_admin']), [
  body('status').isIn(['registered', 'attended', 'absent']).withMessage('Statut invalide')
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

    const eventId = req.params.id;
    const userId = req.params.userId;
    const { status } = req.body;

    // Vérification que l'inscription existe
    const [registrations] = await pool.execute(
      'SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inscription non trouvée'
      });
    }

    // Mise à jour du statut
    await pool.execute(
      'UPDATE event_participants SET status = ? WHERE event_id = ? AND user_id = ?',
      [status, eventId, userId]
    );

    res.json({
      success: true,
      message: 'Statut de participation mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

module.exports = router;
