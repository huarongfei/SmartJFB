const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Get timer state for a specific game
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const timer = game.timer || {
      game_clock_time: game.sport === 'basketball' ? 720 : 2700, // 12 min for basketball, 45 min for soccer
      game_clock_running: false,
      shot_clock_time: 240, // 24 seconds in tenths
      shot_clock_running: false,
      current_period: 1,
      timeouts_home: 3,
      timeouts_away: 3,
      fouls_home: 0,
      fouls_away: 0
    };
    
    res.json({
      timer: {
        gameClock: { 
          time: timer.game_clock_time, 
          isRunning: timer.game_clock_running 
        },
        shotClock: { 
          time: timer.shot_clock_time, 
          isRunning: timer.shot_clock_running 
        },
        period: timer.current_period,
        timeouts: { 
          home: timer.timeouts_home, 
          away: timer.timeouts_away 
        },
        fouls: { 
          home: timer.fouls_home, 
          away: timer.fouls_away 
        },
        sport: game.sport
      }
    });
  } catch (error) {
    console.error('Error getting timer state:', error);
    res.status(500).json({ error: 'Failed to get timer state' });
  }
});

// Update shot clock for a specific game
router.put('/:gameId/shot-clock', async (req, res) => {
  try {
    const { time } = req.body;
    const gameId = req.params.gameId;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Update the timer in the game model
    const updatedTimer = Game.updateTimer(gameId, {
      shot_clock_time: time
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    
    res.json({
      message: 'Shot clock updated',
      timer: {
        gameClock: { 
          time: updatedTimer.game_clock_time, 
          isRunning: updatedTimer.game_clock_running 
        },
        shotClock: { 
          time: updatedTimer.shot_clock_time, 
          isRunning: updatedTimer.shot_clock_running 
        },
        period: updatedTimer.current_period,
        timeouts: { 
          home: updatedTimer.timeouts_home, 
          away: updatedTimer.timeouts_away 
        },
        fouls: { 
          home: updatedTimer.fouls_home, 
          away: updatedTimer.fouls_away 
        },
        sport: game.sport
      }
    });
  } catch (error) {
    console.error('Error updating shot clock:', error);
    res.status(500).json({ error: 'Failed to update shot clock' });
  }
});

// Update game clock for a specific game
router.put('/:gameId/game-clock', async (req, res) => {
  try {
    const { time, isRunning } = req.body;
    const gameId = req.params.gameId;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Update the timer in the game model
    const updateData = {};
    if (time !== undefined) updateData.game_clock_time = time;
    if (isRunning !== undefined) updateData.game_clock_running = isRunning;
    
    const updatedTimer = Game.updateTimer(gameId, updateData);
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    
    res.json({
      message: 'Game clock updated',
      timer: {
        gameClock: { 
          time: updatedTimer.game_clock_time, 
          isRunning: updatedTimer.game_clock_running 
        },
        shotClock: { 
          time: updatedTimer.shot_clock_time, 
          isRunning: updatedTimer.shot_clock_running 
        },
        period: updatedTimer.current_period,
        timeouts: { 
          home: updatedTimer.timeouts_home, 
          away: updatedTimer.timeouts_away 
        },
        fouls: { 
          home: updatedTimer.fouls_home, 
          away: updatedTimer.fouls_away 
        },
        sport: game.sport
      }
    });
  } catch (error) {
    console.error('Error updating game clock:', error);
    res.status(500).json({ error: 'Failed to update game clock' });
  }
});

// Start/stop timer
router.post('/:gameId/toggle', async (req, res) => {
  try {
    const { gameClock, shotClock } = req.body;
    const gameId = req.params.gameId;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Update the timer in the game model
    const updateData = {};
    if (gameClock !== undefined) updateData.game_clock_running = gameClock;
    if (shotClock !== undefined) updateData.shot_clock_running = shotClock;
    
    const updatedTimer = Game.updateTimer(gameId, updateData);
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    
    res.json({
      message: 'Timer state updated',
      timer: {
        gameClock: { 
          time: updatedTimer.game_clock_time, 
          isRunning: updatedTimer.game_clock_running 
        },
        shotClock: { 
          time: updatedTimer.shot_clock_time, 
          isRunning: updatedTimer.shot_clock_running 
        },
        period: updatedTimer.current_period,
        timeouts: { 
          home: updatedTimer.timeouts_home, 
          away: updatedTimer.timeouts_away 
        },
        fouls: { 
          home: updatedTimer.fouls_home, 
          away: updatedTimer.fouls_away 
        },
        sport: game.sport
      }
    });
  } catch (error) {
    console.error('Error toggling timer:', error);
    res.status(500).json({ error: 'Failed to toggle timer' });
  }
});

module.exports = router;