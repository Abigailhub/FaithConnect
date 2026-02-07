const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FaithConnect API',
      version: '1.0.0',
      description: 'API pour la plateforme FaithConnect - Gestion d\'Association / Mosquée / Église',
      contact: {
        name: 'FaithConnect Team',
        email: 'contact@faithconnect.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-api-domain.com/api' 
          : 'http://localhost:3000/api',
        description: process.env.NODE_ENV === 'production' ? 'Serveur de production' : 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur'
            },
            firstName: {
              type: 'string',
              description: 'Prénom de l\'utilisateur'
            },
            lastName: {
              type: 'string',
              description: 'Nom de l\'utilisateur'
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'member'],
              description: 'Rôle de l\'utilisateur'
            },
            phone: {
              type: 'string',
              description: 'Numéro de téléphone'
            },
            isActive: {
              type: 'boolean',
              description: 'Statut d\'activité du compte'
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email vérifié ou non'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Dernière connexion'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            }
          }
        },
        Organization: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'organisation'
            },
            name: {
              type: 'string',
              description: 'Nom de l\'organisation'
            },
            type: {
              type: 'string',
              enum: ['mosque', 'church', 'association'],
              description: 'Type d\'organisation'
            },
            address: {
              type: 'string',
              description: 'Adresse de l\'organisation'
            },
            phone: {
              type: 'string',
              description: 'Numéro de téléphone'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de contact'
            },
            description: {
              type: 'string',
              description: 'Description de l\'organisation'
            },
            isActive: {
              type: 'boolean',
              description: 'Statut d\'activité'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'événement'
            },
            title: {
              type: 'string',
              description: 'Titre de l\'événement'
            },
            description: {
              type: 'string',
              description: 'Description de l\'événement'
            },
            eventDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date et heure de l\'événement'
            },
            location: {
              type: 'string',
              description: 'Lieu de l\'événement'
            },
            maxParticipants: {
              type: 'integer',
              description: 'Nombre maximum de participants'
            },
            isActive: {
              type: 'boolean',
              description: 'Statut d\'activité'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            }
          }
        },
        Contribution: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de la contribution'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Montant de la contribution'
            },
            type: {
              type: 'string',
              enum: ['donation', 'tithe', 'offering', 'other'],
              description: 'Type de contribution'
            },
            paymentMethod: {
              type: 'string',
              enum: ['cash', 'bank_transfer', 'mobile_money', 'check', 'online'],
              description: 'Méthode de paiement'
            },
            description: {
              type: 'string',
              description: 'Description de la contribution'
            },
            contributionDate: {
              type: 'string',
              format: 'date',
              description: 'Date de la contribution'
            },
            isVerified: {
              type: 'boolean',
              description: 'Statut de vérification'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Message d\'erreur'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Champ concerné'
                  },
                  message: {
                    type: 'string',
                    description: 'Message d\'erreur spécifique'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Message de succès'
            },
            data: {
              type: 'object',
              description: 'Données retournées'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Mot de passe'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Connexion réussie'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT token'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './routes/*.js', // Chemin vers les fichiers de routes
    './server.js'     // Chemin vers le fichier principal
  ]
};

const specs = swaggerJsdoc(options);

const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FaithConnect API Documentation'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerUiOptions
};
