const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'faithconnect',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données MySQL établie avec succès');
    
    // Test simple pour vérifier si la base est accessible
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('🔍 Test de requête réussi:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    console.error('📋 Détails de l\'erreur:', error.code || error.errno);
    return false;
  }
};

// Initialisation de la base de données (création des tables si elles n'existent pas)
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Création de la base de données si elle n'existe pas
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);
    
    // Création des tables
    await createTables(connection);
    
    console.log('Base de données initialisée avec succès');
    connection.release();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error.message);
    throw error;
  }
};

// Création des tables
const createTables = async (connection) => {
  // Table des organisations
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type ENUM('mosque', 'church', 'association') NOT NULL,
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  // Table des utilisateurs
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id INT,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50),
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('super_admin', 'admin', 'member') NOT NULL DEFAULT 'member',
      is_active BOOLEAN DEFAULT TRUE,
      email_verified BOOLEAN DEFAULT FALSE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    )
  `);

  // Table des événements
  await connection.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date DATETIME NOT NULL,
      location VARCHAR(255),
      max_participants INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table des participations aux événements
  await connection.query(`
    CREATE TABLE IF NOT EXISTS event_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      user_id INT NOT NULL,
      status ENUM('registered', 'attended', 'absent') DEFAULT 'registered',
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_event_user (event_id, user_id)
    )
  `);

  // Table des contributions (dons)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS contributions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id INT NOT NULL,
      user_id INT,
      amount DECIMAL(10,2) NOT NULL,
      type ENUM('donation', 'tithe', 'offering', 'other') NOT NULL,
      payment_method ENUM('cash', 'bank_transfer', 'mobile_money', 'check', 'online') DEFAULT 'cash',
      description TEXT,
      contribution_date DATE NOT NULL,
      recorded_by INT NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table des notifications
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'event', 'contribution', 'system') DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table des groupes/sections
  await connection.query(`
    CREATE TABLE IF NOT EXISTS groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      leader_id INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Table des appartenances aux groupes
  await connection.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      user_id INT NOT NULL,
      role ENUM('member', 'leader') DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_group_user (group_id, user_id)
    )
  `);

  // Insertion des données par défaut uniquement si elles n'existent pas
  await insertDefaultData(connection);

  console.log('📋 Tables vérifiées/créées avec succès');
};

// Insertion des données par défaut uniquement si elles n'existent pas
const insertDefaultData = async (connection) => {
  try {
    const defaultAdminPassword = 'admin123';
    const defaultMemberPassword = 'member123';

    const adminHash = await bcrypt.hash(defaultAdminPassword, 12);
    const memberHash = await bcrypt.hash(defaultMemberPassword, 12);

    // Vérifier si le super admin existe déjà
    const [existingSuperAdmin] = await connection.query(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@faithconnect.com', 'super_admin']
    );

    console.log('🔍 Vérification super admin:', existingSuperAdmin.length, 'trouvé(s)');

    if (existingSuperAdmin.length === 0) {
      // Insertion du super administrateur par défaut
      // Mot de passe: admin123 (à changer après la première connexion)
      await connection.query(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, organization_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          'Super',
          'Administrateur',
          'admin@faithconnect.com',
          adminHash,
          'super_admin',
          null
        ]
      );
      console.log('👤 Super administrateur par défaut créé');
    } else {
      console.log('👤 Super administrateur existe déjà');

      const [superAdminRow] = await connection.query(
        'SELECT id, password_hash FROM users WHERE email = ? AND role = ? LIMIT 1',
        ['admin@faithconnect.com', 'super_admin']
      );

      if (superAdminRow.length > 0) {
        const matches = await bcrypt.compare(defaultAdminPassword, superAdminRow[0].password_hash);
        if (!matches) {
          await connection.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [adminHash, superAdminRow[0].id]
          );
          console.log('🔐 Hash du super admin mis à jour');
        }
      }
    }

    // Vérifier si l'organisation de test existe
    const [existingOrg] = await connection.query(
      'SELECT id FROM organizations WHERE name = ?',
      ['Mosquée Al-Fath']
    );

    console.log('🔍 Vérification organisation:', existingOrg.length, 'trouvé(s)');

    let orgId;
    if (existingOrg.length === 0) {
      // Exemple d'organisation de test
      const [orgResult] = await connection.query(
        'INSERT INTO organizations (name, type, address, phone, email, description) VALUES (?, ?, ?, ?, ?, ?)',
        [
          'Mosquée Al-Fath',
          'mosque',
          '123 Rue de la Paix, 75001 Paris',
          '+33 1 23 45 67 89',
          'contact@mosquee-alfath.fr',
          'Mosquée communautaire dédiée à l\'éducation islamique et aux activités culturelles.'
        ]
      );
      orgId = orgResult.insertId;
      console.log('🏢 Organisation de test créée avec ID:', orgId);
    } else {
      orgId = existingOrg[0].id;
      console.log('🏢 Organisation existe déjà avec ID:', orgId);
    }

    // Vérifier si l'admin de test existe
    const [existingAdmin] = await connection.query(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@mosquee-alfath.fr', 'admin']
    );

    console.log('🔍 Vérification admin:', existingAdmin.length, 'trouvé(s)');

    if (existingAdmin.length === 0) {
      // Exemple d'administrateur pour l'organisation de test
      // Mot de passe: admin123
      await connection.query(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, organization_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          'Ahmed',
          'Benali',
          'admin@mosquee-alfath.fr',
          adminHash,
          'admin',
          orgId,
          '+33 6 12 34 56 78'
        ]
      );
      console.log('👤 Administrateur de test créé');
    } else {
      console.log('👤 Administrateur existe déjà');

      const [adminRow] = await connection.query(
        'SELECT id, password_hash FROM users WHERE email = ? AND role = ? LIMIT 1',
        ['admin@mosquee-alfath.fr', 'admin']
      );

      if (adminRow.length > 0) {
        const matches = await bcrypt.compare(defaultAdminPassword, adminRow[0].password_hash);
        if (!matches) {
          await connection.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [adminHash, adminRow[0].id]
          );
          console.log('🔐 Hash de l\'admin mis à jour');
        }
      }
    }

    // Vérifier si le membre de test existe
    const [existingMember] = await connection.query(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['fatima.alami@email.com', 'member']
    );

    console.log('🔍 Vérification membre:', existingMember.length, 'trouvé(s)');

    if (existingMember.length === 0) {
      // Exemple de membre pour l'organisation de test
      // Mot de passe: member123
      await connection.query(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, organization_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          'Fatima',
          'Alami',
          'fatima.alami@email.com',
          memberHash,
          'member',
          orgId,
          '+33 6 98 76 54 32'
        ]
      );
      console.log('👤 Membre de test créé');
    } else {
      console.log('👤 Membre existe déjà');

      const [memberRow] = await connection.query(
        'SELECT id, password_hash FROM users WHERE email = ? AND role = ? LIMIT 1',
        ['fatima.alami@email.com', 'member']
      );

      if (memberRow.length > 0) {
        const matches = await bcrypt.compare(defaultMemberPassword, memberRow[0].password_hash);
        if (!matches) {
          await connection.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [memberHash, memberRow[0].id]
          );
          console.log('🔐 Hash du membre mis à jour');
        }
      }
    }

    // Vérifier si l'événement de test existe
    const [existingEvent] = await connection.query(
      'SELECT id FROM events WHERE title = ? AND organization_id = ?',
      ['Cours d\'arabe pour débutants', orgId]
    );

    console.log('🔍 Vérification événement:', existingEvent.length, 'trouvé(s)');

    if (existingEvent.length === 0) {
      // Récupérer l'ID de l'admin pour l'événement
      const [adminUser] = await connection.query(
        'SELECT id FROM users WHERE organization_id = ? AND role = ?',
        [orgId, 'admin']
      );

      if (adminUser.length > 0) {
        // Exemple d'événement
        await connection.query(
          'INSERT INTO events (organization_id, title, description, event_date, location, max_participants, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            orgId,
            'Cours d\'arabe pour débutants',
            'Cours hebdomadaire d\'apprentissage de la langue arabe pour adultes et enfants.',
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
            'Salle principale',
            30,
            adminUser[0].id
          ]
        );
        console.log('📅 Événement de test créé');
      }
    } else {
      console.log('📅 Événement existe déjà');
    }

    // Vérifier si la contribution de test existe
    const [existingContribution] = await connection.query(
      'SELECT id FROM contributions WHERE organization_id = ? AND amount = ?',
      [orgId, 50.00]
    );

    console.log('🔍 Vérification contribution:', existingContribution.length, 'trouvé(s)');

    if (existingContribution.length === 0) {
      // Récupérer les IDs nécessaires pour la contribution
      const [memberUser] = await connection.query(
        'SELECT id FROM users WHERE organization_id = ? AND role = ?',
        [orgId, 'member']
      );
      const [adminUser] = await connection.query(
        'SELECT id FROM users WHERE organization_id = ? AND role = ?',
        [orgId, 'admin']
      );

      if (memberUser.length > 0 && adminUser.length > 0) {
        // Exemple de contribution
        await connection.query(
          'INSERT INTO contributions (organization_id, user_id, amount, type, payment_method, contribution_date, recorded_by, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            orgId,
            memberUser[0].id,
            50.00,
            'donation',
            'cash',
            new Date(),
            adminUser[0].id,
            true
          ]
        );
        console.log('💰 Contribution de test créée');
      }
    } else {
      console.log('💰 Contribution existe déjà');
    }

    // Vérification finale des utilisateurs
    const [allUsers] = await connection.query('SELECT email, role FROM users');
    console.log('👥 Liste des utilisateurs dans la base:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    console.log('📊 Données par défaut vérifiées/insérées avec succès');
  } catch (error) {
    console.error('⚠️ Erreur lors de l\'insertion des données par défaut:', error.message);
    // Ne pas bloquer le démarrage si les données par défaut ne peuvent pas être insérées
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
