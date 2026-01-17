// Timer Service for SmartJFB
// Handles all timing-related functionality with precision and reliability

class TimerService {
  constructor() {
    this.games = new Map(); // Store game timers
    this.intervalId = null;
    this.running = false;
  }

  // Initialize a game timer
  initGameTimer(gameId, sport, gameType) {
    let initialGameTime;
    let shotClockTime = 240; // Tenths of seconds (24.0 seconds)
    
    if (sport === 'basketball') {
      // Basketball: 12 minutes per quarter (720 seconds) or 10 minutes depending on league
      initialGameTime = gameType === 'quarter' ? 720 : 600; // 12 or 10 minutes in seconds
    } else if (sport === 'soccer') {
      // Soccer: 45 minutes per half (2700 seconds)
      initialGameTime = 2700;
    } else {
      // Default to 12-minute basketball period
      initialGameTime = 720;
    }

    this.games.set(gameId, {
      gameClock: {
        time: initialGameTime, // in seconds
        isRunning: false,
        direction: 'countdown',
        startTime: null,
        accumulatedTime: 0 // Time accumulated when counting up
      },
      shotClock: {
        time: shotClockTime, // in tenths of seconds
        isRunning: false,
        lastResetTime: initialGameTime
      },
      period: 1, // Quarter/Half number
      status: 'stopped', // stopped, running, paused
      sport: sport,
      timeouts: {
        home: 3, // Starting timeouts
        away: 3
      },
      fouls: {
        home: 0,
        away: 0
      },
      lastUpdateTime: Date.now()
    });

    return this.games.get(gameId);
  }

  // Start the game timer
  startGameTimer(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.status = 'running';
    gameTimer.gameClock.isRunning = true;
    gameTimer.lastUpdateTime = Date.now();

    // Start the global timer interval if not already running
    if (!this.running) {
      this.startGlobalTimer();
    }

    return gameTimer;
  }

  // Pause the game timer
  pauseGameTimer(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.status = 'paused';
    gameTimer.gameClock.isRunning = false;
    gameTimer.shotClock.isRunning = false;

    return gameTimer;
  }

  // Stop the game timer
  stopGameTimer(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.status = 'stopped';
    gameTimer.gameClock.isRunning = false;
    gameTimer.shotClock.isRunning = false;

    return gameTimer;
  }

  // Reset the game timer to initial values
  resetGameTimer(gameId, sport, gameType) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    let initialGameTime;
    if (sport === 'basketball') {
      initialGameTime = gameType === 'quarter' ? 720 : 600;
    } else if (sport === 'soccer') {
      initialGameTime = 2700;
    } else {
      initialGameTime = 720;
    }

    gameTimer.gameClock = {
      time: initialGameTime,
      isRunning: false,
      direction: 'countdown',
      startTime: null,
      accumulatedTime: 0
    };
    gameTimer.shotClock = {
      time: 240, // 24.0 seconds in tenths
      isRunning: false,
      lastResetTime: initialGameTime
    };
    gameTimer.period = 1;
    gameTimer.status = 'stopped';
    gameTimer.timeouts = {
      home: 3,
      away: 3
    };
    gameTimer.fouls = {
      home: 0,
      away: 0
    };
    gameTimer.lastUpdateTime = Date.now();

    return gameTimer;
  }

  // Update game clock manually
  updateGameClock(gameId, newTime) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.gameClock.time = newTime;
    gameTimer.lastUpdateTime = Date.now();

    return gameTimer;
  }

  // Start the shot clock
  startShotClock(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    // Only basketball has shot clock
    if (gameTimer.sport !== 'basketball') {
      throw new Error('Shot clock is only applicable to basketball games');
    }

    gameTimer.shotClock.isRunning = true;
    gameTimer.lastUpdateTime = Date.now();

    return gameTimer;
  }

  // Pause the shot clock
  pauseShotClock(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.shotClock.isRunning = false;
    gameTimer.lastUpdateTime = Date.now();

    return gameTimer;
  }

  // Reset the shot clock
  resetShotClock(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.shotClock.time = 240; // 24.0 seconds in tenths
    gameTimer.shotClock.isRunning = false;
    gameTimer.shotClock.lastResetTime = gameTimer.gameClock.time;
    gameTimer.lastUpdateTime = Date.now();

    return gameTimer;
  }

  // Advance to next period
  nextPeriod(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.period += 1;
    gameTimer.lastUpdateTime = Date.now();

    // For basketball, reset timeouts for new half (typically at halftime)
    if (gameTimer.sport === 'basketball' && gameTimer.period === 3) {
      gameTimer.timeouts.home = 3;
      gameTimer.timeouts.away = 3;
    }

    return gameTimer;
  }

  // Use a timeout
  useTimeout(gameId, team) { // team is 'home' or 'away'
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    if (gameTimer.timeouts[team] > 0) {
      gameTimer.timeouts[team] -= 1;
      gameTimer.lastUpdateTime = Date.now();
      return gameTimer;
    } else {
      throw new Error(`No timeouts remaining for ${team} team`);
    }
  }

  // Register a foul
  registerFoul(gameId, team) { // team is 'home' or 'away'
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      throw new Error(`Game timer for game ${gameId} not found`);
    }

    gameTimer.fouls[team] += 1;
    gameTimer.lastUpdateTime = Date.now();

    // In basketball, team fouls might trigger bonus situations
    // This would be handled by the game logic layer

    return gameTimer;
  }

  // Start the global timer that updates all game clocks
  startGlobalTimer() {
    if (this.running) return;

    this.running = true;
    this.intervalId = setInterval(() => {
      this.updateAllTimers();
    }, 100); // Update every 100ms for precision timing
  }

  // Update all running timers
  updateAllTimers() {
    for (let [gameId, gameTimer] of this.games) {
      const now = Date.now();
      const deltaTime = (now - gameTimer.lastUpdateTime) / 1000; // Convert to seconds
      gameTimer.lastUpdateTime = now;

      // Update game clock if running
      if (gameTimer.gameClock.isRunning) {
        if (gameTimer.gameClock.direction === 'countdown') {
          gameTimer.gameClock.time = Math.max(0, gameTimer.gameClock.time - deltaTime);
          
          // Check if time ran out
          if (gameTimer.gameClock.time <= 0) {
            // In a real implementation, this might trigger a period end event
            gameTimer.gameClock.isRunning = false;
            gameTimer.status = 'paused';
          }
        } else {
          // Counting up
          gameTimer.gameClock.accumulatedTime += deltaTime;
          gameTimer.gameClock.time += deltaTime;
        }
      }

      // Update shot clock if running
      if (gameTimer.shotClock.isRunning) {
        gameTimer.shotClock.time = Math.max(0, gameTimer.shotClock.time - (deltaTime * 10)); // Shot clock in tenths
        
        // Check if shot clock ran out
        if (gameTimer.shotClock.time <= 0) {
          // In a real implementation, this would trigger a shot clock violation
          gameTimer.shotClock.isRunning = false;
        }
      }
    }
  }

  // Stop the global timer
  stopGlobalTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
  }

  // Get timer state for a game
  getTimerState(gameId) {
    const gameTimer = this.games.get(gameId);
    if (!gameTimer) {
      return null;
    }

    // Return a copy to prevent external modification
    return JSON.parse(JSON.stringify(gameTimer));
  }

  // Clean up a game timer
  removeGameTimer(gameId) {
    return this.games.delete(gameId);
  }
}

// Export a singleton instance
const timerService = new TimerService();
module.exports = timerService;