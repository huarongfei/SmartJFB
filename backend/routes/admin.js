const express = require('express');
const router = express.Router();

// Mock data for admin functionality
let users = [
  { id: 1, username: 'admin', role: 'admin', email: 'admin@smartjfb.com', createdAt: new Date() },
  { id: 2, username: 'operator', role: 'operator', email: 'operator@smartjfb.com', createdAt: new Date() }
];

let gamesHistory = [];

// Get all users
router.get('/users', (req, res) => {
  res.json({
    users: users
  });
});

// Create a new user
router.post('/users', (req, res) => {
  const { username, email, role } = req.body;
  
  if (!username || !email || !role) {
    return res.status(400).json({ error: 'Username, email, and role are required' });
  }

  const newUser = {
    id: users.length + 1,
    username,
    email,
    role,
    createdAt: new Date()
  };

  users.push(newUser);

  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
});

// Update user
router.put('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { email, role } = req.body;

  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[userIndex].email = email || users[userIndex].email;
  users[userIndex].role = role || users[userIndex].role;

  res.json({
    message: 'User updated successfully',
    user: users[userIndex]
  });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);

  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);

  res.json({
    message: 'User deleted successfully'
  });
});

// Get all games history
router.get('/games-history', (req, res) => {
  const { sport, dateFrom, dateTo, limit } = req.query;
  
  let filteredGames = [...gamesHistory];
  
  if (sport) {
    filteredGames = filteredGames.filter(game => game.sport === sport);
  }
  
  if (dateFrom) {
    filteredGames = filteredGames.filter(game => new Date(game.createdAt) >= new Date(dateFrom));
  }
  
  if (dateTo) {
    filteredGames = filteredGames.filter(game => new Date(game.createdAt) <= new Date(dateTo));
  }
  
  if (limit) {
    filteredGames = filteredGames.slice(0, parseInt(limit));
  }

  res.json({
    games: filteredGames
  });
});

// Export game data
router.get('/games/:id/export', (req, res) => {
  const gameId = req.params.id;
  
  // Find the game in history
  const game = gamesHistory.find(g => g.id === gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Create CSV export
  const csvHeader = 'Period,Time,EventType,Team,Player,Points,Description\n';
  const csvRows = game.events.map(event => {
    return [
      event.period || '',
      event.time || '',
      event.type || '',
      event.team || '',
      event.player || '',
      event.points || '',
      event.description || ''
    ].join(',');
  }).join('\n');
  
  const csvContent = csvHeader + csvRows;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=game_${gameId}_data.csv`);
  
  res.send(csvContent);
});

// Get system statistics
router.get('/stats', (req, res) => {
  const totalUsers = users.length;
  const totalGames = gamesHistory.length;
  const activeGames = 0; // Would come from active games in real implementation
  
  const stats = {
    totalUsers,
    totalGames,
    activeGames,
    sportsDistribution: {
      basketball: gamesHistory.filter(g => g.sport === 'basketball').length,
      soccer: gamesHistory.filter(g => g.sport === 'soccer').length
    }
  };

  res.json({
    stats
  });
});

// Get recent activity
router.get('/activity', (req, res) => {
  // This would typically come from a logs table in real implementation
  const recentActivity = [
    { id: 1, user: 'admin', action: 'Created new game', timestamp: new Date(Date.now() - 3600000) },
    { id: 2, user: 'operator', action: 'Updated game score', timestamp: new Date(Date.now() - 1800000) },
    { id: 3, user: 'admin', action: 'Exported game data', timestamp: new Date(Date.now() - 900000) }
  ];

  res.json({
    activity: recentActivity
  });
});

// System configuration
router.get('/config', (req, res) => {
  // Return system configuration
  const config = {
    systemInfo: {
      version: '1.0.0',
      uptime: process.uptime ? Math.floor(process.uptime()) : 'N/A',
      nodeVersion: process.version
    },
    features: {
      basketballEnabled: true,
      soccerEnabled: true,
      analyticsEnabled: true,
      exportEnabled: true
    }
  };

  res.json({
    config
  });
});

// Update system configuration
router.put('/config', (req, res) => {
  const { features } = req.body;
  
  // In a real implementation, this would update system settings
  // For now, we'll just return a success message
  
  res.json({
    message: 'Configuration updated successfully',
    updatedFeatures: features
  });
});

module.exports = router;