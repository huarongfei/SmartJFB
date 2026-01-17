// Timeout Control specific functionality
document.addEventListener('DOMContentLoaded', function() {
  initTimeoutControlPage();
});

function initTimeoutControlPage() {
  // Initialize timeout control specific functionality
  initializeTimeoutControlElements();
  initializeTimeoutControlEvents();
  connectToTimeoutUpdates();
}

function initializeTimeoutControlElements() {
  // Initialize elements specific to timeout control
  console.log('Initializing timeout control elements');
}

function initializeTimeoutControlEvents() {
  // Timeout control specific event listeners
  document.getElementById('use-home-timeout').addEventListener('click', useHomeTimeout);
  document.getElementById('add-home-timeout').addEventListener('click', addHomeTimeout);
  document.getElementById('reset-home-timeouts').addEventListener('click', resetHomeTimeouts);
  document.getElementById('use-away-timeout').addEventListener('click', useAwayTimeout);
  document.getElementById('add-away-timeout').addEventListener('click', addAwayTimeout);
  document.getElementById('reset-away-timeouts').addEventListener('click', resetAwayTimeouts);
}

function connectToTimeoutUpdates() {
  // Connect to socket for timeout updates
  if (window.io) {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', function() {
      console.log('Connected to timeout updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for timeout updates
    socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.timeouts) {
        updateTimeoutDisplays(data.timer.timeouts);
      }
    });
  }
}

function useHomeTimeout() {
  console.log('Using home team timeout');
  // Send command to backend to use home team timeout
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'timeout', action: 'use', team: 'home' });
  }
}

function addHomeTimeout() {
  console.log('Adding home team timeout');
  // Send command to backend to add home team timeout
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'timeout', action: 'add', team: 'home' });
  }
}

function resetHomeTimeouts() {
  console.log('Resetting home team timeouts');
  // Send command to backend to reset home team timeouts
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'timeout', action: 'reset', team: 'home' });
  }
}

function useAwayTimeout() {
  console.log('Using away team timeout');
  // Send command to backend to use away team timeout
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'timeout', action: 'use', team: 'away' });
  }
}

function addAwayTimeout() {
  console.log('Adding away team timeout');
  // Send command to backend to add away team timeout
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'timeout', action: 'add', team: 'away' });
  }
}

function resetAwayTimeouts() {
  console.log('Resetting away team timeouts');
  // Send command to backend to reset away team timeouts
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'timeout', action: 'reset', team: 'away' });
  }
}

function updateTimeoutDisplays(timeouts) {
  const homeTimeoutsElement = document.getElementById('home-timeouts');
  const awayTimeoutsElement = document.getElementById('away-timeouts');
  
  if (homeTimeoutsElement && timeouts.home !== undefined) {
    homeTimeoutsElement.textContent = timeouts.home;
  }
  
  if (awayTimeoutsElement && timeouts.away !== undefined) {
    awayTimeoutsElement.textContent = timeouts.away;
  }
}

function updateConnectionStatus(status, text) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.className = `status-indicator ${status}`;
    statusElement.textContent = text;
  }
}