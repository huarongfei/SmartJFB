// Timeout Control specific functionality

// Using utilities from utils.js
document.addEventListener('DOMContentLoaded', async function() {
  await initTimeoutControlPage();
});

async function initTimeoutControlPage() {
  // Initialize timeout control specific functionality
  initializeTimeoutControlElements();
  initializeTimeoutControlEvents();
  await initializeGameSelection();
  connectToTimeoutUpdates();
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

function initializeTimeoutControlElements() {
  // Initialize elements specific to timeout control
  console.log('Initializing timeout control elements');
}

function initializeTimeoutControlEvents() {
  // Timeout control specific event listeners
  document.getElementById('use-home-timeout')?.addEventListener('click', useHomeTimeout);
  document.getElementById('add-home-timeout')?.addEventListener('click', addHomeTimeout);
  document.getElementById('reset-home-timeouts')?.addEventListener('click', resetHomeTimeouts);
  document.getElementById('use-away-timeout')?.addEventListener('click', useAwayTimeout);
  document.getElementById('add-away-timeout')?.addEventListener('click', addAwayTimeout);
  document.getElementById('reset-away-timeouts')?.addEventListener('click', resetAwayTimeouts);
}

function connectToTimeoutUpdates() {
  // Connect to socket for timeout updates
  if (window.io) {
    window.socket = io('http://localhost:3000');
    
    window.socket.on('connect', function() {
      console.log('Connected to timeout updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    window.socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for timeout updates
    window.socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.timeouts) {
        updateTimeoutDisplays(data.timer.timeouts);
      }
    });
  }
}

async function useHomeTimeout() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Using home team timeout for game:', gameId);
  // Send command to backend to use home team timeout
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'timeout', action: 'use', team: 'home', gameId });
  }
}

async function addHomeTimeout() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Adding home team timeout for game:', gameId);
  // Send command to backend to add home team timeout
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'timeout', action: 'add', team: 'home', gameId });
  }
}

async function resetHomeTimeouts() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Resetting home team timeouts for game:', gameId);
  // Send command to backend to reset home team timeouts
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'timeout', action: 'reset', team: 'home', gameId });
  }
}

async function useAwayTimeout() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Using away team timeout for game:', gameId);
  // Send command to backend to use away team timeout
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'timeout', action: 'use', team: 'away', gameId });
  }
}

async function addAwayTimeout() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Adding away team timeout for game:', gameId);
  // Send command to backend to add away team timeout
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'timeout', action: 'add', team: 'away', gameId });
  }
}

async function resetAwayTimeouts() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Resetting away team timeouts for game:', gameId);
  // Send command to backend to reset away team timeouts
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'timeout', action: 'reset', team: 'away', gameId });
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