const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Timer = require('../models/Timer');

// Create a new game
router.post('/', async (req, res) => {
  try {
    const { sport, name, teams, gameConfig } = req.body;
    
    if (!sport || !teams) {
      return res.status(400).json({ error: 'Sport and teams are required' });
    }

    // Create the game in the database
    const newGame = await Game.create({
      sport,
      name: name || `${Array.isArray(teams) && teams[0]?.name || 'Home'} vs ${Array.isArray(teams) && teams[1]?.name || 'Away'}`,
      teams: teams.map((team, index) => ({
        name: team.name,
        type: index === 0 ? 'home' : 'away'
      })),
      config: gameConfig || {}
    });

    // Emit real-time update via socket to notify all connected clients
    req.app.get('io').emit('gameCreated', newGame);
    
    // Also broadcast updated games list
    const allGames = await Game.findAll();
    req.app.get('io').emit('gamesListUpdate', { games: allGames });

    res.status(201).json({
      message: 'Game created successfully',
      game: newGame
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Get all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll();
    res.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get a specific game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Update game status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const game = await Game.updateStatus(req.params.id, status);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Emit real-time update via socket
    req.app.get('io').to(req.params.id).emit('gameUpdate', game);

    res.json({
      message: 'Game status updated',
      game
    });
  } catch (error) {
    console.error('Error updating game status:', error);
    res.status(500).json({ error: 'Failed to update game status' });
  }
});

// Start/Resume game
router.post('/:id/start', async (req, res) => {
  try {
    const game = await Game.updateStatus(req.params.id, 'running');
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update timer status
    const updatedTimer = await Timer.updateStatus(req.params.id, true, false);

    // Emit real-time update via socket
    req.app.get('io').to(req.params.id).emit('gameUpdate', { ...game, timer: updatedTimer });

    res.json({
      message: 'Game started',
      game: { ...game, timer: updatedTimer }
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Pause game
router.post('/:id/pause', async (req, res) => {
  try {
    const game = await Game.updateStatus(req.params.id, 'paused');
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update timer status
    const updatedTimer = await Timer.updateStatus(req.params.id, false, false);

    // Emit real-time update via socket
    req.app.get('io').to(req.params.id).emit('gameUpdate', { ...game, timer: updatedTimer });

    res.json({
      message: 'Game paused',
      game: { ...game, timer: updatedTimer }
    });
  } catch (error) {
    console.error('Error pausing game:', error);
    res.status(500).json({ error: 'Failed to pause game' });
  }
});

// End game
router.post('/:id/end', async (req, res) => {
  try {
    const game = await Game.updateStatus(req.params.id, 'finished');
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update timer status
    const updatedTimer = await Timer.updateStatus(req.params.id, false, false);

    // Emit real-time update via socket
    req.app.get('io').to(req.params.id).emit('gameUpdate', { ...game, timer: updatedTimer });

    res.json({
      message: 'Game ended',
      game: { ...game, timer: updatedTimer }
    });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Delete a game
router.delete('/:id', async (req, res) => {
  try {
    const deletedGame = await Game.delete(req.params.id);
    
    if (!deletedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Emit real-time update via socket to notify all connected clients
    const allGames = await Game.findAll();
    req.app.get('io').emit('gamesListUpdate', { games: allGames });

    res.json({
      message: 'Game deleted successfully',
      game: deletedGame
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;