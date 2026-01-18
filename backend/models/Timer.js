/**
 * Timer Model
 */

// Using the Game model since timers are now managed there
const Game = require('./Game');

class Timer {
  // Get timer by game ID
  static async getByGameId(gameId) {
    return Game.getTimer(gameId);
  }

  // Create timer for a game
  static async createForGame(gameId, initialData = {}) {
    const {
      gameClockTime = 720, // 12 minutes default for basketball
      shotClockTime = 240, // 24 seconds default
      currentPeriod = 1,
      timeoutsHome = 3,
      timeoutsAway = 3
    } = initialData;
    
    const newTimer = {
      id: require('uuid').v4(),
      game_id: gameId,
      game_clock_time: gameClockTime,
      game_clock_running: false, // initially not running
      shot_clock_time: shotClockTime,
      shot_clock_running: false, // initially not running
      current_period: currentPeriod,
      timeouts_home: timeoutsHome,
      timeouts_away: timeoutsAway,
      fouls_home: 0, // fouls home
      fouls_away: 0,  // fouls away
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store the timer in the Game model's timer collection
    Game.updateTimer(gameId, newTimer);
    
    return newTimer;
  }

  // Update game clock
  static async updateGameClock(gameId, time, isRunning) {
    const currentTimer = Game.getTimer(gameId);
    
    if (!currentTimer) {
      return null;
    }
    
    const updatedTimer = {
      ...currentTimer,
      game_clock_time: time,
      game_clock_running: isRunning,
      updated_at: new Date().toISOString()
    };
    
    return Game.updateTimer(gameId, updatedTimer);
  }

  // Update shot clock
  static async updateShotClock(gameId, time, isRunning) {
    const currentTimer = Game.getTimer(gameId);
    
    if (!currentTimer) {
      return null;
    }
    
    const updatedTimer = {
      ...currentTimer,
      shot_clock_time: time,
      shot_clock_running: isRunning,
      updated_at: new Date().toISOString()
    };
    
    return Game.updateTimer(gameId, updatedTimer);
  }

  // Update period
  static async updatePeriod(gameId, period) {
    const currentTimer = Game.getTimer(gameId);
    
    if (!currentTimer) {
      return null;
    }
    
    const updatedTimer = {
      ...currentTimer,
      current_period: period,
      updated_at: new Date().toISOString()
    };
    
    return Game.updateTimer(gameId, updatedTimer);
  }

  // Use timeout
  static async useTimeout(gameId, team) {
    const currentTimer = Game.getTimer(gameId);
    
    if (!currentTimer) {
      return null;
    }
    
    let updatedTimeouts;
    if (team === 'home') {
      updatedTimeouts = { ...currentTimer, timeouts_home: Math.max(0, currentTimer.timeouts_home - 1) };
    } else if (team === 'away') {
      updatedTimeouts = { ...currentTimer, timeouts_away: Math.max(0, currentTimer.timeouts_away - 1) };
    } else {
      throw new Error('Invalid team specified. Use "home" or "away".');
    }
    
    updatedTimeouts.updated_at = new Date().toISOString();
    
    return Game.updateTimer(gameId, updatedTimeouts);
  }

  // Add foul
  static async addFoul(gameId, team) {
    const currentTimer = Game.getTimer(gameId);
    
    if (!currentTimer) {
      return null;
    }
    
    let updatedFouls;
    if (team === 'home') {
      updatedFouls = { ...currentTimer, fouls_home: currentTimer.fouls_home + 1 };
    } else if (team === 'away') {
      updatedFouls = { ...currentTimer, fouls_away: currentTimer.fouls_away + 1 };
    } else {
      throw new Error('Invalid team specified. Use "home" or "away".');
    }
    
    updatedFouls.updated_at = new Date().toISOString();
    
    return Game.updateTimer(gameId, updatedFouls);
  }

  // Reset timer
  static async reset(gameId, sport = 'basketball') {
    const defaultGameClock = sport === 'basketball' ? 720 : 2700; // 12 min for basketball, 45 min for soccer
    
    const resetTimer = {
      ...Game.getTimer(gameId),
      game_clock_time: defaultGameClock,
      game_clock_running: false,
      shot_clock_time: 240,
      shot_clock_running: false,
      current_period: 1,
      timeouts_home: 3,
      timeouts_away: 3,
      fouls_home: 0,
      fouls_away: 0,
      updated_at: new Date().toISOString()
    };
    
    return Game.updateTimer(gameId, resetTimer);
  }

  // Update timer status (start/pause/stop)
  static async updateStatus(gameId, gameClockRunning, shotClockRunning) {
    const currentTimer = Game.getTimer(gameId);
    
    if (!currentTimer) {
      return null;
    }
    
    const updatedTimer = {
      ...currentTimer,
      game_clock_running: gameClockRunning,
      shot_clock_running: shotClockRunning,
      updated_at: new Date().toISOString()
    };
    
    return Game.updateTimer(gameId, updatedTimer);
  }
}

module.exports = Timer;