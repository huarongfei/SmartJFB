/**
 * 导出模块 JavaScript
 * 处理数据导出功能
 */

class ExportManager {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.exportHistory = JSON.parse(localStorage.getItem('exportHistory') || '[]');
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderExportHistory();
  }

  bindEvents() {
    // 返回按钮
    document.getElementById('backBtn').addEventListener('click', () => {
      window.history.back();
    });

    // 导出按钮
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.dataset.type;
        const format = btn.dataset.format;
        this.exportData(type, format);
      });
    });

    // 批量导出
    document.getElementById('batchExportBtn').addEventListener('click', () => {
      this.batchExport();
    });

    // 模态框关闭
    document.querySelector('.close-btn').addEventListener('click', () => {
      this.closeModal();
    });

    // 点击模态框外部关闭
    document.getElementById('exportModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });
  }

  /**
   * 导出数据
   * @param {string} type - 导出类型
   * @param {string} format - 导出格式 (excel, csv, pdf)
   */
  async exportData(type, format) {
    const typeNames = {
      'summary': '比赛摘要',
      'team-stats': '球队统计',
      'player-stats': '球员统计',
      'playbyplay': '事件序列',
      'all': '完整数据'
    };

    this.showModal(`${typeNames[type]} (${format.toUpperCase()})`, '正在生成文件...');

    try {
      const endpoint = `/export/${type}`;
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;

      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // 记录导出历史
      this.addToHistory(type, format, filename);

      this.closeModal();
      this.showSuccess(`${typeNames[type]}导出成功！`);

    } catch (error) {
      console.error('导出错误:', error);
      this.closeModal();
      this.showError(`导出失败: ${error.message}`);
    }
  }

  /**
   * 批量导出所有格式
   */
  async batchExport() {
    const types = ['summary', 'team-stats', 'player-stats', 'playbyplay'];
    const formats = ['excel', 'csv'];

    let completed = 0;
    const total = types.length * formats.length;

    this.showModal('批量导出', `正在导出 ${total} 个文件...`);

    for (const type of types) {
      for (const format of formats) {
        try {
          await this.exportData(type, format);
          completed++;
          this.updateProgress(completed, total);
        } catch (error) {
          console.error(`批量导出失败 (${type}-${format}):`, error);
        }
      }
    }

    this.closeModal();
    this.showSuccess(`批量导出完成！共导出 ${completed}/${total} 个文件`);
  }

  /**
   * 添加到导出历史
   */
  addToHistory(type, format, filename) {
    const historyItem = {
      id: Date.now(),
      type,
      format,
      filename,
      timestamp: new Date().toLocaleString('zh-CN')
    };

    this.exportHistory.unshift(historyItem);
    // 保留最近20条记录
    if (this.exportHistory.length > 20) {
      this.exportHistory = this.exportHistory.slice(0, 20);
    }

    localStorage.setItem('exportHistory', JSON.stringify(this.exportHistory));
    this.renderExportHistory();
  }

  /**
   * 渲染导出历史
   */
  renderExportHistory() {
    const container = document.getElementById('exportHistory');

    if (this.exportHistory.length === 0) {
      container.innerHTML = '<p class="empty">暂无导出记录</p>';
      return;
    }

    const typeNames = {
      'summary': '比赛摘要',
      'team-stats': '球队统计',
      'player-stats': '球员统计',
      'playbyplay': '事件序列',
      'all': '完整数据'
    };

    container.innerHTML = this.exportHistory.map(item => `
      <div class="history-item">
        <div class="history-info">
          <span class="history-type">${typeNames[item.type] || item.type}</span>
          <span class="history-format badge ${item.format}">${item.format.toUpperCase()}</span>
        </div>
        <div class="history-meta">
          <span class="history-filename">${item.filename}</span>
          <span class="history-time">${item.timestamp}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * 显示模态框
   */
  showModal(title, text) {
    const modal = document.getElementById('exportModal');
    const titleEl = modal.querySelector('h3');
    const progressText = modal.querySelector('.progress-text');

    titleEl.textContent = title;
    progressText.textContent = text;

    modal.classList.add('show');
  }

  /**
   * 关闭模态框
   */
  closeModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.remove('show');
  }

  /**
   * 更新进度
   */
  updateProgress(completed, total) {
    const percentage = (completed / total) * 100;
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `已导出 ${completed}/${total} 个文件 (${percentage.toFixed(0)}%)`;
  }

  /**
   * 显示成功消息
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * 显示错误消息
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // 动画显示
    setTimeout(() => toast.classList.add('show'), 10);

    // 自动消失
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}

// 初始化导出管理器
document.addEventListener('DOMContentLoaded', () => {
  new ExportManager();
});
