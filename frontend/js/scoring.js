// Scoring-specific functionality

// Using utilities from utils.js

document.addEventListener('DOMContentLoaded', function() {
  initScoringPage();
});

function initScoringPage() {
  // Initialize event handlers for scoring page
  initScoringEventHandlers();
  
  // Update connection status
  checkConnectionStatus();
  
  // Load active games list
  refreshGamesList();
}

function initScoringEventHandlers() {
  // Game selection
  document.getElementById('active-games')?.addEventListener('change', loadGameScore);
  document.getElementById('refresh-games')?.addEventListener('click', refreshGamesList);
  
  // Quick scoring buttons
  document.querySelectorAll('[data-team]').forEach(button => {
    button.addEventListener('click', function() {
      const team = this.getAttribute('data-team');
      const points = this.getAttribute('data-points');
      const action = this.getAttribute('data-action');
      
      if (points) {
        updateScore(team, parseInt(points));
      } else if (action === 'foul') {
        addFoul(team);
      } else if (action === 'timeout') {
        useTimeout(team);
      }
    });
  });
  
  // Record detailed score
  document.getElementById('record-score')?.addEventListener('click', recordDetailedScore);
  
  // Record event
  document.getElementById('record-event')?.addEventListener('click', recordEvent);
}

// Load score for selected game
async function loadGameScore() {
  const gameId = document.getElementById('active-games').value;

  if (!gameId) return;

  try {
    // Load the game details to get team names
    const gameResponse = await fetch(`${API_BASE_URL}/games/${gameId}`);
    const gameResult = await gameResponse.json();
    
    if (gameResponse.ok) {
      // Update team names
      if (Array.isArray(gameResult.game.teams) && gameResult.game.teams.length >= 2) {
        document.getElementById('home-team-name').textContent = gameResult.game.teams[0].name;
        document.getElementById('away-team-name').textContent = gameResult.game.teams[1].name;
      }
      
      gameState.currentGameId = gameId;
    } else {
      throw new Error(gameResult.error || 'Failed to load game data');
    }
    
    // Load the score data
    const scoreResponse = await fetch(`${API_BASE_URL}/scores/${gameId}`);
    const scoreResult = await scoreResponse.json();
    
    if (scoreResponse.ok) {
      updateScoreDisplay(scoreResult.scores);
    } else {
      console.warn('No score data found for this game, using default values');
      // Initialize with default scores if none exist yet
      const defaultScores = {};
      if (Array.isArray(gameResult.game.teams) && gameResult.game.teams.length >= 2) {
        defaultScores[gameResult.game.teams[0].name] = 0;
        defaultScores[gameResult.game.teams[1].name] = 0;
      }
      updateScoreDisplay(defaultScores);
    }
    
    // Load recent events for this game
    loadGameEvents(gameId);
  } catch (error) {
    console.error('Error loading game score:', error);
    alert(`加载计分数据失败: ${error.message}`);
  }
}

// Load recent events for the game
async function loadGameEvents(gameId) {
  try {
    // Fetch events from the server
    const eventsResponse = await fetch(`${API_BASE_URL}/scores/${gameId}/events`);
    const eventsResult = await eventsResponse.json();
    
    const eventsContainer = document.getElementById('events-list');
    if (eventsContainer) {
      eventsContainer.innerHTML = ''; // Clear existing events
      
      if (eventsResponse.ok && eventsResult.events && eventsResult.events.length > 0) {
        // Sort events by timestamp (most recent first)
        const sortedEvents = eventsResult.events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Add events to the timeline
        sortedEvents.forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = 'event-item';
          
          const timeString = new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          
          let eventTypeDisplay = event.eventType || 'Event';
          if (event.eventType === 'foul') eventTypeDisplay = '犯规';
          else if (event.eventType === 'timeout') eventTypeDisplay = '暂停';
          else if (event.eventType === 'substitution') eventTypeDisplay = '换人';
          else if (event.points) eventTypeDisplay = `${event.points}分`;
          
          eventElement.innerHTML = `
            <div class="event-content">
              <div class="event-header">
                <span class="event-time">${timeString}</span>
                <span class="event-team ${event.team.toLowerCase()}">${event.team}</span>
              </div>
              <div class="event-details">
                <span class="event-desc">${eventTypeDisplay}</span>
                <span class="event-player">${event.player || ''}</span>
              </div>
            </div>
          `;
          
          eventsContainer.appendChild(eventElement);
        });
      } else {
        // Show message if no events
        const noEventsElement = document.createElement('div');
        noEventsElement.className = 'event-item';
        noEventsElement.innerHTML = `
          <div class="event-content">
            <div class="event-header">
              <span class="event-time">--:--</span>
              <span class="event-team">系统</span>
            </div>
            <div class="event-details">
              <span class="event-desc">暂无事件记录</span>
            </div>
          </div>
        `;
        eventsContainer.appendChild(noEventsElement);
      }
    }
  } catch (error) {
    console.error('Error loading game events:', error);
  }
}

