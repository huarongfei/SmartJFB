/**
 * 统一错误处理中间件
 * Unified Error Handling Middleware
 */

const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源未找到') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error({
    error: {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // 响应客户端
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || '服务器内部错误',
      code: err.code || 'INTERNAL_ERROR',
      ...(isDevelopment && err.stack ? { stack: err.stack } : {})
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  logger.warn({
    message: 'Resource not found',
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip
    }
  });

  res.status(404).json({
    success: false,
    error: {
      message: '请求的资源不存在',
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * 异步路由包装器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};
