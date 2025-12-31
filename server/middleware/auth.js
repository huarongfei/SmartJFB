/**
 * 认证中间件
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const configManager = require('../config');
const logger = require('../utils/logger');
const { AuthenticationError } = require('./errorHandler');

/**
 * 生成JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, configManager.get('jwt.secret'), {
    expiresIn: configManager.get('jwt.expiresIn'),
    algorithm: configManager.get('jwt.algorithm')
  });
}

/**
 * 验证JWT Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, configManager.get('jwt.secret'), {
      algorithms: [configManager.get('jwt.algorithm')]
    });
  } catch (error) {
    return null;
  }
}

/**
 * 认证中间件
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        message: '未提供认证令牌',
        code: 'NO_TOKEN'
      },
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn({
      message: 'Invalid token attempt',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.status(401).json({
      success: false,
      error: {
        message: '认证令牌无效或已过期',
        code: 'INVALID_TOKEN'
      },
      timestamp: new Date().toISOString()
    });
  }

  req.user = decoded;
  next();
}

/**
 * 可选认证中间件（不强制要求）
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

/**
 * 角色检查中间件
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '需要认证',
          code: 'AUTHENTICATION_REQUIRED'
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        message: 'Unauthorized role access',
        user: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: {
          message: '权限不足',
          code: 'INSUFFICIENT_ROLE'
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * 管理员认证中间件
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  requireRole,
  requireAdmin
};
