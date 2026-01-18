const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();

// Mock data storage for game events and statistics
let gameEvents = {};
let gameStats = {};

// Calculate game statistics
function calculateGameStats(gameId) {
  const events = gameEvents[gameId] || [];
  
  // Initialize stats
  const stats = {
    totalEvents: events.length,
    scores: {
      home: { count: 0, points: 0, attempts: 0, makes: 0 }, // Makes/attempts for shooting %
      away: { count: 0, points: 0, attempts: 0, makes: 0 }
    },
    fouls: {
      home: 0,
      away: 0
    },
    timeouts: {
      home: 0,
      away: 0
    },
    rebounds: {
      home: 0,
      away: 0
    },
    assists: {
      home: 0,
      away: 0
    },
    steals: {
      home: 0,
      away: 0
    },
    blocks: {
      home: 0,
      away: 0
    },
    turnovers: {
      home: 0,
      away: 0
    },
    timeWithLead: {
      home: 0, // seconds
      away: 0
    },
    scoringRuns: [], // Sequences of consecutive scores
    possessionTime: {
      home: 0, // percentage
      away: 0
    }
  };

  // Process each event
  for (const event of events) {
    const team = event.team.toLowerCase();
    
    switch (event.eventType) {
      case 'score':
      case 'regular':
        stats.scores[team].points += event.points || 0;
        stats.scores[team].count += 1;
        stats.scores[team].makes += 1; // Assuming all scores are makes
        break;
      case 'foul':
        stats.fouls[team] += 1;
        break;
      case 'timeout':
        stats.timeouts[team] += 1;
        break;
      case 'rebound':
        stats.rebounds[team] += 1;
        break;
      case 'assist':
        stats.assists[team] += 1;
        break;
      case 'steal':
        stats.steals[team] += 1;
        break;
      case 'block':
        stats.blocks[team] += 1;
        break;
      case 'turnover':
        stats.turnovers[team] += 1;
        break;
    }
  }

  // Calculate shooting percentages
  stats.scores.home.percentage = stats.scores.home.attempts > 0 
    ? (stats.scores.home.makes / stats.scores.home.attempts * 100).toFixed(1) 
    : 0;
  stats.scores.away.percentage = stats.scores.away.attempts > 0 
    ? (stats.scores.away.makes / stats.scores.away.attempts * 100).toFixed(1) 
    : 0;

  return stats;
}

// Calculate advanced statistics
function calculateAdvancedStats(gameId, gameData) {
  const basicStats = calculateGameStats(gameId);
  
  // Advanced metrics calculation
  const advancedStats = {
    efficiency: {
      home: calculateEfficiency(basicStats.scores.home, basicStats),
      away: calculateEfficiency(basicStats.scores.away, basicStats)
    },
    fourFactors: calculateFourFactors(gameId, basicStats), // Basketball specific
    pace: calculatePace(gameId), // Possessions per 48 minutes
    trueShootingPercentage: {
      home: calculateTrueShootingPercentage(basicStats.scores.home, basicStats),
      away: calculateTrueShootingPercentage(basicStats.scores.away, basicStats)
    }
  };

  return { basic: basicStats, advanced: advancedStats };
}

// Helper function to calculate efficiency rating
function calculateEfficiency(scoreStats, allStats) {
  // Simplified efficiency calculation
  // (Points + Rebounds + Assists + Steals + Blocks - Missed Shots - Turnovers) / Games Played
  const makes = scoreStats.makes || 0;
  const attempts = scoreStats.attempts || 0;
  const missed = attempts - makes;
  
  return ((scoreStats.points || 0) + (allStats.rebounds.home || 0) + 
          (allStats.assists.home || 0) + (allStats.steals.home || 0) + 
          (allStats.blocks.home || 0) - missed - (allStats.turnovers.home || 0)).toFixed(1);
}

