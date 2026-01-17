// Period Control specific functionality
document.addEventListener('DOMContentLoaded', function() {
  initPeriodControlPage();
});

function initPeriodControlPage() {
  // Initialize period control specific functionality
  initializePeriodControlElements();
  initializePeriodControlEvents();
  connectToPeriodUpdates();
}

function initializePeriodControlElements() {
  // Initialize elements specific to period control
  console.log('Initializing period control elements');
}

function initializePeriodControlEvents() {
  // Period control specific event listeners
  document.getElementById('prev-period').addEventListener('click', prevPeriod);
  document.getElementById('next-period').addEventListener('click', nextPeriod);
  document.getElementById('apply-period').addEventListener('click', setPeriodToValue);
}

function connectToPeriodUpdates() {
  // Connect to socket for period updates
  if (window.io) {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', function() {
      console.log('Connected to period updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for period updates
    socket.on('timerUpdate', function(data) {
      if (data.timer && data.timer.period) {
        updatePeriodDisplay(data.timer.period);
      }
    });
  }
}

function prevPeriod() {
  console.log('Moving to previous period');
  // Send command to backend to move to previous period
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'period', action: 'prev' });
  }
}

function nextPeriod() {
  console.log('Moving to next period');
  // Send command to backend to move to next period
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'period', action: 'next' });
  }
}

function setPeriodToValue() {
  const periodInput = document.getElementById('period-input').value;
  console.log('Setting period to:', periodInput);
  // Send command to backend to set period to specific value
  if (window.io) {
    const socket = io('http://localhost:3001');
    socket.emit('control-timer', { type: 'period', action: 'set', value: parseInt(periodInput) });
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