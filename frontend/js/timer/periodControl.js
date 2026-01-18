// Period Control specific functionality

// Using utilities from utils.js
document.addEventListener('DOMContentLoaded', async function() {
  await initPeriodControlPage();
});

async function initPeriodControlPage() {
  // Initialize period control specific functionality
  initializePeriodControlElements();
  initializePeriodControlEvents();
  await initializeGameSelection();
  connectToPeriodUpdates();
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

function initializePeriodControlElements() {
  // Initialize elements specific to period control
  console.log('Initializing period control elements');
}

function initializePeriodControlEvents() {
  // Period control specific event listeners
  document.getElementById('prev-period')?.addEventListener('click', prevPeriod);
  document.getElementById('next-period')?.addEventListener('click', nextPeriod);
  document.getElementById('apply-period')?.addEventListener('click', setPeriodToValue);
}

function connectToPeriodUpdates() {
  // Connect to socket for period updates
  if (window.io) {
    window.socket = io('http://localhost:3000');
    
    window.socket.on('connect', function() {
      console.log('Connected to period updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    window.socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for period updates
    window.socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.period) {
        updatePeriodDisplay(data.timer.period);
      }
    });
  }
}

async function prevPeriod() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Moving to previous period for game:', gameId);
  // Send command to backend to move to previous period
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'period', action: 'prev', gameId });
  }
}

async function nextPeriod() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  console.log('Moving to next period for game:', gameId);
  // Send command to backend to move to next period
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'period', action: 'next', gameId });
  }
}

async function setPeriodToValue() {
  const gameId = document.getElementById('active-games').value;
  const periodInput = document.getElementById('period-input').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  if (!periodInput) {
    alert('请输入节数');
    return;
  }
  
  const periodValue = parseInt(periodInput);
  if (isNaN(periodValue) || periodValue < 1) {
    alert('请输入有效的节数');
    return;
  }
  
  console.log('Setting period to:', periodValue, 'for game:', gameId);
  // Send command to backend to set period to specific value
  if (window.socket) {
    window.socket.emit('control-timer', { type: 'period', action: 'set', value: periodValue, gameId });
  }
}

function updatePeriodDisplay(period) {
  const periodElement = document.getElementById('current-period');
  if (periodElement) {
    periodElement.textContent = period;
  }
}

function updateConnectionStatus(status, text) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.className = `status-indicator ${status}`;
    statusElement.textContent = text;
  }
}