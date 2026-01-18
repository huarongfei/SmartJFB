// Game Clock specific functionality

// Using utilities from utils.js
document.addEventListener('DOMContentLoaded', async function() {
  await initGameClockPage();
});

async function initGameClockPage() {
  // Initialize game clock specific functionality
  initializeGameClockElements();
  initializeGameClockEventListeners();
  await initializeGameSelection();
  connectToGameClockUpdates();
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

function initializeGameClockElements() {
  // Initialize elements specific to game clock
  console.log('Initializing game clock elements');
}

function initializeGameClockEventListeners() {
  // Game clock specific event listeners
  document.getElementById('start-game-timer')?.addEventListener('click', startGameTimer);
  document.getElementById('pause-game-timer')?.addEventListener('click', pauseGameTimer);
  document.getElementById('stop-game-timer')?.addEventListener('click', stopGameTimer);
  document.getElementById('reset-game-timer')?.addEventListener('click', resetGameTimer);
  document.getElementById('set-game-clock')?.addEventListener('click', setGameClockTime);
}

function connectToGameClockUpdates() {
  // Connect to socket for game clock updates
  if (window.io) {
    window.socket = io('http://localhost:3000');
    
    window.socket.on('connect', function() {
      console.log('Connected to game clock updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    window.socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for game clock updates
    window.socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.gameClock) {
        updateGameClockDisplay(data.timer.gameClock.time);
      }
    });
  }
}

async function startGameTimer() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Starting game timer for game:', gameId);
  // Send command to backend to start game timer
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'gameClock', action: 'start', gameId });
  }
}

async function pauseGameTimer() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Pausing game timer for game:', gameId);
  // Send command to backend to pause game timer
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'gameClock', action: 'pause', gameId });
  }
}

async function stopGameTimer() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Stopping game timer for game:', gameId);
  // Send command to backend to stop game timer
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'gameClock', action: 'stop', gameId });
  }
}

async function resetGameTimer() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Resetting game timer for game:', gameId);
  // Send command to backend to reset game timer
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'gameClock', action: 'reset', gameId });
  }
}

async function setGameClockTime() {
  const gameId = document.getElementById('active-games').value;
  const timeInput = document.getElementById('game-clock-input').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  if (!timeInput) {
    alert('请输入时间 (格式: MM:SS)');
    return;
  }
  
  console.log('Setting game clock time to:', timeInput, 'for game:', gameId);
  // Send command to backend to set game clock time
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'gameClock', action: 'setTime', value: timeInput, gameId });
  }
}

function updateGameClockDisplay(timeInSeconds) {
  const clockElement = document.getElementById('game-clock');
  if (clockElement) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    clockElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function updateConnectionStatus(status, text) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.className = `status-indicator ${status}`;
    statusElement.textContent = text;
  }
}