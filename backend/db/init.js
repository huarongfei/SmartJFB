/**
 * Database initialization script
 */

const { ensureDataDir } = require('../config/db');

async function initDatabase() {
  try {
    // Initialize file-based database
    await ensureDataDir();
    console.log('File-based database initialized successfully');
    
    // Default admin user is already created in the db.js file
    console.log('Default admin user is ready (Username: admin, Password: password123)');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;