/**
 * 配置管理中心
 * Centralized Configuration Management
 */

const path = require('path');
const fs = require('fs').promises;

class ConfigManager {
  constructor() {
    this.config = {
      server: {
        port: process.env.API_PORT || 3001,
        env: process.env.NODE_ENV || 'development',
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        algorithm: 'HS256'
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        dir: path.join(__dirname, '../../logs')
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        port: process.env.MONITORING_PORT || 9090,
        path: '/metrics'
      },
      database: {
        type: process.env.DB_TYPE || 'file', // 'file' | 'mongodb' | 'postgresql'
        connectionString: process.env.DB_CONNECTION_STRING || './data',
        backupInterval: parseInt(process.env.DB_BACKUP_INTERVAL || '3600000') // 1小时
      },
      redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || ''
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15分钟
        max: parseInt(process.env.RATE_LIMIT_MAX || '100') // 每个IP最多100次请求
      }
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this;

    // 确保日志目录存在
    try {
      await fs.mkdir(this.config.logging.dir, { recursive: true });
      await fs.mkdir(path.join(__dirname, '../../data'), { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error.message);
    }

    this.initialized = true;
    return this;
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }

  isDevelopment() {
    return this.config.server.env === 'development';
  }

  isProduction() {
    return this.config.server.env === 'production';
  }
}

// 导出单例实例
const configManager = new ConfigManager();

module.exports = configManager;
