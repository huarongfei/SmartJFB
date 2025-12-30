/**
 * 布局编辑器 JavaScript
 */

class LayoutEditor {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.layouts = [];
    this.currentLayout = null;
    this.components = [];
    this.selectedComponent = null;
    this.zoomLevel = 1;
    this.gridEnabled = true;
    this.snapEnabled = true;
    this.history = [];
    this.historyIndex = -1;

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadLayouts();
    this.loadComponentTemplates();
  }

  bindEvents() {
    // 返回按钮
    document.getElementById('backBtn').addEventListener('click', () => {
      window.history.back();
    });

    // 工具栏按钮
    document.getElementById('newLayoutBtn').addEventListener('click', () => {
      this.showNewLayoutModal();
    });

    document.getElementById('duplicateBtn').addEventListener('click', () => {
      this.duplicateLayout();
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
      this.deleteLayout();
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveLayout();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportLayout();
    });

    document.getElementById('importBtn').addEventListener('click', () => {
      this.importLayout();
    });

    document.getElementById('previewBtn').addEventListener('click', () => {
      this.previewLayout();
    });

    // 布局选择
    document.getElementById('layoutSelect').addEventListener('change', (e) => {
      this.loadLayout(e.target.value);
    });

    // 缩放控制
    document.querySelectorAll('[data-action^="zoom-"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'zoom-in') {
          this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
        } else {
          this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
        }
        this.updateZoom();
      });
    });

    // 画布工具栏
    document.querySelectorAll('.canvas-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleCanvasAction(action);
      });
    });

    // 模态框关闭
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('show');
      });
    });
  }

  async loadLayouts() {
    try {
      const response = await fetch(`${this.apiBase}/layouts`);
      const result = await response.json();
      this.layouts = result.data || [];
      this.renderLayoutList();
    } catch (error) {
      console.error('加载布局失败:', error);
    }
  }

  renderLayoutList() {
    const select = document.getElementById('layoutSelect');
    select.innerHTML = '<option value="">选择布局...</option>';
    this.layouts.forEach(layout => {
      const option = document.createElement('option');
      option.value = layout.id;
      option.textContent = layout.name;
      select.appendChild(option);
    });
  }

  async loadComponentTemplates() {
    try {
      const response = await fetch(`${this.apiBase}/layouts/templates`);
      const result = await response.json();
      this.renderComponentTemplates(result.data);
    } catch (error) {
      console.error('加载组件模板失败:', error);
    }
  }

  renderComponentTemplates(templates) {
    const list = document.getElementById('componentList');
    list.innerHTML = templates.map(template => `
      <div class="component-item" draggable="true" data-type="${template.id}">
        <span class="component-icon">${template.icon}</span>
        <span class="component-name">${template.name}</span>
      </div>
    `).join('');

    // 绑定拖放事件
    list.querySelectorAll('.component-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('componentType', item.dataset.type);
        e.dataTransfer.setData('componentTemplate', JSON.stringify(item));
      });
    });
  }

  async loadLayout(layoutId) {
    if (!layoutId) {
      this.currentLayout = null;
      this.components = [];
      this.clearCanvas();
      return;
    }

    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) return;

    this.currentLayout = layout;
    this.components = [...layout.components];

    // 更新表单
    document.getElementById('layoutName').value = layout.name;
    document.getElementById('layoutDescription').value = layout.description || '';
    document.getElementById('layoutSportType').value = layout.sportType;
    document.getElementById('screenWidth').value = layout.screenSize.width;
    document.getElementById('screenHeight').value = layout.screenSize.height;

    this.renderComponents();
  }

  renderComponents() {
    const canvas = document.getElementById('canvas');
    const tree = document.getElementById('componentsTree');

    // 清空画布
    canvas.innerHTML = '<div class="drop-zone" id="dropZone"><p class="drop-text">拖放组件到此处</p></div>';

    // 渲染组件到画布
    this.components.forEach(comp => {
      const element = this.createComponentElement(comp);
      canvas.appendChild(element);
    });

    // 更新组件树
    if (this.components.length === 0) {
      tree.innerHTML = '<p class="empty-text">暂无组件</p>';
    } else {
      tree.innerHTML = this.components.map(comp => `
        <div class="tree-item" data-id="${comp.id}" onclick="app.selectComponent('${comp.id}')">
          <span class="tree-icon">${this.getComponentIcon(comp.type)}</span>
          <span class="tree-name">${comp.id}</span>
        </div>
      `).join('');
    }
  }

  createComponentElement(comp) {
    const div = document.createElement('div');
    div.className = 'component-element';
    div.dataset.id = comp.id;
    div.style.cssText = `
      position: absolute;
      left: ${comp.position.x}px;
      top: ${comp.position.y}px;
      width: ${comp.position.width}px;
      height: ${comp.position.height}px;
      border: 2px solid ${comp.id === this.selectedComponent?.id ? '#667eea' : '#ddd'};
      background: rgba(102, 126, 234, 0.1);
      display: ${comp.visible !== false ? 'block' : 'none'};
    `;

    div.innerHTML = `
      <div class="component-label">${comp.type}</div>
      <div class="component-resize">
        <div class="resize-handle resize-se"></div>
      </div>
    `;

    // 选中事件
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectComponent(comp.id);
    });

    // 拖拽
    this.makeDraggable(div, comp);

    return div;
  }

  makeDraggable(element, comp) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    element.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('resize-handle')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = comp.position.x;
      initialY = comp.position.y;
      element.style.cursor = 'move';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = (e.clientX - startX) / this.zoomLevel;
      const dy = (e.clientY - startY) / this.zoomLevel;

      let newX = initialX + dx;
      let newY = initialY + dy;

      // 吸附到网格
      if (this.snapEnabled) {
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
      }

      comp.position.x = newX;
      comp.position.y = newY;

      element.style.left = `${newX}px`;
      element.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'default';
      }
    });
  }

  selectComponent(componentId) {
    this.selectedComponent = this.components.find(c => c.id === componentId);
    this.renderComponents();
    this.showProperties(this.selectedComponent);

    // 更新树选中状态
    document.querySelectorAll('.tree-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.id === componentId);
    });
  }

  showProperties(component) {
    const section = document.getElementById('propertiesSection');
    const form = document.getElementById('propertiesForm');

    if (!component) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    form.innerHTML = `
      <div class="property-group">
        <label>组件ID</label>
        <input type="text" value="${component.id}" disabled>
      </div>
      <div class="property-group">
        <label>类型</label>
        <input type="text" value="${component.type}" disabled>
      </div>
      <div class="property-group">
        <label>位置 X</label>
        <input type="number" value="${component.position.x}" 
               onchange="app.updateComponentProperty('${component.id}', 'position.x', this.value)">
      </div>
      <div class="property-group">
        <label>位置 Y</label>
        <input type="number" value="${component.position.y}"
               onchange="app.updateComponentProperty('${component.id}', 'position.y', this.value)">
      </div>
      <div class="property-group">
        <label>宽度</label>
        <input type="number" value="${component.position.width}"
               onchange="app.updateComponentProperty('${component.id}', 'position.width', this.value)">
      </div>
      <div class="property-group">
        <label>高度</label>
        <input type="number" value="${component.position.height}"
               onchange="app.updateComponentProperty('${component.id}', 'position.height', this.value)">
      </div>
      <div class="property-group">
        <label>可见</label>
        <input type="checkbox" ${component.visible !== false ? 'checked' : ''}
               onchange="app.updateComponentProperty('${component.id}', 'visible', this.checked)">
      </div>
    `;
  }

  updateComponentProperty(componentId, property, value) {
    const component = this.components.find(c => c.id === componentId);
    if (!component) return;

    if (property.startsWith('position.')) {
      const prop = property.split('.')[1];
      component.position[prop] = parseInt(value);
    } else {
      component[property] = value;
    }

    this.renderComponents();
  }

  clearCanvas() {
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = '<div class="drop-zone" id="dropZone"><p class="drop-text">拖放组件到此处</p></div>';
  }

  updateZoom() {
    document.getElementById('zoomLevel').textContent = `${Math.round(this.zoomLevel * 100)}%`;
    const canvas = document.getElementById('canvas');
    canvas.style.transform = `scale(${this.zoomLevel})`;
  }

  handleCanvasAction(action) {
    switch (action) {
      case 'grid-toggle':
        this.gridEnabled = !this.gridEnabled;
        this.showToast(`网格已${this.gridEnabled ? '启用' : '禁用'}`);
        break;
      case 'snap-toggle':
        this.snapEnabled = !this.snapEnabled;
        this.showToast(`吸附已${this.snapEnabled ? '启用' : '禁用'}`);
        break;
      case 'guide-toggle':
        this.showToast('辅助线功能开发中');
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.components = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.renderComponents();
      this.showToast('已撤销');
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.components = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.renderComponents();
      this.showToast('已重做');
    }
  }

  saveToHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(this.components)));
    this.historyIndex++;
  }

  async saveLayout() {
    if (!this.currentLayout) {
      this.showToast('请先创建或选择一个布局', 'warning');
      return;
    }

    const layoutData = {
      name: document.getElementById('layoutName').value,
      description: document.getElementById('layoutDescription').value,
      sportType: document.getElementById('layoutSportType').value,
      screenSize: {
        width: parseInt(document.getElementById('screenWidth').value),
        height: parseInt(document.getElementById('screenHeight').value)
      },
      components: this.components
    };

    try {
      const response = await fetch(`${this.apiBase}/layouts/${this.currentLayout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutData)
      });

      const result = await response.json();

      if (result.success) {
        this.showToast('布局已保存', 'success');
        this.loadLayouts();
      } else {
        this.showToast(result.message, 'error');
      }
    } catch (error) {
      console.error('保存失败:', error);
      this.showToast('保存失败', 'error');
    }
  }

  async duplicateLayout() {
    if (!this.currentLayout) {
      this.showToast('请先选择一个布局', 'warning');
      return;
    }

    const newName = prompt('输入新布局名称:', `${this.currentLayout.name} (副本)`);
    if (!newName) return;

    try {
      const response = await fetch(`${this.apiBase}/layouts/${this.currentLayout.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      const result = await response.json();

      if (result.success) {
        this.showToast('布局已复制', 'success');
        this.loadLayouts();
        document.getElementById('layoutSelect').value = result.data.id;
        this.loadLayout(result.data.id);
      }
    } catch (error) {
      console.error('复制失败:', error);
      this.showToast('复制失败', 'error');
    }
  }

  async deleteLayout() {
    if (!this.currentLayout) {
      this.showToast('请先选择一个布局', 'warning');
      return;
    }

    if (this.currentLayout.isPreset) {
      this.showToast('不能删除预设布局', 'error');
      return;
    }

    if (!confirm('确定要删除这个布局吗？')) return;

    try {
      const response = await fetch(`${this.apiBase}/layouts/${this.currentLayout.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        this.showToast('布局已删除', 'success');
        this.currentLayout = null;
        this.components = [];
        this.clearCanvas();
        this.loadLayouts();
      }
    } catch (error) {
      console.error('删除失败:', error);
      this.showToast('删除失败', 'error');
    }
  }

  async exportLayout() {
    if (!this.currentLayout) {
      this.showToast('请先选择一个布局', 'warning');
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/layouts/${this.currentLayout.id}/export`);

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentLayout.name}.json`;
        a.click();
        this.showToast('布局已导出', 'success');
      }
    } catch (error) {
      console.error('导出失败:', error);
      this.showToast('导出失败', 'error');
    }
  }

  importLayout() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const layoutData = JSON.parse(text);

        const response = await fetch(`${this.apiBase}/layouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...layoutData,
            name: prompt('输入布局名称:', layoutData.name)
          })
        });

        const result = await response.json();

        if (result.success) {
          this.showToast('布局已导入', 'success');
          this.loadLayouts();
        }
      } catch (error) {
        console.error('导入失败:', error);
        this.showToast('导入失败', 'error');
      }
    };

    input.click();
  }

  previewLayout() {
    if (!this.currentLayout) {
      this.showToast('请先选择一个布局', 'warning');
      return;
    }

    const container = document.getElementById('previewContainer');
    container.style.width = `${this.currentLayout.screenSize.width}px`;
    container.style.height = `${this.currentLayout.screenSize.height}px`;

    // 简单预览实现
    container.innerHTML = this.components.map(comp => `
      <div style="
        position: absolute;
        left: ${comp.position.x}px;
        top: ${comp.position.y}px;
        width: ${comp.position.width}px;
        height: ${comp.position.height}px;
        border: 1px solid #667eea;
        background: rgba(102, 126, 234, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${this.getComponentIcon(comp.type)} ${comp.type}
      </div>
    `).join('');

    document.getElementById('previewModal').classList.add('show');
  }

  showNewLayoutModal() {
    // 加载预设模板并显示
    this.loadPresetTemplates();
    document.getElementById('newLayoutModal').classList.add('show');
  }

  async loadPresetTemplates() {
    try {
      const response = await fetch(`${this.apiBase}/layouts`);
      const result = await response.json();
      const presets = result.data.filter(l => l.isPreset);

      const grid = document.getElementById('templateGrid');
      grid.innerHTML = presets.map(preset => `
        <div class="template-card" onclick="app.selectTemplate('${preset.id}')">
          <div class="template-preview">
            ${this.getComponentIcon('scoreboard')}
          </div>
          <div class="template-info">
            <h4>${preset.name}</h4>
            <p>${preset.description}</p>
          </div>
        </div>
      `).join('');

      document.getElementById('blankLayoutBtn').onclick = () => {
        this.createBlankLayout();
        document.getElementById('newLayoutModal').classList.remove('show');
      };
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  }

  selectTemplate(presetId) {
    // 复制预设模板为新布局
    const response = fetch(`${this.apiBase}/layouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `新建布局 - ${new Date().toLocaleString('zh-CN')}`,
        sportType: 'custom'
      })
    });
    this.showToast('请在新布局中编辑', 'info');
  }

  async createBlankLayout() {
    const name = prompt('输入布局名称:');
    if (!name) return;

    try {
      const response = await fetch(`${this.apiBase}/layouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: '自定义布局',
          sportType: 'custom',
          components: []
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showToast('布局已创建', 'success');
        this.loadLayouts();
        document.getElementById('layoutSelect').value = result.data.id;
        this.loadLayout(result.data.id);
      }
    } catch (error) {
      console.error('创建失败:', error);
      this.showToast('创建失败', 'error');
    }
  }

  getComponentIcon(type) {
    const icons = {
      'scoreboard': '📊',
      'video': '📹',
      'statistics': '📈',
      'player-list': '👥',
      'text': '📝',
      'image': '🖼️'
    };
    return icons[type] || '📦';
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
  window.app = new LayoutEditor();
});
