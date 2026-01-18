/**
 * 通用JavaScript工具模块
 * 包含常用的工具函数和通用功能
 */

// API和Socket常量
const API_BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// 认证状态
let authToken = localStorage.getItem('smartjfb_token') || null;
let currentUser = JSON.parse(localStorage.getItem('smartjfb_user')) || null;

// 全局状态
let gameState = {
  currentGameId: null,
  sport: null,
  teams: null,
  scores: null,
  timers: null
};

// Socket连接
let socket;

/**
 * 初始化应用程序
 */
function initApp() {
  // 初始化Socket连接
  initSocket();
  
  // 初始化UI事件处理器
  initEventHandlers();
  
  // 检查连接状态
  checkConnectionStatus();
  
  // 检查认证状态
  checkAuthStatus();
}

/**
 * 初始化Socket连接
 */
function initSocket() {
  socket = io(SOCKET_URL);
  
  socket.on('connect', function() {
    updateConnectionStatus(true);
    console.log('Connected to server:', socket.id);
  });
  
  socket.on('disconnect', function() {
    updateConnectionStatus(false);
    console.log('Disconnected from server');
  });
  
  // 监听游戏更新
  socket.on('gameUpdate', function(data) {
    console.log('Game updated:', data);
    updateGameDisplay(data.game);
  });
  
  // 监听新游戏创建
  socket.on('gameCreated', function(data) {
    console.log('New game created:', data);
    // 更新本地游戏列表
    if (window.gamesList) {
      window.gamesList.push(data);
      updateActiveGamesDropdown(window.gamesList);
    }
  });
  
  // 监听计时器更新
  socket.on('timerUpdate', function(data) {
    console.log('Timer updated:', data);
    updateTimerDisplay(data.timer);
  });
  
  // 监听分数更新
  socket.on('scoreUpdate', function(data) {
    console.log('Score updated:', data);
    updateScoreDisplay(data.scores);
  });
  
  // 监听事件更新
  socket.on('eventUpdate', function(data) {
    console.log('Event updated:', data);
    addEventToTimeline(data);
  });
  
  // 监听游戏列表更新
  socket.on('gamesListUpdate', function(data) {
    console.log('Games list updated:', data);
    window.gamesList = data.games || [];
    updateActiveGamesDropdown(window.gamesList);
  });
  
  // 监听用户列表更新
  socket.on('usersListUpdate', function(data) {
    console.log('Users list updated:', data);
    window.usersList = data.users || [];
    // 可以在这里添加更新用户界面的逻辑
    if (typeof updateUsersList === 'function') {
      updateUsersList(window.usersList);
    }
  });
}

/**
 * 初始化通用事件处理器
 */
function initEventHandlers() {
  // 游戏创建
  document.getElementById('create-game-btn')?.addEventListener('click', createNewGame);
  
  // 分数控制
  document.querySelectorAll('[id^="add-home-point"]').forEach(btn => {
    btn.addEventListener('click', () => updateScore('home', parseInt(btn.dataset.points)));
  });
  
  document.querySelectorAll('[id^="add-away-point"]').forEach(btn => {
    btn.addEventListener('click', () => updateScore('away', parseInt(btn.dataset.points)));
  });
  
  // 计时器控制
  document.getElementById('start-timer')?.addEventListener('click', () => controlTimer('start'));
  document.getElementById('pause-timer')?.addEventListener('click', () => controlTimer('pause'));
  document.getElementById('reset-timer')?.addEventListener('click', () => controlTimer('reset'));
  
  // 游戏控制
  document.getElementById('start-game')?.addEventListener('click', () => controlGame('start'));
  document.getElementById('pause-game')?.addEventListener('click', () => controlGame('pause'));
  document.getElementById('end-game')?.addEventListener('click', () => controlGame('end'));
}

/**
 * 检查连接状态
 */
function checkConnectionStatus() {
  if (socket && socket.connected) {
    updateConnectionStatus(true);
  } else {
    updateConnectionStatus(false);
  }
}

/**
 * 检查认证状态
 */
function checkAuthStatus() {
  // 从localStorage刷新认证状态
  authToken = localStorage.getItem('smartjfb_token');
  currentUser = JSON.parse(localStorage.getItem('smartjfb_user'));
  
  // 根据认证状态更新UI
  updateAuthUI();
}

/**
 * 更新认证相关的UI元素
 */
function updateAuthUI() {
  const loginStatusElement = document.getElementById('login-status');
  const currentUserElement = document.getElementById('current-user');
  
  if (loginStatusElement) {
    loginStatusElement.textContent = authToken ? '已登录' : '未登录';
  }
  
  if (currentUserElement) {
    currentUserElement.textContent = currentUser ? currentUser.username : '-';
  }
}

/**
 * 检查用户是否已认证
 */
function isAuthenticated() {
  return !!authToken && !!currentUser;
}

/**
 * 获取当前用户角色
 */
function getUserRole() {
  return currentUser ? currentUser.role : null;
}

/**
 * 检查认证并重定向到登录页面（如果未认证）
 */
