// Dashboard-specific functions

async function createNewGame() {
  const sport = document.getElementById('sport-type').value;
  const homeTeam = document.getElementById('home-team').value.trim();
  const awayTeam = document.getElementById('away-team').value.trim();
  
  if (!homeTeam || !awayTeam) {
    alert('请输入主队和客队名称');
    return;
  }
  
  const gameData = {
    sport,
    teams: [
      { name: homeTeam, type: 'home' },
      { name: awayTeam, type: 'away' }
    ]
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gameData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      gameState.currentGameId = result.game.id;
      gameState.sport = result.game.sport;
      gameState.teams = result.game.teams;
      gameState.scores = result.game.score;
      
      // Update UI
      document.getElementById('home-team-name').textContent = homeTeam;
      document.getElementById('away-team-name').textContent = awayTeam;
      document.getElementById('home-team-score').textContent = '0';
      document.getElementById('away-team-score').textContent = '0';
      
      // Join game room in socket
      socket.emit('join-game', result.game.id);
      
      // Show game panels
      showPanel('scoreboard');
      showPanel('timer-controls');
      showPanel('game-controls');
      hidePanel('game-setup');
      
      // Update game status
      updateGameStatus(result.game.status);
      
      console.log('Game created successfully:', result.game);
    } else {
      throw new Error(result.error || '创建比赛失败');
    }
  } catch (error) {
    console.error('Error creating game:', error);
    alert(`创建比赛失败: ${error.message}`);
  }
}

async function updateScore(teamType, points) {
  if (!gameState.currentGameId) {
    alert('请先创建比赛');
    return;
  }
  
  const teamName = teamType === 'home' ? 
    document.getElementById('home-team-name').textContent : 
    document.getElementById('away-team-name').textContent;
  
  try {
    const response = await fetch(`${API_BASE_URL}/scores/${gameState.currentGameId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team: teamName,
        points: points,
        eventType: 'regular'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Score updated:', result);
      // The score will be updated via socket event
    } else {
      throw new Error(result.error || '更新分数失败');
    }
  } catch (error) {
    console.error('Error updating score:', error);
    alert(`更新分数失败: ${error.message}`);
  }
}

async function controlTimer(action) {
  if (!gameState.currentGameId) {
    alert('请先创建比赛');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/timers/${gameState.currentGameId}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action,
        sport: gameState.sport
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Timer control executed:', result);
    } else {
      throw new Error(result.error || '计时器控制失败');
    }
  } catch (error) {
    console.error('Error controlling timer:', error);
    alert(`计时器控制失败: ${error.message}`);
  }
}

async function controlGame(action) {
  if (!gameState.currentGameId) {
    alert('请先创建比赛');
    return;
  }
  
  try {
    let response;
    
    switch(action) {
      case 'start':
        response = await fetch(`${API_BASE_URL}/games/${gameState.currentGameId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'pause':
        response = await fetch(`${API_BASE_URL}/games/${gameState.currentGameId}/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'end':
        response = await fetch(`${API_BASE_URL}/games/${gameState.currentGameId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      default:
        throw new Error('无效的操作');
    }
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Game control executed:', result);
      updateGameStatus(result.game.status);
    } else {
      throw new Error(result.error || '比赛控制失败');
    }
  } catch (error) {
    console.error('Error controlling game:', error);
    alert(`比赛控制失败: ${error.message}`);
  }
}

function updateGameDisplay(game) {
  if (game.id !== gameState.currentGameId) return;
  
  gameState.sport = game.sport;
  gameState.scores = game.score;
  
  // Update scores
  updateScoreDisplay(game.score);
  
  // Update game status
  updateGameStatus(game.status);
  
  console.log('Game display updated:', game);
}

function updateTimerDisplay(timer) {
  // Update game clock
  const gameClockElement = document.getElementById('game-clock');
  if (gameClockElement) {
    gameClockElement.textContent = formatTime(timer.gameClock.time);
  }
  
  // Update shot clock (if applicable)
  const shotClockElement = document.getElementById('shot-clock');
  if (shotClockElement && timer.shotClock) {
    shotClockElement.textContent = formatShotClock(timer.shotClock.time);
  }
  
  console.log('Timer display updated:', timer);
}

function updateScoreDisplay(scores) {
  if (!scores) return;
  
  // Update home team score
  const homeTeamName = document.getElementById('home-team-name').textContent;
  const homeScoreElement = document.getElementById('home-team-score');
  if (homeScoreElement) {
    homeScoreElement.textContent = scores[homeTeamName] || 0;
  }
  
  // Update away team score
  const awayTeamName = document.getElementById('away-team-name').textContent;
  const awayScoreElement = document.getElementById('away-team-score');
  if (awayScoreElement) {
    awayScoreElement.textContent = scores[awayTeamName] || 0;
  }
  
  console.log('Score display updated:', scores);
}

function addEventToTimeline(event) {
  console.log('Event added to timeline:', event);
  // Here we would add the event to a visual timeline
  // For now, we'll just log it
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Additional initialization specific to dashboard
  console.log('Dashboard initialized');
});