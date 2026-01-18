const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Create the user in the database
    const newUser = await User.create({
      username,
      email,
      password, // User model will hash the password
      role: role || 'operator'
    });

    // Emit real-time update via socket to notify all connected clients
    const allUsers = await User.findAll();
    req.app.get('io').emit('usersListUpdate', { users: allUsers });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, role } = req.body;

    const updatedUser = await User.update(userId, { email, role });
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const deletedUser = await User.delete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Emit real-time update via socket to notify all connected clients
    const allUsers = await User.findAll();
    req.app.get('io').emit('usersListUpdate', { users: allUsers });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all games history
router.get('/games-history', async (req, res) => {
  try {
    const { sport, dateFrom, dateTo, limit } = req.query;
    
    // Apply filters
    const filters = {};
    if (sport) filters.sport = sport;
    if (dateFrom || dateTo) {
      // Note: date filtering would need more complex implementation
      // This is a simplified approach
    }
    
    let games = await Game.findAll(filters);
    
    if (limit) {
      games = games.slice(0, parseInt(limit));
    }

    res.json({
      games
    });
  } catch (error) {
    console.error('Error fetching games history:', error);
    res.status(500).json({ error: 'Failed to fetch games history' });
  }
});

// Export game data
router.get('/games/:id/export', async (req, res) => {
  try {
    const gameId = req.params.id;
    
    // Get the game from database
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create CSV export
    const csvHeader = 'Period,Time,EventType,Team,Player,Points,Description\n';
    // For now, we'll create a basic CSV - in a real system, you'd fetch event data
    const csvContent = csvHeader;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=game_${gameId}_data.csv`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting game data:', error);
    res.status(500).json({ error: 'Failed to export game data' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const allUsers = await User.findAll();
    const allGames = await Game.findAll();
    
    // Count active games (games with status 'running')
    const activeGames = allGames.filter(g => g.status === 'running').length;
    
    const stats = {
      totalUsers: allUsers.length,
      totalGames: allGames.length,
      activeGames,
      sportsDistribution: {
        basketball: allGames.filter(g => g.sport === 'basketball').length,
        soccer: allGames.filter(g => g.sport === 'soccer').length
      }
    };

    res.json({
      stats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
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