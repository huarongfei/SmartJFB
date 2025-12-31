/**
 * 健康检查中间件
 * Health Check Middleware
 */

const fs = require('fs');
const os = require('os');

const metrics = {
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  cpu: process.cpuUsage(),
  timestamp: Date.now()
};

function getHealthStatus() {
  const uptimeHours = process.uptime() / 3600;
  const healthStatus = {
    status: 'healthy',
    uptime: `${uptimeHours.toFixed(2)}h`,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
    },
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalmem: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      freemem: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`
    },
    dependencies: {
      node: process.version,
      express: require('express/package.json').version,
      socketio: require('socket.io/package.json').version
    }
  };

  // 检查磁盘空间
  try {
    const stats = fs.statSync(process.cwd());
    healthStatus.disk = {
      available: 'N/A'
    };
  } catch (error) {
    healthStatus.disk = { error: 'Unable to check disk' };
  }

  return healthStatus;
}

function healthCheck(req, res) {
  const health = getHealthStatus();

  res.status(health.status === 'healthy' ? 200 : 503).json({
    success: true,
    data: health
  });
}

function healthCheckDetailed(req, res) {
  const health = getHealthStatus();

  // 添加更详细的健康检查
  const detailed = {
    ...health,
    processes: {
      nodeVersion: process.version,
      pid: process.pid,
      execPath: process.execPath
    },
    network: {
      hostname: os.hostname(),
      networkInterfaces: Object.keys(os.networkInterfaces())
    }
  };

  res.status(health.status === 'healthy' ? 200 : 503).json({
    success: true,
    data: detailed
  });
}

module.exports = {
  healthCheck,
  healthCheckDetailed,
  getHealthStatus
};