// Calculate Four Factors (Basketball specific)
function calculateFourFactors(gameId, stats) {
  // Four factors: Shooting (40%), Turnovers (25%), Rebounding (20%), Free Throws (15%)
  return {
    efg: { // Effective Field Goal Percentage
      home: ((stats.scores.home.makes || 0) + 0.5 * (stats.scores.home.threePointMakes || 0)) / 
            Math.max(1, stats.scores.home.attempts || 0) * 100,
      away: ((stats.scores.away.makes || 0) + 0.5 * (stats.scores.away.threePointMakes || 0)) / 
            Math.max(1, stats.scores.away.attempts || 0) * 100
    },
    tov: { // Turnover Rate
      home: (stats.turnovers.home / Math.max(1, stats.scores.home.attempts || 0)) * 100,
      away: (stats.turnovers.away / Math.max(1, stats.scores.away.attempts || 0)) * 100
    },
    orb: { // Offensive Rebounding Percentage
      home: (stats.rebounds.home.offensive || 0) / 
            (stats.rebounds.home.offensive || 0 + stats.rebounds.away.defensive || 0) * 100,
      away: (stats.rebounds.away.offensive || 0) / 
            (stats.rebounds.away.offensive || 0 + stats.rebounds.home.defensive || 0) * 100
    },
    ftRate: { // Free Throw Rate
      home: (stats.scores.home.ftMade || 0) / Math.max(1, stats.scores.home.attempts || 0) * 100,
      away: (stats.scores.away.ftMade || 0) / Math.max(1, stats.scores.away.attempts || 0) * 100
    }
  };
}

// Calculate pace (possessions per 48 minutes)
function calculatePace(gameId) {
  // Simplified pace calculation
  return 100; // Placeholder - would be calculated based on game events
}

// Calculate True Shooting Percentage
function calculateTrueShootingPercentage(scoreStats, allStats) {
  // TS% = Points / (2 * (FGA + 0.44 * FTA))
  const fga = scoreStats.attempts || 0;
  const fta = allStats.freeThrows ? (allStats.freeThrows.home || allStats.freeThrows.away || 0) : 0;
  const points = scoreStats.points || 0;
  
  const denominator = 2 * (fga + 0.44 * fta);
  return denominator > 0 ? (points / denominator * 100).toFixed(1) : 0;
}

