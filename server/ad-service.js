/**
 * 广告位管理服务 - Advertisement Management Service
 * 负责广告的增删改查、定时播放、统计等功能
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AdvertisementService {
  constructor(dataStore) {
    this.dataStore = dataStore;
    this.adsDir = path.join(__dirname, '../public/ads');
    this.adsFile = path.join(__dirname, '../ads.json');
    this.ads = [];
    this.currentPlayingAd = null;
    this.playSchedule = null;

    this.initialize();
  }

  /**
   * 初始化
   */
  async initialize() {
    await this.ensureAdsDirectory();
    await this.loadAds();
    console.log('[广告服务] 初始化完成，当前广告数:', this.ads.length);
  }

  /**
   * 确保广告目录存在
   */
  async ensureAdsDirectory() {
    try {
      await fs.access(this.adsDir);
    } catch {
      await fs.mkdir(this.adsDir, { recursive: true });
      console.log('[广告服务] 创建广告目录:', this.adsDir);
    }
  }

  /**
   * 加载广告数据
   */
  async loadAds() {
    try {
      const data = await fs.readFile(this.adsFile, 'utf-8');
      this.ads = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，创建默认广告
        this.ads = [];
        await this.saveAds();
      } else {
        console.error('[广告服务] 加载广告失败:', error);
      }
    }
  }

  /**
   * 保存广告数据
   */
  async saveAds() {
    await fs.writeFile(this.adsFile, JSON.stringify(this.ads, null, 2));
  }

  /**
   * 添加广告
   */
  async addAd(adData) {
    const ad = {
      id: uuidv4(),
      name: adData.name,
      type: adData.type, // 'image', 'video', 'text'
      content: adData.content, // URL或文本内容
      position: adData.position || 'bottom', // 'top', 'bottom', 'left', 'right', 'center', 'fullscreen'
      duration: adData.duration || 10, // 播放时长（秒）
      schedule: adData.schedule || [], // 播放时间表
      priority: adData.priority || 0, // 优先级，越高越优先
      enabled: adData.enabled !== false,
      displayCount: 0,
      lastPlayedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: adData.metadata || {} // 扩展元数据
    };

    this.ads.push(ad);
    await this.saveAds();

    return ad;
  }

  /**
   * 更新广告
   */
  async updateAd(adId, updates) {
    const index = this.ads.findIndex(ad => ad.id === adId);
    if (index === -1) {
      throw new Error('广告不存在');
    }

    this.ads[index] = {
      ...this.ads[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveAds();
    return this.ads[index];
  }

  /**
   * 删除广告
   */
  async deleteAd(adId) {
    const index = this.ads.findIndex(ad => ad.id === adId);
    if (index === -1) {
      throw new Error('广告不存在');
    }

    this.ads.splice(index, 1);
    await this.saveAds();
  }

  /**
   * 获取所有广告
   */
  getAllAds() {
    return this.ads;
  }

  /**
   * 获取启用的广告
   */
  getEnabledAds() {
    return this.ads.filter(ad => ad.enabled);
  }

  /**
   * 获取按位置分类的广告
   */
  getAdsByPosition(position) {
    return this.ads.filter(ad => ad.position === position && ad.enabled);
  }

  /**
   * 获取下一个要播放的广告
   */
  getNextAd(position) {
    const positionAds = this.getAdsByPosition(position);
    if (positionAds.length === 0) return null;

    // 按优先级排序
    const sortedAds = positionAds.sort((a, b) => {
      // 优先级高的优先
      if (b.priority !== a.priority) return b.priority - a.priority;
      // 同优先级，播放次数少的优先
      return a.displayCount - b.displayCount;
    });

    return sortedAds[0];
  }

  /**
   * 记录广告播放
   */
  async recordAdPlay(adId) {
    const ad = this.ads.find(a => a.id === adId);
    if (ad) {
      ad.displayCount++;
      ad.lastPlayedAt = new Date().toISOString();
      await this.saveAds();
    }
  }

  /**
   * 获取广告统计
   */
  getAdStatistics(adId) {
    const ad = this.ads.find(a => a.id === adId);
    if (!ad) {
      throw new Error('广告不存在');
    }

    return {
      id: ad.id,
      name: ad.name,
      displayCount: ad.displayCount,
      lastPlayedAt: ad.lastPlayedAt,
      createdAt: ad.createdAt,
      enabled: ad.enabled
    };
  }

  /**
   * 获取所有广告统计
   */
  getAllStatistics() {
    return this.ads.map(ad => ({
      id: ad.id,
      name: ad.name,
      type: ad.type,
      position: ad.position,
      displayCount: ad.displayCount,
      lastPlayedAt: ad.lastPlayedAt,
      enabled: ad.enabled,
      priority: ad.priority
    }));
  }

  /**
   * 启动/禁用广告
   */
  async toggleAd(adId, enabled) {
    return await this.updateAd(adId, { enabled });
  }

  /**
   * 重置广告统计
   */
  async resetStatistics() {
    this.ads.forEach(ad => {
      ad.displayCount = 0;
      ad.lastPlayedAt = null;
    });
    await this.saveAds();
  }

  /**
   * 检查是否应该在当前时间播放
   */
  shouldPlayNow(ad) {
    if (!ad.schedule || ad.schedule.length === 0) {
      return true; // 无时间限制
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 当天分钟数

    return ad.schedule.some(schedule => {
      const [startH, startM] = schedule.start.split(':').map(Number);
      const [endH, endM] = schedule.end.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;

      return currentTime >= start && currentTime <= end;
    });
  }

  /**
   * 获取预设广告模板
   */
  getPresetTemplates() {
    return [
      {
        name: '顶部横幅',
        type: 'image',
        position: 'top',
        duration: 15,
        priority: 1,
        metadata: { width: 1920, height: 150 }
      },
      {
        name: '底部横幅',
        type: 'image',
        position: 'bottom',
        duration: 15,
        priority: 1,
        metadata: { width: 1920, height: 120 }
      },
      {
        name: '左侧边栏',
        type: 'image',
        position: 'left',
        duration: 20,
        priority: 2,
        metadata: { width: 300, height: 800 }
      },
      {
        name: '右侧边栏',
        type: 'image',
        position: 'right',
        duration: 20,
        priority: 2,
        metadata: { width: 300, height: 800 }
      },
      {
        name: '中央弹窗',
        type: 'image',
        position: 'center',
        duration: 10,
        priority: 3,
        metadata: { width: 800, height: 600 }
      },
      {
        name: '全屏广告',
        type: 'image',
        position: 'fullscreen',
        duration: 30,
        priority: 4,
        metadata: { width: 1920, height: 1080 }
      },
      {
        name: '视频广告',
        type: 'video',
        position: 'fullscreen',
        duration: 60,
        priority: 5,
        metadata: { width: 1920, height: 1080 }
      }
    ];
  }
}

module.exports = AdvertisementService;
