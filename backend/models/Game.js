/**
 * Game Model
 */

const { games } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for timers associated with games
const timers = new Map();

class Game {
  // Create a new game
  static async create(gameData) {
    const { sport, name, teams, config } = gameData;
    
    const gameId = uuidv4();
    
    const newGame = {
      id: gameId,
      sport,
      name: name || `${teams && teams[0] ? teams[0].name : 'Home'} vs ${teams && teams[1] ? teams[1].name : 'Away'}`,
      teams: teams ? teams.map((team, index) => ({
        id: uuidv4(),
        name: team.name,
        type: team.type || (index === 0 ? 'home' : 'away'),
        game_id: gameId
      })) : [],
      config: config || {},
      status: 'setup',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store the game
    await games.insert(newGame);
    
    // Create default timer for the game
    const defaultTimer = {
      id: uuidv4(),
      game_id: gameId,
      game_clock_time: sport === 'basketball' ? 720 : 2700, // 12 min for basketball, 45 min for soccer
      game_clock_running: false,
      shot_clock_time: 240, // 24 seconds in tenths
      shot_clock_running: false,
      current_period: 1,
      timeouts_home: 3,
      timeouts_away: 3,
      fouls_home: 0,
      fouls_away: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    timers.set(gameId, defaultTimer);
    
    return newGame;
  }

  // Find game by ID
  static async findById(id) {
    const game = await games.findById(id);
    
    if (!game) {
      return null;
    }
    
    // Add timer information if available
    const timer = timers.get(id);
    
    return {
      ...game,
      timer: timer || null
    };
  }

  // Find all games
  static async findAll(filters = {}) {
    let allGames = await games.read();
    
    // Apply filters if provided
    if (filters.status) {
      allGames = allGames.filter(game => game.status === filters.status);
    }
    
    if (filters.sport) {
      allGames = allGames.filter(game => game.sport === filters.sport);
    }
    
    // Sort by creation date (newest first)
    allGames.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Add timer information to each game
    return allGames.map(game => ({
      ...game,
      timer: timers.get(game.id) || null
    }));
  }

  // Update game status
  static async updateStatus(id, status) {
    const updatedGame = await games.updateById(id, { status });
    return updatedGame;
  }

  // Delete game
  static async delete(id) {
    // Remove timer for the game
    timers.delete(id);
    
    const deletedGame = await games.deleteById(id);
    return deletedGame;
  }
  
  // Get timer for game
  static getTimer(gameId) {
    return timers.get(gameId) || null;
  }
  
  // Update timer for game
  static updateTimer(gameId, timerData) {
    const existingTimer = timers.get(gameId);
    
    if (!existingTimer) {
      return null;
    }
    
    const updatedTimer = {
      ...existingTimer,
      ...timerData,
      updated_at: new Date().toISOString()
    };
    
    timers.set(gameId, updatedTimer);
    return updatedTimer;
  }
}

module.exports = Game;