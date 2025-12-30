/**
 * 自定义显示布局编辑器服务 - Layout Editor Service
 * 负责显示布局的创建、编辑、保存、加载等功能
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class LayoutService {
  constructor() {
    this.layoutsDir = path.join(__dirname, '../layouts');
    this.layoutsFile = path.join(__dirname, '../layouts.json');
    this.layouts = [];
    this.currentLayout = null;

    this.initialize();
  }

  /**
   * 初始化
   */
  async initialize() {
    await this.ensureLayoutsDirectory();
    await this.loadLayouts();

    // 加载预设布局
    if (this.layouts.length === 0) {
      await this.createPresetLayouts();
    }

    console.log('[布局服务] 初始化完成，当前布局数:', this.layouts.length);
  }

  /**
   * 确保布局目录存在
   */
  async ensureLayoutsDirectory() {
    try {
      await fs.access(this.layoutsDir);
    } catch {
      await fs.mkdir(this.layoutsDir, { recursive: true });
      console.log('[布局服务] 创建布局目录:', this.layoutsDir);
    }
  }

  /**
   * 加载布局数据
   */
  async loadLayouts() {
    try {
      const data = await fs.readFile(this.layoutsFile, 'utf-8');
      const saved = JSON.parse(data);
      this.layouts = saved.layouts || [];
      this.currentLayout = saved.currentLayout || null;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.layouts = [];
        this.currentLayout = null;
      } else {
        console.error('[布局服务] 加载布局失败:', error);
      }
    }
  }

  /**
   * 保存布局数据
   */
  async saveLayouts() {
    await fs.writeFile(this.layoutsFile, JSON.stringify({
      layouts: this.layouts,
      currentLayout: this.currentLayout
    }, null, 2));
  }

  /**
   * 创建预设布局
   */
  async createPresetLayouts() {
    const presets = this.getPresetLayouts();
    for (const preset of presets) {
      await this.createLayout(preset);
    }
    console.log('[布局服务] 已创建', presets.length, '个预设布局');
  }

  /**
   * 创建布局
   */
  async createLayout(layoutData) {
    const layout = {
      id: uuidv4(),
      name: layoutData.name,
      description: layoutData.description || '',
      sportType: layoutData.sportType || 'basketball', // 'basketball', 'football', 'custom'
      isPreset: layoutData.isPreset || false,
      isDefault: layoutData.isDefault || false,
      thumbnail: layoutData.thumbnail || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // 布局配置
      components: layoutData.components || [],
      // 屏幕尺寸
      screenSize: {
        width: 1920,
        height: 1080,
        ...layoutData.screenSize
      },
      // 布局元数据
      metadata: layoutData.metadata || {}
    };

    this.layouts.push(layout);
    await this.saveLayouts();

    return layout;
  }

  /**
   * 更新布局
   */
  async updateLayout(layoutId, updates) {
    const index = this.layouts.findIndex(l => l.id === layoutId);
    if (index === -1) {
      throw new Error('布局不存在');
    }

    this.layouts[index] = {
      ...this.layouts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveLayouts();
    return this.layouts[index];
  }

  /**
   * 删除布局
   */
  async deleteLayout(layoutId) {
    const index = this.layouts.findIndex(l => l.id === layoutId);
    if (index === -1) {
      throw new Error('布局不存在');
    }

    // 不能删除预设布局
    if (this.layouts[index].isPreset) {
      throw new Error('不能删除预设布局');
    }

    this.layouts.splice(index, 1);

    // 如果删除的是当前布局，清空当前布局
    if (this.currentLayout === layoutId) {
      this.currentLayout = null;
    }

    await this.saveLayouts();
  }

  /**
   * 复制布局
   */
  async duplicateLayout(layoutId, newName) {
    const original = this.layouts.find(l => l.id === layoutId);
    if (!original) {
      throw new Error('布局不存在');
    }

    const duplicated = {
      ...JSON.parse(JSON.stringify(original)),
      id: uuidv4(),
      name: newName || `${original.name} (副本)`,
      isPreset: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.layouts.push(duplicated);
    await this.saveLayouts();

    return duplicated;
  }

  /**
   * 设置当前布局
   */
  async setCurrentLayout(layoutId) {
    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) {
      throw new Error('布局不存在');
    }

    this.currentLayout = layoutId;
    await this.saveLayouts();

    return layout;
  }

  /**
   * 获取当前布局
   */
  getCurrentLayout() {
    if (!this.currentLayout) return null;
    return this.layouts.find(l => l.id === this.currentLayout);
  }

  /**
   * 获取所有布局
   */
  getAllLayouts() {
    return this.layouts;
  }

  /**
   * 按运动类型获取布局
   */
  getLayoutsBySport(sportType) {
    return this.layouts.filter(l => l.sportType === sportType);
  }

  /**
   * 获取预设布局
   */
  getPresetLayouts() {
    return [
      {
        name: '标准篮球布局',
        description: '适合大多数篮球比赛的经典布局',
        sportType: 'basketball',
        isPreset: true,
        isDefault: true,
        thumbnail: 'basketball-standard.jpg',
        components: [
          {
            id: 'scoreboard',
            type: 'scoreboard',
            position: { x: 0, y: 0, width: 1920, height: 200 },
            visible: true,
            config: {
              showQuarter: true,
              showTime: true,
              showScores: true,
              showFouls: true
            }
          },
          {
            id: 'main-display',
            type: 'video',
            position: { x: 0, y: 200, width: 1200, height: 880 },
            visible: true,
            config: {
              source: 'camera'
            }
          },
          {
            id: 'team-stats',
            type: 'statistics',
            position: { x: 1200, y: 200, width: 720, height: 440 },
            visible: true,
            config: {
              team: 'home'
            }
          },
          {
            id: 'player-stats',
            type: 'player-list',
            position: { x: 1200, y: 640, width: 720, height: 440 },
            visible: true,
            config: {
              team: 'home'
            }
          }
        ]
      },
      {
        name: '标准足球布局',
        description: '适合足球比赛的经典布局',
        sportType: 'football',
        isPreset: true,
        thumbnail: 'football-standard.jpg',
        components: [
          {
            id: 'scoreboard',
            type: 'scoreboard',
            position: { x: 0, y: 0, width: 1920, height: 150 },
            visible: true,
            config: {
              showHalf: true,
              showTime: true,
              showScores: true
            }
          },
          {
            id: 'main-display',
            type: 'video',
            position: { x: 0, y: 150, width: 1400, height: 930 },
            visible: true,
            config: {
              source: 'camera'
            }
          },
          {
            id: 'game-stats',
            type: 'statistics',
            position: { x: 1400, y: 150, width: 520, height: 930 },
            visible: true,
            config: {
              showComparison: true,
              showShots: true,
              showPossession: true
            }
          }
        ]
      },
      {
        name: '大屏篮球布局',
        description: '适合大屏幕的篮球比赛布局',
        sportType: 'basketball',
        isPreset: true,
        thumbnail: 'basketball-large.jpg',
        screenSize: { width: 2560, height: 1440 },
        components: [
          {
            id: 'scoreboard',
            type: 'scoreboard',
            position: { x: 0, y: 0, width: 2560, height: 250 },
            visible: true,
            config: {
              large: true
            }
          },
          {
            id: 'main-display',
            type: 'video',
            position: { x: 0, y: 250, width: 1600, height: 1190 },
            visible: true,
            config: {
              source: 'camera'
            }
          },
          {
            id: 'home-stats',
            type: 'statistics',
            position: { x: 1600, y: 250, width: 960, height: 595 },
            visible: true,
            config: { team: 'home' }
          },
          {
            id: 'away-stats',
            type: 'statistics',
            position: { x: 1600, y: 845, width: 960, height: 595 },
            visible: true,
            config: { team: 'away' }
          }
        ]
      },
      {
        name: '四分屏布局',
        description: '将屏幕分为四个区域',
        sportType: 'custom',
        isPreset: true,
        thumbnail: 'quad-screen.jpg',
        components: [
          {
            id: 'top-left',
            type: 'video',
            position: { x: 0, y: 0, width: 960, height: 540 },
            visible: true,
            config: { source: 'camera1' }
          },
          {
            id: 'top-right',
            type: 'video',
            position: { x: 960, y: 0, width: 960, height: 540 },
            visible: true,
            config: { source: 'camera2' }
          },
          {
            id: 'bottom-left',
            type: 'video',
            position: { x: 0, y: 540, width: 960, height: 540 },
            visible: true,
            config: { source: 'camera3' }
          },
          {
            id: 'bottom-right',
            type: 'video',
            position: { x: 960, y: 540, width: 960, height: 540 },
            visible: true,
            config: { source: 'camera4' }
          },
          {
            id: 'scoreboard-overlay',
            type: 'scoreboard',
            position: { x: 100, y: 40, width: 820, height: 100 },
            visible: true,
            config: { overlay: true }
          }
        ]
      },
      {
        name: '焦点布局',
        description: '突出显示主要比赛画面',
        sportType: 'custom',
        isPreset: true,
        thumbnail: 'focus-layout.jpg',
        components: [
          {
            id: 'main-display',
            type: 'video',
            position: { x: 0, y: 0, width: 1920, height: 1080 },
            visible: true,
            config: { source: 'camera', full: true }
          },
          {
            id: 'mini-scoreboard',
            type: 'scoreboard',
            position: { x: 10, y: 10, width: 300, height: 80 },
            visible: true,
            config: { mini: true }
          },
          {
            id: 'stats-panel',
            type: 'statistics',
            position: { x: 1610, y: 10, width: 300, height: 400 },
            visible: true,
            config: { compact: true }
          }
        ]
      }
    ];
  }

  /**
   * 验证布局
   */
  validateLayout(layout) {
    const errors = [];

    // 检查组件是否有ID
    const ids = new Set();
    layout.components.forEach((comp, index) => {
      if (!comp.id) {
        errors.push(`第${index + 1}个组件缺少ID`);
      } else if (ids.has(comp.id)) {
        errors.push(`组件ID重复: ${comp.id}`);
      } else {
        ids.add(comp.id);
      }

      // 检查位置
      if (!comp.position) {
        errors.push(`组件 ${comp.id || index} 缺少位置信息`);
      } else {
        const { x, y, width, height } = comp.position;
        if (typeof x !== 'number' || typeof y !== 'number') {
          errors.push(`组件 ${comp.id || index} 位置坐标无效`);
        }
        if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
          errors.push(`组件 ${comp.id || index} 尺寸无效`);
        }
      }

      // 检查类型
      const validTypes = ['scoreboard', 'video', 'statistics', 'player-list', 'text', 'image', 'clock'];
      if (!comp.type || !validTypes.includes(comp.type)) {
        errors.push(`组件 ${comp.id || index} 类型无效`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 导出布局
   */
  async exportLayout(layoutId) {
    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) {
      throw new Error('布局不存在');
    }

    const filepath = path.join(this.layoutsDir, `${layout.name.replace(/\s+/g, '_')}.json`);
    await fs.writeFile(filepath, JSON.stringify(layout, null, 2));
    return filepath;
  }

  /**
   * 导入布局
   */
  async importLayout(layoutData, name) {
    const validation = this.validateLayout(layoutData);
    if (!validation.valid) {
      throw new Error(`布局验证失败: ${validation.errors.join(', ')}`);
    }

    const newLayout = await this.createLayout({
      name: name || layoutData.name,
      description: `导入的布局 - ${new Date().toLocaleString('zh-CN')}`,
      sportType: layoutData.sportType,
      components: layoutData.components,
      screenSize: layoutData.screenSize
    });

    return newLayout;
  }

  /**
   * 获取布局模板
   */
  getLayoutTemplates() {
    return [
      {
        id: 'scoreboard',
        name: '记分牌组件',
        type: 'scoreboard',
        defaultConfig: {
          showQuarter: true,
          showTime: true,
          showScores: true,
          showFouls: true
        },
        icon: '📊',
        description: '显示比赛时间、比分、节次等信息'
      },
      {
        id: 'video',
        name: '视频组件',
        type: 'video',
        defaultConfig: {
          source: 'camera'
        },
        icon: '📹',
        description: '显示视频流或媒体内容'
      },
      {
        id: 'statistics',
        name: '统计组件',
        type: 'statistics',
        defaultConfig: {
          team: 'home'
        },
        icon: '📈',
        description: '显示技术统计数据'
      },
      {
        id: 'player-list',
        name: '球员列表',
        type: 'player-list',
        defaultConfig: {
          team: 'home'
        },
        icon: '👥',
        description: '显示球员信息列表'
      },
      {
        id: 'text',
        name: '文本组件',
        type: 'text',
        defaultConfig: {
          content: '文本内容',
          fontSize: 24
        },
        icon: '📝',
        description: '显示自定义文本'
      },
      {
        id: 'image',
        name: '图片组件',
        type: 'image',
        defaultConfig: {
          source: ''
        },
        icon: '🖼️',
        description: '显示图片内容'
      }
    ];
  }
}

module.exports = LayoutService;
