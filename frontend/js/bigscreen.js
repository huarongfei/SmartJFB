// Big screen display functionality

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
  // In a real implementation, we would connect to game updates
  // For now, we'll simulate updates
  
  // Listen for game updates via socket
  if (window.io) {
    window.bigScreenSocket = io('http://localhost:3000');
        
    window.bigScreenSocket.on('connect', function() {
      console.log('Connected to game updates for big screen');
      updateConnectionStatus(true);
    });
        
    window.bigScreenSocket.on('disconnect', function() {
      console.log('Disconnected from game updates');
      updateConnectionStatus(false);
    });
        
    // Listen for game state updates
    window.bigScreenSocket.on('scoreUpdate', function(data) {
      console.log('Score update received:', data);
      updateScoreDisplay(data.scores);
    });
        
    // Listen for timer updates
    window.bigScreenSocket.on('timerUpdate', function(data) {
      console.log('Timer update received:', data);
      updateTimerDisplay(data.timer);
    });
        
    // Listen for game events
    window.bigScreenSocket.on('eventUpdate', function(data) {
      console.log('Event update received:', data);
      handleGameEvent(data);
    });
        
    // Listen for game status changes
    window.bigScreenSocket.on('gameUpdate', function(data) {
      console.log('Game update received:', data);
      updateGameDisplay(data.game);
    });
        
    // Listen for game creation/update events
    window.bigScreenSocket.on('gamesListUpdate', function(data) {
      console.log('Games list update received:', data);
      if (data.games && data.games.length > 0) {
        // Use the first available game
        const game = data.games[0];
        updateTeamNames(game);
      }
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
}

function updateScoreDisplay(scores) {
  if (!scores) return;
  
  // Find team names from the scores object
  const teamNames = Object.keys(scores);
  if (teamNames.length >= 2) {
    const homeScoreElement = document.getElementById('home-team-score');
    const awayScoreElement = document.getElementById('away-team-score');
    
    // Get current scores
    const currentHomeScore = parseInt(homeScoreElement.textContent) || 0;
    const newHomeScore = scores[teamNames[0]] || 0;
    const currentAwayScore = parseInt(awayScoreElement.textContent) || 0;
    const newAwayScore = scores[teamNames[1]] || 0;
    
    // Update scores
    homeScoreElement.textContent = newHomeScore;
    awayScoreElement.textContent = newAwayScore;
    
    // Add animation if score changed
    if (newHomeScore !== currentHomeScore) {
      homeScoreElement.classList.add('score-update-animation');
      setTimeout(() => {
        homeScoreElement.classList.remove('score-update-animation');
      }, 500);
    }
    
    if (newAwayScore !== currentAwayScore) {
      awayScoreElement.classList.add('score-update-animation');
      setTimeout(() => {
        awayScoreElement.classList.remove('score-update-animation');
      }, 500);
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
      showCenterOverlay('CUSTOM MESSAGE');
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

// Update team names from game data
function updateTeamNames(game) {
  if (game && game.teams && game.teams.length >= 2) {
    const homeTeam = game.teams[0];
    const awayTeam = game.teams[1];
    
    document.getElementById('home-team-name').textContent = homeTeam.name || '主队';
    document.getElementById('away-team-name').textContent = awayTeam.name || '客队';
    
    // Update team logos if available
    if (homeTeam.logo) {
      document.getElementById('home-team-logo').textContent = '';
      const img = document.createElement('img');
      img.src = homeTeam.logo;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      document.getElementById('home-team-logo').appendChild(img);
    }
    
    if (awayTeam.logo) {
      document.getElementById('away-team-logo').textContent = '';
      const img = document.createElement('img');
      img.src = awayTeam.logo;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      document.getElementById('away-team-logo').appendChild(img);
    }
  }
}

// Update connection status display
function updateConnectionStatus(isConnected) {
  // In a big screen, we might show a subtle indicator
  console.log(`Big screen connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
}