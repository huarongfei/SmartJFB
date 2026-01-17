const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock data storage (in production, use database)
let games = {};

// Create a new game
router.post('/', (req, res) => {
  const { sport, teams, gameConfig } = req.body;
  
  if (!sport || !teams) {
    return res.status(400).json({ error: 'Sport and teams are required' });
  }

  const gameId = uuidv4();
  const newGame = {
    id: gameId,
    sport,
    teams,
    gameConfig: gameConfig || {},
    status: 'setup', // setup, running, paused, finished
    createdAt: new Date(),
    currentPeriod: 1,
    score: {
      [teams[0].name]: 0,
      [teams[1].name]: 0
    },
    timers: {
      gameClock: { time: sport === 'basketball' ? 720 : 2700, isRunning: false }, // Basketball: 12 min, Soccer: 45 min
      shotClock: { time: 24, isRunning: false }, // Basketball specific
      timeouts: {
        [teams[0].name]: 3, // Starting timeouts
        [teams[1].name]: 3
      }
    }
  };

  games[gameId] = newGame;

  res.status(201).json({
    message: 'Game created successfully',
    game: newGame
  });
});

// Get all games
router.get('/', (req, res) => {
  res.json({
    games: Object.values(games)
  });
});

// Get a specific game
router.get('/:id', (req, res) => {
  const game = games[req.params.id];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json({
    game
  });
});

// Update game status
router.patch('/:id/status', (req, res) => {
  const game = games[req.params.id];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const { status } = req.body;
  game.status = status;
  game.updatedAt = new Date();

  // Emit real-time update via socket
  req.app.get('io').to(req.params.id).emit('gameUpdate', game);

  res.json({
    message: 'Game status updated',
    game
  });
});

// Start/Resume game
router.post('/:id/start', (req, res) => {
  const game = games[req.params.id];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  game.status = 'running';
  game.timers.gameClock.isRunning = true;
  game.updatedAt = new Date();

  // Emit real-time update via socket
  req.app.get('io').to(req.params.id).emit('gameUpdate', game);

  res.json({
    message: 'Game started',
    game
  });
});

// Pause game
router.post('/:id/pause', (req, res) => {
  const game = games[req.params.id];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  game.status = 'paused';
  game.timers.gameClock.isRunning = false;
  game.updatedAt = new Date();

  // Emit real-time update via socket
  req.app.get('io').to(req.params.id).emit('gameUpdate', game);

  res.json({
    message: 'Game paused',
    game
  });
});

// End game
router.post('/:id/end', (req, res) => {
  const game = games[req.params.id];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  game.status = 'finished';
  game.timers.gameClock.isRunning = false;
  game.updatedAt = new Date();

  // Emit real-time update via socket
  req.app.get('io').to(req.params.id).emit('gameUpdate', game);

  res.json({
    message: 'Game ended',
    game
  });
});

module.exports = router;