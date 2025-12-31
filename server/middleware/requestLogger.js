/**
 * 请求日志中间件
 * Request Logging Middleware
 */

const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 记录请求开始
  logger.http('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
}

module.exports = requestLogger;
