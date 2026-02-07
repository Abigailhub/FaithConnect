const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  try {
    const connection = await pool.getConnection();
    
    // Générer le bon hash pour "member123"
    const correctHash = await bcrypt.hash('member123', 12);
    console.log('Nouveau hash pour member123:', correctHash);
    
    // Mettre à jour le mot de passe de Fatima
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [correctHash, 'fatima.alami@email.com']
    );
    
    console.log('Mise à jour effectuée:', result.affectedRows, 'ligne(s) modifiée(s)');
    
    // Vérifier le hash stocké
    const [users] = await connection.execute(
      'SELECT email, password_hash FROM users WHERE email = ?',
      ['fatima.alami@email.com']
    );
    
    if (users.length > 0) {
      console.log('Hash stocké dans la base:', users[0].password_hash);
      
      // Tester la vérification
      const isValid = await bcrypt.compare('member123', users[0].password_hash);
      console.log('Vérification du mot de passe:', isValid);
    }
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

fixPassword();
