const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 获取特定比赛的判罚记录
router.get('/', async (req, res) => {
  try {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Missing gameId parameter' });
    }

    // 从文件数据库获取判罚记录
    const penalties = await db.penalties.find(penalty => penalty.gameId === gameId);
    
    res.json({ 
      penalties: penalties.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // 按时间倒序排列
    });
  } catch (error) {
    console.error('Error fetching penalties:', error);
    res.status(500).json({ error: 'Failed to fetch penalties' });
  }
});

// 记录新的判罚
router.post('/', async (req, res) => {
  try {
    const { gameId, team, playerNumber, penaltyType, penaltyTime, referee, notes } = req.body;

    // 验证必需字段
    if (!gameId || !team || playerNumber === undefined || !penaltyType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 创建新的判罚记录
    const newPenalty = {
      id: Date.now().toString(), // 简单的ID生成
      gameId,
      team,
      playerNumber: parseInt(playerNumber),
      penaltyType,
      penaltyTime,
      referee: referee || '',
      notes: notes || '',
      timestamp: new Date().toISOString()
    };

    // 保存到文件数据库
    await db.penalties.insert(newPenalty);

    res.status(201).json({ 
      message: 'Penalty recorded successfully', 
      penalty: newPenalty 
    });
  } catch (error) {
    console.error('Error recording penalty:', error);
    res.status(500).json({ error: 'Failed to record penalty' });
  }
});

// 删除判罚记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing penalty ID' });
    }

    // 从文件数据库删除记录
    const deletedPenalty = await db.penalties.deleteById(id);

    if (!deletedPenalty) {
      return res.status(404).json({ error: 'Penalty not found' });
    }

    res.json({ message: 'Penalty deleted successfully' });
  } catch (error) {
    console.error('Error deleting penalty:', error);
    res.status(500).json({ error: 'Failed to delete penalty' });
  }
});

// 获取判罚统计
router.get('/stats/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({ error: 'Missing gameId parameter' });
    }

    // 从文件数据库获取该比赛的所有判罚记录
    const penalties = await db.penalties.find(penalty => penalty.gameId === gameId);

    // 统计各队犯规数
    const homeFouls = penalties.filter(p => p.team === 'home').length;
    const awayFouls = penalties.filter(p => p.team === 'away').length;
    const totalPenalties = penalties.length;

    // 这里简化处理，实际应该从游戏数据中获取当前节次
    const game = await db.games.findById(gameId);
    const currentPeriod = game ? game.currentPeriod || 1 : 1;

    res.json({ 
      homeFouls,
      awayFouls, 
      totalPenalties,
      currentPeriod
    });
  } catch (error) {
    console.error('Error fetching penalty stats:', error);
    res.status(500).json({ error: 'Failed to fetch penalty stats' });
  }
});

module.exports = router;