// Get game statistics
router.get('/games/:gameId/stats', (req, res) => {
  const gameId = req.params.gameId;
  
  try {
    const stats = calculateAdvancedStats(gameId);
    
    res.json({
      gameId,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player statistics for a game
router.get('/games/:gameId/players/:playerId', (req, res) => {
  const { gameId, playerId } = req.params;
  
  // In a real implementation, this would aggregate stats for a specific player
  // For now, we'll return mock data
  const playerStats = {
    playerId,
    gameId,
    name: `Player ${playerId}`,
    team: 'home',
    minutesPlayed: 36.5,
    stats: {
      points: 22,
      rebounds: 8,
      assists: 7,
      steals: 2,
      blocks: 1,
      turnovers: 3,
      fgAttempts: 18,
      fgMakes: 8,
      threeAttempts: 7,
      threeMakes: 3,
      ftAttempts: 6,
      ftMakes: 5
    },
    ratings: {
      efficiency: 24.5,
      usage: 28.3,
      plusMinus: 12
    }
  };

  res.json({
    playerStats
  });
});

// Get season statistics for a team
router.get('/teams/:teamId/season-stats', (req, res) => {
  const teamId = req.params.teamId;
  
  // In a real implementation, this would aggregate stats across multiple games
  // For now, we'll return mock data
  const seasonStats = {
    teamId,
    wins: 24,
    losses: 6,
    winPercentage: 80.0,
    avgPointsPerGame: 112.3,
    avgPointsAllowed: 102.1,
    avgMargin: 10.2,
    offensiveRating: 115.2,
    defensiveRating: 104.8,
    pace: 98.7,
    conferenceRank: 1,
    leagueRank: 2
  };

  res.json({
    seasonStats
  });
});

// Get league leaders
router.get('/league/leaders', (req, res) => {
  const category = req.query.category || 'points';
  const limit = parseInt(req.query.limit) || 10;
  
  // Mock league leaders data
  const leaders = [
    { rank: 1, playerId: 'p1', playerName: 'Player One', team: 'Team A', value: 32.5, category },
    { rank: 2, playerId: 'p2', playerName: 'Player Two', team: 'Team B', value: 29.8, category },
    { rank: 3, playerId: 'p3', playerName: 'Player Three', team: 'Team C', value: 28.7, category },
    { rank: 4, playerId: 'p4', playerName: 'Player Four', team: 'Team D', value: 27.9, category },
    { rank: 5, playerId: 'p5', playerName: 'Player Five', team: 'Team E', value: 26.4, category }
  ].slice(0, limit);

  res.json({
    category,
    leaders
  });
});

// Get momentum analysis
router.get('/games/:gameId/momentum', (req, res) => {
  const gameId = req.params.gameId;
  
  // Analyze game flow and momentum shifts
  const events = gameEvents[gameId] || [];
  
  // Identify momentum-changing events (runs, big plays, etc.)
  const momentumAnalysis = {
    scoringRuns: identifyScoringRuns(events),
    leadChanges: countLeadChanges(events),
    biggestLead: findBiggestLead(events),
    momentumShifts: identifyMomentumShifts(events)
  };

  res.json({
    gameId,
    momentumAnalysis
  });
});

// Helper function to identify scoring runs
function identifyScoringRuns(events) {
  // Look for sequences of consecutive scores by the same team
  const runs = [];
  let currentRun = null;
  
  for (const event of events) {
    if (event.eventType === 'score' || event.eventType === 'regular') {
      if (!currentRun) {
        currentRun = {
          team: event.team,
          startEvent: event,
          points: event.points || 0,
          events: [event]
        };
      } else if (currentRun.team === event.team) {
        // Continue the run
        currentRun.points += event.points || 0;
        currentRun.events.push(event);
      } else {
        // Run ended, save it if significant
        if (currentRun.points >= 6) { // Significant run threshold
          runs.push(currentRun);
        }
        // Start new run
        currentRun = {
          team: event.team,
          startEvent: event,
          points: event.points || 0,
          events: [event]
        };
      }
    } else if (event.eventType === 'timeout' || event.eventType === 'period_change') {
      // Timeout or period change ends the current run
      if (currentRun && currentRun.points >= 6) {
        runs.push(currentRun);
      }
      currentRun = null;
    }
  }
  
  // Don't forget the last run if it was significant
  if (currentRun && currentRun.points >= 6) {
    runs.push(currentRun);
  }
  
  return runs;
}

// Helper function to count lead changes
function countLeadChanges(events) {
  let leadHolder = null;
  let leadChanges = 0;
  let homeScore = 0;
  let awayScore = 0;
  
  for (const event of events) {
    if (event.eventType === 'score' || event.eventType === 'regular') {
      if (event.team.includes('home') || event.team.toLowerCase() === 'home') {
        homeScore += event.points || 0;
      } else {
        awayScore += event.points || 0;
      }
      
      let newLeadHolder;
      if (homeScore > awayScore) {
        newLeadHolder = 'home';
      } else if (awayScore > homeScore) {
        newLeadHolder = 'away';
      } else {
        newLeadHolder = null; // Tied
      }
      
      if (newLeadHolder && newLeadHolder !== leadHolder) {
        if (leadHolder !== null) { // Not the initial lead assignment
          leadChanges++;
        }
        leadHolder = newLeadHolder;
      }
    }
  }
  
  return leadChanges;
}

// Helper function to find the biggest lead
function findBiggestLead(events) {
  let homeScore = 0;
  let awayScore = 0;
  let maxHomeLead = 0;
  let maxAwayLead = 0;
  
  for (const event of events) {
    if (event.eventType === 'score' || event.eventType === 'regular') {
      if (event.team.includes('home') || event.team.toLowerCase() === 'home') {
        homeScore += event.points || 0;
      } else {
        awayScore += event.points || 0;
      }
      
      const homeLead = homeScore - awayScore;
      const awayLead = awayScore - homeScore;
      
      if (homeLead > maxHomeLead) maxHomeLead = homeLead;
      if (awayLead > maxAwayLead) maxAwayLead = awayLead;
    }
  }
  
  return {
    team: maxHomeLead > maxAwayLead ? 'home' : 'away',
    points: Math.max(maxHomeLead, maxAwayLead)
  };
}

// Helper function to identify momentum shifts
function identifyMomentumShifts(events) {
  // Momentum shifts often occur after big plays or runs
  const shifts = [];
  
  // Look for events that commonly shift momentum
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    // Big plays like dunks, three-pointers, steals, blocks
    if (event.points >= 3 || event.eventType === 'steal' || event.eventType === 'block') {
      // Check if this led to a scoring run by the same team
      shifts.push({
        event,
        time: event.timestamp || i,
        significance: event.points || 1
      });
    }
  }
  
  return shifts;
}

// Get trend analysis for a game
router.get('/games/:gameId/trends', (req, res) => {
  const gameId = req.params.gameId;
  const events = gameEvents[gameId] || [];
  
  // Analyze trends throughout the game
  const trends = {
    scoringByQuarter: analyzeScoringByPeriod(events),
    shootingTrends: analyzeShootingTrends(events),
    momentumTrend: analyzeMomentumTrend(events)
  };

  res.json({
    gameId,
    trends
  });
});

// Helper function to analyze scoring by period
function analyzeScoringByPeriod(events) {
  const periods = {};
  
  for (const event of events) {
    const period = event.period || 1;
    
    if (!periods[period]) {
      periods[period] = { home: 0, away: 0 };
    }
    
    if (event.eventType === 'score' || event.eventType === 'regular') {
      if (event.team.includes('home') || event.team.toLowerCase() === 'home') {
        periods[period].home += event.points || 0;
      } else {
        periods[period].away += event.points || 0;
      }
    }
  }
  
  return periods;
}

// Helper function to analyze shooting trends
function analyzeShootingTrends(events) {
  // For simplicity, we'll return a mock analysis
  return {
    firstHalf: { home: 45.2, away: 42.1 }, // Shooting percentages
    secondHalf: { home: 51.3, away: 47.8 },
    clutch: { home: 48.5, away: 43.2 } // In last 5 minutes
  };
}

// Helper function to analyze momentum trend
function analyzeMomentumTrend(events) {
  // Calculate who had the momentum at different points in the game
  return {
    earlyGame: 'home', // First quarter/half
    midGame: 'away',   // Second/third quarter
    lateGame: 'home',  // Final quarter
    overall: 'home'    // Winner of momentum battle
  };
}

// Export statistics to various formats
router.get('/games/:gameId/export/:format', (req, res) => {
  const { gameId, format } = req.params;
  
  // Get game stats
  const stats = calculateAdvancedStats(gameId);
  
  if (format === 'csv') {
    // Create CSV representation
    const csvHeader = 'Category,Home,Away\n';
    const csvRows = [
      `Total Points,${stats.basic.scores.home.points},${stats.basic.scores.away.points}`,
      `Field Goals,${stats.basic.scores.home.makes}/${stats.basic.scores.home.attempts},${stats.basic.scores.away.makes}/${stats.basic.scores.away.attempts}`,
      `Three Pointers,${stats.basic.scores.home.threeMakes||0}/${stats.basic.scores.home.threeAttempts||0},${stats.basic.scores.away.threeMakes||0}/${stats.basic.scores.away.threeAttempts||0}`,
      `Free Throws,${stats.basic.scores.home.ftMakes||0}/${stats.basic.scores.home.ftAttempts||0},${stats.basic.scores.away.ftMakes||0}/${stats.basic.scores.away.ftAttempts||0}`,
      `Rebounds,${stats.basic.rebounds.home||0},${stats.basic.rebounds.away||0}`,
      `Assists,${stats.basic.assists.home||0},${stats.basic.assists.away||0}`,
      `Steals,${stats.basic.steals.home||0},${stats.basic.steals.away||0}`,
      `Blocks,${stats.basic.blocks.home||0},${stats.basic.blocks.away||0}`,
      `Turnovers,${stats.basic.turnovers.home||0},${stats.basic.turnovers.away||0}`,
      `Fouls,${stats.basic.fouls.home||0},${stats.basic.fouls.away||0}`
    ].join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=game_${gameId}_stats.csv`);
    
    return res.send(csvContent);
  } else if (format === 'pdf') {
    // Generate a basic PDF using pdfkit
    const doc = new PDFDocument();
    
    // Set up response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=game_${gameId}_stats.pdf`);
    
    // Pipe the PDF document to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(20).text('比赛统计数据报告', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`比赛ID: ${gameId}`);
    doc.moveDown();
    
    doc.fontSize(12).text('基本统计数据:', { underline: true });
    doc.moveDown();
    
    doc.text(`主队得分: ${stats.basic.scores.home.points}`);
    doc.text(`客队得分: ${stats.basic.scores.away.points}`);
    doc.text(`主队篮板: ${stats.basic.rebounds.home || 0}`);
    doc.text(`客队篮板: ${stats.basic.rebounds.away || 0}`);
    doc.text(`主队助攻: ${stats.basic.assists.home || 0}`);
    doc.text(`客队助攻: ${stats.basic.assists.away || 0}`);
    doc.text(`主队抢断: ${stats.basic.steals.home || 0}`);
    doc.text(`客队抢断: ${stats.basic.steals.away || 0}`);
    doc.text(`主队盖帽: ${stats.basic.blocks.home || 0}`);
    doc.text(`客队盖帽: ${stats.basic.blocks.away || 0}`);
    doc.moveDown();
    
    doc.text('高级统计数据:', { underline: true });
    doc.moveDown();
    
    doc.text(`主队效率值: ${stats.advanced.efficiency.home}`);
    doc.text(`客队效率值: ${stats.advanced.efficiency.away}`);
    
    // Finalize the PDF
    doc.end();
    return;
  }
  
  // Default to JSON
  res.json(stats);
});

module.exports = router;