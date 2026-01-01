/**
 * 组件系统 - 实现模块化的组件架构
 */

// 组件基类
class BaseComponent {
    constructor(config) {
        this.id = config.id;
        this.type = config.type;
        this.position = config.position;
        this.visible = config.visible !== false;
        this.config = config.config || {};
        this.element = null;
        this.eventListeners = new Map();
        
        this.init();
    }
    
    init() {
        this.createElement();
        this.render();
        this.setPosition();
        this.setVisibility();
        this.bindEvents();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = `component component-${this.type}`;
        this.element.dataset.id = this.id;
        this.element.dataset.type = this.type;
    }
    
    render() {
        // 子类应重写此方法
    }
    
    setPosition() {
        if (this.element && this.position) {
            this.element.style.left = `${this.position.x}px`;
            this.element.style.top = `${this.position.y}px`;
            this.element.style.width = `${this.position.width}px`;
            this.element.style.height = `${this.position.height}px`;
        }
    }
    
    setVisibility() {
        if (this.element) {
            this.element.style.display = this.visible ? 'block' : 'none';
        }
    }
    
    update(data) {
        // 子类应重写此方法来处理数据更新
    }
    
    bindEvents() {
        // 子类可以重写此方法来绑定事件
    }
    
    destroy() {
        // 清理事件监听器
        this.eventListeners.forEach((listeners, eventType) => {
            listeners.forEach(listener => {
                if (this.element) {
                    this.element.removeEventListener(eventType, listener);
                }
            });
        });
        
        // 从DOM中移除元素
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    // 事件管理
    addEventListener(eventType, handler) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        
        this.eventListeners.get(eventType).push(handler);
        
        if (this.element) {
            this.element.addEventListener(eventType, handler);
        }
    }
    
    removeEventListener(eventType, handler) {
        if (this.eventListeners.has(eventType)) {
            const listeners = this.eventListeners.get(eventType);
            const index = listeners.indexOf(handler);
            
            if (index > -1) {
                listeners.splice(index, 1);
                
                if (this.element) {
                    this.element.removeEventListener(eventType, handler);
                }
            }
        }
    }
    
    // 触发自定义事件
    dispatchEvent(eventType, data) {
        if (this.element) {
            const event = new CustomEvent(eventType, { detail: data });
            this.element.dispatchEvent(event);
        }
    }
}

// 记分牌组件
class ScoreboardComponent extends BaseComponent {
    constructor(config) {
        super(config);
        this.matchData = {};
    }
    
    render() {
        this.element.innerHTML = `
            <div class="scoreboard" style="width: 100%; height: 100%;">
                <div class="teams" style="display: flex; justify-content: space-between; height: 60%; align-items: center; padding: 0 5%;">
                    <div class="team home" style="text-align: center; color: white; flex: 1;">
                        <div class="team-name" style="font-size: 2em; margin-bottom: 10px;">
                            <h2 id="homeTeamName" style="margin: 0; font-size: 1.5em;">主队</h2>
                        </div>
                        <div class="score" style="font-size: 4em; font-weight: bold; color: white;" id="homeScore">0</div>
                    </div>
                    
                    <div class="score-display" style="text-align: center; color: white; flex: 1;">
                        <div class="time" style="font-size: 2.5em; color: #00d9ff; margin: 10px 0;" id="gameTime">12:00</div>
                        <div class="period" style="font-size: 1.5em; color: rgba(255, 255, 255, 0.6);">
                            第 <span id="currentPeriod">1</span> 节
                        </div>
                    </div>
                    
                    <div class="team away" style="text-align: center; color: white; flex: 1;">
                        <div class="team-name" style="font-size: 2em; margin-bottom: 10px;">
                            <h2 id="awayTeamName" style="margin: 0; font-size: 1.5em;">客队</h2>
                        </div>
                        <div class="score" style="font-size: 4em; font-weight: bold; color: white;" id="awayScore">0</div>
                    </div>
                </div>
                
                <div class="shot-clock" style="text-align: center; margin-top: 5%; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; color: white;">
                    <div class="shot-clock-label" style="font-size: 1em; color: rgba(255, 255, 255, 0.6); margin-bottom: 10px;">进攻时钟</div>
                    <div class="shot-clock-time" style="font-size: 3em; font-weight: bold; color: #ff6b6b;" id="shotClock">24</div>
                </div>
            </div>
        `;
    }
    
