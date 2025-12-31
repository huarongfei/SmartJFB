/**
 * 速率限制中间件
 * Rate Limiting Middleware
 */

const logger = require('../utils/logger');
const configManager = require('../config');

class RateLimiter {
  constructor() {
    this.clients = new Map();
    this.windowMs = configManager.get('rateLimit.windowMs');
    this.maxRequests = configManager.get('rateLimit.max');
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }

  getClientKey(req) {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  cleanup() {
    const now = Date.now();
    for (const [key, client] of this.clients.entries()) {
      if (now - client.resetTime > this.windowMs) {
        this.clients.delete(key);
      }
    }
  }

  checkLimit(req, res, next) {
    const key = this.getClientKey(req);
    const now = Date.now();
    const client = this.clients.get(key);

    if (!client) {
      this.clients.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return next();
    }

    // 重置过期窗口
    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + this.windowMs;
      return next();
    }

    // 检查是否超过限制
    if (client.count >= this.maxRequests) {
      logger.warn({
        message: 'Rate limit exceeded',
        ip: key,
        count: client.count,
        limit: this.maxRequests,
        resetTime: new Date(client.resetTime).toISOString()
      });

      return res.status(429).json({
        success: false,
        error: {
          message: '请求过于频繁，请稍后再试',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        retryAfter: Math.ceil((client.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      });
    }

    client.count++;
    next();
  }

  middleware() {
    return this.checkLimit.bind(this);
  }
}

// 创建速率限制器实例
const rateLimiter = new RateLimiter();

module.exports = rateLimiter.middleware.bind(rateLimiter);
