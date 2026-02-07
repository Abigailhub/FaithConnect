-- Script de création de la base de données FaithConnect
-- Exécutez ce script pour créer la base de données et les tables initiales

CREATE DATABASE IF NOT EXISTS faithconnect;
USE faithconnect;

-- Table des organisations
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
);

-- Table des utilisateurs
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
);

-- Table des événements
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
);

-- Table des participations aux événements
CREATE TABLE IF NOT EXISTS event_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('registered', 'attended', 'absent') DEFAULT 'registered',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_user (event_id, user_id)
);

-- Table des contributions (dons)
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
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'event', 'contribution', 'system') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des groupes/sections
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
);

-- Table des appartenances aux groupes
CREATE TABLE IF NOT EXISTS group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('member', 'leader') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_group_user (group_id, user_id)
);

-- Index pour optimiser les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_contributions_organization ON contributions(organization_id);
CREATE INDEX idx_contributions_date ON contributions(contribution_date);
CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_user ON event_participants(user_id);

-- Insertion du super administrateur par défaut
-- Mot de passe: admin123 (à changer après la première connexion)
INSERT INTO users (first_name, last_name, email, password_hash, role, organization_id) 
VALUES (
  'Super', 
  'Administrateur', 
  'admin@faithconnect.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO6', -- admin123
  'super_admin', 
  NULL
) ON DUPLICATE KEY UPDATE email=email;

-- Exemple d'organisation de test
INSERT INTO organizations (name, type, address, phone, email, description) VALUES (
  'Mosquée Al-Fath',
  'mosque',
  '123 Rue de la Paix, 75001 Paris',
  '+33 1 23 45 67 89',
  'contact@mosquee-alfath.fr',
  'Mosquée communautaire dédiée à l\'éducation islamique et aux activités culturelles.'
) ON DUPLICATE KEY UPDATE name=name;

-- Exemple d'administrateur pour l'organisation de test
-- Mot de passe: admin123
INSERT INTO users (first_name, last_name, email, password_hash, role, organization_id, phone) 
SELECT 
  'Ahmed', 
  'Benali', 
  'admin@mosquee-alfath.fr', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO6', -- admin123
  'admin', 
  id,
  '+33 6 12 34 56 78'
FROM organizations 
WHERE name = 'Mosquée Al-Fath' 
LIMIT 1
ON DUPLICATE KEY UPDATE email=email;

-- Exemple de membre pour l'organisation de test
-- Mot de passe: member123
INSERT INTO users (first_name, last_name, email, password_hash, role, organization_id, phone) 
SELECT 
  'Fatima', 
  'Alami', 
  'fatima.alami@email.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO6', -- member123
  'member', 
  id,
  '+33 6 98 76 54 32'
FROM organizations 
WHERE name = 'Mosquée Al-Fath' 
LIMIT 1
ON DUPLICATE KEY UPDATE email=email;

-- Exemple d'événement
INSERT INTO events (organization_id, title, description, event_date, location, max_participants, created_by)
SELECT 
  o.id,
  'Cours d''arabe pour débutants',
  'Cours hebdomadaire d''apprentissage de la langue arabe pour adultes et enfants.',
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  'Salle principale',
  30,
  u.id
FROM organizations o
JOIN users u ON u.organization_id = o.id AND u.role = 'admin'
WHERE o.name = 'Mosquée Al-Fath'
LIMIT 1
ON DUPLICATE KEY UPDATE title=title;

-- Exemple de contribution
INSERT INTO contributions (organization_id, user_id, amount, type, payment_method, contribution_date, recorded_by, is_verified)
SELECT 
  o.id,
  u.id,
  50.00,
  'donation',
  'cash',
  CURDATE(),
  admin.id,
  TRUE
FROM organizations o
JOIN users u ON u.organization_id = o.id AND u.role = 'member'
JOIN users admin ON admin.organization_id = o.id AND admin.role = 'admin'
WHERE o.name = 'Mosquée Al-Fath'
LIMIT 1
ON DUPLICATE KEY UPDATE amount=amount;