function requireAuth(redirectUrl = './auth.html') {
  if (!isAuthenticated()) {
    // 获取当前页面路径并尝试构建正确的登录页面路径
    const currentPath = window.location.pathname;
    let loginPath;
    
    // 根据当前页面位置决定正确的登录页面路径
    if (currentPath.includes('/pages/timer/')) {
      // 如果在timer子目录下，需要向上两级
      loginPath = '../../pages/auth.html';
    } else if (currentPath.includes('/pages/')) {
      // 如果在pages目录下，需要向上一级
      loginPath = './auth.html';
    } else {
      // 对于根目录下的页面，直接使用相对路径
      loginPath = redirectUrl;
    }
    
    // 最终重定向到登录页面
    window.location.href = loginPath;
    return false;
  }
  return true;
}

/**
 * 更新连接状态显示
 */
function updateConnectionStatus(isConnected) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.textContent = isConnected ? '已连接' : '未连接';
    statusElement.className = isConnected ? 
      'status-indicator connected' : 
      'status-indicator disconnected';
  }
}

/**
 * 更新游戏状态显示
 */
function updateGameStatus(status) {
  const statusElement = document.getElementById('game-status');
  if (statusElement) {
    statusElement.textContent = getStatusText(status);
    // 我们可以根据状态添加视觉指示器
  }
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
  const statusMap = {
    'setup': '设置',
    'running': '进行中',
    'paused': '暂停',
    'finished': '结束'
  };
  return statusMap[status] || status;
}

/**
 * 显示指定面板
 */
function showPanel(panelId) {
  // 首先隐藏所有面板
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  
  // 显示请求的面板
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.remove('hidden');
  }
}

/**
 * 隐藏指定面板
 */
function hidePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.add('hidden');
  }
}

/**
 * 格式化时间（秒）
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化带小数的时间（秒）
 */
function formatDecimalTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

/**
 * 格式化进攻时钟时间（十分之一秒）
 */
function formatShotClock(tenths) {
  return (tenths / 10).toFixed(1);
}

/**
 * 存储认证数据
 */
function storeAuthData(token, user) {
  authToken = token;
  currentUser = user;
  
  localStorage.setItem('smartjfb_token', token);
  localStorage.setItem('smartjfb_user', JSON.stringify(user));
}

/**
 * 清除认证数据
 */
function clearAuthData() {
  authToken = null;
  currentUser = null;
  
  localStorage.removeItem('smartjfb_token');
  localStorage.removeItem('smartjfb_user');
}

/**
 * 显示提示信息
 */
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  // 将提示框添加到页面顶部
  const appContainer = document.getElementById('app') || document.body;
  appContainer.insertBefore(alertDiv, appContainer.firstChild);
  
  // 3秒后自动移除提示框
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 3000);
}

/**
 * 等待DOM元素出现
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        observer.disconnect();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * 通用的HTTP请求函数
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };
  
  const requestOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 将通用函数暴露到全局作用域
window.API_BASE_URL = API_BASE_URL;
window.SOCKET_URL = SOCKET_URL;
window.authToken = authToken;
window.currentUser = currentUser;
window.gameState = gameState;
window.socket = socket;

// 将工具函数添加到window对象以便其他模块使用
window.initApp = initApp;
window.initSocket = initSocket;
window.initEventHandlers = initEventHandlers;
window.checkConnectionStatus = checkConnectionStatus;
window.checkAuthStatus = checkAuthStatus;
window.updateAuthUI = updateAuthUI;
window.is_authenticated = isAuthenticated;
window.getUserRole = getUserRole;
window.requireAuth = requireAuth;
window.updateConnectionStatus = updateConnectionStatus;
window.updateGameStatus = updateGameStatus;
window.getStatusText = getStatusText;
window.showPanel = showPanel;
window.hidePanel = hidePanel;
window.formatTime = formatTime;
window.formatDecimalTime = formatDecimalTime;
window.formatShotClock = formatShotClock;
window.storeAuthData = storeAuthData;
window.clearAuthData = clearAuthData;
window.showAlert = showAlert;
window.waitForElement = waitForElement;
window.apiRequest = apiRequest;
window.debounce = debounce;
window.throttle = throttle;

// 获取所有活动游戏列表
async function fetchActiveGames() {
  try {
    const response = await fetch(`${API_BASE_URL}/games`);
    const data = await response.json();
    
    if (response.ok) {
      window.gamesList = data.games || [];
      return window.gamesList;
    } else {
      console.error('Failed to fetch games:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
}

// 更新活动游戏下拉菜单
function updateActiveGamesDropdown(games) {
  const dropdown = document.getElementById('active-games');
  if (!dropdown) return;
  
  // 清空现有选项
  dropdown.innerHTML = '<option value="">请选择比赛...</option>';
  
  // 添加游戏选项
  if (games && games.length > 0) {
    games.forEach(game => {
      const option = document.createElement('option');
      option.value = game.id;
      option.textContent = `${game.teams[0]?.name || 'Home'} vs ${game.teams[1]?.name || 'Away'} (${game.sport})`;
      dropdown.appendChild(option);
    });
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '暂无比赛';
    dropdown.appendChild(option);
  }
}

// 刷新游戏列表
async function refreshGamesList() {
  const games = await fetchActiveGames();
  updateActiveGamesDropdown(games);
  return games;
}

// 将新增的函数也添加到window对象
window.fetchActiveGames = fetchActiveGames;
window.updateActiveGamesDropdown = updateActiveGamesDropdown;
window.refreshGamesList = refreshGamesList;