const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware d'authentification JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupération de l'utilisateur depuis la base de données
    const [users] = await pool.execute(
      'SELECT id, email, role, organization_id, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte utilisateur désactivé'
      });
    }

    // Ajout des informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification'
    });
  }
};

// Middleware de vérification des rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour cette action'
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur peut accéder à son organisation
const requireOrganizationAccess = async (req, res, next) => {
  try {
    // Les super admins peuvent accéder à toutes les organisations
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Les admins et membres doivent appartenir à une organisation
    if (!req.user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Aucune organisation associée à cet utilisateur'
      });
    }

    // Vérification que l'organisation existe et est active
    const [organizations] = await pool.execute(
      'SELECT id, is_active FROM organizations WHERE id = ? AND is_active = TRUE',
      [req.user.organizationId]
    );

    if (organizations.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Organisation non trouvée ou inactive'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur de vérification d\'organisation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'organisation'
    });
  }
};

// Middleware pour vérifier l'accès à une ressource spécifique
const requireResourceAccess = (resourceType, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID de ressource requis'
        });
      }

      // Les super admins ont accès à tout
      if (req.user.role === 'super_admin') {
        return next();
      }

      let query = '';
      let params = [];

      switch (resourceType) {
        case 'user':
          query = 'SELECT organization_id FROM users WHERE id = ?';
          params = [resourceId];
          break;
        case 'event':
          query = 'SELECT organization_id FROM events WHERE id = ?';
          params = [resourceId];
          break;
        case 'contribution':
          query = 'SELECT organization_id FROM contributions WHERE id = ?';
          params = [resourceId];
          break;
        case 'organization':
          // Pour les organisations, vérifier que l'utilisateur y a accès
          if (req.user.role === 'admin' && resourceId != req.user.organizationId) {
            return res.status(403).json({
              success: false,
              message: 'Accès limité à votre organisation'
            });
          }
          return next();
        default:
          return res.status(400).json({
            success: false,
            message: 'Type de ressource non valide'
          });
      }

      const [resources] = await pool.execute(query, params);

      if (resources.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ressource non trouvée'
        });
      }

      const resource = resources[0];

      // Vérifier que l'utilisateur a accès à cette organisation
      if (req.user.role === 'admin' && resource.organization_id != req.user.organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette ressource'
        });
      }

      // Pour les membres, vérifier que la ressource leur appartient ou est dans leur organisation
      if (req.user.role === 'member') {
        if (resourceType === 'user' && resourceId != req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Accès limité à vos propres informations'
          });
        }
        
        if (resource.organization_id != req.user.organizationId) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à cette ressource'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Erreur de vérification d\'accès à la ressource:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOrganizationAccess,
  requireResourceAccess
};
