// Standalone big screen display functionality
// Using utilities from utils.js

document.addEventListener('DOMContentLoaded', function() {
  initBigScreen();
});

function initBigScreen() {
  // Initialize connection to game data
  initBigScreenEventHandlers();
  
  // Connect to game updates via WebSocket
  connectToGameUpdates();
  
  // Set initial display values
  setInitialDisplayValues();
}

function initBigScreenEventHandlers() {
  // No specific user interactions needed for big screen
  // But we'll monitor keyboard shortcuts for special functions
  document.addEventListener('keydown', handleKeyPress);
}

function connectToGameUpdates() {
  // Listen for game updates via socket
  if (window.io) {
    const bigScreenSocket = io('http://localhost:3001');
    
    bigScreenSocket.on('connect', function() {
      console.log('Connected to game updates for big screen');
      updateConnectionStatus(true);
      
      // Join a specific game room if gameId is provided
      const urlParams = new URLSearchParams(window.location.search);
      const gameId = urlParams.get('gameId') || 'default';
      bigScreenSocket.emit('join-game', gameId);
    });
    
    bigScreenSocket.on('disconnect', function() {
      console.log('Disconnected from game updates');
      updateConnectionStatus(false);
    });
    
    // Listen for game state updates
    bigScreenSocket.on('scoreUpdate', function(data) {
      console.log('Score update received:', data);
      updateScoreDisplay(data.scores);
    });
    
    // Listen for timer updates
    bigScreenSocket.on('timerUpdate', function(data) {
      console.log('Timer update received:', data);
      updateTimerDisplay(data.timer);
    });
    
    // Listen for game events
    bigScreenSocket.on('eventUpdate', function(data) {
      console.log('Event update received:', data);
      handleGameEvent(data);
    });
    
    // Listen for game status changes
    bigScreenSocket.on('gameUpdate', function(data) {
      console.log('Game update received:', data);
      updateGameDisplay(data.game);
    });
  }
  
  // 注释掉演示模式代码
  // setInterval(simulateScoreUpdate, 10000); // Every 10 seconds
}

function setInitialDisplayValues() {
  // Set initial team names (these would come from the game data in real implementation)
  document.getElementById('home-team-name').textContent = '主队';
  document.getElementById('away-team-name').textContent = '客队';
  
  // Initial scores
  document.getElementById('home-team-score').textContent = '0';
  document.getElementById('away-team-score').textContent = '0';
  
  // Initial timer
  document.getElementById('game-timer').textContent = '12:00';
  
  // Initial period
  document.getElementById('period-display').textContent = '第1节';
  
  // Initial fouls
  document.getElementById('home-fouls').textContent = '0';
  document.getElementById('away-fouls').textContent = '0';
  
  // Initialize connection status as disconnected
  updateConnectionStatus(false);
}

function updateScoreDisplay(scores) {
  if (!scores) return;
  
  // Find team names from the scores object
  const teamNames = Object.keys(scores);
  if (teamNames.length >= 2) {
    // Update scores
    document.getElementById('home-team-score').textContent = scores[teamNames[0]] || 0;
    document.getElementById('away-team-score').textContent = scores[teamNames[1]] || 0;
  } else if (teamNames.length === 1) {
    // If only one team's score is provided, update that team
    if (teamNames[0].toLowerCase().includes('home')) {
      document.getElementById('home-team-score').textContent = scores[teamNames[0]];
    } else if (teamNames[0].toLowerCase().includes('away')) {
      document.getElementById('away-team-score').textContent = scores[teamNames[0]];
    }
  }
}

function updateTimerDisplay(timer) {
  if (!timer) return;
  
  // Update game clock
  const gameClockElement = document.getElementById('game-timer');
  if (gameClockElement) {
    gameClockElement.textContent = formatTime(timer.gameClock.time);
  }
  
  // Update shot clock if visible (basketball)
  const shotClockElement = document.getElementById('shot-clock');
  if (shotClockElement && timer.shotClock) {
    shotClockElement.textContent = formatShotClock(timer.shotClock.time);
    shotClockElement.classList.remove('hidden');
  }
  
  // Update period
  const periodElement = document.getElementById('period-display');
  if (periodElement) {
    const periodLabels = ['第1节', '第2节', '第3节', '第4节', '加时1', '加时2', '加时3'];
    const periodIndex = Math.min(timer.period - 1, periodLabels.length - 1);
    periodElement.textContent = periodLabels[periodIndex] || `第${timer.period}节`;
  }
  
  // Update fouls if available
  if (timer.fouls) {
    document.getElementById('home-fouls').textContent = timer.fouls.home || 0;
    document.getElementById('away-fouls').textContent = timer.fouls.away || 0;
  }
  
  // Update timeouts if available
  if (timer.timeouts) {
    updateTimeoutIndicators('home', timer.timeouts.home);
    updateTimeoutIndicators('away', timer.timeouts.away);
  }
}