// Refresh list of active games (overriding the default function)
async function refreshGamesList() {
  try {
    // Use the function from utils.js
    const games = await fetch(`${API_BASE_URL}/games`);
    const data = await games.json();
    
    if (games.ok) {
      updateGamesList(data.games || []);
    } else {
      console.error('Failed to refresh games list:', data.error);
      updateGamesList([]);
    }
  } catch (error) {
    console.error('Error refreshing games list:', error);
    alert(`刷新比赛列表失败: ${error.message}`);
  }
}

// Update games dropdown with active games
function updateGamesList(games) {
  const gamesSelect = document.getElementById('active-games');
  // Clear existing options except the first one
  gamesSelect.innerHTML = '<option value="">请选择比赛...</option>';
  
  if (games && Array.isArray(games)) {
    for (const game of games) {
      const option = document.createElement('option');
      option.value = game.id;
      option.textContent = `${game.name || `${Array.isArray(game.teams) && game.teams[0]?.name || 'Home'} vs ${Array.isArray(game.teams) && game.teams[1]?.name || 'Away'}`} - ${game.sport}`;
      gamesSelect.appendChild(option);
    }
  }
}

// Update score for a team
async function updateScore(teamType, points) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  const teamName = teamType === 'home' ? 
    document.getElementById('home-team-name').textContent || 'Home Team' : 
    document.getElementById('away-team-name').textContent || 'Away Team';
  
  try {
    const response = await fetch(`${API_BASE_URL}/scores/${gameId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team: teamName,
        points: points,
        eventType: 'regular',
        period: 1 // Should get actual period
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Score updated:', result);
      updateScoreDisplay(result.scores);
      addEventToTimeline(result.event);
    } else {
      throw new Error(result.error || 'Failed to update score');
    }
  } catch (error) {
    console.error('Error updating score:', error);
    alert(`更新分数失败: ${error.message}`);
  }
}

// Add foul for a team
async function addFoul(teamType) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  const teamName = teamType === 'home' ? 
    document.getElementById('home-team-name').textContent || 'Home Team' : 
    document.getElementById('away-team-name').textContent || 'Away Team';
  
  try {
    const response = await fetch(`${API_BASE_URL}/scores/${gameId}/foul`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team: teamName,
        eventType: 'foul',
        foulType: 'personal',
        period: 1
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Foul recorded:', result);
      addEventToTimeline(result.event);
      // Update fouls display
      updateFoulsDisplay(teamType);
    } else {
      throw new Error(result.error || 'Failed to record foul');
    }
  } catch (error) {
    console.error('Error recording foul:', error);
    alert(`记录犯规失败: ${error.message}`);
  }
}

// Use timeout for a team
async function useTimeout(teamType) {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  const teamName = teamType === 'home' ? 
    document.getElementById('home-team-name').textContent || 'Home Team' : 
    document.getElementById('away-team-name').textContent || 'Away Team';
  
  try {
    const response = await fetch(`${API_BASE_URL}/scores/${gameId}/timeout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team: teamName,
        period: 1
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Timeout recorded:', result);
      addEventToTimeline(result.event);
      // Update timeouts display
      updateTimeoutsDisplay(teamType);
    } else {
      throw new Error(result.error || 'Failed to record timeout');
    }
  } catch (error) {
    console.error('Error recording timeout:', error);
    alert(`记录暂停失败: ${error.message}`);
  }
}

// Record detailed score
async function recordDetailedScore() {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  const team = document.getElementById('scoring-team').value;
  const playerNumber = document.getElementById('scoring-player').value;
  const points = parseInt(document.getElementById('scoring-points').value);
  const description = document.getElementById('scoring-description').value;
  
  if (!points || points <= 0) {
    alert('请输入有效的分数');
    return;
  }
  
  const teamName = team === 'home' ? 
    document.getElementById('home-team-name').textContent || 'Home Team' : 
    document.getElementById('away-team-name').textContent || 'Away Team';
  
  try {
    const response = await fetch(`${API_BASE_URL}/scores/${gameId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team: teamName,
        points: points,
        player: playerNumber ? `Player #${playerNumber}` : null,
        eventType: 'detailed',
        period: 1,
        description: description || `Scored ${points} points`
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Detailed score recorded:', result);
      updateScoreDisplay(result.scores);
      addEventToTimeline(result.event);
      
      // Clear form
      document.getElementById('scoring-player').value = '';
      document.getElementById('scoring-description').value = '';
    } else {
      throw new Error(result.error || 'Failed to record detailed score');
    }
  } catch (error) {
    console.error('Error recording detailed score:', error);
    alert(`记录详细得分失败: ${error.message}`);
  }
}

