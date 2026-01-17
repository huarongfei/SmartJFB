// Game Clock specific functionality
document.addEventListener('DOMContentLoaded', function() {
  initGameClockPage();
});

function initGameClockPage() {
  // Initialize game clock specific functionality
  initializeGameClockElements();
  initializeGameClockEventListeners();
  connectToGameClockUpdates();
}

function initializeGameClockElements() {
  // Initialize elements specific to game clock
  console.log('Initializing game clock elements');
}

function initializeGameClockEventListeners() {
  // Game clock specific event listeners
  document.getElementById('start-game-timer').addEventListener('click', startGameTimer);
  document.getElementById('pause-game-timer').addEventListener('click', pauseGameTimer);
  document.getElementById('stop-game-timer').addEventListener('click', stopGameTimer);
  document.getElementById('reset-game-timer').addEventListener('click', resetGameTimer);
  document.getElementById('set-game-clock').addEventListener('click', setGameClockTime);
}

function connectToGameClockUpdates() {
  // Connect to socket for game clock updates
  if (window.io) {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', function() {
      console.log('Connected to game clock updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for game clock updates
    socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.gameClock) {
        updateGameClockDisplay(data.timer.gameClock.time);
      }
    });
  }
}

function startGameTimer() {
  console.log('Starting game timer');
  // Send command to backend to start game timer
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'gameClock', action: 'start' });
  }
}

function pauseGameTimer() {
  console.log('Pausing game timer');
  // Send command to backend to pause game timer
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'gameClock', action: 'pause' });
  }
}

function stopGameTimer() {
  console.log('Stopping game timer');
  // Send command to backend to stop game timer
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'gameClock', action: 'stop' });
  }
}

function resetGameTimer() {
  console.log('Resetting game timer');
  // Send command to backend to reset game timer
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'gameClock', action: 'reset' });
  }
}

function setGameClockTime() {
  const timeInput = document.getElementById('game-clock-input').value;
  console.log('Setting game clock time to:', timeInput);
  // Send command to backend to set game clock time
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'gameClock', action: 'setTime', value: timeInput });
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