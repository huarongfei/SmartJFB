/**
 * SmartJFB - Professional Basketball/Football Scoreboard and Timer System
 * Copyright (c) 2023 SmartJFB Development Team
 * Licensed under the MIT License
 */
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize database
const initDatabase = require('./db/init');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const gameRoutes = require('./routes/game');
const timerRoutes = require('./routes/timer');
const advancedTimerRoutes = require('./routes/advancedTimer');
const penaltyRoutes = require('./routes/penalties');
const scoringRoutes = require('./routes/scoring');
const displayRoutes = require('./routes/display');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

const analyticsRoutes = require('./routes/analytics');

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/timers', timerRoutes);
app.use('/api/advanced-timers', advancedTimerRoutes);
app.use('/api/penalties', penaltyRoutes);
app.use('/api/scores', scoringRoutes);
app.use('/api/displays', displayRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/analytics', analyticsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'SmartJFB API is running!' });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Make io accessible to routes
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });

  // Broadcast game state changes
  socket.on('join-game', (gameId) => {
    socket.join(gameId);
    console.log(`Socket ${socket.id} joined game ${gameId}`);
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`SmartJFB server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = server;