    update(data) {
        if (!data) return;
        
        // 更新队伍信息
        if (data.homeTeam) {
            const homeNameEl = this.element.querySelector('#homeTeamName');
            const homeScoreEl = this.element.querySelector('#homeScore');
            if (homeNameEl) homeNameEl.textContent = data.homeTeam.name || '主队';
            if (homeScoreEl) homeScoreEl.textContent = data.homeTeam.score || 0;
        }
        
        if (data.awayTeam) {
            const awayNameEl = this.element.querySelector('#awayTeamName');
            const awayScoreEl = this.element.querySelector('#awayScore');
            if (awayNameEl) awayNameEl.textContent = data.awayTeam.name || '客队';
            if (awayScoreEl) awayScoreEl.textContent = data.awayTeam.score || 0;
        }
        
        // 更新比赛时间
        if (data.gameClock && data.gameClock.currentTime !== undefined) {
            const gameTime = data.gameClock.currentTime;
            const minutes = Math.floor(gameTime / 60);
            const seconds = Math.floor(gameTime % 60);
            const timeEl = this.element.querySelector('#gameTime');
            if (timeEl) {
                timeEl.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
        
        // 更新当前节次
        if (data.gameClock && data.gameClock.currentQuarter !== undefined) {
            const periodEl = this.element.querySelector('#currentPeriod');
            if (periodEl) {
                periodEl.textContent = data.gameClock.currentQuarter;
            }
        }
        
        // 更新进攻时钟
        if (data.shotClock && data.shotClock.currentTime !== undefined) {
            const shotClockEl = this.element.querySelector('#shotClock');
            if (shotClockEl) {
                shotClockEl.textContent = Math.floor(data.shotClock.currentTime);
            }
        }
    }
}

// 视频组件
class VideoComponent extends BaseComponent {
    constructor(config) {
        super(config);
    }
    
    render() {
        const source = this.config.source || 'camera';
        this.element.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #333; color: white;">
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 20px;">视频组件</div>
                    <div>源: ${source}</div>
                </div>
            </div>
        `;
    }
    
    update(data) {
        // 视频组件的更新逻辑
    }
}

// 统计组件
class StatisticsComponent extends BaseComponent {
    constructor(config) {
        super(config);
    }
    
    render() {
        const team = this.config.team || 'home';
        this.element.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #2c3e50; color: white;">
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 20px;">统计组件</div>
                    <div>队伍: ${team}</div>
                </div>
            </div>
        `;
    }
    
    update(data) {
        // 统计组件的更新逻辑
    }
}

// 球员列表组件
class PlayerListComponent extends BaseComponent {
    constructor(config) {
        super(config);
    }
    
    render() {
        const team = this.config.team || 'home';
        this.element.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #16a085; color: white;">
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 20px;">球员列表组件</div>
                    <div>队伍: ${team}</div>
                </div>
            </div>
        `;
    }
    
    update(data) {
        // 球员列表组件的更新逻辑
    }
}

// 文本组件
class TextComponent extends BaseComponent {
    constructor(config) {
        super(config);
    }
    
    render() {
        const content = this.config.content || '文本内容';
        const fontSize = this.config.fontSize || 24;
        const textAlign = this.config.textAlign || 'center';
        
        this.element.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: ${textAlign === 'center' ? 'center' : textAlign === 'left' ? 'flex-start' : 'flex-end'}; 
                 padding: 20px; background: #7f8c8d; color: white; font-size: ${fontSize}px; text-align: ${textAlign};">
                <div style="align-self: center; width: 100%;">${content}</div>
            </div>
        `;
    }
    
    update(data) {
        // 文本组件的更新逻辑
        if (data && data.content) {
            const content = data.content;
            this.element.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; 
                     padding: 20px; background: #7f8c8d; color: white; font-size: ${this.config.fontSize || 24}px; text-align: ${this.config.textAlign || 'center'};">
                    <div style="align-self: center; width: 100%;">${content}</div>
                </div>
            `;
        }
    }
}

// 图片组件
class ImageComponent extends BaseComponent {
    constructor(config) {
        super(config);
    }
    
    render() {
        const source = this.config.source || '/images/default-logo.png';
        const alt = this.config.alt || '图片组件';
        
        this.element.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #95a5a6;">
                <img src="${source}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${alt}">
            </div>
        `;
    }
    
    update(data) {
        // 图片组件的更新逻辑
        if (data && data.source) {
            const source = data.source;
            const alt = data.alt || '图片组件';
            this.element.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #95a5a6;">
                    <img src="${source}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${alt}">
                </div>
            `;
        }
    }
}

// 组件工厂
class ComponentFactory {
    static createComponent(config) {
        switch (config.type) {
            case 'scoreboard':
                return new ScoreboardComponent(config);
            case 'video':
                return new VideoComponent(config);
            case 'statistics':
                return new StatisticsComponent(config);
            case 'player-list':
                return new PlayerListComponent(config);
            case 'text':
                return new TextComponent(config);
            case 'image':
                return new ImageComponent(config);
            default:
                console.warn(`未知组件类型: ${config.type}`);
                return new BaseComponent(config);
        }
    }
}

// 布局渲染器
class LayoutRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.components = new Map();
        this.currentLayout = null;
        this.eventHandlers = new Map();
    }
    
    renderLayout(layout) {
        // 清除现有组件
        this.clearComponents();
        
        if (!layout || !layout.components) {
            console.warn('无效的布局配置');
            return;
        }
        
        this.currentLayout = layout;
        
        // 设置容器尺寸
        if (layout.screenSize) {
            this.container.style.width = `${layout.screenSize.width}px`;
            this.container.style.height = `${layout.screenSize.height}px`;
        }
        
        // 创建并渲染所有组件
        layout.components.forEach(compConfig => {
            const component = ComponentFactory.createComponent(compConfig);
            this.container.appendChild(component.element);
            this.components.set(compConfig.id, component);
            
            // 注册组件事件处理
            this.registerComponentEvents(component);
        });
    }
    
    clearComponents() {
        this.components.forEach(comp => comp.destroy());
        this.components.clear();
        this.container.innerHTML = '';
    }
    
    updateComponent(id, data) {
        const component = this.components.get(id);
        if (component) {
            component.update(data);
        }
    }
    
    updateAll(data) {
        this.components.forEach(comp => {
            comp.update(data);
        });
    }
    
    // 注册组件事件处理
    registerComponentEvents(component) {
        // 为特定组件类型注册事件处理
        if (component.type === 'scoreboard') {
            // 记分牌组件的特殊事件处理
        }
    }
    
    // 获取组件
    getComponent(id) {
        return this.components.get(id);
    }
    
    // 获取所有组件
    getAllComponents() {
        return Array.from(this.components.values());
    }
    
    // 添加布局事件监听器
    addLayoutEventListener(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }
    
    // 触发布局事件
    dispatchLayoutEvent(eventType, data) {
        if (this.eventHandlers.has(eventType)) {
            this.eventHandlers.get(eventType).forEach(handler => {
                handler(data);
            });
        }
    }
}

// 组件注册表，允许动态注册新组件类型
class ComponentRegistry {
    constructor() {
        this.components = new Map();
        this.registerDefaultComponents();
    }
    
    registerDefaultComponents() {
        this.register('scoreboard', ScoreboardComponent);
        this.register('video', VideoComponent);
        this.register('statistics', StatisticsComponent);
        this.register('player-list', PlayerListComponent);
        this.register('text', TextComponent);
        this.register('image', ImageComponent);
    }
    
    register(type, componentClass) {
        this.components.set(type, componentClass);
    }
    
    unregister(type) {
        this.components.delete(type);
    }
    
    get(type) {
        return this.components.get(type);
    }
    
    create(config) {
        const componentClass = this.get(config.type);
        if (componentClass) {
            return new componentClass(config);
        } else {
            console.warn(`未注册的组件类型: ${config.type}`);
            return new BaseComponent(config);
        }
    }
    
    listTypes() {
        return Array.from(this.components.keys());
    }
}

// 全局组件注册表实例
const componentRegistry = new ComponentRegistry();

// 扩展组件工厂以使用注册表
class AdvancedComponentFactory {
    static createComponent(config) {
        return componentRegistry.create(config);
    }
    
    static registerComponent(type, componentClass) {
        componentRegistry.register(type, componentClass);
    }
    
    static unregisterComponent(type) {
        componentRegistry.unregister(type);
    }
    
    static listComponentTypes() {
        return componentRegistry.listTypes();
    }
}

// 导出公共API
window.ComponentSystem = {
    BaseComponent,
    LayoutRenderer,
    ComponentFactory: AdvancedComponentFactory,
    ScoreboardComponent,
    VideoComponent,
    StatisticsComponent,
    PlayerListComponent,
    TextComponent,
    ImageComponent
};