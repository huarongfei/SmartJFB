// Global constants and variables
// Using utilities from utils.js

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

// Functions that are now in utils.js:
// - checkConnectionStatus
// - checkAuthStatus
// - updateAuthUI
// - isAuthenticated
// - getUserRole
// - requireAuth
// - updateConnectionStatus
// - updateGameStatus
// - getStatusText
// - showPanel
// - hidePanel
// - formatTime
// - formatDecimalTime
// - formatShotClock
// - storeAuthData
// - clearAuthData