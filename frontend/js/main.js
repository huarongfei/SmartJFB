// Global constants and variables
const API_BASE_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Authentication state
let authToken = localStorage.getItem('smartjfb_token') || null;
let currentUser = JSON.parse(localStorage.getItem('smartjfb_user')) || null;

// Global state
let gameState = {
  currentGameId: null,
  sport: null,
  teams: null,
  scores: null,
  timers: null
};

// Socket connection
let socket;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initApp();
});

function initApp() {
  // Initialize socket connection
  initSocket();
  
  // Initialize UI event handlers
  initEventHandlers();
  
  // Check connection status
  checkConnectionStatus();
  
  // Check authentication status
  checkAuthStatus();
}

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
  
  // Listen for game updates
  socket.on('gameUpdate', function(data) {
    console.log('Game updated:', data);
    updateGameDisplay(data.game);
  });
  
  // Listen for timer updates
  socket.on('timerUpdate', function(data) {
    console.log('Timer updated:', data);
    updateTimerDisplay(data.timer);
  });
  
  // Listen for score updates
  socket.on('scoreUpdate', function(data) {
    console.log('Score updated:', data);
    updateScoreDisplay(data.scores);
  });
  
  // Listen for general event updates
  socket.on('eventUpdate', function(data) {
    console.log('Event updated:', data);
    addEventToTimeline(data);
  });
}

function initEventHandlers() {
  // Game creation
  document.getElementById('create-game-btn')?.addEventListener('click', createNewGame);
  
  // Score controls
  document.querySelectorAll('[id^="add-home-point"]').forEach(btn => {
    btn.addEventListener('click', () => updateScore('home', parseInt(btn.dataset.points)));
  });
  
  document.querySelectorAll('[id^="add-away-point"]').forEach(btn => {
    btn.addEventListener('click', () => updateScore('away', parseInt(btn.dataset.points)));
  });
  
  // Timer controls
  document.getElementById('start-timer')?.addEventListener('click', () => controlTimer('start'));
  document.getElementById('pause-timer')?.addEventListener('click', () => controlTimer('pause'));
  document.getElementById('reset-timer')?.addEventListener('click', () => controlTimer('reset'));
  
  // Game controls
  document.getElementById('start-game')?.addEventListener('click', () => controlGame('start'));
  document.getElementById('pause-game')?.addEventListener('click', () => controlGame('pause'));
  document.getElementById('end-game')?.addEventListener('click', () => controlGame('end'));
}

function checkConnectionStatus() {
  // Initial connection status check
  if (socket && socket.connected) {
    updateConnectionStatus(true);
  } else {
    updateConnectionStatus(false);
  }
}

function checkAuthStatus() {
  // Refresh authentication state from localStorage
  authToken = localStorage.getItem('smartjfb_token');
  currentUser = JSON.parse(localStorage.getItem('smartjfb_user'));
  
  // Update UI based on authentication status
  updateAuthUI();
}

function updateAuthUI() {
  // Update UI elements based on authentication status
  const loginStatusElement = document.getElementById('login-status');
  const currentUserElement = document.getElementById('current-user');
  
  if (loginStatusElement) {
    loginStatusElement.textContent = authToken ? '已登录' : '未登录';
  }
  
  if (currentUserElement) {
    currentUserElement.textContent = currentUser ? currentUser.username : '-';
  }
}

// Function to check if user is authenticated
function isAuthenticated() {
  return !!authToken && !!currentUser;
}

// Function to get current user role
function getUserRole() {
  return currentUser ? currentUser.role : null;
}

// Function to redirect to login page if not authenticated
function requireAuth(redirectUrl = './auth.html') {
  if (!isAuthenticated()) {
    // 获取当前页面路径并尝试构建正确的登录页面路径
    const currentPath = window.location.pathname;
    let loginPath;
    
    // 如果当前路径包含 '/pages/'，那么登录页面应该在同一级
    if (currentPath.includes('/pages/')) {
      loginPath = './auth.html';
    } else {
      // 否则可能是嵌套的路径，尝试向上几级
      if (currentPath.includes('/timer/')) {
        loginPath = './auth.html';
      } else {
        loginPath = redirectUrl;
      }
    }
    
    // 最终重定向到登录页面
    window.location.href = loginPath;
    return false;
  }
  return true;
}

function updateConnectionStatus(isConnected) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.textContent = isConnected ? '已连接' : '未连接';
    statusElement.className = isConnected ? 
      'status-indicator connected' : 
      'status-indicator disconnected';
  }
}

function updateGameStatus(status) {
  const statusElement = document.getElementById('game-status');
  if (statusElement) {
    statusElement.textContent = getStatusText(status);
    // We could add visual indicators based on status here
  }
}

function getStatusText(status) {
  const statusMap = {
    'setup': '设置',
    'running': '进行中',
    'paused': '暂停',
    'finished': '结束'
  };
  return statusMap[status] || status;
}

function showPanel(panelId) {
  // Hide all panels first
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  
  // Show the requested panel
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.remove('hidden');
  }
}

function hidePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.add('hidden');
  }
}

// Utility functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDecimalTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

// Format shot clock time (tenths of seconds)
function formatShotClock(tenths) {
  return (tenths / 10).toFixed(1);
}

// Function to store authentication data
function storeAuthData(token, user) {
  authToken = token;
  currentUser = user;
  
  localStorage.setItem('smartjfb_token', token);
  localStorage.setItem('smartjfb_user', JSON.stringify(user));
}

// Function to clear authentication data
function clearAuthData() {
  authToken = null;
  currentUser = null;
  
  localStorage.removeItem('smartjfb_token');
  localStorage.removeItem('smartjfb_user');
}