function handleGameEvent(event) {
  // Handle different types of game events
  switch(event.eventType) {
    case 'timeout':
      // Update timeout indicators
      break;
    case 'foul':
      // Update foul counters
      break;
    case 'period_change':
      // Update period display
      break;
    default:
      // Other events
      break;
  }
}

function updateGameDisplay(game) {
  // Update the display with full game state
  if (game.score) {
    updateScoreDisplay(game.score);
  }
  
  if (game.timers) {
    updateTimerDisplay(game.timers);
  }
}

function updateTimeoutIndicators(team, remainingTimeouts) {
  const container = document.getElementById(`${team}-timeouts`);
  if (!container) return;
  
  const dots = container.querySelectorAll('.timeout-dot');
  const totalTimeouts = dots.length;
  
  // Set dots as active/inactive based on remaining timeouts
  for (let i = 0; i < totalTimeouts; i++) {
    if (i < totalTimeouts - remainingTimeouts) {
      dots[i].classList.add('active');
    } else {
      dots[i].classList.remove('active');
    }
  }
}

function handleKeyPress(event) {
  // Keyboard shortcuts for special big screen functions
  switch(event.key) {
    case 't':
    case 'T':
      // Toggle shot clock visibility
      toggleShotClock();
      break;
    case 'c':
    case 'C':
      // Show center overlay with custom message
      showCenterOverlay('自定义信息');
      break;
    case 'h':
    case 'H':
      // Show halftime message
      showCenterOverlay('半场休息', 'half-time');
      break;
    case 'e':
    case 'E':
      // Show end of game
      showCenterOverlay('比赛结束', 'end-game');
      break;
    case 'Escape':
      // Hide any overlays
      hideCenterOverlay();
      break;
    case '1':
      // Quick score for home team
      adjustScore('home', 1);
      break;
    case '2':
      // Quick score for home team (2 points)
      adjustScore('home', 2);
      break;
    case '3':
      // Quick score for home team (3 points)
      adjustScore('home', 3);
      break;
    case '4':
      // Quick score for away team
      adjustScore('away', 1);
      break;
    case '5':
      // Quick score for away team (2 points)
      adjustScore('away', 2);
      break;
    case '6':
      // Quick score for away team (3 points)
      adjustScore('away', 3);
      break;
  }
}

function adjustScore(team, points) {
  const scoreElement = document.getElementById(`${team}-team-score`);
  if (scoreElement) {
    const currentScore = parseInt(scoreElement.textContent) || 0;
    scoreElement.textContent = currentScore + points;
  }
}

function toggleShotClock() {
  const shotClockElement = document.getElementById('shot-clock');
  if (shotClockElement) {
    shotClockElement.classList.toggle('hidden');
  }
}

function showCenterOverlay(message, type = '') {
  const overlay = document.getElementById('center-info-overlay');
  if (overlay) {
    overlay.textContent = message;
    overlay.classList.remove('hidden');
    
    if (type) {
      overlay.classList.add(type);
    }
    
    // Auto-hide after 5 seconds
    setTimeout(hideCenterOverlay, 5000);
  }
}

function hideCenterOverlay() {
  const overlay = document.getElementById('center-info-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.classList.remove('half-time', 'end-game');
  }
}

// 演示模式函数已移除
function simulateScoreUpdate() {
  // 演示模式已禁用，仅保留空函数防止错误
}

// Format time for display (MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format shot clock time (X.X seconds)
function formatShotClock(tenths) {
  return (tenths / 10).toFixed(1);
}

// Update connection status display
function updateConnectionStatus(isConnected) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.textContent = isConnected ? '已连接' : '未连接';
    statusElement.className = 'connection-status ' + (isConnected ? 'connected' : 'disconnected');
  }
}