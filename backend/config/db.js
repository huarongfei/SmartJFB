/**
 * Database configuration (File-based storage for demo purposes)
 */

const fs = require('fs').promises;
const path = require('path');

// Data directory
const DATA_DIR = path.join(__dirname, '..', 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize files if they don't exist
    const initFiles = [
      { path: GAMES_FILE, default: [] },
      { path: USERS_FILE, default: [
        {
          id: 1,
          username: 'admin',
          email: 'admin@smartjfb.com',
          password_hash: '$2a$10$9c6UvYTyCXfEMvt5fXo9kedBg3C7Q/Z0yqCQZbgYvSdxR8sKFoN2O', // 'password123' hashed
          role: 'admin',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          username: 'operator',
          email: 'operator@smartjfb.com',
          password_hash: '$2a$10$9c6UvYTyCXfEMvt5fXo9kedBg3C7Q/Z0yqCQZbgYvSdxR8sKFoN2O', // 'password123' hashed
          role: 'operator',
          created_at: new Date().toISOString()
        }
      ]}
    ];
    
    for (const file of initFiles) {
      try {
        await fs.access(file.path);
      } catch {
        // File doesn't exist, create it with default content
        await fs.writeFile(file.path, JSON.stringify(file.default, null, 2));
      }
    }
  } catch (error) {
    console.error('Error initializing data directory:', error);
  }
}

ensureDataDir();

// Generic file-based DB operations
class FileDB {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async read() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${this.filePath}:`, error);
      return [];
    }
  }

  async write(data) {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${this.filePath}:`, error);
    }
  }

  async find(filterFn) {
    const items = await this.read();
    return items.filter(filterFn);
  }

  async findOne(filterFn) {
    const items = await this.read();
    return items.find(filterFn);
  }

  async findById(id) {
    const items = await this.read();
    return items.find(item => item.id == id);
  }

  async insert(item) {
    const items = await this.read();
    items.push(item);
    await this.write(items);
    return item;
  }

  async updateById(id, updateData) {
    const items = await this.read();
    const index = items.findIndex(item => item.id == id);
    
    if (index !== -1) {
      items[index] = { ...items[index], ...updateData, updated_at: new Date().toISOString() };
      await this.write(items);
      return items[index];
    }
    
    return null;
  }

  async deleteById(id) {
    const items = await this.read();
    const index = items.findIndex(item => item.id == id);
    
    if (index !== -1) {
      const deletedItem = items.splice(index, 1)[0];
      await this.write(items);
      return deletedItem;
    }
    
    return null;
  }
}

// Create instances for each entity
const gamesDB = new FileDB(GAMES_FILE);
const usersDB = new FileDB(USERS_FILE);

module.exports = {
  games: gamesDB,
  users: usersDB,
  ensureDataDir
};