// Record event
async function recordEvent() {
  const gameId = gameState.currentGameId;
  
  if (!gameId) {
    alert('请先选择比赛');
    return;
  }
  
  const team = document.getElementById('event-team').value;
  const eventType = document.getElementById('event-type').value;
  const playerNumber = document.getElementById('event-player').value;
  const description = document.getElementById('event-description').value;
  
  if (!eventType) {
    alert('请选择事件类型');
    return;
  }
  
  const teamName = team === 'home' ? 
    document.getElementById('home-team-name').textContent || 'Home Team' : 
    document.getElementById('away-team-name').textContent || 'Away Team';
  
  try {
    let response;
    let eventData = {
      team: teamName,
      eventType: eventType,
      period: 1,
      description: description || `${eventType} event`
    };
    
    if (playerNumber) {
      eventData.player = `Player #${playerNumber}`;
    }
    
    // Different endpoints for different event types
    if (eventType === 'foul') {
      response = await fetch(`${API_BASE_URL}/scores/${gameId}/foul`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...eventData,
          foulType: 'personal'
        })
      });
    } else if (eventType === 'timeout') {
      response = await fetch(`${API_BASE_URL}/scores/${gameId}/timeout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
    } else {
      // For other events, we'll use a general event endpoint if available
      // Or just add to local timeline for now
      addEventToTimeline({
        gameId,
        team: teamName,
        eventType,
        player: playerNumber ? `Player #${playerNumber}` : null,
        description,
        period: 1,
        timestamp: new Date()
      });
      
      alert('事件已记录到本地列表（实际系统中会发送到服务器）');
      return;
    }
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Event recorded:', result);
      addEventToTimeline(result.event);
      
      // Clear form
      document.getElementById('event-player').value = '';
      document.getElementById('event-description').value = '';
    } else {
      throw new Error(result.error || 'Failed to record event');
    }
  } catch (error) {
    console.error('Error recording event:', error);
    alert(`记录事件失败: ${error.message}`);
  }
}

// Update score display
function updateScoreDisplay(scores) {
  if (!scores) return;
  
  // Update home team score
  const homeTeamName = document.getElementById('home-team-name').textContent || 'Home Team';
  const homeScoreElement = document.getElementById('home-team-score');
  if (homeScoreElement) {
    homeScoreElement.textContent = scores[homeTeamName] || 0;
  }
  
  // Update away team score
  const awayTeamName = document.getElementById('away-team-name').textContent || 'Away Team';
  const awayScoreElement = document.getElementById('away-team-score');
  if (awayScoreElement) {
    awayScoreElement.textContent = scores[awayTeamName] || 0;
  }
}

// Update fouls display
function updateFoulsDisplay(teamType) {
  // This would update the displayed foul counts
  // In a real implementation, this would come from the server
  if (teamType === 'home') {
    const element = document.getElementById('home-fouls-count');
    if (element) {
      element.textContent = parseInt(element.textContent || 0) + 1;
    }
  } else {
    const element = document.getElementById('away-fouls-count');
    if (element) {
      element.textContent = parseInt(element.textContent || 0) + 1;
    }
  }
}

// Update timeouts display
function updateTimeoutsDisplay(teamType) {
  // This would update the displayed timeout counts
  // In a real implementation, this would come from the server
  if (teamType === 'home') {
    const element = document.getElementById('home-timeouts-count');
    if (element) {
      const current = parseInt(element.textContent || 3);
      element.textContent = Math.max(0, current - 1);
    }
  } else {
    const element = document.getElementById('away-timeouts-count');
    if (element) {
      const current = parseInt(element.textContent || 3);
      element.textContent = Math.max(0, current - 1);
    }
  }
}

// Add event to timeline
function addEventToTimeline(event) {
  const eventsContainer = document.getElementById('events-list');
  if (!eventsContainer) return;

  const eventElement = document.createElement('div');
  eventElement.className = 'event-item';

  const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  eventElement.innerHTML = `
    <div class="event-content">
      <div class="event-header">
        <span class="event-time">${timeString}</span>
        <span class="event-team ${event.team.toLowerCase()}">${event.team}</span>
      </div>
      <div class="event-details">
        <span class="event-desc">${event.description || event.eventType || 'Event'}</span>
        <span class="event-player">${event.player || ''}</span>
      </div>
    </div>
  `;

  // Add to the top of the list
  eventsContainer.insertBefore(eventElement, eventsContainer.firstChild);

  // Limit to 20 events
  if (eventsContainer.children.length > 20) {
    eventsContainer.removeChild(eventsContainer.lastChild);
  }
}