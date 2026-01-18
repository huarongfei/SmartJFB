const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Get timer state for a game
router.get('/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  try {
    const game = await Game.findById(gameId);
    
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
    console.error('Error fetching timer state:', error);
    res.status(500).json({ error: 'Failed to fetch timer state' });
  }
});

// Initialize a game timer
router.post('/:gameId/init', async (req, res) => {
  const { gameId } = req.params;
  const { sport, gameType } = req.body;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create or update timer for the game
    const initialGameTime = sport === 'basketball' ? 720 : 2700; // 12 mins vs 45 mins
    
    const timerData = {
      game_clock_time: initialGameTime,
      game_clock_running: false,
      shot_clock_time: 240, // 24 seconds in tenths
      shot_clock_running: false,
      current_period: 1,
      timeouts_home: 3,
      timeouts_away: 3,
      fouls_home: 0,
      fouls_away: 0
    };

    const updatedTimer = Game.updateTimer(gameId, timerData);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerInit', { 
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
        sport: sport
      }
    });

    res.json({
      message: 'Game timer initialized',
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
        sport: sport
      }
    });
  } catch (error) {
    console.error('Error initializing game timer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update game clock
router.put('/:gameId/game-clock', async (req, res) => {
  const { time } = req.body;
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model
    const updatedTimer = Game.updateTimer(gameId, {
      game_clock_time: time
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerUpdate', { 
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
    res.status(400).json({ error: error.message });
  }
});

// Start game timer
router.post('/:gameId/game-clock/start', async (req, res) => {
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to start it
    const updatedTimer = Game.updateTimer(gameId, {
      game_clock_running: true
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerStart', { 
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

    res.json({
      message: 'Game timer started',
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
    console.error('Error starting game timer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Pause game timer
router.post('/:gameId/game-clock/pause', async (req, res) => {
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to pause it
    const updatedTimer = Game.updateTimer(gameId, {
      game_clock_running: false
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerPause', { 
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

    res.json({
      message: 'Game timer paused',
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
    console.error('Error pausing game timer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Stop game timer
router.post('/:gameId/game-clock/stop', async (req, res) => {
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to stop it
    const updatedTimer = Game.updateTimer(gameId, {
      game_clock_running: false
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerStop', { 
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

    res.json({
      message: 'Game timer stopped',
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
    console.error('Error stopping game timer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Reset game timer
router.post('/:gameId/reset', async (req, res) => {
  const gameId = req.params.gameId;
  const { sport, gameType } = req.body;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create or update timer for the game with reset values
    const initialGameTime = sport === 'basketball' ? 720 : 2700; // 12 mins vs 45 mins
    
    const timerData = {
      game_clock_time: initialGameTime,
      game_clock_running: false,
      shot_clock_time: 240, // 24 seconds in tenths
      shot_clock_running: false,
      current_period: 1,
      timeouts_home: 3,
      timeouts_away: 3,
      fouls_home: 0,
      fouls_away: 0
    };

    const updatedTimer = Game.updateTimer(gameId, timerData);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerReset', { 
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
        sport: sport
      }
    });

    res.json({
      message: 'Game timer reset',
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
        sport: sport
      }
    });
  } catch (error) {
    console.error('Error resetting game timer:', error);
    res.status(400).json({ error: error.message });
  }
});

// Start shot clock (basketball specific)
router.post('/:gameId/shot-clock/start', async (req, res) => {
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to start shot clock
    const updatedTimer = Game.updateTimer(gameId, {
      shot_clock_running: true
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('shotClockStart', { 
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

    res.json({
      message: 'Shot clock started',
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
    console.error('Error starting shot clock:', error);
    res.status(400).json({ error: error.message });
  }
});

// Pause shot clock
router.post('/:gameId/shot-clock/pause', async (req, res) => {
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to pause shot clock
    const updatedTimer = Game.updateTimer(gameId, {
      shot_clock_running: false
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('shotClockPause', { 
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

    res.json({
      message: 'Shot clock paused',
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
    console.error('Error pausing shot clock:', error);
    res.status(400).json({ error: error.message });
  }
});

// Reset shot clock
router.post('/:gameId/shot-clock/reset', async (req, res) => {
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to reset shot clock
    const updatedTimer = Game.updateTimer(gameId, {
      shot_clock_time: 240, // Reset to 24 seconds
      shot_clock_running: false
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('shotClockReset', { 
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

    res.json({
      message: 'Shot clock reset',
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
    console.error('Error resetting shot clock:', error);
    res.status(400).json({ error: error.message });
  }
});

// Advance to next period
router.post('/:gameId/period/next', async (req, res) => {
  const gameId = req.params.gameId;

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to advance period
    const updatedTimer = Game.updateTimer(gameId, {
      current_period: (game.timer?.current_period || 1) + 1
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('periodChange', { 
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

    res.json({
      message: 'Advanced to next period',
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
    console.error('Error advancing to next period:', error);
    res.status(400).json({ error: error.message });
  }
});

// Use a timeout
router.post('/:gameId/timeout', async (req, res) => {
  const gameId = req.params.gameId;
  const { team } = req.body;

  if (!team) {
    return res.status(400).json({ error: 'Team is required' });
  }

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to decrease timeout count
    const currentTimer = game.timer || {
      timeouts_home: 3,
      timeouts_away: 3
    };
    
    const updatedTimeouts = { ...currentTimer };
    if (team === 'home' && updatedTimeouts.timeouts_home > 0) {
      updatedTimeouts.timeouts_home -= 1;
    } else if (team === 'away' && updatedTimeouts.timeouts_away > 0) {
      updatedTimeouts.timeouts_away -= 1;
    }

    const updatedTimer = Game.updateTimer(gameId, {
      timeouts_home: updatedTimeouts.timeouts_home,
      timeouts_away: updatedTimeouts.timeouts_away
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timeoutUsed', { 
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

    res.json({
      message: `Timeout used for ${team} team`,
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
    console.error('Error using timeout:', error);
    res.status(400).json({ error: error.message });
  }
});

// Register a foul
router.post('/:gameId/foul', async (req, res) => {
  const gameId = req.params.gameId;
  const { team } = req.body;

  if (!team) {
    return res.status(400).json({ error: 'Team is required' });
  }

  try {
    // First, get the game to make sure it exists
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the timer in the game model to increase foul count
    const currentTimer = game.timer || {
      fouls_home: 0,
      fouls_away: 0
    };
    
    const updatedFouls = { ...currentTimer };
    if (team === 'home') {
      updatedFouls.fouls_home += 1;
    } else if (team === 'away') {
      updatedFouls.fouls_away += 1;
    }

    const updatedTimer = Game.updateTimer(gameId, {
      fouls_home: updatedFouls.fouls_home,
      fouls_away: updatedFouls.fouls_away
    });
    
    if (!updatedTimer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('foulRegistered', { 
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

    res.json({
      message: `Foul registered for ${team} team`,
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
    console.error('Error registering foul:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all active timers
router.get('/', async (req, res) => {
  try {
    // In a real implementation, this would return all active timers
    // For now, return an empty object
    res.json({
      timers: {}
    });
  } catch (error) {
    console.error('Error fetching active timers:', error);
    res.status(500).json({ error: 'Failed to fetch active timers' });
  }
});

module.exports = router;