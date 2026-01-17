const express = require('express');
const router = express.Router();

// Timer operations
// Note: In a real implementation, this would connect to actual timer hardware or a timer service
// For now, we'll simulate timer operations

let timers = {};

// Get timer state for a game
router.get('/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  const timer = timers[gameId] || {
    gameClock: { time: 0, isRunning: false, direction: 'countdown' },
    shotClock: { time: 0, isRunning: false },
    period: 1,
    status: 'stopped'
  };

  res.json({
    timer
  });
});

// Update game clock
router.put('/:gameId/game-clock', (req, res) => {
  const { time, isRunning, direction } = req.body;
  const gameId = req.params.gameId;

  if (timers[gameId]) {
    timers[gameId].gameClock = {
      time: time !== undefined ? time : timers[gameId].gameClock.time,
      isRunning: isRunning !== undefined ? isRunning : timers[gameId].gameClock.isRunning,
      direction: direction || timers[gameId].gameClock.direction
    };
  } else {
    timers[gameId] = {
      gameClock: { time: time || 0, isRunning: isRunning || false, direction: direction || 'countdown' },
      shotClock: { time: 24, isRunning: false },
      period: 1,
      status: isRunning ? 'running' : 'stopped'
    };
  }

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('timerUpdate', timers[gameId]);

  res.json({
    message: 'Game clock updated',
    timer: timers[gameId]
  });
});

// Update shot clock (basketball specific)
router.put('/:gameId/shot-clock', (req, res) => {
  const { time, isRunning } = req.body;
  const gameId = req.params.gameId;

  if (!timers[gameId]) {
    return res.status(404).json({ error: 'Timer for this game not initialized' });
  }

  timers[gameId].shotClock = {
    time: time !== undefined ? time : timers[gameId].shotClock.time,
    isRunning: isRunning !== undefined ? isRunning : timers[gameId].shotClock.isRunning
  };

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('timerUpdate', timers[gameId]);

  res.json({
    message: 'Shot clock updated',
    timer: timers[gameId]
  });
});

// Reset timer to initial values
router.post('/:gameId/reset', (req, res) => {
  const gameId = req.params.gameId;
  const { sport, gameType } = req.body;

  let initialGameTime;
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

  timers[gameId] = {
    gameClock: { time: initialGameTime, isRunning: false, direction: 'countdown' },
    shotClock: { time: 24, isRunning: false }, // Default to 24 seconds for basketball
    period: 1,
    status: 'stopped'
  };

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('timerReset', timers[gameId]);

  res.json({
    message: 'Timer reset successfully',
    timer: timers[gameId]
  });
});

// Control timer (start/pause/reset)
router.post('/:gameId/control', (req, res) => {
  const gameId = req.params.gameId;
  const { action, duration } = req.body;

  if (!timers[gameId]) {
    return res.status(404).json({ error: 'Timer for this game not initialized' });
  }

  switch(action) {
    case 'start':
      timers[gameId].status = 'running';
      timers[gameId].gameClock.isRunning = true;
      if (timers[gameId].shotClock.time > 0) {
        timers[gameId].shotClock.isRunning = true;
      }
      break;
      
    case 'pause':
      timers[gameId].status = 'paused';
      timers[gameId].gameClock.isRunning = false;
      timers[gameId].shotClock.isRunning = false;
      break;
      
    case 'stop':
      timers[gameId].status = 'stopped';
      timers[gameId].gameClock.isRunning = false;
      timers[gameId].shotClock.isRunning = false;
      break;
      
    case 'reset':
      // This would be handled by the reset endpoint, but we'll include it here too
      const { sport, gameType } = req.body;
      let initialGameTime;
      if (sport === 'basketball') {
        initialGameTime = gameType === 'quarter' ? 720 : 600;
      } else if (sport === 'soccer') {
        initialGameTime = 2700;
      } else {
        initialGameTime = 720;
      }
      timers[gameId].gameClock = { time: initialGameTime, isRunning: false, direction: 'countdown' };
      timers[gameId].shotClock = { time: 24, isRunning: false };
      timers[gameId].period = 1;
      timers[gameId].status = 'stopped';
      break;
      
    default:
      return res.status(400).json({ error: 'Invalid action. Use start, pause, stop, or reset.' });
  }

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('timerControl', {
    action,
    timer: timers[gameId]
  });

  res.json({
    message: `Timer ${action} command executed`,
    timer: timers[gameId]
  });
});

// Update period/half
router.put('/:gameId/period', (req, res) => {
  const { period } = req.body;
  const gameId = req.params.gameId;

  if (!timers[gameId]) {
    return res.status(404).json({ error: 'Timer for this game not initialized' });
  }

  timers[gameId].period = period;

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('timerUpdate', timers[gameId]);

  res.json({
    message: 'Period updated',
    timer: timers[gameId]
  });
});

module.exports = router;