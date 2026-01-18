// Timer-specific functionality

// Using utilities from utils.js

document.addEventListener('DOMContentLoaded', function() {
  initTimerPage();
});

function initTimerPage() {
  // Initialize event handlers for timer page
  initTimerEventHandlers();
  
  // Update connection status
  checkConnectionStatus();
  
  // Load active games list
  refreshGamesList();
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
  
  if (!gameId) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/advanced-timers/${gameId}`);
    const result = await response.json();
    
    if (response.ok) {
      updateTimerDisplay(result.timer);
      gameState.currentGameId = gameId;
    } else {
      throw new Error(result.error || 'Failed to load timer data');
    }
  } catch (error) {
    console.error('Error loading game timer:', error);
    alert(`加载计时器数据失败: ${error.message}`);
  }
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
  if (periodElement) {
    periodElement.textContent = timer.period;
  }
  
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
  
  // Update period display
  const periodDisplayElement = document.getElementById('period-display');
  if (periodDisplayElement) {
    periodDisplayElement.textContent = timer.period;
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