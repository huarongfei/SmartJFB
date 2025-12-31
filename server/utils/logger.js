/**
 * 统一日志工具
 * Unified Logging Utility
 */

const fs = require('fs');
const path = require('path');
const configManager = require('../config');

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4
    };
    this.currentLevel = this.levels[configManager.get('logging.level')] || this.levels.info;
    this.format = configManager.get('logging.format') || 'json';
    this.logDir = configManager.get('logging.dir');
  }

  formatMessage(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...meta
    };

    return this.format === 'json' ? JSON.stringify(logEntry) : `[${logEntry.timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  }

  writeLog(level, message, meta) {
    if (this.levels[level] > this.currentLevel) return;

    const formatted = this.formatMessage(level, message, meta);
    const logFile = path.join(this.logDir, `${level}.log`);

    // 控制台输出
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // 文件输出（异步）
    fs.appendFile(logFile, formatted + '\n', (err) => {
      if (err) console.error('Failed to write log:', err.message);
    });
  }

  error(message, meta = {}) {
    this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }

  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }

  http(message, meta = {}) {
    this.writeLog('http', message, meta);
  }

  debug(message, meta = {}) {
    this.writeLog('debug', message, meta);
  }

  // 创建子日志器
  child(context) {
    const childLogger = {
      error: (message, meta) => this.error(message, { ...context, ...meta }),
      warn: (message, meta) => this.warn(message, { ...context, ...meta }),
      info: (message, meta) => this.info(message, { ...context, ...meta }),
      http: (message, meta) => this.http(message, { ...context, ...meta }),
      debug: (message, meta) => this.debug(message, { ...context, ...meta })
    };
    return childLogger;
  }
}

// 创建并初始化日志器
const logger = new Logger();

module.exports = logger;
