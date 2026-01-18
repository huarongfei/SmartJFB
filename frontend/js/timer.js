// Timer-specific functionality

// Using utilities from utils.js

// Global state for timer
let gameState = {
  currentGameId: null,
  sport: null
};

document.addEventListener('DOMContentLoaded', function() {
  initTimerPage();
});

function initTimerPage() {
  // Initialize event handlers for timer page
  initTimerEventHandlers();
  
  // Update connection status
  checkConnectionStatus();
  
  // Connect to socket for real-time updates
  connectToTimerUpdates();
  
  // Load active games list
  refreshGamesList();
}

// Connect to socket for real-time timer updates
function connectToTimerUpdates() {
  if (window.io) {
    window.socket = io('http://localhost:3000');
    
    window.socket.on('connect', function() {
      console.log('Connected to timer updates');
      updateConnectionStatus('connected', '已连接');
    });
    
    window.socket.on('disconnect', function() {
      updateConnectionStatus('disconnected', '未连接');
    });
    
    // Listen for timer updates
    window.socket.on('timerUpdate', function(data) {
      if (data.timer) {
        updateTimerDisplay(data.timer);
      }
    });
  }
}

// Update connection status
function updateConnectionStatus(status, text) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.className = `status-indicator ${status}`;
    statusElement.textContent = text;
  }
}

function initTimerEventHandlers() {
  // Game selection
  document.getElementById('active-games')?.addEventListener('change', loadGameTimer);
  document.getElementById('refresh-games')?.addEventListener('click', refreshGamesList);
  
  // Game timer controls
  document.getElementById('start-game-timer')?.addEventListener('click', () => controlGameTimer('start'));
  document.getElementById('pause-game-timer')?.addEventListener('click', () => controlGameTimer('pause'));
  document.getElementById('stop-game-timer')?.addEventListener('click', () => controlGameTimer('stop'));
  document.getElementById('reset-game-timer')?.addEventListener('click', () => controlGameTimer('reset'));
  document.getElementById('set-game-clock')?.addEventListener('click', setGameClockTime);
  
  // Shot clock controls
  document.getElementById('start-shot-clock')?.addEventListener('click', () => controlShotClock('start'));
  document.getElementById('pause-shot-clock')?.addEventListener('click', () => controlShotClock('pause'));
  document.getElementById('reset-shot-clock')?.addEventListener('click', () => controlShotClock('reset'));
  document.getElementById('set-shot-clock')?.addEventListener('click', setShotClockTime);
  
  // Period controls
  document.getElementById('prev-period')?.addEventListener('click', prevPeriod);
  document.getElementById('next-period')?.addEventListener('click', nextPeriod);
  
  // Timeout controls
  document.getElementById('use-home-timeout')?.addEventListener('click', () => useTimeout('home'));
  document.getElementById('use-away-timeout')?.addEventListener('click', () => useTimeout('away'));
  
  // Foul controls
  document.getElementById('add-home-foul')?.addEventListener('click', () => addFoul('home'));
  document.getElementById('add-away-foul')?.addEventListener('click', () => addFoul('away'));
}

