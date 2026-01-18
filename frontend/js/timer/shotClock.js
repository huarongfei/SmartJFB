// Shot Clock specific functionality

// Using utilities from utils.js
document.addEventListener('DOMContentLoaded', async function() {
  await initShotClockPage();
});

async function initShotClockPage() {
  // Initialize shot clock specific functionality
  initializeShotClockElements();
  initializeShotClockEventListeners();
  await initializeGameSelection();
  connectToShotClockUpdates();
}

// Initialize game selection dropdown
async function initializeGameSelection() {
  try {
    // Load games into the dropdown
    await window.refreshGamesList();
    
    // Add event listener for game selection
    document.getElementById('active-games').addEventListener('change', function() {
      const gameId = this.value;
      if (gameId) {
        console.log('Selected game:', gameId);
        // Here we would typically join the game room
        if (window.socket) {
          window.socket.emit('join-game', gameId);
        }
      }
    });
    
    // Add event listener for refresh button
    document.getElementById('refresh-games')?.addEventListener('click', async function() {
      await window.refreshGamesList();
    });
  } catch (error) {
    console.error('Error initializing game selection:', error);
  }
}

function initializeShotClockElements() {
  // Initialize elements specific to shot clock
  console.log('Initializing shot clock elements');
}

function initializeShotClockEventListeners() {
  // Shot clock specific event listeners
  document.getElementById('start-shot-clock')?.addEventListener('click', startShotClock);
  document.getElementById('pause-shot-clock')?.addEventListener('click', pauseShotClock);
  document.getElementById('reset-shot-clock')?.addEventListener('click', resetShotClock);
  document.getElementById('set-shot-clock')?.addEventListener('click', setShotClockTime);
}

function connectToShotClockUpdates() {
  // Connect to socket for shot clock updates
  if (window.io) {
    window.socket = io('http://localhost:3000');
    
    window.socket.on('connect', function() {
      console.log('Connected to shot clock updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    window.socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for shot clock updates
    window.socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.shotClock) {
        updateShotClockDisplay(data.timer.shotClock.time);
      }
    });
  }
}

async function startShotClock() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Starting shot clock for game:', gameId);
  // Send command to backend to start shot clock
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'shotClock', action: 'start', gameId });
  }
}

async function pauseShotClock() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Pausing shot clock for game:', gameId);
  // Send command to backend to pause shot clock
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'shotClock', action: 'pause', gameId });
  }
}

async function resetShotClock() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Resetting shot clock for game:', gameId);
  // Send command to backend to reset shot clock
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'shotClock', action: 'reset', gameId });
  }
}

async function setShotClockTime() {
  const gameId = document.getElementById('active-games').value;
  const timeInput = document.getElementById('shot-clock-input').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  if (!timeInput) {
    alert('请输入时间 (单位: 秒)');
    return;
  }
  
  console.log('Setting shot clock time to:', timeInput, 'for game:', gameId);
  // Send command to backend to set shot clock time
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'shotClock', action: 'setTime', value: timeInput, gameId });
  }
}

function updateShotClockDisplay(timeInTenths) {
  const clockElement = document.getElementById('shot-clock');
  if (clockElement) {
    const seconds = timeInTenths / 10;
    clockElement.textContent = seconds.toFixed(1);
  }
}

function updateConnectionStatus(status, text) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.className = `status-indicator ${status}`;
    statusElement.textContent = text;
  }
}