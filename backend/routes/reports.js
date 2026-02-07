const express = require('express');
const { query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireOrganizationAccess } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// GET /api/reports/dashboard - Tableau de bord principal
router.get('/dashboard', requireOrganizationAccess, [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Période invalide')
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

    const period = req.query.period || 'month';
    const organizationId = req.user.role === 'admin' ? req.user.organizationId : null;

    // Calcul des dates selon la période
    let startDate, endDate = new Date();
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    let whereClause = 'WHERE is_active = TRUE';
    let params = [];

    // Filtrage par organisation
    if (organizationId) {
      whereClause += ' AND organization_id = ?';
      params.push(organizationId);
    }

    // Statistiques des membres
    const [memberStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count,
        COUNT(CASE WHEN created_at >= ? THEN 1 END) as new_members,
        COUNT(CASE WHEN last_login >= ? THEN 1 END) as active_members
      FROM users
      ${whereClause}
    `, [startDateStr, startDateStr, ...params]);

    // Statistiques des événements
    const [eventStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_date >= CURDATE() THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN event_date BETWEEN ? AND CURDATE() THEN 1 END) as past_events,
        COUNT(CASE WHEN event_date >= ? THEN 1 END) as new_events,
        COALESCE(SUM(max_participants), 0) as total_capacity
      FROM events
      ${whereClause}
    `, [startDateStr, startDateStr, ...params]);

    // Statistiques des contributions
    const [contributionStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_contributions,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount,
        COUNT(CASE WHEN contribution_date BETWEEN ? AND ? THEN 1 END) as recent_contributions,
        COALESCE(SUM(CASE WHEN contribution_date BETWEEN ? AND ? THEN amount END), 0) as recent_amount
      FROM contributions
      ${whereClause} AND is_verified = TRUE
    `, [startDateStr, endDateStr, startDateStr, endDateStr, ...params]);

    // Derniers événements
    const [recentEvents] = await pool.execute(`
      SELECT 
        id, title, event_date, location,
        COUNT(DISTINCT ep.id) as participant_count
      FROM events
      LEFT JOIN event_participants ep ON events.id = ep.event_id
      ${whereClause}
      ORDER BY event_date DESC
      LIMIT 5
    `, params);

    // Dernières contributions
    const [recentContributions] = await pool.execute(`
      SELECT 
        c.id, c.amount, c.type, c.contribution_date,
        u.first_name, u.last_name
      FROM contributions c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause} AND c.is_verified = TRUE
      ORDER BY c.contribution_date DESC
      LIMIT 5
    `, params);

    // Évolution des contributions (derniers 6 mois)
    const [contributionEvolution] = await pool.execute(`
      SELECT 
        DATE_FORMAT(contribution_date, '%Y-%m') as month,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM contributions
      ${whereClause} AND is_verified = TRUE AND contribution_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(contribution_date, '%Y-%m')
      ORDER BY month ASC
    `, params);

    res.json({
      success: true,
      data: {
        period,
        members: memberStats[0],
        events: eventStats[0],
        contributions: contributionStats[0],
        recentEvents,
        recentContributions,
        contributionEvolution
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du tableau de bord:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du tableau de bord'
    });
  }
});

// GET /api/reports/members - Rapport des membres
router.get('/members', requireRole(['admin', 'super_admin']), requireOrganizationAccess, [
  query('startDate').optional().isISO8601().withMessage('La date de début est invalide'),
  query('endDate').optional().isISO8601().withMessage('La date de fin est invalide'),
  query('role').optional().isIn(['admin', 'member']).withMessage('Rôle invalide'),
  query('isActive').optional().isBoolean().withMessage('Le statut doit être un booléen')
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

    const { startDate, endDate, role, isActive } = req.query;
    const organizationId = req.user.role === 'admin' ? req.user.organizationId : null;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // Filtrage par organisation
    if (organizationId) {
      whereClause += ' AND organization_id = ?';
      params.push(organizationId);
    }

    // Filtrage par dates
    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    // Filtrage par rôle
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    // Filtrage par statut
    if (isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true');
    }

    // Statistiques générales
    const [generalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count,
        COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_count,
        COUNT(CASE WHEN last_login >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as active_count,
        COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_count
      FROM users
      ${whereClause}
    `, params);

    // Membres par mois
    const [memberEvolution] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_members
      FROM users
      ${whereClause}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `, params);

    // Liste des membres
    const [members] = await pool.execute(`
      SELECT 
        id, first_name, last_name, email, phone, role,
        is_active, email_verified, last_login, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 100
    `, params);

    res.json({
      success: true,
      data: {
        general: generalStats[0],
        evolution: memberEvolution,
        members
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport des membres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport des membres'
    });
  }
});

// GET /api/reports/events - Rapport des événements
router.get('/events', requireRole(['admin', 'super_admin']), requireOrganizationAccess, [
  query('startDate').optional().isISO8601().withMessage('La date de début est invalide'),
  query('endDate').optional().isISO8601().withMessage('La date de fin est invalide'),
  query('status').optional().isIn(['upcoming', 'past', 'all']).withMessage('Statut invalide')
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

    const { startDate, endDate, status } = req.query;
    const organizationId = req.user.role === 'admin' ? req.user.organizationId : null;

    let whereClause = 'WHERE is_active = TRUE';
    let params = [];

    // Filtrage par organisation
    if (organizationId) {
      whereClause += ' AND organization_id = ?';
      params.push(organizationId);
    }

    // Filtrage par dates
    if (startDate) {
      whereClause += ' AND event_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND event_date <= ?';
      params.push(endDate);
    }

    // Filtrage par statut
    if (status === 'upcoming') {
      whereClause += ' AND event_date >= CURDATE()';
    } else if (status === 'past') {
      whereClause += ' AND event_date < CURDATE()';
    }

    // Statistiques générales
    const [generalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_date >= CURDATE() THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN event_date < CURDATE() THEN 1 END) as past_events,
        COALESCE(AVG(max_participants), 0) as average_capacity,
        COALESCE(SUM(max_participants), 0) as total_capacity
      FROM events
      ${whereClause}
    `, params);

    // Participation aux événements
    const [participationStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT ep.id) as total_participations,
        COUNT(DISTINCT CASE WHEN ep.status = 'attended' THEN ep.id END) as attended_count,
        COUNT(DISTINCT CASE WHEN ep.status = 'registered' THEN ep.id END) as registered_count,
        COUNT(DISTINCT ep.user_id) as unique_participants
      FROM events e
      LEFT JOIN event_participants ep ON e.id = ep.event_id
      ${whereClause}
    `, params);

    // Événements par mois
    const [eventEvolution] = await pool.execute(`
      SELECT 
        DATE_FORMAT(event_date, '%Y-%m') as month,
        COUNT(*) as event_count
      FROM events
      ${whereClause}
      GROUP BY DATE_FORMAT(event_date, '%Y-%m')
      ORDER BY month ASC
    `, params);

    // Liste des événements
    const [events] = await pool.execute(`
      SELECT 
        id, title, event_date, location, max_participants, created_at,
        (SELECT COUNT(*) FROM event_participants WHERE event_id = events.id) as participant_count,
        (SELECT COUNT(*) FROM event_participants WHERE event_id = events.id AND status = 'attended') as attended_count
      FROM events
      ${whereClause}
      ORDER BY event_date DESC
      LIMIT 50
    `, params);

    res.json({
      success: true,
      data: {
        general: generalStats[0],
        participation: participationStats[0],
        evolution: eventEvolution,
        events
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport des événements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport des événements'
    });
  }
});

// GET /api/reports/financial - Rapport financier
router.get('/financial', requireRole(['admin', 'super_admin']), requireOrganizationAccess, [
  query('startDate').optional().isISO8601().withMessage('La date de début est invalide'),
  query('endDate').optional().isISO8601().withMessage('La date de fin est invalide'),
  query('type').optional().isIn(['donation', 'tithe', 'offering', 'other']).withMessage('Type invalide'),
  query('groupBy').optional().isIn(['month', 'quarter', 'year']).withMessage('Groupement invalide')
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

    const { startDate, endDate, type, groupBy = 'month' } = req.query;
    const organizationId = req.user.role === 'admin' ? req.user.organizationId : null;

    let whereClause = 'WHERE is_active = TRUE AND is_verified = TRUE';
    let params = [];

    // Filtrage par organisation
    if (organizationId) {
      whereClause += ' AND organization_id = ?';
      params.push(organizationId);
    }

    // Filtrage par dates
    if (startDate) {
      whereClause += ' AND contribution_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND contribution_date <= ?';
      params.push(endDate);
    }

    // Filtrage par type
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // Statistiques générales
    const [generalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_contributions,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount,
        COALESCE(MIN(amount), 0) as min_amount,
        COALESCE(MAX(amount), 0) as max_amount
      FROM contributions
      ${whereClause}
    `, params);

    // Répartition par type
    const [typeStats] = await pool.execute(`
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount
      FROM contributions
      ${whereClause}
      GROUP BY type
      ORDER BY total_amount DESC
    `, params);

    // Répartition par méthode de paiement
    const [paymentStats] = await pool.execute(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM contributions
      ${whereClause}
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, params);

    // Évolution temporelle
    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'quarter':
        dateFormat = '%Y-Q%u';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
    }

    const [timeEvolution] = await pool.execute(`
      SELECT 
        DATE_FORMAT(contribution_date, '${dateFormat}') as period,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount
      FROM contributions
      ${whereClause}
      GROUP BY DATE_FORMAT(contribution_date, '${dateFormat}')
      ORDER BY period ASC
    `, params);

    // Top contributeurs
    const [topContributors] = await pool.execute(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email,
        COUNT(*) as contribution_count,
        COALESCE(SUM(c.amount), 0) as total_amount,
        COALESCE(AVG(c.amount), 0) as average_amount,
        MAX(c.contribution_date) as last_contribution
      FROM contributions c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY total_amount DESC
      LIMIT 20
    `, params);

    res.json({
      success: true,
      data: {
        general: generalStats[0],
        byType: typeStats,
        byPaymentMethod: paymentStats,
        timeEvolution,
        topContributors
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport financier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport financier'
    });
  }
});

// GET /api/reports/export - Export de données
router.get('/export', requireRole(['admin', 'super_admin']), requireOrganizationAccess, [
  query('type').isIn(['members', 'events', 'contributions']).withMessage('Type d\'export invalide'),
  query('format').isIn(['json', 'csv']).withMessage('Format d\'export invalide'),
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

    const { type, format, startDate, endDate } = req.query;
    const organizationId = req.user.role === 'admin' ? req.user.organizationId : null;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // Filtrage par organisation
    if (organizationId) {
      whereClause += ' AND organization_id = ?';
      params.push(organizationId);
    }

    // Filtrage par dates
    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    let query = '';
    let filename = '';

    switch (type) {
      case 'members':
        query = `
          SELECT 
            id, first_name, last_name, email, phone, role,
            is_active, email_verified, last_login, created_at
          FROM users
          ${whereClause}
          ORDER BY created_at DESC
        `;
        filename = `members_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'events':
        query = `
          SELECT 
            id, title, description, event_date, location, 
            max_participants, created_at
          FROM events
          ${whereClause}
          ORDER BY event_date DESC
        `;
        filename = `events_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'contributions':
        whereClause += ' AND is_verified = TRUE';
        query = `
          SELECT 
            id, amount, type, payment_method, description, 
            contribution_date, created_at
          FROM contributions
          ${whereClause}
          ORDER BY contribution_date DESC
        `;
        filename = `contributions_${new Date().toISOString().split('T')[0]}`;
        break;
    }

    const [data] = await pool.execute(query, params);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        totalRecords: data.length
      });
    } else if (format === 'csv') {
      // Conversion en CSV simple
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const value = row[header];
              // Échapper les valeurs contenant des virgules ou des guillemets
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ];
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csvRows.join('\n'));
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send('');
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données'
    });
  }
});

module.exports = router;
