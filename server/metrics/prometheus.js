/**
 * Prometheus 监控指标
 * Prometheus Monitoring Metrics
 */

const logger = require('../utils/logger');
const configManager = require('../config');

class PrometheusMetrics {
  constructor() {
    this.metrics = {
      counters: new Map(),
      gauges: new Map(),
      histograms: new Map(),
      summaries: new Map()
    };

    this.initialized = false;
  }

  initialize() {
    if (!configManager.get('monitoring.enabled')) {
      logger.info('Monitoring is disabled');
      return this;
    }

    // 初始化核心指标
    this.createCounter('http_requests_total', 'Total HTTP requests', ['method', 'route', 'status']);
    this.createCounter('http_request_duration_ms', 'HTTP request duration', ['method', 'route']);
    this.createCounter('websocket_connections_total', 'Total WebSocket connections', ['status']);
    this.createCounter('websocket_messages_total', 'Total WebSocket messages', ['direction', 'type']);

    this.createGauge('active_websocket_connections', 'Active WebSocket connections');
    this.createGauge('memory_usage_bytes', 'Memory usage in bytes', ['type']);
    this.createGauge('cpu_usage_percent', 'CPU usage percentage');
    this.createGauge('match_status', 'Current match status', ['sport']);

    this.createHistogram('api_response_time', 'API response time in seconds', ['endpoint'], [0.1, 0.5, 1, 2, 5]);

    this.initialized = true;
    logger.info('Prometheus metrics initialized');

    // 定期更新系统指标
    setInterval(() => this.updateSystemMetrics(), 10000); // 每10秒

    return this;
  }

  createCounter(name, help, labels = []) {
    this.metrics.counters.set(name, {
      name,
      help,
      labels,
      value: 0,
      labelValues: new Map()
    });
  }

  createGauge(name, help, labels = []) {
    this.metrics.gauges.set(name, {
      name,
      help,
      labels,
      value: 0,
      labelValues: new Map()
    });
  }

  createHistogram(name, help, labels = [], buckets = []) {
    this.metrics.histograms.set(name, {
      name,
      help,
      labels,
      buckets,
      value: 0,
      labelValues: new Map()
    });
  }

  incrementCounter(name, labels = {}, value = 1) {
    if (!this.initialized) return;

    const counter = this.metrics.counters.get(name);
    if (!counter) return;

    const labelKey = this.getLabelKey(labels);
    const current = counter.labelValues.get(labelKey) || 0;
    counter.labelValues.set(labelKey, current + value);
    counter.value += value;
  }

  setGauge(name, value, labels = {}) {
    if (!this.initialized) return;

    const gauge = this.metrics.gauges.get(name);
    if (!gauge) return;

    const labelKey = this.getLabelKey(labels);
    gauge.labelValues.set(labelKey, value);
    gauge.value = value;
  }

  observeHistogram(name, value, labels = {}) {
    if (!this.initialized) return;

    const histogram = this.metrics.histograms.get(name);
    if (!histogram) return;

    const labelKey = this.getLabelKey(labels);
    const current = histogram.labelValues.get(labelKey) || { count: 0, sum: 0, values: [] };
    current.count++;
    current.sum += value;
    current.values.push(value);
    histogram.labelValues.set(labelKey, current);
    histogram.value = value;
  }

  getLabelKey(labels) {
    return Object.keys(labels)
      .sort()
      .map(key => `${key}="${labels[key]}"`)
      .join(',');
  }

  updateSystemMetrics() {
    if (!this.initialized) return;

    const memoryUsage = process.memoryUsage();

    this.setGauge('memory_usage_bytes', memoryUsage.heapUsed, { type: 'heap_used' });
    this.setGauge('memory_usage_bytes', memoryUsage.heapTotal, { type: 'heap_total' });
    this.setGauge('memory_usage_bytes', memoryUsage.rss, { type: 'rss' });

    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // 微秒转秒
    this.setGauge('cpu_usage_percent', cpuPercent);
  }

  formatMetrics() {
    let output = '';

    // 格式化 Counters
    for (const [name, counter] of this.metrics.counters) {
      output += `# HELP ${name} ${counter.help}\n`;
      output += `# TYPE ${name} counter\n`;

      for (const [labelKey, value] of counter.labelValues) {
        const labels = labelKey ? `{${labelKey}}` : '';
        output += `${name}${labels} ${value}\n`;
      }
      output += '\n';
    }

    // 格式化 Gauges
    for (const [name, gauge] of this.metrics.gauges) {
      output += `# HELP ${name} ${gauge.help}\n`;
      output += `# TYPE ${name} gauge\n`;

      for (const [labelKey, value] of gauge.labelValues) {
        const labels = labelKey ? `{${labelKey}}` : '';
        output += `${name}${labels} ${value}\n`;
      }
      output += '\n';
    }

    // 格式化 Histograms
    for (const [name, histogram] of this.metrics.histograms) {
      output += `# HELP ${name} ${histogram.help}\n`;
      output += `# TYPE ${name} histogram\n`;

      for (const [labelKey, data] of histogram.labelValues) {
        const labels = labelKey ? `{${labelKey}}` : '';
        output += `${name}_count${labels} ${data.count}\n`;
        output += `${name}_sum${labels} ${data.sum}\n`;
        output += `${name}_bucket${labels}{le="+Inf"} ${data.count}\n`;
      }
      output += '\n';
    }

    return output;
  }

  getMetrics() {
    return this.formatMetrics();
  }
}

// 创建单例实例
const prometheusMetrics = new PrometheusMetrics();

module.exports = prometheusMetrics;
