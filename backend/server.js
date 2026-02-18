const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./config/database');
const { specs, swaggerUi, swaggerUiOptions } = require('./swagger');
require('dotenv').config();

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));

// Limitation des requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API FaithConnect',
    version: '1.0.0',
    status: 'active',
    documentation: '/api-docs'
  });
});

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, swaggerUiOptions));

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const contributionRoutes = require('./routes/contributions');
const organizationRoutes = require('./routes/organizations');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

const PORT = process.env.PORT || 3000;

// Initialisation de la base de données au démarrage
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur FaithConnect démarré sur le port ${PORT}`);
    console.log(`Environnement: ${process.env.NODE_ENV}`);
  });
}).catch(error => {
  console.error('Erreur lors de l\'initialisation de la base de données:', error);
  process.exit(1);
});

module.exports = app;