// Load timer data for selected game
async function loadGameTimer() {
  const gameId = document.getElementById('active-games').value;
  
  if (!gameId) {
    // Reset the display when no game is selected
    resetTimerDisplay();
    gameState.currentGameId = null;
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    const result = await response.json();
    
    if (response.ok) {
      // Update game state
      gameState.currentGameId = gameId;
      gameState.sport = result.sport;
      
      // Join game room for updates
      if (window.socket) {
        window.socket.emit('join-game', gameId);
      }
      
      // Try to get existing timer data
      let timerResult;
      try {
        const timerResponse = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}`);
        timerResult = await timerResponse.json();
        
        if (!timerResponse.ok) {
          // Timer doesn't exist, initialize it
          const initResponse = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sport: result.sport, gameType: 'quarter' })
          });
          
          if (initResponse.ok) {
            const initResult = await initResponse.json();
            timerResult = initResult;
          } else {
            // If initialization fails, use default values
            throw new Error('Failed to initialize timer');
          }
        }
      } catch (timerError) {
        // If getting timer data fails, initialize a new timer
        const initResponse = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sport: result.sport, gameType: 'quarter' })
        });
        
        if (initResponse.ok) {
          timerResult = await initResponse.json();
        } else {
          // If all attempts fail, use default values
          const defaultTimer = {
            gameClock: { time: 720, isRunning: false }, // 12 minutes default
            shotClock: { time: 240, isRunning: false }, // 24 seconds default
            period: 1,
            timeouts: { home: 3, away: 3 },
            fouls: { home: 0, away: 0 },
            sport: result.sport
          };
          updateTimerDisplay(defaultTimer);
          return;
        }
      }
      
      // Update display with timer data
      if (timerResult.timer) {
        updateTimerDisplay(timerResult.timer);
      } else {
        updateTimerDisplay(timerResult);
      }
    } else {
      throw new Error(result.error || 'Failed to load game data');
    }
  } catch (error) {
    console.error('Error loading game timer:', error);
    alert(`加载比赛数据失败: ${error.message}`);
  }
}

// Reset timer display to default state
function resetTimerDisplay() {
  document.getElementById('game-clock').textContent = '12:00';
  document.getElementById('shot-clock').textContent = '24.0';
  document.getElementById('current-period').textContent = '1';
  document.getElementById('period-display').textContent = '1';
  document.getElementById('home-timeouts').textContent = '3';
  document.getElementById('away-timeouts').textContent = '3';
  document.getElementById('home-fouls').textContent = '0';
  document.getElementById('away-fouls').textContent = '0';
  document.getElementById('timer-state').textContent = '停止';
  document.getElementById('sport-type-display').textContent = '篮球';
}

// Refresh list of active games (overriding the default function)
async function refreshGamesList() {
  try {
    // Use the new function from utils.js
    await window.refreshGamesList();
  } catch (error) {
    console.error('Error refreshing games list:', error);
    alert(`刷新比赛列表失败: ${error.message}`);
  }
}

// Update games dropdown with active games
function updateGamesList(timers) {
  const gamesSelect = document.getElementById('active-games');
  // Clear existing options except the first one
  gamesSelect.innerHTML = '<option value="">请选择比赛...</option>';
  
  for (const [gameId, timer] of Object.entries(timers)) {
    const option = document.createElement('option');
    option.value = gameId;
    option.textContent = `比赛 ${gameId.substring(0, 8)} - ${timer.sport}`;
    gamesSelect.appendChild(option);
  }
}

// Control game timer (start, pause, stop, reset)
async function controlGameTimer(action) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  try {
    let response;
    
    switch(action) {
      case 'start':
        response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/game-clock/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'pause':
        response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/game-clock/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'stop':
        response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/game-clock/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'reset':
        // For reset, we need to know the sport and game type
        const sport = gameState.sport || 'basketball';
        const gameType = 'quarter'; // Default
        
        response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sport, gameType })
        });
        break;
      default:
        throw new Error('Invalid action');
    }
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`Game timer ${action} executed:`, result);
      updateTimerDisplay(result.timer);
    } else {
      throw new Error(result.error || `Failed to ${action} game timer`);
    }
  } catch (error) {
    console.error(`Error controlling game timer (${action}):`, error);
    alert(`控制游戏时钟失败: ${error.message}`);
  }
}

// Set game clock to specific time
async function setGameClockTime() {
  const gameId = gameState.currentGameId;
  const timeInput = document.getElementById('game-clock-input').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  if (!timeInput) {
    alert('请输入时间 (格式: MM:SS)');
    return;
  }
  
  // Parse MM:SS format to seconds
  const timeParts = timeInput.split(':');
  if (timeParts.length !== 2) {
    alert('时间格式错误，请使用 MM:SS 格式');
    return;
  }
  
  const minutes = parseInt(timeParts[0], 10);
  const seconds = parseInt(timeParts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
    alert('时间格式错误，请使用有效的 MM:SS 格式');
    return;
  }
  
  const totalSeconds = minutes * 60 + seconds;
  
  try {
    const response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/game-clock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: totalSeconds })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Game clock updated:', result);
      updateTimerDisplay(result.timer);
    } else {
      throw new Error(result.error || 'Failed to update game clock');
    }
  } catch (error) {
    console.error('Error setting game clock time:', error);
    alert(`设置游戏时钟失败: ${error.message}`);
  }
}

// Control shot clock (start, pause, reset)
async function controlShotClock(action) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  try {
    let response;
    
    switch(action) {
      case 'start':
        response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/shot-clock/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'pause':
        response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/shot-clock/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'reset':
        response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/shot-clock/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      default:
        throw new Error('Invalid action');
    }
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`Shot clock ${action} executed:`, result);
      updateTimerDisplay(result.timer);
    } else {
      throw new Error(result.error || `Failed to ${action} shot clock`);
    }
  } catch (error) {
    console.error(`Error controlling shot clock (${action}):`, error);
    alert(`控制进攻时钟失败: ${error.message}`);
  }
}

// Set shot clock to specific time
async function setShotClockTime() {
  const gameId = gameState.currentGameId;
  const timeInput = document.getElementById('shot-clock-input').value;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  if (!timeInput) {
    alert('请输入时间 (单位: 秒)');
    return;
  }
  
  const seconds = parseFloat(timeInput);
  if (isNaN(seconds) || seconds < 0) {
    alert('时间格式错误，请输入有效的时间');
    return;
  }
  
  // Convert to tenths of seconds for our system
  const tenthsOfSeconds = Math.round(seconds * 10);
  
  try {
    // Update the timer service directly
    // Since we don't have a direct API for this, we'll update the timer state
    const response = await fetch(`${API_BASE_URL}/timers/${gameId}/shot-clock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: tenthsOfSeconds }) // in tenths of seconds
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Shot clock updated:', result);
      updateTimerDisplay(result.timer);
    } else {
      throw new Error(result.error || 'Failed to update shot clock');
    }
  } catch (error) {
    console.error('Error setting shot clock time:', error);
    alert(`设置进攻时钟失败: ${error.message}`);
  }
}

