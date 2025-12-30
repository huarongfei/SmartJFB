/**
 * 广告管理器 JavaScript
 */

class AdManager {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.ads = [];
    this.currentAd = null;
    this.filters = {
      position: 'all',
      type: 'all',
      status: 'all'
    };
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadAds();
  }

  bindEvents() {
    // 返回按钮
    document.getElementById('backBtn').addEventListener('click', () => {
      window.history.back();
    });

    // 添加广告
    document.getElementById('addAdBtn').addEventListener('click', () => {
      this.showAddModal();
    });

    // 重置统计
    document.getElementById('resetStatsBtn').addEventListener('click', () => {
      this.resetStatistics();
    });

    // 刷新
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadAds();
    });

    // 筛选器
    document.getElementById('positionFilter').addEventListener('change', (e) => {
      this.filters.position = e.target.value;
      this.filterAds();
    });

    document.getElementById('typeFilter').addEventListener('change', (e) => {
      this.filters.type = e.target.value;
      this.filterAds();
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.filterAds();
    });

    // 模态框
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.closeAllModals();
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveAd();
    });

    // 确认删除
    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
      document.getElementById('confirmModal').classList.remove('show');
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      this.deleteAd(this.currentAd);
    });
  }

  async loadAds() {
    try {
      const response = await fetch(`${this.apiBase}/ads`);
      const result = await response.json();
      this.ads = result.data || [];
      this.renderAds();
      this.updateStats();
    } catch (error) {
      console.error('加载广告失败:', error);
      this.showToast('加载广告失败', 'error');
    }
  }

  renderAds() {
    const grid = document.getElementById('adsGrid');
    const emptyState = document.getElementById('emptyState');

    const filteredAds = this.filterAdsList();

    if (filteredAds.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = filteredAds.map(ad => this.createAdCard(ad)).join('');

    // 绑定卡片事件
    grid.querySelectorAll('.ad-card').forEach(card => {
      const adId = card.dataset.id;
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.ad-actions button')) {
          this.showEditModal(adId);
        }
      });
    });
  }

  filterAdsList() {
    return this.ads.filter(ad => {
      if (this.filters.position !== 'all' && ad.position !== this.filters.position) {
        return false;
      }
      if (this.filters.type !== 'all' && ad.type !== this.filters.type) {
        return false;
      }
      if (this.filters.status === 'enabled' && !ad.enabled) {
        return false;
      }
      if (this.filters.status === 'disabled' && ad.enabled) {
        return false;
      }
      return true;
    });
  }

  createAdCard(ad) {
    const typeIcons = {
      'image': '🖼️',
      'video': '🎬',
      'text': '📝'
    };

    const positionLabels = {
      'top': '顶部',
      'bottom': '底部',
      'left': '左侧',
      'right': '右侧',
      'center': '中央',
      'fullscreen': '全屏'
    };

    const statusBadge = ad.enabled
      ? '<span class="badge badge-success">已启用</span>'
      : '<span class="badge badge-warning">已禁用</span>';

    return `
      <div class="ad-card" data-id="${ad.id}">
        <div class="ad-preview">
          <span class="ad-type-icon">${typeIcons[ad.type]}</span>
        </div>
        <div class="ad-info">
          <h4 class="ad-name">${ad.name}</h4>
          <div class="ad-meta">
            <span>📍 ${positionLabels[ad.position]}</span>
            <span>⏱️ ${ad.duration}秒</span>
            <span>⭐ 优先级${ad.priority}</span>
          </div>
          <div class="ad-stats">
            <span>播放次数: ${ad.displayCount || 0}</span>
            <span>${ad.lastPlayedAt ? '上次播放: ' + new Date(ad.lastPlayedAt).toLocaleString('zh-CN') : '未播放'}</span>
          </div>
        </div>
        <div class="ad-actions">
          <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); app.toggleAd('${ad.id}')">
            ${ad.enabled ? '禁用' : '启用'}
          </button>
          <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); app.previewAd('${ad.id}')">
            预览
          </button>
          <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); app.confirmDelete('${ad.id}')">
            删除
          </button>
        </div>
      </div>
    `;
  }

  showAddModal() {
    document.getElementById('modalTitle').textContent = '添加广告';
    document.getElementById('adForm').reset();
    document.getElementById('adId').value = '';
    document.getElementById('adModal').classList.add('show');
  }

  showEditModal(adId) {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) return;

    document.getElementById('modalTitle').textContent = '编辑广告';
    document.getElementById('adId').value = ad.id;
    document.getElementById('adName').value = ad.name;
    document.getElementById('adType').value = ad.type;
    document.getElementById('adPosition').value = ad.position;
    document.getElementById('adContent').value = ad.content;
    document.getElementById('adDuration').value = ad.duration;
    document.getElementById('adPriority').value = ad.priority;
    document.getElementById('adEnabled').checked = ad.enabled;

    document.getElementById('adModal').classList.add('show');
  }

  async saveAd() {
    const adId = document.getElementById('adId').value;
    const adData = {
      name: document.getElementById('adName').value,
      type: document.getElementById('adType').value,
      position: document.getElementById('adPosition').value,
      content: document.getElementById('adContent').value,
      duration: parseInt(document.getElementById('adDuration').value),
      priority: parseInt(document.getElementById('adPriority').value),
      enabled: document.getElementById('adEnabled').checked
    };

    try {
      const url = adId ? `${this.apiBase}/ads/${adId}` : `${this.apiBase}/ads`;
      const method = adId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adData)
      });

      const result = await response.json();

      if (result.success) {
        this.closeAllModals();
        this.loadAds();
        this.showToast(adId ? '广告已更新' : '广告已添加', 'success');
      } else {
        this.showToast(result.message, 'error');
      }
    } catch (error) {
      console.error('保存广告失败:', error);
      this.showToast('保存失败', 'error');
    }
  }

  async toggleAd(adId) {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) return;

    try {
      const response = await fetch(`${this.apiBase}/ads/${adId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !ad.enabled })
      });

      const result = await response.json();

      if (result.success) {
        this.loadAds();
        this.showToast(result.message, 'success');
      }
    } catch (error) {
      console.error('切换状态失败:', error);
      this.showToast('操作失败', 'error');
    }
  }

  previewAd(adId) {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) return;

    const previewContent = document.getElementById('previewContent');

    if (ad.type === 'image') {
      previewContent.innerHTML = `<img src="${ad.content}" alt="${ad.name}" style="max-width: 100%; max-height: 500px;">`;
    } else if (ad.type === 'video') {
      previewContent.innerHTML = `<video src="${ad.content}" controls style="max-width: 100%; max-height: 500px;"></video>`;
    } else if (ad.type === 'text') {
      previewContent.innerHTML = `<div class="text-preview" style="padding: 50px; text-align: center; font-size: 24px;">${ad.content}</div>`;
    }

    document.getElementById('previewModal').classList.add('show');
  }

  confirmDelete(adId) {
    this.currentAd = adId;
    document.getElementById('confirmModal').classList.add('show');
  }

  async deleteAd(adId) {
    try {
      const response = await fetch(`${this.apiBase}/ads/${adId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById('confirmModal').classList.remove('show');
        this.loadAds();
        this.showToast('广告已删除', 'success');
      }
    } catch (error) {
      console.error('删除失败:', error);
      this.showToast('删除失败', 'error');
    }
  }

  async resetStatistics() {
    if (!confirm('确定要重置所有广告的统计吗？')) return;

    try {
      const response = await fetch(`${this.apiBase}/ads/statistics/reset`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        this.loadAds();
        this.showToast('统计已重置', 'success');
      }
    } catch (error) {
      console.error('重置失败:', error);
      this.showToast('重置失败', 'error');
    }
  }

  updateStats() {
    const totalAds = this.ads.length;
    const enabledAds = this.ads.filter(ad => ad.enabled).length;
    const totalPlays = this.ads.reduce((sum, ad) => sum + (ad.displayCount || 0), 0);
    const positions = new Set(this.ads.map(ad => ad.position)).size;

    document.getElementById('totalAds').textContent = totalAds;
    document.getElementById('enabledAds').textContent = enabledAds;
    document.getElementById('totalPlays').textContent = totalPlays;
    document.getElementById('activePositions').textContent = positions;
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('show');
    });
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AdManager();
});
