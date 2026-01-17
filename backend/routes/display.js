const express = require('express');
const router = express.Router();

// Display-related routes for big screen and secondary displays

let displays = {};

// Register a display device
router.post('/register', (req, res) => {
  const { displayId, type, gameId } = req.body;
  
  if (!displayId || !type) {
    return res.status(400).json({ error: 'Display ID and type are required' });
  }

  displays[displayId] = {
    id: displayId,
    type, // 'main', 'secondary', 'big_screen', 'mobile'
    gameId: gameId || null,
    registeredAt: new Date(),
    isActive: true
  };

  res.json({
    message: 'Display registered successfully',
    display: displays[displayId]
  });
});

// Get display data for a specific game
router.get('/:displayId/game/:gameId', (req, res) => {
  const { displayId, gameId } = req.params;
  
  // Check if display is registered
  if (!displays[displayId]) {
    return res.status(404).json({ error: 'Display not registered' });
  }

  // In a real implementation, this would fetch game data from the game service
  // For now, we'll return mock data
  const gameData = {
    id: gameId,
    sport: 'basketball', // Would come from actual game
    teams: [
      { name: 'Home Team', score: 85 },
      { name: 'Away Team', score: 78 }
    ],
    period: 4,
    timeRemaining: 120, // seconds
    shotClock: 18, // tenths of seconds
    lastEvent: {
      type: 'score',
      team: 'Home Team',
      player: 'Player 23',
      points: 2,
      time: '8:45'
    },
    stats: {
      home: {
        fouls: 12,
        timeouts: 2,
        rebounds: 34
      },
      away: {
        fouls: 9,
        timeouts: 1,
        rebounds: 28
      }
    }
  };

  res.json({
    gameData
  });
});

// Update display settings
router.patch('/:displayId/settings', (req, res) => {
  const { displayId } = req.params;
  const { layout, theme, brightness } = req.body;

  if (!displays[displayId]) {
    return res.status(404).json({ error: 'Display not registered' });
  }

  // Update display settings
  displays[displayId].settings = {
    layout: layout || displays[displayId].settings?.layout,
    theme: theme || displays[displayId].settings?.theme,
    brightness: brightness || displays[displayId].settings?.brightness
  };

  res.json({
    message: 'Display settings updated',
    display: displays[displayId]
  });
});

// Activate/deactivate a display
router.patch('/:displayId/status', (req, res) => {
  const { displayId } = req.params;
  const { isActive } = req.body;

  if (!displays[displayId]) {
    return res.status(404).json({ error: 'Display not registered' });
  }

  displays[displayId].isActive = isActive;

  res.json({
    message: `Display ${isActive ? 'activated' : 'deactivated'}`,
    display: displays[displayId]
  });
});

// Get all registered displays for a game
router.get('/game/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  
  const gameDisplays = Object.values(displays).filter(display => 
    display.gameId === gameId
  );

  res.json({
    gameId,
    displays: gameDisplays
  });
});

// Send emergency overlay to display
router.post('/:displayId/emergency-overlay', (req, res) => {
  const { displayId } = req.params;
  const { message, type, duration } = req.body;

  if (!displays[displayId]) {
    return res.status(404).json({ error: 'Display not registered' });
  }

  // In a real system, this would send the overlay to the display
  // For now, we'll just log it and emit via socket
  
  const overlay = {
    displayId,
    message,
    type: type || 'info', // info, warning, danger
    duration: duration || 5000, // ms
    sentAt: new Date()
  };

  // Emit to socket for real-time update
  req.app.get('io').to(displayId).emit('emergencyOverlay', overlay);

  res.json({
    message: 'Emergency overlay sent',
    overlay
  });
});

module.exports = router;