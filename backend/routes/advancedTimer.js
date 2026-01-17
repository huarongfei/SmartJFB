const express = require('express');
const router = express.Router();
const timerService = require('../services/timerService');

// Get timer state for a game
router.get('/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  const timerState = timerService.getTimerState(gameId);

  if (!timerState) {
    return res.status(404).json({ error: 'Timer for this game not initialized' });
  }

  res.json({
    timer: timerState
  });
});

// Initialize a game timer
router.post('/:gameId/init', (req, res) => {
  const { gameId } = req.params;
  const { sport, gameType } = req.body;

  try {
    const timer = timerService.initGameTimer(gameId, sport, gameType);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerInit', timer);

    res.json({
      message: 'Game timer initialized',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update game clock
router.put('/:gameId/game-clock', (req, res) => {
  const { time } = req.body;
  const gameId = req.params.gameId;

  try {
    const timer = timerService.updateGameClock(gameId, time);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerUpdate', timer);

    res.json({
      message: 'Game clock updated',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start game timer
router.post('/:gameId/game-clock/start', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const timer = timerService.startGameTimer(gameId);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerStart', timer);

    res.json({
      message: 'Game timer started',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pause game timer
router.post('/:gameId/game-clock/pause', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const timer = timerService.pauseGameTimer(gameId);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerPause', timer);

    res.json({
      message: 'Game timer paused',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stop game timer
router.post('/:gameId/game-clock/stop', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const timer = timerService.stopGameTimer(gameId);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerStop', timer);

    res.json({
      message: 'Game timer stopped',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset game timer
router.post('/:gameId/reset', (req, res) => {
  const gameId = req.params.gameId;
  const { sport, gameType } = req.body;

  try {
    const timer = timerService.resetGameTimer(gameId, sport, gameType);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timerReset', timer);

    res.json({
      message: 'Game timer reset',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start shot clock (basketball specific)
router.post('/:gameId/shot-clock/start', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const timer = timerService.startShotClock(gameId);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('shotClockStart', timer);

    res.json({
      message: 'Shot clock started',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pause shot clock
router.post('/:gameId/shot-clock/pause', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const timer = timerService.pauseShotClock(gameId);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('shotClockPause', timer);

    res.json({
      message: 'Shot clock paused',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset shot clock
router.post('/:gameId/shot-clock/reset', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const timer = timerService.resetShotClock(gameId);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('shotClockReset', timer);

    res.json({
      message: 'Shot clock reset',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Advance to next period
router.post('/:gameId/period/next', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const timer = timerService.nextPeriod(gameId);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('periodChange', timer);

    res.json({
      message: 'Advanced to next period',
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Use a timeout
router.post('/:gameId/timeout', (req, res) => {
  const gameId = req.params.gameId;
  const { team } = req.body;

  if (!team) {
    return res.status(400).json({ error: 'Team is required' });
  }

  try {
    const timer = timerService.useTimeout(gameId, team);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('timeoutUsed', timer);

    res.json({
      message: `Timeout used for ${team} team`,
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Register a foul
router.post('/:gameId/foul', (req, res) => {
  const gameId = req.params.gameId;
  const { team } = req.body;

  if (!team) {
    return res.status(400).json({ error: 'Team is required' });
  }

  try {
    const timer = timerService.registerFoul(gameId, team);

    // Emit real-time update via socket
    req.app.get('io').to(gameId).emit('foulRegistered', timer);

    res.json({
      message: `Foul registered for ${team} team`,
      timer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all active timers
router.get('/', (req, res) => {
  const activeTimers = {};
  for (let [gameId, timer] of timerService.games) {
    activeTimers[gameId] = timer;
  }

  res.json({
    timers: activeTimers
  });
});

module.exports = router;