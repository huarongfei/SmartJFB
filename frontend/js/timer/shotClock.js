// Shot Clock specific functionality
document.addEventListener('DOMContentLoaded', function() {
  initShotClockPage();
});

function initShotClockPage() {
  // Initialize shot clock specific functionality
  initializeShotClockElements();
  initializeShotClockEventListeners();
  connectToShotClockUpdates();
}

function initializeShotClockElements() {
  // Initialize elements specific to shot clock
  console.log('Initializing shot clock elements');
}

function initializeShotClockEventListeners() {
  // Shot clock specific event listeners
  document.getElementById('start-shot-clock').addEventListener('click', startShotClock);
  document.getElementById('pause-shot-clock').addEventListener('click', pauseShotClock);
  document.getElementById('reset-shot-clock').addEventListener('click', resetShotClock);
  document.getElementById('set-shot-clock').addEventListener('click', setShotClockTime);
}

function connectToShotClockUpdates() {
  // Connect to socket for shot clock updates
  if (window.io) {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', function() {
      console.log('Connected to shot clock updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for shot clock updates
    socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.shotClock) {
        updateShotClockDisplay(data.timer.shotClock.time);
      }
    });
  }
}

function startShotClock() {
  console.log('Starting shot clock');
  // Send command to backend to start shot clock
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'shotClock', action: 'start' });
  }
}

function pauseShotClock() {
  console.log('Pausing shot clock');
  // Send command to backend to pause shot clock
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'shotClock', action: 'pause' });
  }
}

function resetShotClock() {
  console.log('Resetting shot clock');
  // Send command to backend to reset shot clock
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'shotClock', action: 'reset' });
  }
}

function setShotClockTime() {
  const timeInput = document.getElementById('shot-clock-input').value;
  console.log('Setting shot clock time to:', timeInput);
  // Send command to backend to set shot clock time
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'shotClock', action: 'setTime', value: timeInput });
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