// Go to previous period
async function prevPeriod() {
  // Implementation depends on specific game rules
  // Usually you can't go back to a previous period once it's started
  alert('通常不允许返回到之前的节数');
}

// Go to next period
async function nextPeriod() {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/period/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Next period executed:', result);
      updateTimerDisplay(result.timer);
    } else {
      throw new Error(result.error || 'Failed to advance to next period');
    }
  } catch (error) {
    console.error('Error advancing to next period:', error);
    alert(`进入下一节失败: ${error.message}`);
  }
}

// Use timeout for a team
async function useTimeout(team) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/timeout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Timeout used:', result);
      updateTimerDisplay(result.timer);
    } else {
      throw new Error(result.error || `Failed to use timeout for ${team} team`);
    }
  } catch (error) {
    console.error(`Error using timeout for ${team}:`, error);
    alert(`使用暂停失败: ${error.message}`);
  }
}

// Add foul for a team
async function addFoul(team) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}/foul`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Foul added:', result);
      updateTimerDisplay(result.timer);
    } else {
      throw new Error(result.error || `Failed to add foul for ${team} team`);
    }
  } catch (error) {
    console.error(`Error adding foul for ${team}:`, error);
    alert(`记录犯规失败: ${error.message}`);
  }
}

// Update timer display based on timer data
function updateTimerDisplay(timer) {
  if (!timer) return;
  
  // Update game clock
  const gameClockElement = document.getElementById('game-clock');
  if (gameClockElement) {
    gameClockElement.textContent = formatTime(timer.gameClock.time);
  }
  
  // Update shot clock
  const shotClockElement = document.getElementById('shot-clock');
  if (shotClockElement) {
    shotClockElement.textContent = formatShotClock(timer.shotClock.time);
  }
  
  // Update period
  const periodElement = document.getElementById('current-period');
  const periodDisplayElement = document.getElementById('period-display');
  if (periodElement) periodElement.textContent = timer.period;
  if (periodDisplayElement) periodDisplayElement.textContent = timer.period;
  
  // Update timeouts
  const homeTimeoutsElement = document.getElementById('home-timeouts');
  const awayTimeoutsElement = document.getElementById('away-timeouts');
  if (homeTimeoutsElement) homeTimeoutsElement.textContent = timer.timeouts?.home || 0;
  if (awayTimeoutsElement) awayTimeoutsElement.textContent = timer.timeouts?.away || 0;
  
  // Update fouls
  const homeFoulsElement = document.getElementById('home-fouls');
  const awayFoulsElement = document.getElementById('away-fouls');
  if (homeFoulsElement) homeFoulsElement.textContent = timer.fouls?.home || 0;
  if (awayFoulsElement) awayFoulsElement.textContent = timer.fouls?.away || 0;
  
  // Update status display
  const timerStateElement = document.getElementById('timer-state');
  if (timerStateElement) {
    timerStateElement.textContent = timer.gameClock.isRunning ? '运行中' : '停止';
  }
  
  // Update sport type
  const sportElement = document.getElementById('sport-type-display');
  if (sportElement) {
    sportElement.textContent = timer.sport === 'basketball' ? '篮球' : '足球';
  }
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