const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock data storage (in production, use database)
let scores = {};
let events = {};

// Record a score
router.post('/:gameId/score', (req, res) => {
  const { gameId } = req.params;
  const { team, points, player, eventType, period } = req.body;

  if (!team || points === undefined) {
    return res.status(400).json({ error: 'Team and points are required' });
  }

  // Initialize game scores if not exists
  if (!scores[gameId]) {
    scores[gameId] = {
      [team]: 0
    };
  }

  // Add points to team score
  scores[gameId][team] = (scores[gameId][team] || 0) + parseInt(points);

  // Create event record
  const eventId = uuidv4();
  const event = {
    id: eventId,
    gameId,
    team,
    player: player || null,
    points: parseInt(points),
    eventType: eventType || 'regular',
    period: period || 1,
    timestamp: new Date()
  };

  if (!events[gameId]) {
    events[gameId] = [];
  }
  events[gameId].push(event);

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('scoreUpdate', {
    scores: scores[gameId],
    lastEvent: event
  });

  res.json({
    message: 'Score recorded successfully',
    score: scores[gameId],
    event
  });
});

// Record foul or violation
router.post('/:gameId/foul', (req, res) => {
  const { gameId } = req.params;
  const { team, player, foulType, period } = req.body;

  if (!team || !foulType) {
    return res.status(400).json({ error: 'Team and foul type are required' });
  }

  // Create foul event record
  const eventId = uuidv4();
  const event = {
    id: eventId,
    gameId,
    team,
    player: player || null,
    eventType: 'foul',
    foulType,
    period: period || 1,
    timestamp: new Date()
  };

  if (!events[gameId]) {
    events[gameId] = [];
  }
  events[gameId].push(event);

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('eventUpdate', event);

  res.json({
    message: 'Foul recorded successfully',
    event
  });
});

// Record timeout
router.post('/:gameId/timeout', (req, res) => {
  const { gameId } = req.params;
  const { team, period } = req.body;

  if (!team) {
    return res.status(400).json({ error: 'Team is required' });
  }

  // Create timeout event record
  const eventId = uuidv4();
  const event = {
    id: eventId,
    gameId,
    team,
    eventType: 'timeout',
    period: period || 1,
    timestamp: new Date()
  };

  if (!events[gameId]) {
    events[gameId] = [];
  }
  events[gameId].push(event);

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('eventUpdate', event);

  res.json({
    message: 'Timeout recorded successfully',
    event
  });
});

// Record substitution
router.post('/:gameId/substitution', (req, res) => {
  const { gameId } = req.params;
  const { team, playerIn, playerOut, period } = req.body;

  if (!team || !playerIn || !playerOut) {
    return res.status(400).json({ error: 'Team, player in and player out are required' });
  }

  // Create substitution event record
  const eventId = uuidv4();
  const event = {
    id: eventId,
    gameId,
    team,
    eventType: 'substitution',
    playerIn,
    playerOut,
    period: period || 1,
    timestamp: new Date()
  };

  if (!events[gameId]) {
    events[gameId] = [];
  }
  events[gameId].push(event);

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('eventUpdate', event);

  res.json({
    message: 'Substitution recorded successfully',
    event
  });
});

// Get game score
router.get('/:gameId', (req, res) => {
  const { gameId } = req.params;
  
  const gameScores = scores[gameId] || {};
  const gameEvents = events[gameId] || [];

  res.json({
    scores: gameScores,
    events: gameEvents
  });
});

// Get game events
router.get('/:gameId/events', (req, res) => {
  const { gameId } = req.params;
  const { eventType, period } = req.query;
  
  let gameEvents = events[gameId] || [];

  // Filter events if query params provided
  if (eventType) {
    gameEvents = gameEvents.filter(event => event.eventType === eventType);
  }
  
  if (period) {
    gameEvents = gameEvents.filter(event => event.period == period);
  }

  res.json({
    events: gameEvents
  });
});

// Undo last action (decrease score or remove event)
router.delete('/:gameId/undo', (req, res) => {
  const { gameId } = req.params;
  
  if (!events[gameId] || events[gameId].length === 0) {
    return res.status(400).json({ error: 'No events to undo' });
  }

  // Get the last event
  const lastEvent = events[gameId].pop();
  
  // If it was a score, reduce the team's score
  if (lastEvent.eventType === 'regular' || lastEvent.points) {
    scores[gameId][lastEvent.team] -= lastEvent.points;
    if (scores[gameId][lastEvent.team] < 0) {
      scores[gameId][lastEvent.team] = 0;
    }
  }

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('undoAction', {
    scores: scores[gameId],
    undoneEvent: lastEvent
  });

  res.json({
    message: 'Last action undone',
    scores: scores[gameId],
    undoneEvent: lastEvent
  });
});

// Update score manually
router.patch('/:gameId/score', (req, res) => {
  const { gameId } = req.params;
  const { team, newScore } = req.body;

  if (!team || newScore === undefined) {
    return res.status(400).json({ error: 'Team and new score are required' });
  }

  // Initialize game scores if not exists
  if (!scores[gameId]) {
    scores[gameId] = {};
  }

  // Update team score
  scores[gameId][team] = parseInt(newScore);

  // Emit real-time update via socket
  req.app.get('io').to(gameId).emit('scoreUpdate', {
    scores: scores[gameId]
  });

  res.json({
    message: 'Score updated successfully',
    score: scores[gameId]
  });
});

module.exports = router;